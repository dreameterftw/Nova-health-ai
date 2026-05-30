import { NextResponse } from "next/server";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type EmotionContext = {
  dominant?: string;
  stress?: number;
  sadness?: number;
  fatigue?: number;
  joy?: number;
  isCritical?: boolean;
};

function formatPercent(value: unknown): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "0%";
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

function fallbackResponse(messages: unknown, userProfile: { name?: string } | undefined): string {
  const lastUserMessage = Array.isArray(messages)
    ? [...messages].reverse().find((message) => message?.role === "user")?.content
    : "";
  const topic = typeof lastUserMessage === "string" && lastUserMessage.trim()
    ? `I saw your message: "${lastUserMessage.trim().slice(0, 140)}${lastUserMessage.length > 140 ? "..." : ""}"`
    : "I saw your message.";

  return [
    `I am here, ${userProfile?.name || "there"}. ${topic}`,
    "",
    "My local intelligence service is not connected right now, so I cannot give a full AI response yet. You can still use NOVA safely: write down symptoms, track mood, upload documents, and use SOS immediately for urgent symptoms such as chest pain, severe breathlessness, stroke signs, major bleeding, poisoning, or self-harm risk.",
    "",
    "Once the NOVA Intelligence server is running, I will answer normally with personalized, context-aware support."
  ].join("\n");
}

function streamTextAsOllamaChunks(text: string): Response {
  const encoder = new TextEncoder();
  const chunks = text.match(/.{1,80}(\s|$)/g) || [text];

  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(JSON.stringify({ message: { content: chunk } }) + "\n"));
      }
      controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + "\n"));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no"
    }
  });
}

export async function POST(req: Request) {
  let payload: { messages?: unknown; userProfile?: { name?: string }; currentEmotion?: EmotionContext } = {};

  try {
    payload = await req.json();
    const { messages, userProfile, currentEmotion } = payload;
    const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "nova-health";
    const emotion = (currentEmotion || {}) as EmotionContext;

    // System prompt to define the NOVA persona
    const systemPrompt = `You are NOVA (Next-Gen Omniscient Virtual Assistant), a private and compassionate AI health companion. 
Your tone is professional yet empathetic. You are specifically designed for the Indian context (Yoga, Ayurveda, Indian medical standards).
User Name: ${userProfile?.name || "User"}

Current Emotional State:
- Dominant: ${emotion.dominant || "calm"}
- Stress Level: ${formatPercent(emotion.stress)}
- Sadness Level: ${formatPercent(emotion.sadness)}
- Joy Level: ${formatPercent(emotion.joy)}
- Fatigue Level: ${formatPercent(emotion.fatigue)}
- Critical Alert: ${emotion.isCritical ? "YES" : "No"}

IMPORTANT: You are an AI, not a doctor. Always include a disclaimer for critical medical advice. 
If the user mentions self-harm, suicide, chest pain, stroke symptoms, severe breathlessness, loss of consciousness, poisoning, pregnancy emergencies, or major bleeding, respond with deep empathy and strictly urge them to use the SOS feature and contact local emergency services immediately.
Keep answers concise, practical, and culturally aware. Do not diagnose. Explain uncertainty clearly.`;

    // Map messages for Ollama format
    const ollamaMessages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(messages) ? messages : [])
        .filter((m: ChatMessage) => m?.role === "user" || m?.role === "assistant")
        .map((m: ChatMessage) => ({
          role: m.role,
          content: m.content
        }))
    ];

    const response = await fetch(`${ollamaHost}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        messages: ollamaMessages,
        stream: true,
        options: {
          temperature: 0.6,
          top_p: 0.85,
          num_predict: 512
        }
      })
    }).catch(() => {
      return null;
    });

    if (!response) {
      return streamTextAsOllamaChunks(fallbackResponse(messages, userProfile));
    }

    if (!response.ok) {
      return streamTextAsOllamaChunks(fallbackResponse(messages, userProfile));
    }

    if (!response.body) {
      throw new Error("Ollama returned an empty streaming response.");
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no"
      }
    });

  } catch {
    return streamTextAsOllamaChunks(fallbackResponse(payload.messages, payload.userProfile));
  }
}
