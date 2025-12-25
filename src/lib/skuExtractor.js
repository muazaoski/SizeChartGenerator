import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Extract SKU number from an image using Gemini AI
 * @param {string} imageUrl - The image URL or data URL
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<string|null>} - The extracted SKU number or null if not found
 */
export async function extractSKUFromImage(imageUrl, apiKey) {
    try {
        console.log('Starting AI-based SKU extraction...');

        const genAI = new GoogleGenerativeAI(apiKey);

        // Try multiple models in order of preference
        const models = [
            "gemini-3.0-flash",           // Latest 3.0 flash model
            "gemini-2.5-flash",           // Flash model
            "gemini-2.0-flash",           // Previous flash model
            "gemini-1.5-flash-latest",    // Stable flash model
        ];

        // Remove header if present (data:image/jpeg;base64,)
        const matches = imageUrl.match(/^data:(.+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error("Invalid image format");
        }

        const mimeType = matches[1];
        const base64Data = matches[2];

        // Prepare the prompt for Gemini
        const prompt = `Please analyze this image and extract any SKU number you can find.
        Look for text that starts with "SKU" or any alphanumeric product codes.

        If you find an SKU, return only the SKU number (without "SKU" prefix).
        If no SKU is found, return "NO_SKU_FOUND".

        Examples of expected format:
        - If you see "SKU 508-04199", return "508-04199"
        - If you see "SKU: ABC123", return "ABC123"
        - If you see "Product Code XYZ-789", return "XYZ-789"
        - If no SKU is found, return "NO_SKU_FOUND"`;

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType,
            },
        };

        let lastError = null;

        for (const modelName of models) {
            try {
                console.log(`SKU extraction: Attempting model ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });

                // Add a timeout to prevent infinite hanging
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Request timed out after 20 seconds")), 20000)
                );

                const result = await Promise.race([
                    model.generateContent([prompt, imagePart]),
                    timeoutPromise
                ]);

                const response = await result.response;
                const extractedText = response.text().trim();

                console.log('Gemini SKU extraction response:', extractedText);

                if (!extractedText || extractedText === 'NO_SKU_FOUND') {
                    console.log('No SKU found in the image');
                    return null;
                }

                // Clean up the extracted text
                let sku = extractedText;

                // Remove any "SKU" prefix if it exists
                sku = sku.replace(/^SKU[:\s]*/i, '').trim();

                // Remove any quotes
                sku = sku.replace(/^["']|["']$/g, '').trim();

                console.log('SKU extracted:', sku);
                return sku;

            } catch (error) {
                console.error(`SKU extraction failed with ${modelName}:`, error.message);
                lastError = error;

                // Continue to next model on rate limit or unavailable
                if (error.message.includes('429') ||
                    error.message.includes('quota') ||
                    error.message.includes('404') ||
                    error.message.includes('not found')) {
                    continue;
                }

                // For other errors, still try next model
                continue;
            }
        }

        // All models failed, return null silently (SKU is optional)
        console.log('SKU extraction: All models failed, skipping SKU');
        return null;

    } catch (error) {
        console.error('Error extracting SKU with Gemini:', error);
        return null;
    }
}