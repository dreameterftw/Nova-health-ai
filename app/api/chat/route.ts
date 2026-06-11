
import { buildNovaSystemPrompt } from "@/lib/novaPrompt";
import type { UserActivityContext } from "@/lib/userContext";
import type { ChatLanguageCode } from "@/lib/chatLanguages";

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
    "My intelligence service is currently not connected or has run into an issue, so I cannot give a full AI response right now. You can still use NOVA safely: write down symptoms, track mood, upload documents, and use SOS immediately for urgent symptoms such as chest pain, severe breathlessness, stroke signs, major bleeding, poisoning, or self-harm risk.",
    "",
    "Please check the Groq / OpenRouter API key configuration or try again in a moment."
  ].join("\n");
}

function streamTextAsNdjsonChunks(text: string): Response {
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

function transformOpenAIStream(rawStream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = rawStream.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + "\n"));
            controller.close();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed === "data: [DONE]") continue;

            if (trimmed.startsWith("data: ")) {
              const jsonStr = trimmed.slice(6);
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  const streamChunk = JSON.stringify({ message: { content } }) + "\n";
                  controller.enqueue(encoder.encode(streamChunk));
                }
              } catch (e) {
                // Ignore parsing errors for partial or invalid lines
              }
            }
          }
        }
      } catch (err) {
        controller.error(err);
      }
    }
  });
}

/**
 * Resolves which Cloud LLM provider to use.
 * Priority: GROQ_API_KEY → OPENROUTER_API_KEY
 */
function resolveProvider(): { apiKey: string; model: string; endpoint: string; headers: Record<string, string> } | null {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    return {
      apiKey: groqKey,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`,
      }
    };
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    return {
      apiKey: openRouterKey,
      model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct",
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openRouterKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "NOVA Health"
      }
    };
  }

  return null;
}

export async function POST(req: Request) {
  let payload: {
    messages?: unknown;
    userProfile?: { name?: string };
    currentEmotion?: EmotionContext;
    userContext?: UserActivityContext;
    exchangeCount?: number;
    language?: ChatLanguageCode;
  } = {};

  try {
    payload = await req.json();
    const { messages, userProfile, currentEmotion, userContext, exchangeCount, language } = payload;
    const provider = resolveProvider();
    const emotion = (currentEmotion || {}) as EmotionContext;

    if (!provider) {
      return streamTextAsNdjsonChunks(fallbackResponse(messages, userProfile));
    }

    const systemPrompt = buildNovaSystemPrompt(
      userProfile?.name,
      emotion,
      userContext,
      typeof exchangeCount === "number" ? exchangeCount : 0,
      language || "auto"
    );

    // Map messages for the OpenAI-compatible chat format
    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(messages) ? messages : [])
        .filter((m: ChatMessage) => m?.role === "user" || m?.role === "assistant")
        .map((m: ChatMessage) => ({
          role: m.role,
          content: m.content
        }))
    ];

    const response = await fetch(provider.endpoint, {
      method: "POST",
      headers: provider.headers,
      body: JSON.stringify({
        model: provider.model,
        messages: chatMessages,
        stream: true,
        temperature: 0.7,
        top_p: 0.88,
        max_tokens: 768
      })
    }).catch(() => {
      return null;
    });

    if (!response) {
      return streamTextAsNdjsonChunks(fallbackResponse(messages, userProfile));
    }

    if (!response.ok) {
      return streamTextAsNdjsonChunks(fallbackResponse(messages, userProfile));
    }

    if (!response.body) {
      throw new Error("Cloud LLM returned an empty streaming response.");
    }

    const transformedStream = transformOpenAIStream(response.body);

    return new Response(transformedStream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no"
      }
    });

  } catch {
    return streamTextAsNdjsonChunks(fallbackResponse(payload.messages, payload.userProfile));
  }
}
