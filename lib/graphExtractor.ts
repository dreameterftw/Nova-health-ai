import { getGraph, updateGraph } from "@/lib/healthGraph";
import { evaluateEarlyWarning } from "@/lib/earlyWarning";

type ExtractedGraphFacts = {
  symptoms?: string[];
  conditions?: string[];
  goals?: string[];
  milestones?: { note: string }[];
  sentiment?: {
    valence?: "positive" | "neutral" | "negative";
    negativeSelfReference?: boolean;
    crisisLanguage?: boolean;
  };
};

function resolveProvider(): { endpoint: string; model: string; headers: Record<string, string> } | null {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    return {
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
    };
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    return {
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct",
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

function parseJsonObject(text: string): ExtractedGraphFacts {
  const trimmed = text.trim();
  const jsonText = trimmed.startsWith("{")
    ? trimmed
    : trimmed.match(/\{[\s\S]*\}/)?.[0] ?? "{}";
  try {
    return JSON.parse(jsonText) as ExtractedGraphFacts;
  } catch {
    return {};
  }
}

function cleanList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10);
}

export async function extractConversationFacts(uid: string, transcript: { role: string; content: string }[]) {
  const provider = resolveProvider();
  if (!provider || transcript.length === 0) return;

  const prompt = `Extract durable user health facts from this NOVA chat transcript.
Return ONLY compact JSON with this shape:
{
  "symptoms": ["fatigue"],
  "conditions": ["migraines"],
  "goals": ["better sleep"],
  "milestones": [{"note": "User mentioned work-related stress"}],
  "sentiment": {"valence":"negative","negativeSelfReference":false,"crisisLanguage":false}
}

Only include facts that are new, health-related, and likely useful in future sessions. Do not diagnose.

Transcript:
${transcript.map((m) => `${m.role}: ${m.content}`).join("\n")}`;

  const response = await fetch(provider.endpoint, {
    method: "POST",
    headers: provider.headers,
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: "user", content: prompt }],
      stream: false,
      temperature: 0.1,
      max_tokens: 400,
    }),
  }).catch(() => null);

  if (!response?.ok) return;
  const data = await response.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return;

  const extracted = parseJsonObject(content);
  const symptoms = cleanList(extracted.symptoms);
  const conditions = cleanList(extracted.conditions);
  const goals = cleanList(extracted.goals);
  const milestones = Array.isArray(extracted.milestones)
    ? extracted.milestones
        .map((item) => typeof item?.note === "string" ? item.note.trim() : "")
        .filter(Boolean)
        .slice(0, 5)
    : [];
  const sentiment = extracted.sentiment;
  const valence: "positive" | "neutral" | "negative" =
    sentiment?.valence === "positive" || sentiment?.valence === "negative" ? sentiment.valence : "neutral";
  const chatSentimentEntry = {
    date: new Date().toISOString().slice(0, 10),
    valence,
    negativeSelfReference: sentiment?.negativeSelfReference === true,
    crisisLanguage: sentiment?.crisisLanguage === true,
  };

  const graph = await getGraph(uid);
  const symptomMap = { ...graph.symptomMap };
  for (const symptom of symptoms) {
    symptomMap[symptom] = (symptomMap[symptom] ?? 0) + 1;
  }

  const today = new Date().toISOString().slice(0, 10);
  const chatSentiment = [chatSentimentEntry, ...graph.chatSentiment].slice(0, 20);
  const draft = {
    ...graph,
    symptomMap,
    chatSentiment,
    conversationMilestones: [
      ...milestones.map((note) => ({ date: today, note: note.slice(0, 180) })),
      ...graph.conversationMilestones,
    ].slice(0, 30),
  };

  await updateGraph(uid, {
    profile: {
      conditions,
      goals,
    },
    symptomMap,
    chatSentiment,
    conversationMilestones: draft.conversationMilestones,
    earlyWarning: evaluateEarlyWarning(draft),
  });
}
