const OCR_API_URL = "https://ocr.muazaoski.online/ocr/extract";

/**
 * Calls the custom high-accuracy OCR API
 */
export async function extractDataFromOCR(imageBase64, apiKey) {
    try {
        console.log("Starting OCR Extraction...");
        // Use provided key or fallback to a public demo key
        const finalApiKey = apiKey || "ocr_demo_key_public_feel_free_to_use";

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

        // We use PSM 3 (Auto) for better flexibility with grid lines
        const response = await fetch(`${OCR_API_URL}?language=ind&psm=3&preprocess=true`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-API-Key': finalApiKey
            }
        });

        if (!response.ok) {
            throw new Error(`OCR API Error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Raw OCR Text Output:", result.text);

        return parseOCROutput(result.text);
    } catch (error) {
        console.error("OCR Extraction Error:", error);
        throw error;
    }
}

/**
 * Robust parser for size chart OCR results.
 */
function parseOCROutput(text) {
    if (!text) return { sku: null, notes: null, tableData: { headers: ["SIZE", "UKURAN"], data: [] } };

    const rawLines = text.split('\n');
    const cleanedLines = rawLines.map(line => {
        // Keep alphanumeric and basic punctuation for measurements
        return line.replace(/[|\[\]_]/g, ' ').replace(/\s+/g, ' ').trim();
    }).filter(l => l.length > 0);

    let sku = null;
    let headers = ["SIZE", "UKURAN"]; // Default headers
    const tableRows = [];
    let headerFound = false;
    let notesLines = [];

    // Keywords to identify headers
    const headerKeywords = ['size', 'ukuran', 'eu', 'us', 'uk', 'cm', 'mm', 'inch', 'len', 'foot', 'panjang'];

    for (let i = 0; i < cleanedLines.length; i++) {
        const line = cleanedLines[i];
        const lowerLine = line.toLowerCase();

        // 1. Detect SKU (Anywhere in the text, usually top)
        if (!sku) {
            const skuMatch = line.match(/(?:SKU|Article|Art|Model|Kode|Code|Style)[:\s]+([A-Z0-9\-]+)/i);
            if (skuMatch) {
                sku = skuMatch[1];
                continue;
            }
        }

        // 2. Detect Header
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

        // 3. Process Data Rows
        const tokens = line.split(/\s+/).map(t => t.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')).filter(t => t.length > 0);

        // A data row usually starts with a size number (35, 36...) or label (S, M...)
        const isDataRow = tokens.length >= 1 && (
            /^\d/.test(tokens[0]) ||
            /^[SMLXL]/.test(tokens[0].toUpperCase())
        );

        if (isDataRow && !lowerLine.includes('sku') && !lowerLine.includes('size')) {
            const rowObj = {};
            headers.forEach((h, idx) => {
                if (idx === headers.length - 1) {
                    // Join all remaining tokens into the last column (e.g. "24.5", "CM" -> "24.5 CM")
                    rowObj[h] = tokens.slice(idx).join(' ');
                } else {
                    rowObj[h] = tokens[idx] || "";
                }
            });

            if (Object.values(rowObj).some(v => v.length > 0)) {
                tableRows.push(rowObj);
            }
        } else if (headerFound && tableRows.length > 0 && !isDataRow) {
            // Collect as notes if it's not a data row and we've already found the table
            if (lowerLine.length > 5 && !lowerLine.includes('sku')) {
                notesLines.push(line);
            }
        }
    }

    return {
        sku: sku || "",
        notes: null, // User wants notes to be default/manual only
        tableData: {
            headers: headers,
            data: tableRows.length > 0 ? tableRows : [{ "SIZE": "-", "UKURAN": "-" }]
        }
    };
}
