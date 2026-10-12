import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { moods, journals } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: "Gemini API key is not configured." },
        { status: 500 }
      );
    }

    if ((!moods || moods.length === 0) && (!journals || journals.length === 0)) {
      return Response.json({
        summary: "Log a few moods or journal entries to unlock personalized emotional patterns and reflections!",
        highlights: ["Start your first check-in today"]
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
    });

    const prompt = `Analyze this user's recent emotional check-in history and journal entries. 
Provide a warm, supportive 2-3 paragraph reflection summarizing:
1. Observed emotional patterns or shifts.
2. Acknowledgment of resilience and themes noticed.
3. 2-3 gentle, practical wellness suggestions for the week ahead (e.g. mindfulness, journaling prompt, self-care boundary).

Recent Mood Logs (newest to oldest):
${JSON.stringify(moods?.slice(0, 15) || [])}

Recent Journal Entries:
${JSON.stringify(journals?.slice(0, 5) || [])}

Return the response in JSON format matching this schema:
{
  "summary": "Warm, encouraging markdown summary",
  "highlights": ["3 concise key insights or takeaways as bullet points"]
}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(result.response.text());
    return Response.json(parsed);
  } catch (error) {
    console.error("Error generating wellness insights:", error);
    return Response.json(
      { error: "Failed to generate wellness insights." },
      { status: 500 }
    );
  }
}
