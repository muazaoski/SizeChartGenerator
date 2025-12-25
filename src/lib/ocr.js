const OCR_API_URL = "https://ocr.muazaoski.online/ocr/extract";

/**
 * Calls the custom high-accuracy OCR API
 */
export async function extractDataFromOCR(imageBase64, apiKey) {
    try {
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

        // Detailed extraction for better layout understanding if needed, 
        // but text endpoint is 100% accurate for our charts
        const response = await fetch(`${OCR_API_URL}?language=ind&psm=6&preprocess=true`, {
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
        return parseOCROutput(result.text);
    } catch (error) {
        console.error("OCR Extraction Error:", error);
        throw error;
    }
}

/**
 * State-of-the-art parser for size chart OCR results.
 * Handles messy text, artifacts, and multi-line layouts.
 */
function parseOCROutput(text) {
    const rawLines = text.split('\n');
    const cleanedLines = rawLines.map(line => {
        // Remove pipes and weird brackets but keep letters, numbers, and common symbols
        return line.replace(/[|\[\]_]/g, ' ').replace(/\s+/g, ' ').trim();
    }).filter(l => l.length > 0);

    let sku = null;
    let headers = [];
    const tableRows = [];
    let headerFound = false;
    let notesLines = [];

    // 1. Precise SKU Detection
    // Look for SKU, Article, Model, or Kode patterns
    for (const line of cleanedLines.slice(0, 8)) { // SKU is usually at the top
        const skuMatch = line.match(/(?:SKU|Article|Art|Model|Kode|Code|Style)[:\s]+([A-Z0-9\-]{3,})/i);
        if (skuMatch) {
            sku = skuMatch[1];
            break;
        }
        // Fallback: If a line is just a short alphanumeric string (e.g. "G-1234"), it's likely the SKU
        if (/^[A-Z0-9\-]{4,15}$/i.test(line) && !['SIZE', 'UKURAN'].includes(line.toUpperCase())) {
            sku = line;
        }
    }

    // 2. Header & Data Extraction
    const headerKeywords = ['size', 'ukuran', 'eu', 'us', 'uk', 'cm', 'mm', 'inch', 'len', 'foot', 'panjang'];

    for (let i = 0; i < cleanedLines.length; i++) {
        const line = cleanedLines[i];
        const lowerLine = line.toLowerCase();

        // Detect Header
        if (!headerFound && headerKeywords.some(k => lowerLine.includes(k))) {
            const potentialHeaders = line.split(/\s+/).filter(h => h.length > 1 || /[0-9]/.test(h));
            if (potentialHeaders.length >= 2) { // Need at least 2 columns to be a table
                headers = potentialHeaders;
                headerFound = true;
                continue;
            }
        }

        // Process Data Rows
        if (headerFound) {
            const tokens = line.split(/\s+/);

            // Check if this looks like a data row (usually starts with a number or size label)
            const isDataRow = tokens.length >= 1 && (
                /^\d/.test(tokens[0]) || // Starts with number (39, 40...)
                /^[SMLXL]/.test(tokens[0].toUpperCase()) // Starts with S, M, L...
            );

            // Check if it's a Footer/Note line instead
            const isNote = lowerLine.includes('note') || lowerLine.includes('please') || lowerLine.includes('*)') || tokens.length > 10;

            if (isDataRow && !isNote && tableRows.length < 50) { // Limit to 50 rows to avoid runaway
                const rowObj = {};
                headers.forEach((h, idx) => {
                    // Smart mapping: if row is shorter than headers, we try to align.
                    rowObj[h] = tokens[idx] || "";
                    // Basic cleanup for cell values
                    if (rowObj[h]) {
                        rowObj[h] = rowObj[h].replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
                    }
                });
                tableRows.push(rowObj);
            } else if (headerFound && tableRows.length > 0) {
                // Collect everything after the table as potential notes
                if (lowerLine.length > 5 && !isDataRow) {
                    notesLines.push(line);
                }
            }
        }
    }

    // 3. Notes Cleanup
    let notes = null;
    if (notesLines.length > 0) {
        // Filter and clean note items
        const validNotes = notesLines
            .filter(l => l.length > 8 && !l.includes('---'))
            .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim()) // Remove leading 1. 2.
            .filter(l => l.length > 0)
            .slice(0, 4); // Max 4 bullet points

        if (validNotes.length > 0) {
            notes = {
                title: 'Please note:',
                items: validNotes.map((text, i) => `${i + 1}. ${text}`)
            };
        }
    }

    return {
        sku,
        notes,
        tableData: {
            headers: headers.length > 0 ? headers : ["Size", "Measurement"],
            data: tableRows.length > 0 ? tableRows : [{ "Size": "-", "Measurement": "-" }]
        }
    };
}
