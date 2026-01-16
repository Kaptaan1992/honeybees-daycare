
import { GoogleGenAI } from "@google/genai";
import { DailyLog, Child, Parent } from "../types";

// Always use process.env.API_KEY directly for initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDailySummary = async (log: DailyLog, child: Child, parent: Parent) => {
  if (!process.env.API_KEY) return log.teacherNotes;

  const prompt = `
    Generate a warm, professional, and very CONCISE daycare daily summary (max 60 words).
    Child Name: ${child.firstName}
    Mood: ${log.overallMood}
    Activities: ${log.activities.map(a => a.category).join(', ')}
    Raw Teacher Notes: ${log.teacherNotes}
    Preferred Language: ${parent.preferredLanguage}

    Instructions:
    - Keep it very brief and focused on the best highlight of the day.
    - Focus on a narrative summary, not a list of facts.
    - If language is Urdu or Punjabi, provide the translation only.
    - Format as a single, punchy paragraph.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || log.teacherNotes;
  } catch (error) {
    console.error("Gemini Summarization Error:", error);
    return log.teacherNotes;
  }
};
