
import { GoogleGenAI, Type } from "@google/genai";
import { TicketPriority } from "../types";

const API_KEY = process.env.API_KEY || ''; // Ensure this is set in your environment
const ai = new GoogleGenAI({ apiKey: API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

export interface TicketAnalysis {
  category: string;
  priority: TicketPriority;
  summary: string;
  sentiment: string;
  suggestedSolution: string;
}

export const analyzeTicket = async (subject: string, description: string): Promise<TicketAnalysis> => {
  if (!API_KEY) {
      // Fallback if no API key is provided
      return {
          category: 'Общее',
          priority: TicketPriority.MEDIUM,
          summary: 'Анализ недоступен (Нет API Key)',
          sentiment: 'Нейтрально',
          suggestedSolution: 'Пожалуйста, проверьте вручную.'
      };
  }

  try {
    const prompt = `
      Analyze the following support ticket for SocPower.ru (a social media marketing tool).
      Subject: ${subject}
      Description: ${description}
      
      Determine the following. RETURN ALL TEXT FIELDS IN RUSSIAN LANGUAGE:
      1. A short category (e.g., Биллинг, Технический, API, Аккаунт).
      2. Priority (LOW, MEDIUM, HIGH, CRITICAL).
      3. A one-sentence summary in Russian.
      4. User sentiment (e.g., Раздражен, Доволен, Смущен) in Russian.
      5. A brief suggested solution for the support agent in Russian.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            summary: { type: Type.STRING },
            sentiment: { type: Type.STRING },
            suggestedSolution: { type: Type.STRING }
          },
          required: ['category', 'priority', 'summary', 'sentiment', 'suggestedSolution']
        }
      }
    });

    if (response.text) {
        const data = JSON.parse(response.text);
        // Cast priority safely
        const priority = Object.values(TicketPriority).includes(data.priority as TicketPriority)
            ? (data.priority as TicketPriority)
            : TicketPriority.MEDIUM;

        return {
            ...data,
            priority
        };
    }
    throw new Error("No response from AI");

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
        category: 'Не определено',
        priority: TicketPriority.MEDIUM,
        summary: 'Ошибка авто-анализа.',
        sentiment: 'Неизвестно',
        suggestedSolution: 'Требуется ручная проверка.'
    };
  }
};
