// OCR API Configuration
const OCR_API_URL = "https://ocr.muazaoski.online/ocr/extract";
const AI_UNDERSTAND_URL = "https://ocr.muazaoski.online/ocr/understand";
const API_KEY = "ocr_demo_key_public_feel_free_to_use";

/**
 * AI-Powered Size Chart Extraction using Qwen3-VL Vision Model
 * This directly understands the image and returns structured data!
 */
export async function extractDataFromOCR(imageBase64, apiKey) {
    try {
        console.log("Starting AI Size Chart Understanding...");
        const finalApiKey = apiKey || API_KEY;

        // Convert base64 to blob
        const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
        const mimeType = matches ? matches[1] : 'image/png';
        const base64Data = matches ? matches[2] : imageBase64;

        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });

        const formData = new FormData();
        formData.append('file', blob, 'chart.png');

        // Use the AI Understanding endpoint with size_chart preset
        const response = await fetch(`${AI_UNDERSTAND_URL}?preset=size_chart`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-API-Key': finalApiKey
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // If AI endpoint fails, fall back to basic OCR
            if (response.status === 503 || response.status === 504 || response.status === 408) {
                console.log("AI server busy/timeout, falling back to basic OCR...");
                return await fallbackToBasicOCR(blob, finalApiKey);
            }

            throw new Error(errorData.detail || `AI Understanding Error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("AI Understanding Result:", result);

        // Parse the AI response into structured data
        return parseAIResponse(result.result);

    } catch (error) {
        console.error("AI Extraction Error:", error);

        // On any error, try fallback to basic OCR
        if (error.message.includes('timeout') || error.message.includes('network')) {
            console.log("Network issue, trying basic OCR fallback...");
            try {
                const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
                const base64Data = matches ? matches[2] : imageBase64;
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'image/png' });
                return await fallbackToBasicOCR(blob, API_KEY);
            } catch (fallbackError) {
                console.error("Fallback also failed:", fallbackError);
            }
        }

        throw error;
    }
}

/**
 * Fallback to basic OCR if AI is unavailable
 */
async function fallbackToBasicOCR(blob, apiKey) {
    const formData = new FormData();
    formData.append('file', blob, 'chart.png');

    const response = await fetch(`${OCR_API_URL}?language=ind&psm=3&preprocess=true`, {
        method: 'POST',
        body: formData,
        headers: {
            'X-API-Key': apiKey
        }
    });

    if (!response.ok) {
        throw new Error(`OCR API Error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Fallback OCR Text:", result.text);
    return parseOCROutput(result.text);
}

/**
 * Parse AI Understanding response into structured chart data
 */
function parseAIResponse(aiResult) {
    if (!aiResult) {
        console.log("No AI result, returning default");
        return { sku: null, notes: null, tableData: { headers: ["SIZE", "UKURAN"], data: [] } };
    }

    console.log("Parsing AI Response:", aiResult);

    // Try to extract JSON from the AI response
    try {
        let jsonString = aiResult;

        // Remove markdown code blocks if present
        if (typeof aiResult === 'string') {
            jsonString = aiResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        }

        console.log("Cleaned JSON string:", jsonString);

        // Try to find and parse JSON
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[0]);
            console.log("Parsed JSON data:", jsonData);

            // Check for the expected format: sizes array + measurements object
            if (jsonData.sizes && Array.isArray(jsonData.sizes)) {
                const sizes = jsonData.sizes;
                const measurements = jsonData.measurements || {};

                console.log("Sizes:", sizes);
                console.log("Measurements:", measurements);

                const measurementKeys = Object.keys(measurements);
                console.log("Measurement keys:", measurementKeys);

                // Check if measurements have the format: {measurement_name: {size: S, value: X}}
                const firstMeasurement = measurements[measurementKeys[0]];
                console.log("First measurement:", firstMeasurement);

                if (firstMeasurement && typeof firstMeasurement === 'object' && 'value' in firstMeasurement) {
                    // Alternative format: each measurement key has {size, value, unit}
                    console.log("Detected alternative format (value-based)");
                    const uniqueMeasurementTypes = [...new Set(measurementKeys.map(k => k.replace(/_/g, ' ').toUpperCase()))];
                    const headers = ["SIZE", ...uniqueMeasurementTypes];

                    const dataMap = {};
                    sizes.forEach(size => {
                        dataMap[size] = { SIZE: size };
                        uniqueMeasurementTypes.forEach(mt => {
                            dataMap[size][mt] = "";
                        });
                    });

                    measurementKeys.forEach(key => {
                        const measurement = measurements[key];
                        if (measurement && measurement.size && measurement.value) {
                            const measurementType = key.replace(/_/g, ' ').toUpperCase();
                            if (dataMap[measurement.size]) {
                                dataMap[measurement.size][measurementType] = measurement.value;
                            }
                        }
                    });

                    const data = sizes.map(size => dataMap[size]);
                    console.log("Result (alt format):", { headers, data });

                    return {
                        sku: jsonData.sku || "",
                        notes: jsonData.notes || null,
                        tableData: {
                            headers: headers,
                            data: data.length > 0 ? data : [{ "SIZE": "-", "UKURAN": "-" }]
                        }
                    };
                }

                // Standard format: measurements = {measurement_name: {S: value, M: value, ...}}
                console.log("Detected standard format (size-keyed)");
                let headers = ["SIZE"];
                if (measurementKeys.length > 0) {
                    headers = ["SIZE", ...measurementKeys.map(k => k.replace(/_/g, ' ').toUpperCase())];
                }
                console.log("Headers:", headers);

                // Build data rows
                const data = sizes.map(size => {
                    const row = { SIZE: size };
                    measurementKeys.forEach(key => {
                        const measurementData = measurements[key];
                        const headerName = key.replace(/_/g, ' ').toUpperCase();
                        if (measurementData && typeof measurementData === 'object') {
                            row[headerName] = measurementData[size] || "";
                        }
                    });
                    return row;
                });
                console.log("Data rows:", data);

                const result = {
                    sku: jsonData.sku || "",
                    notes: jsonData.notes || null,
                    tableData: {
                        headers: headers,
                        data: data.length > 0 ? data : [{ "SIZE": "-", "UKURAN": "-" }]
                    }
                };
                console.log("Final result:", result);
                return result;
            }
        }
    } catch (parseError) {
        console.log("JSON parsing failed, trying text extraction:", parseError);
    }

    // Fallback: Parse as text if JSON extraction fails
    console.log("Falling back to text parsing");
    return parseTextResponse(aiResult);
}

/**
 * Parse text response from AI into structured data
 */
function parseTextResponse(text) {
    if (!text) return { sku: null, notes: null, tableData: { headers: ["SIZE", "UKURAN"], data: [] } };

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    let headers = ["SIZE"];
    const data = [];
    let sku = null;
    let notes = null;
    let inTable = false;

    for (const line of lines) {
        // Look for SKU
        const skuMatch = line.match(/(?:SKU|Article|Model|Kode)[:\s]+([A-Z0-9\-]+)/i);
        if (skuMatch) {
            sku = skuMatch[1];
            continue;
        }

        // Look for table data patterns like "XS: 34" or "S - 36 - 90cm"
        const sizeMatch = line.match(/^(XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|\d{1,2})[\s:.\-]+(.+)$/i);
        if (sizeMatch) {
            inTable = true;
            const size = sizeMatch[1].toUpperCase();
            const values = sizeMatch[2].split(/[\s,\-]+/).filter(v => v.length > 0);

            // Dynamically adjust headers based on values count
            while (headers.length < values.length + 1) {
                headers.push(`COL${headers.length}`);
            }

            const row = { SIZE: size };
            values.forEach((val, idx) => {
                row[headers[idx + 1] || `COL${idx + 1}`] = val;
            });
            data.push(row);
        }

        // Look for notes (after table data)
        if (inTable && !sizeMatch && data.length > 0) {
            const lowerLine = line.toLowerCase();
            if (!lowerLine.includes('size') && line.length > 10) {
                notes = (notes ? notes + '\n' : '') + line;
            }
        }
    }

    // If we detected column headers in first line
    if (headers.length === 1 && data.length === 0) {
        // Try to detect headers from first few lines
        const headerKeywords = ['size', 'ukuran', 'chest', 'bust', 'waist', 'length', 'cm', 'inch'];
        for (const line of lines.slice(0, 3)) {
            const lowerLine = line.toLowerCase();
            if (headerKeywords.some(kw => lowerLine.includes(kw))) {
                const potentialHeaders = line.split(/[\s,|\-]+/).filter(h => h.length > 1);
                if (potentialHeaders.length >= 2) {
                    headers = potentialHeaders.map(h => h.toUpperCase());
                    break;
                }
            }
        }
    }

    return {
        sku: sku || "",
        notes: notes,
        tableData: {
            headers: headers.length > 1 ? headers : ["SIZE", "UKURAN"],
            data: data.length > 0 ? data : [{ "SIZE": "-", "UKURAN": "-" }]
        }
    };
}

/**
 * Legacy OCR text parser (used as fallback)
 */
function parseOCROutput(text) {
    if (!text) return { sku: null, notes: null, tableData: { headers: ["SIZE", "UKURAN"], data: [] } };

    const rawLines = text.split('\n');
    const cleanedLines = rawLines.map(line => {
        return line.replace(/[|\[\]_]/g, ' ').replace(/\s+/g, ' ').trim();
    }).filter(l => l.length > 0);

    let sku = null;
    let headers = ["SIZE", "UKURAN"];
    const tableRows = [];
    let headerFound = false;
    let notesLines = [];

    const headerKeywords = ['size', 'ukuran', 'eu', 'us', 'uk', 'cm', 'mm', 'inch', 'len', 'foot', 'panjang'];

    for (let i = 0; i < cleanedLines.length; i++) {
        const line = cleanedLines[i];
        const lowerLine = line.toLowerCase();

        if (!sku) {
            const skuMatch = line.match(/(?:SKU|Article|Art|Model|Kode|Code|Style)[:\s]+([A-Z0-9\-]+)/i);
            if (skuMatch) {
                sku = skuMatch[1];
                continue;
            }
        }

        if (!headerFound && headerKeywords.some(k => lowerLine.includes(k))) {
            const potentialHeaders = line.split(/\s+/)
                .filter(h => h.length > 1 || /[0-9]/.test(h))
                .map(h => h.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').toUpperCase());

            if (potentialHeaders.length >= 2) {
                headers = potentialHeaders;
                headerFound = true;
                continue;
            }
        }

        const tokens = line.split(/\s+/).map(t => t.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')).filter(t => t.length > 0);

        const isDataRow = tokens.length >= 1 && (
            /^\d/.test(tokens[0]) ||
            /^[SMLXL]/.test(tokens[0].toUpperCase())
        );

        if (isDataRow && !lowerLine.includes('sku') && !lowerLine.includes('size')) {
            const rowObj = {};
            headers.forEach((h, idx) => {
                if (idx === headers.length - 1) {
                    rowObj[h] = tokens.slice(idx).join(' ');
                } else {
                    rowObj[h] = tokens[idx] || "";
                }
            });

            if (Object.values(rowObj).some(v => v.length > 0)) {
                tableRows.push(rowObj);
            }
        } else if (headerFound && tableRows.length > 0 && !isDataRow) {
            if (lowerLine.length > 5 && !lowerLine.includes('sku')) {
                notesLines.push(line);
            }
        }
    }

    return {
        sku: sku || "",
        notes: null,
        tableData: {
            headers: headers,
            data: tableRows.length > 0 ? tableRows : [{ "SIZE": "-", "UKURAN": "-" }]
        }
    };
}
