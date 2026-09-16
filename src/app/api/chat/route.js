import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = `You are an empathetic, non-judgmental, and supportive mental health chatbot. 
Your goal is to provide a safe space for users to discuss their feelings and mental health concerns.
Always use a kind, reassuring, and validating tone. 
Important Guidelines:
1. Do not provide medical diagnoses or prescribe treatments.
2. If the user mentions self-harm, suicide, or being in immediate danger, strongly encourage them to seek immediate professional help or contact emergency services (e.g., 911 or a local crisis hotline like 988 in the US or 112 globally).
3. Keep responses concise but thoughtful.
4. Format your responses using markdown for readability where appropriate.`;

export async function POST(req) {
  try {
    const { messages, context } = await req.json();
    
    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "Gemini API key is not configured." }, { status: 500 });
    }

    let dynamicSystemInstruction = systemInstruction;

    if (context) {
      dynamicSystemInstruction += `\n\nUser's Recent Context:`;
      if (context.mood) {
        dynamicSystemInstruction += `\n- Current Mood: ${context.mood.label} (logged on ${new Date(context.mood.timestamp).toLocaleString()})`;
      }
      if (context.journal) {
        dynamicSystemInstruction += `\n- Recent Journal Entry: "${context.journal.content}" (written on ${new Date(context.journal.timestamp).toLocaleString()})`;
      }
      dynamicSystemInstruction += `\nUse this context to be more empathetic and aware of their current state, but do not explicitly say "I see you logged a mood" unless it flows naturally in conversation.`;
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash",
      systemInstruction: dynamicSystemInstruction 
    });

    // Format history for Gemini API: requires role ('user' or 'model') and parts ([{ text: "..." }])
    // The Gemini API strictly requires that the history starts with a 'user' message.
    let chatHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Remove any leading messages that are not from the 'user'
    while (chatHistory.length > 0 && chatHistory[0].role !== 'user') {
      chatHistory.shift();
    }

    const history = chatHistory;
    
    const latestMessage = messages[messages.length - 1].content;

    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessage(latestMessage);
    const responseText = result.response.text();

    return Response.json({ text: responseText });
    
  } catch (error) {
    console.error("Error in chat API route:", error);
    return Response.json({ error: "Failed to generate response." }, { status: 500 });
  }
}
