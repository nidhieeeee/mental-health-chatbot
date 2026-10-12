import { GoogleGenerativeAI } from "@google/generative-ai";
import { containsCrisisSignals, CRISIS_DISCLAIMER_TEXT } from "@/lib/safety";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const baseSystemInstruction = `You are MindMate, a compassionate, non-judgmental, and emotionally intelligent mental health companion.
Your mission is to provide an active, empathetic listening space, helping users reflect, process difficult emotions, and practice evidence-based coping tools (such as CBT cognitive reframing, mindfulness, and breathing).

Core Communication Principles:
1. Validate First: Always acknowledge feelings with deep warmth and validation before offering perspective.
2. Safe Boundaries: You are an AI companion, not a licensed medical professional. Do NOT offer clinical diagnoses, psychiatric prescriptions, or medical prognoses.
3. Collaborative & Grounded: Ask gentle, open-ended questions. Encourage reflection rather than rushing to solve every emotion.
4. Formatting: Keep responses readable, conversational, and thoughtfully structured using clean Markdown. Avoid dense walls of text.
5. Critical Safety: If a user expresses intent to self-harm, suicide, or severe hopelessness, prioritize their physical safety above all else. Provide compassionate validation and explicitly connect them with verified 24/7 crisis hotlines (e.g., 988 Lifeline, Crisis Text Line).`;

export async function POST(req) {
  try {
    const { messages, context, stream = true } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: "Gemini API key is not configured in server environment." },
        { status: 500 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Messages array is required." },
        { status: 400 }
      );
    }

    const latestUserMessage = messages[messages.length - 1]?.content || "";
    const isCrisis = containsCrisisSignals(latestUserMessage);

    let dynamicSystemInstruction = baseSystemInstruction;

    if (isCrisis) {
      dynamicSystemInstruction += `\n\n🚨 URGENT SAFETY PROTOCOL:
The user's message contains indicators of severe crisis or self-harm.
You MUST:
1. Warmly validate their pain without judgment ("I hear how overwhelmed and exhausted you are feeling right now, and I care about your safety.").
2. Remind them gently that they do not have to carry this alone.
3. Clearly provide direct helpline resources:
${CRISIS_DISCLAIMER_TEXT}
4. Stay calm, gentle, and present. Do not overwhelm them with clinical jargon.`;
    }

    if (context) {
      dynamicSystemInstruction += `\n\nUser Context Snapshot:`;
      if (context.mood) {
        dynamicSystemInstruction += `\n- Current Logged Mood: "${context.mood.label}" (logged ${new Date(
          context.mood.timestamp
        ).toLocaleDateString()})`;
        dynamicSystemInstruction += `\n- Tone Adaptation: Meet them where they are. If they are "${context.mood.label}", adapt your emotional pacing and empathy accordingly.`;
      }
      if (context.journal) {
        dynamicSystemInstruction += `\n- Recent Journal Snippet: "${context.journal.content?.slice(0, 200)}..."`;
      }
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: dynamicSystemInstruction,
    });

    // Format chat history for Gemini API
    let chatHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Ensure history starts with user message per Gemini API requirement
    while (chatHistory.length > 0 && chatHistory[0].role !== "user") {
      chatHistory.shift();
    }

    const chat = model.startChat({
      history: chatHistory,
    });

    // Check if client requested streaming
    if (stream) {
      const result = await chat.sendMessageStream(latestUserMessage);

      const encoder = new TextEncoder();
      const customReadableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              controller.enqueue(encoder.encode(chunkText));
            }
            controller.close();
          } catch (err) {
            console.error("Stream transfer error:", err);
            controller.error(err);
          }
        },
      });

      return new Response(customReadableStream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "X-Crisis-Detected": isCrisis ? "true" : "false",
        },
      });
    } else {
      const result = await chat.sendMessage(latestUserMessage);
      const responseText = result.response.text();
      return Response.json({
        text: responseText,
        isCrisis,
      });
    }
  } catch (error) {
    console.error("Error in chat API route:", error);
    return Response.json(
      { error: error?.message || "Failed to generate AI response." },
      { status: 500 }
    );
  }
}
