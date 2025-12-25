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
 * Smart parser for the 100% accurate text from our OCR
 */
function parseOCROutput(text) {
    // 1. Pre-clean the text from common OCR table artifacts
    const cleanedText = text
        .replace(/[|\[\]\-_]/g, ' ') // Replace pipes, brackets, underscores, dashes with space
        .replace(/\s+/g, ' ');       // Collapse multiple spaces

    const lines = text.split('\n').map(l => {
        // Clean each line individually while preserving structure
        return l.trim()
            .replace(/[|\[\]]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }).filter(l => l.length > 0);

    let sku = null;
    let headers = [];
    const data = [];
    let headerFound = false;

    // Keywords to identify headers
    const headerKeywords = ['size', 'ukuran', 'eu', 'us', 'uk', 'cm', 'mm', 'inch', 'length', 'lebar', 'panjang'];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();

        // 1. Check for SKU
        if (lowerLine.includes('sku')) {
            sku = line.replace(/sku[:\s]*/i, '').trim();
            continue;
        }

        // 2. Look for Header (e.g. SIZE UKURAN)
        // We filter out headers that are just single characters or symbols
        if (!headerFound && headerKeywords.some(k => lowerLine.includes(k))) {
            const rawHeaders = line.split(/\s+/).filter(h => h.length > 1 || /[a-zA-Z0-9]/.test(h));
            if (rawHeaders.length > 0) {
                headers = rawHeaders;
                headerFound = true;
            }
            continue;
        }

        // 3. Process Data Rows
        if (headerFound) {
            const row = line.split(/\s+/).filter(r => r.length > 0);

            // Only add if it's not a stray line of dashes or symbols
            if (row.length >= 1 && row.some(cell => /[a-zA-Z0-9]/.test(cell))) {
                const rowObj = {};
                headers.forEach((h, idx) => {
                    // Map data to headers by position
                    rowObj[h] = row[idx] || "";

                    // Specific cleanup for measurement values (removing stray non-alphanumeric at start/end)
                    if (typeof rowObj[h] === 'string') {
                        rowObj[h] = rowObj[h].replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
                    }
                });
                data.push(rowObj);
            }
        }
    }

    return {
        sku,
        tableData: {
            headers: headers.length > 0 ? headers : ["Size", "Measurement"],
            data: data
        }
    };
}
