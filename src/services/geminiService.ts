import { GoogleGenAI, Type } from "@google/genai";

// @ts-ignore
const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
               // @ts-ignore
               (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || 
               "";

export async function analyzePrices(matrix: any[], marketPrices: any[]) {
  // @ts-ignore
  const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
                 // @ts-ignore
                 (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || 
                 "";

  if (!apiKey) {
    console.warn("Gemini API key is not set. Returning mock analysis.");
    return {
      recommendations: [
        {
          product: "Помидоры Черри",
          currentPrice: 250,
          bestPrice: 240,
          supplier: "Мясной Двор",
          savingsPercent: 4
        }
      ],
      alerts: ["Режим демонстрации: подключите API ключ для реального анализа"]
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    Analyze the following restaurant product matrix and current market prices.
    Identify the top 3 saving opportunities where the restaurant can switch to a cheaper supplier.
    Also, flag any unusual price increases.

    Restaurant Matrix: ${JSON.stringify(matrix)}
    Market Prices: ${JSON.stringify(marketPrices)}
  `;

  try {
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
  } catch (error) {
    console.error("Gemini API error:", error);
    return { recommendations: [], alerts: ["Ошибка API Gemini"] };
  }
}
