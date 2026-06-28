import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { getGraph, type HealthGraph } from "@/lib/healthGraph";

// ADDED — env-configurable timeout for AI copy call
const BRIEFING_AI_TIMEOUT_MS = parseInt(process.env.NOVA_BRIEFING_AI_TIMEOUT_MS ?? "8000", 10);
// ADDED — minimum minutes between forced regenerations
const FORCE_REGEN_COOLDOWN_MINS = parseInt(process.env.NOVA_BRIEFING_FORCE_COOLDOWN_MINS ?? "15", 10);

type BriefingPill = {
  id: string;
  icon: string;
  label: string;
  value: string;
  detail: string;
  trend?: "up" | "down" | "flat" | "alert";
  actionTab: "chat" | "pulse" | "vault" | "profile" | "medicine";
};

type BriefingAction = {
  id: string;
  label: string;
  detail: string;
  actionTab: "chat" | "pulse" | "vault" | "profile" | "medicine";
};

type DailyBriefing = {
  date: string;
  greeting: string;
  observation: string;
  pills: BriefingPill[];
  actions: BriefingAction[];
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function firstName(name?: string) {
  return name?.trim().split(/\s+/)[0] || "there";
}

function lastScores(graph: HealthGraph, count = 3) {
  return [...graph.wellnessScores]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-count);
}

function trendFromScores(scores: { score: number }[]): "up" | "down" | "flat" {
  if (scores.length < 2) return "flat";
  const first = scores[0].score;
  const last = scores[scores.length - 1].score;
  if (last > first) return "up";
  if (last < first) return "down";
  return "flat";
}

function topSymptom(graph: HealthGraph) {
  return Object.entries(graph.symptomMap).sort((a, b) => b[1] - a[1])[0];
}

function buildDeterministicBriefing(graph: HealthGraph, name?: string): DailyBriefing {
  const date = todayKey();
  const scores = lastScores(graph);
  const trend = trendFromScores(scores);
  const scoreTrail = scores.map((e) => e.score).join(" → ");
  const symptom = topSymptom(graph);
  const nextMedication = graph.medications[0];

  // FIXED — only surface documents that haven't been discussed with NOVA yet
  const pendingDocument = graph.documents.find((d) => !d.discussedWithNOVA);

  const latestMilestone = graph.conversationMilestones[0];

  // ADDED — read patternNote written by HealthPulse P0.3
  const patternNote = (graph as any).patternNote as string | undefined;

  const pills: BriefingPill[] = [];

  if (scores.length) {
    pills.push({
      id: "wellness-trend",
      icon: "trend",
      label: "Wellness trend",
      value: trend === "up" ? "Improving" : trend === "down" ? "Needs care" : "Stable",
      detail: scoreTrail ? `${scoreTrail} recently` : "New data coming in",
      trend,
      actionTab: "pulse",
    });
  } else {
    pills.push({
      id: "wellness-trend",
      icon: "trend",
      label: "Wellness trend",
      value: "No baseline yet",
      detail: "Log today's HealthPulse to start",
      trend: "flat",
      actionTab: "pulse",
    });
  }

  if (nextMedication) {
    pills.push({
      id: "next-medication",
      icon: "pill",
      label: "Next medication",
      value: nextMedication.name,
      detail: nextMedication.time ? `Due at ${nextMedication.time}` : "Review schedule",
      trend:
        typeof nextMedication.adherenceRate === "number" && nextMedication.adherenceRate < 70
          ? "alert"
          : "flat",
      // FIXED — route to medicine tab, not profile
      actionTab: "medicine",
    });
  }

  if (symptom) {
    pills.push({
      id: "top-symptom",
      icon: "pulse",
      label: "Top symptom",
      value: symptom[0].replace(/_/g, " "),
      detail: `Reported ${symptom[1]} time${symptom[1] === 1 ? "" : "s"}`,
      trend: symptom[1] >= 3 ? "alert" : "flat",
      actionTab: "pulse",
    });
  }

  if (pendingDocument) {
    pills.push({
      id: "pending-review",
      icon: "document",
      label: "Pending review",
      value: pendingDocument.type,
      detail: `Uploaded ${pendingDocument.uploadedOn}`,
      trend: pendingDocument.keyMarkers.length ? "alert" : "flat",
      actionTab: "vault",
    });
  }

  const actions: BriefingAction[] = [
    {
      id: "log-checkin",
      label: "Log today's check-in",
      detail: scores.length ? "Keep your wellness trend current" : "Create your first baseline",
      actionTab: "pulse",
    },
  ];

  if (nextMedication) {
    actions.push({
      id: "take-medication",
      label: `Review ${nextMedication.name}`,
      detail: nextMedication.time ? `Scheduled around ${nextMedication.time}` : "Confirm dose and timing",
      // FIXED — route to medicine tab
      actionTab: "medicine",
    });
  }

  if (pendingDocument) {
    actions.push({
      id: "review-document",
      label: `Review your ${pendingDocument.type}`,
      detail: pendingDocument.keyMarkers[0] || "Open Vision Vault",
      actionTab: "vault",
    });
  }

  if (symptom && symptom[1] >= 3) {
    actions.push({
      id: "follow-symptom",
      label: `Follow up on ${symptom[0].replace(/_/g, " ")}`,
      detail: `Mentioned ${symptom[1]} times in your health picture`,
      actionTab: "chat",
    });
  }

  const namePart = firstName(name);
  const greeting =
    trend === "up"
      ? `Good to see you, ${namePart}. Your wellness has been climbing recently.`
      : trend === "down"
        ? `Hey ${namePart}. It looks like the last few check-ins have been heavier. No pressure today.`
        : `Good to see you, ${namePart}. Let's keep today simple and useful.`;

  // ADDED — incorporate patternNote from HealthPulse into observation
  const observation = patternNote
    ? `NOVA noticed: ${patternNote}${latestMilestone ? ` — ${latestMilestone.note}` : ""}`
    : symptom
      ? `NOVA noticed ${symptom[0].replace(/_/g, " ")} showing up most often in your recent health picture${latestMilestone ? `, alongside this note: ${latestMilestone.note}` : ""
      }.`
      : pendingDocument
        ? `NOVA noticed your latest ${pendingDocument.type} is ready in Vision Vault. It may be worth reviewing before your next chat.`
        : `NOVA is still building your baseline. A quick HealthPulse check-in today will make tomorrow's briefing sharper.`;

  return {
    date,
    greeting,
    observation,
    pills: pills.slice(0, 4),
    actions: actions.slice(0, 4),
  };
}

function resolveProvider(): { endpoint: string; model: string; headers: Record<string, string> } | null {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;
  return {
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`,
    },
  };
}

// ADDED — timeout wrapper for AI copy call
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function addAiCopy(
  base: DailyBriefing,
  graph: HealthGraph,
  name?: string
): Promise<DailyBriefing> {
  const provider = resolveProvider();
  if (!provider) return base;

  // ADDED — include patternNote in AI prompt so it can reference it naturally
  const patternNote = (graph as any).patternNote as string | undefined;

  const prompt = `Write a concise daily health dashboard greeting and observation for NOVA.
Return ONLY JSON: {"greeting":"...","observation":"..."}.
Tone: calm, warm, specific, never clinical. Do not diagnose.
User: ${firstName(name)}
Last wellness scores: ${lastScores(graph).map((s) => `${s.date}:${s.score}`).join(", ") || "none"}
Top symptoms: ${Object.entries(graph.symptomMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}:${v}`).join(", ") || "none"}
Medication: ${graph.medications[0]?.name || "none"}
Latest document: ${graph.documents.find((d) => !d.discussedWithNOVA)?.type || "none"}
Latest milestone: ${graph.conversationMilestones[0]?.note || "none"}${patternNote ? `\nHealth pattern note: ${patternNote}` : ""
    }`;

  try {
    // ADDED — timeout on AI copy call
    const response = await fetchWithTimeout(
      provider.endpoint,
      {
        method: "POST",
        headers: provider.headers,
        body: JSON.stringify({
          model: provider.model,
          messages: [{ role: "user", content: prompt }],
          stream: false,
          temperature: 0.45,
          max_tokens: 220,
        }),
      },
      BRIEFING_AI_TIMEOUT_MS
    );

    if (!response.ok) return base;
    const data = await response.json().catch(() => null);
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return base;

    const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] ?? content);
    return {
      ...base,
      greeting:
        typeof parsed.greeting === "string" ? parsed.greeting.slice(0, 180) : base.greeting,
      observation:
        typeof parsed.observation === "string"
          ? parsed.observation.slice(0, 320)
          : base.observation,
    };
  } catch {
    // Timeout or parse error — fall back to deterministic copy
    return base;
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader;
    if (!idToken) {
      return NextResponse.json({ error: "Authentication token missing." }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const body = await req.json().catch(() => ({}));
    const force = body?.force === true;

    // FIXED — prefer verified display name from token; fall back to body
    const userName = decoded.displayName || body?.userName || undefined;

    const date = todayKey();
    const cacheRef = getAdminDb()
      .collection("users")
      .doc(decoded.uid)
      .collection("sessions")
      .doc(`dailyBriefing-${date}`);

    if (!force) {
      const cached = await cacheRef.get();
      if (cached.exists) {
        const data = cached.data();
        // FIXED — extract only the briefing fields, not generatedAt etc.
        const briefing: DailyBriefing = {
          date: data?.date,
          greeting: data?.greeting,
          observation: data?.observation,
          pills: data?.pills ?? [],
          actions: data?.actions ?? [],
        };
        return NextResponse.json({ briefing, cached: true });
      }
    } else {
      // ADDED — rate-limit force regeneration
      const existing = await cacheRef.get();
      if (existing.exists) {
        const generatedAt = existing.data()?.generatedAt as string | undefined;
        if (generatedAt) {
          const ageMs = Date.now() - new Date(generatedAt).getTime();
          const cooldownMs = FORCE_REGEN_COOLDOWN_MINS * 60 * 1000;
          if (ageMs < cooldownMs) {
            const data = existing.data();
            const briefing: DailyBriefing = {
              date: data?.date,
              greeting: data?.greeting,
              observation: data?.observation,
              pills: data?.pills ?? [],
              actions: data?.actions ?? [],
            };
            return NextResponse.json({ briefing, cached: true, rateLimited: true });
          }
        }
      }
    }

    const graph = await getGraph(decoded.uid);
    const base = buildDeterministicBriefing(graph, userName);
    const briefing = await addAiCopy(base, graph, userName);

    // FIXED — store briefing fields separately from metadata
    await cacheRef.set(
      { ...briefing, generatedAt: new Date().toISOString() },
      { merge: true }
    );

    return NextResponse.json({ briefing, cached: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}