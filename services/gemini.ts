
import { GoogleGenAI } from "@google/genai";
import { DailyLog, Child, Parent } from "../types";

// Always use process.env.API_KEY directly for initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDailySummary = async (log: DailyLog, child: Child, parent: Parent) => {
  if (!process.env.API_KEY) return log.teacherNotes;

  const prompt = `
    Generate a warm, professional, and friendly daycare daily summary for a parent.
    Child Name: ${child.firstName}
    Date: ${log.date}
    Mood: ${log.overallMood}
    Meals: ${log.meals.map(m => `${m.type}: ${m.items} (${m.amount} eaten)`).join(', ')}
    Naps: ${log.naps.map(n => `From ${n.startTime} to ${n.endTime} (Quality: ${n.quality})`).join(', ')}
    Activities: ${log.activities.map(a => `${a.category}: ${a.description}`).join(', ')}
    Raw Teacher Notes: ${log.teacherNotes}
    Preferred Language: ${parent.preferredLanguage}

    Instructions:
    - If language is Urdu or Punjabi, provide the translation of the narrative.
    - Focus on the positive highlights of the day.
    - Use a supportive and caring tone.
    - Format as a cohesive paragraph or two.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    // Use .text property to extract output
    return response.text || log.teacherNotes;
  } catch (error) {
    console.error("Gemini Summarization Error:", error);
    return log.teacherNotes;
  }
};
