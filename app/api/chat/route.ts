import { buildNovaSystemPrompt } from "@/lib/novaPrompt";
import type { UserActivityContext } from "@/lib/userContext";
import type { ChatLanguageCode } from "@/lib/chatLanguages";
import type { HealthMemoryGraph } from "@/lib/healthMemory";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { buildSystemPrompt, getGraph, markDocumentDiscussed } from "@/lib/healthGraph";
import { extractConversationFacts } from "@/lib/graphExtractor";

// ADDED — tuneable via env, sensible defaults
const LLM_TEMPERATURE = parseFloat(process.env.NOVA_LLM_TEMPERATURE ?? "0.7");
const LLM_TOP_P = parseFloat(process.env.NOVA_LLM_TOP_P ?? "0.88");
const LLM_MAX_TOKENS = parseInt(process.env.NOVA_LLM_MAX_TOKENS ?? "768", 10);
const LLM_TIMEOUT_MS = parseInt(process.env.NOVA_LLM_TIMEOUT_MS ?? "28000", 10);
const MAX_MESSAGES_IN = parseInt(process.env.NOVA_MAX_MESSAGES_IN ?? "40", 10);
// ADDED — rough body size guard (bytes). 64 KB is generous for chat payloads.
const MAX_BODY_BYTES = parseInt(process.env.NOVA_MAX_BODY_BYTES ?? "65536", 10);

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

function fallbackResponse(
  messages: unknown,
  userProfile: { name?: string } | undefined
): string {
  const lastUserMessage = Array.isArray(messages)
    ? [...messages].reverse().find((m) => m?.role === "user")?.content
    : "";
  const topic =
    typeof lastUserMessage === "string" && lastUserMessage.trim()
      ? `I saw your message: "${lastUserMessage.trim().slice(0, 140)}${lastUserMessage.length > 140 ? "…" : ""}"`
      : "I saw your message.";

  return [
    `I am here, ${userProfile?.name || "there"}. ${topic}`,
    "",
    "My intelligence service is currently not connected or has run into an issue. You can still use NOVA safely: write down symptoms, track your mood, upload documents, and use SOS immediately for urgent symptoms such as chest pain, severe breathlessness, stroke signs, or self-harm risk.",
    "",
    "Please check the Groq / OpenRouter API key configuration or try again in a moment.",
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
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

function transformOpenAIStream(
  rawStream: ReadableStream<Uint8Array>,
  onComplete?: (assistantText: string) => void
): ReadableStream<Uint8Array> {
  const reader = rawStream.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let assistantText = "";

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            onComplete?.(assistantText);
            controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + "\n"));
            controller.close();
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") continue;
            if (trimmed.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  assistantText += content;
                  controller.enqueue(encoder.encode(JSON.stringify({ message: { content } }) + "\n"));
                }
              } catch { }
            }
          }
        }
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

function resolveProvider(): {
  apiKey: string;
  model: string;
  endpoint: string;
  headers: Record<string, string>;
} | null {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    return {
      apiKey: groqKey,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
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
        Authorization: `Bearer ${openRouterKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "NOVA Health",
      },
    };
  }
  return null;
}

async function runPostSessionTasks(
  uid: string,
  transcript: { role: string; content: string }[],
  assistantText: string,
  graphDocuments: { uploadedOn: string; type: string }[]
): Promise<void> {
  const fullTranscript = [
    ...transcript.slice(-20),
    { role: "assistant", content: assistantText },
  ];
  await Promise.allSettled([
    extractConversationFacts(uid, fullTranscript).catch((err) => {
      console.error("[NOVA] graphExtractor failed:", err);
    }),
    flagDiscussedDocuments(uid, assistantText, graphDocuments).catch((err) => {
      console.error("[NOVA] markDocumentDiscussed failed:", err);
    }),
  ]);
}

async function flagDiscussedDocuments(
  uid: string,
  assistantText: string,
  documents: { uploadedOn: string; type: string }[]
): Promise<void> {
  if (!documents.length || !assistantText) return;
  const lowerText = assistantText.toLowerCase();
  for (const doc of documents) {
    const typeMatch = doc.type.toLowerCase().split(" ").some(
      (word) => word.length > 3 && lowerText.includes(word)
    );
    const dateMatch = lowerText.includes(doc.uploadedOn);
    if (typeMatch || dateMatch) {
      await markDocumentDiscussed(uid, doc.uploadedOn);
    }
  }
}

export async function POST(req: Request) {
  // ADDED — body size guard before parsing
  const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: "Request too large." }), {
      status: 413,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: {
    messages?: unknown;
    userProfile?: { name?: string };
    currentEmotion?: EmotionContext;
    userContext?: UserActivityContext;
    exchangeCount?: number;
    language?: ChatLanguageCode;
    healthMemory?: HealthMemoryGraph;
    // ADDED — authToken removed from payload type; read from header only
  } = {};

  try {
    payload = await req.json();
    const {
      messages,
      userProfile,
      currentEmotion,
      userContext,
      exchangeCount,
      language,
      healthMemory,
    } = payload;

    const provider = resolveProvider();
    const emotion = (currentEmotion || {}) as EmotionContext;
    let uid: string | null = null;
    let graphPrompt = "";
    let graphDocuments: { uploadedOn: string; type: string }[] = [];

    // ADDED — read token from Authorization header only
    const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    if (bearerToken) {
      try {
        const decoded = await getAdminAuth().verifyIdToken(bearerToken);
        uid = decoded.uid;
        const graph = await getGraph(uid);
        graphPrompt = buildSystemPrompt(graph);
        graphDocuments = graph.documents.map((d) => ({
          uploadedOn: d.uploadedOn,
          type: d.type,
        }));
      } catch {
        uid = null;
      }
    }

    if (!provider) {
      return streamTextAsNdjsonChunks(fallbackResponse(messages, userProfile));
    }

    const novaBase = buildNovaSystemPrompt(
      userProfile?.name,
      emotion,
      userContext,
      typeof exchangeCount === "number" ? exchangeCount : 0,
      language || "auto",
      healthMemory
    );

    const systemPrompt = graphPrompt
      ? `${novaBase}\n\n---\n\n${graphPrompt}`
      : novaBase;

    // ADDED — cap incoming messages to MAX_MESSAGES_IN before building the chat array
    const safeMessages = Array.isArray(messages)
      ? (messages as ChatMessage[])
        .filter((m) => m?.role === "user" || m?.role === "assistant")
        .slice(-MAX_MESSAGES_IN)
        .map((m) => ({ role: m.role, content: m.content }))
      : [];

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...safeMessages,
    ];

    // ADDED — AbortController for upstream timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), LLM_TIMEOUT_MS);

    let response: Response | null = null;
    try {
      response = await fetch(provider.endpoint, {
        method: "POST",
        headers: provider.headers,
        signal: abortController.signal,
        body: JSON.stringify({
          model: provider.model,
          messages: chatMessages,
          stream: true,
          // ADDED — env-configurable with sensible defaults
          temperature: LLM_TEMPERATURE,
          top_p: LLM_TOP_P,
          max_tokens: LLM_MAX_TOKENS,
        }),
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      if (fetchErr?.name === "AbortError") {
        // Timeout — stream a graceful message
        return streamTextAsNdjsonChunks(
          `I'm taking longer than usual to respond, ${userProfile?.name || "there"}. Please try again in a moment.`
        );
      }
      return streamTextAsNdjsonChunks(fallbackResponse(messages, userProfile));
    }

    clearTimeout(timeoutId);

    if (!response || !response.ok) {
      return streamTextAsNdjsonChunks(fallbackResponse(messages, userProfile));
    }

    if (!response.body) {
      throw new Error("LLM returned an empty streaming response.");
    }

    const sanitizedTranscript = chatMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));

    const transformedStream = transformOpenAIStream(
      response.body,
      (assistantText) => {
        if (!uid || !assistantText) return;
        void runPostSessionTasks(uid, sanitizedTranscript, assistantText, graphDocuments);
      }
    );

    return new Response(transformedStream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return streamTextAsNdjsonChunks(
      fallbackResponse(payload.messages, payload.userProfile)
    );
  }
}