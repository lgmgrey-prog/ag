import { GoogleGenAI, Type } from "@google/genai";

let cachedApiKey: string | null = null;

async function getApiKey() {
  if (cachedApiKey) return cachedApiKey;

  // @ts-ignore
  const envKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
                 // @ts-ignore
                 (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY);
  
  if (envKey) {
    cachedApiKey = envKey;
    return envKey;
  }

  try {
    const res = await fetch('/api/config/public');
    const data = await res.json();
    if (data.gemini_api_key) {
      cachedApiKey = data.gemini_api_key;
      return data.gemini_api_key;
    }
  } catch (e) {
    console.error("Failed to fetch public config:", e);
  }

  return "";
}

export async function analyzePrices(matrix: any[], marketPrices: any[]) {
  const apiKey = await getApiKey();

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

export async function recognizeInvoice(base64Image?: string, textContent?: string) {
  const apiKey = await getApiKey();

  if (!apiKey) {
    console.warn("Gemini API key is not set. Returning mock recognition.");
    return {
      amount: 12500,
      supplier: "ООО Мясной Двор",
      items: [
        { name: "Говядина вырезка", quantity: 10, unit: "кг", price: 950, total: 9500 },
        { name: "Свинина шея", quantity: 5, unit: "кг", price: 600, total: 3000 }
      ]
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const contents: any[] = [];
    
    if (base64Image) {
       // Detect mime type from base64 string
       const mimeMatch = base64Image.match(/^data:([^;]+);base64,/);
       const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
       
       contents.push({
         inlineData: {
           mimeType: mimeType,
           data: base64Image.split(',')[1]
         }
       });
    }

    if (textContent) {
      contents.push({ text: `Текстовое содержимое файла (CSV/XML/Таблица):\n${textContent}` });
    }

    contents.push({
      text: "Извлеки данные из этой накладной. Верни JSON с полями 'amount' (общая сумма), 'supplier' (название поставщика) и 'items' (массив объектов {name, quantity, unit, price, total})."
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            supplier: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  total: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini API error:", error);
    return { amount: 0, supplier: "", items: [] };
  }
}
