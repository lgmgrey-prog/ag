import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzePrices(matrix: any[], marketPrices: any[]) {
  const prompt = `
    Analyze the following restaurant product matrix and current market prices.
    Identify the top 3 saving opportunities where the restaurant can switch to a cheaper supplier.
    Also, flag any unusual price increases.

    Restaurant Matrix: ${JSON.stringify(matrix)}
    Market Prices: ${JSON.stringify(marketPrices)}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                product: { type: Type.STRING },
                currentPrice: { type: Type.NUMBER },
                bestPrice: { type: Type.NUMBER },
                supplier: { type: Type.STRING },
                savingsPercent: { type: Type.NUMBER }
              }
            }
          },
          alerts: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
