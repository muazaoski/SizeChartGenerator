import { GoogleGenerativeAI } from "@google/generative-ai";

export async function extractDataWithGemini(apiKey, imageBase64) {
  const genAI = new GoogleGenerativeAI(apiKey);

  // Try multiple models in order of preference
  const models = [
    "gemini-3.0-flash",           // Latest 3.0 flash model
    "gemini-2.5-flash",           // Flash model (best balance)
    "gemini-2.0-flash",           // Previous flash model
    "gemini-1.5-flash-latest",    // Stable flash model
  ];

  // Remove header if present (data:image/jpeg;base64,)
  const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid image format");
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  const prompt = `
    Analyze this image which contains a size chart. 
    Extract the data into a strict JSON format.
    The JSON should have two keys: "headers" (array of strings) and "data" (array of objects where keys match headers).
    
    Example format:
    {
      "headers": ["Size", "Chest", "Length"],
      "data": [
        { "Size": "S", "Chest": "38", "Length": "28" },
        { "Size": "M", "Chest": "40", "Length": "29" }
      ]
    }

    Do not include markdown formatting (like \`\`\`json). Just return the raw JSON string.
    If values are ranges (e.g. "38-40"), keep them as strings.
    If there are multiple tables, try to merge them or pick the most relevant one (e.g. Men's sizes).
  `;

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType: mimeType,
    },
  };

  let lastError = null;

  for (const modelName of models) {
    try {
      console.log(`Attempting to use model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      // Add a timeout to prevent infinite hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out after 30 seconds")), 30000)
      );

      const result = await Promise.race([
        model.generateContent([prompt, imagePart]),
        timeoutPromise
      ]);

      const response = await result.response;
      const text = response.text();

      console.log(`Success with model: ${modelName}`);
      console.log("Gemini Raw Response:", text);

      // Clean up potential markdown code blocks
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        return JSON.parse(cleanedText);
      } catch (e) {
        console.error("Failed to parse JSON:", cleanedText);
        throw new Error("AI response was not valid JSON. Please try again.");
      }

    } catch (error) {
      console.error(`Failed with model ${modelName}:`, error.message);
      lastError = error;

      // If it's a rate limit error, try next model
      if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('rate')) {
        console.log(`Rate limited on ${modelName}, trying next model...`);
        continue;
      }

      // For other errors, also try next model but log appropriately
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log(`Model ${modelName} not available, trying next...`);
        continue;
      }

      // If it's a different error type, still try next model
      continue;
    }
  }

  // All models failed
  throw new Error(`All models failed. Last error: ${lastError?.message || 'Unknown error'}. You may have exceeded your API quota - please wait a moment and try again.`);
}
