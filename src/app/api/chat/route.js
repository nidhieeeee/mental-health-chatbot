import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
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

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

/**
 * Retries an asynchronous operation when transient 5xx errors occur.
 */
async function callWithRetry(fn, maxRetries = 2, delayMs = 800) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isTransient =
        err.status >= 500 ||
        (err.message &&
          (err.message.includes("500") ||
            err.message.includes("503") ||
            err.message.includes("Internal Server Error") ||
            err.message.includes("overloaded") ||
            err.message.includes("resource exhausted")));
      if (attempt < maxRetries && isTransient) {
        console.warn(
          `Gemini API transient error on attempt ${attempt + 1}/${maxRetries + 1}. Retrying in ${delayMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2;
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

/**
 * Builds compliant chat history and separates latest user message,
 * preserving emotional context without causing duplicate processing or alternating turn errors.
 */
function buildGeminiPayload(messages) {
  // Find the target user message to respond to (the last user message in the array)
  let targetIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user" && messages[i]?.content?.trim()) {
      targetIndex = i;
      break;
    }
  }

  if (targetIndex === -1) {
    throw new Error("No valid user message found in request.");
  }

  const latestUserMessage = messages[targetIndex].content.trim();
  const rawHistory = messages.slice(0, targetIndex);

  const backgroundContext = [];
  const normalizedTurns = [];

  for (const msg of rawHistory) {
    if (!msg || !msg.content || typeof msg.content !== "string") continue;
    const trimmed = msg.content.trim();
    if (!trimmed) continue;

    // If a previous message explicitly failed, preserve its emotional context in background context
    // instead of creating an unanswered turn in history that prompts duplicate answering.
    if (msg.status === "failed") {
      backgroundContext.push(`[Previous uncompleted user thought]: "${trimmed.slice(0, 500)}"`);
      continue;
    }

    const role = msg.role === "user" ? "user" : "model";

    // Merge consecutive turns with the same role into a single turn
    if (normalizedTurns.length > 0 && normalizedTurns[normalizedTurns.length - 1].role === role) {
      normalizedTurns[normalizedTurns.length - 1].parts[0].text += `\n\n${trimmed}`;
    } else {
      normalizedTurns.push({
        role,
        parts: [{ text: trimmed }],
      });
    }
  }

  // Gemini API requires chat history to start with a "user" turn
  while (normalizedTurns.length > 0 && normalizedTurns[0].role !== "user") {
    normalizedTurns.shift();
  }

  // Gemini API requires chat history to end with a "model" turn before sending the next "user" message
  // If the last turn in history is "user", combine its content with the incoming message or background context
  while (normalizedTurns.length > 0 && normalizedTurns[normalizedTurns.length - 1].role === "user") {
    const trailingUser = normalizedTurns.pop();
    backgroundContext.push(`[Prior context]: "${trailingUser.parts[0].text.slice(0, 500)}"`);
  }

  return {
    chatHistory: normalizedTurns,
    latestUserMessage,
    backgroundContext,
  };
}

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

    const { chatHistory, latestUserMessage, backgroundContext } =
      buildGeminiPayload(messages);

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

    if (backgroundContext.length > 0) {
      dynamicSystemInstruction += `\n\nPreserved Conversational Context (from previous session/uncompleted thoughts):
${backgroundContext.join("\n")}
(Note: Use this background context to maintain empathetic continuity of the user's emotional state, but address their latest message directly without repeating or re-answering past turns).`;
    }

    const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: dynamicSystemInstruction,
      safetySettings,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    const chat = model.startChat({
      history: chatHistory,
    });

    // Check if client requested streaming
    if (stream) {
      const result = await callWithRetry(() =>
        chat.sendMessageStream(latestUserMessage)
      );

      const encoder = new TextEncoder();
      const customReadableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              try {
                const chunkText = chunk.text();
                if (chunkText) {
                  controller.enqueue(encoder.encode(chunkText));
                }
              } catch (chunkErr) {
                console.warn("Chunk extraction note:", chunkErr.message);
                const candidate = chunk.candidates?.[0];
                if (candidate?.finishReason === "SAFETY") {
                  controller.enqueue(
                    encoder.encode(`\n\n${CRISIS_DISCLAIMER_TEXT}`)
                  );
                }
              }
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
      const result = await callWithRetry(() =>
        chat.sendMessage(latestUserMessage)
      );
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
      { status: error?.status && error.status >= 400 && error.status < 600 ? error.status : 500 }
    );
  }
}
