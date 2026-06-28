import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import type { BodySymptom, HealthPulseLog, MindSymptom } from "@/lib/userContext";

const BRIEF_TIMEOUT_MS = parseInt(process.env.NOVA_BRIEF_TIMEOUT_MS ?? "15000", 10);
const MAX_LOGS_INPUT = parseInt(process.env.NOVA_BRIEF_MAX_LOGS ?? "30", 10);
const VALID_RANGE_DAYS = new Set([7, 14, 30]);
// ADDED — allowlist of valid symptom values to prevent prompt injection via symptom fields
const VALID_BODY_SYMPTOMS = new Set([
  "fatigue", "headache", "nausea", "pain", "joint_pain", "back_pain",
  "shortness_of_breath", "dizziness", "fever", "chest_tightness",
  "stomach_ache", "muscle_ache",
]);
const VALID_MIND_SYMPTOMS = new Set([
  "anxious", "stressed", "low", "tired", "foggy", "calm",
  "irritable", "overwhelmed", "hopeful", "restless",
]);

function resolveProvider(): {
  apiKey: string; model: string; endpoint: string; headers: Record<string, string>;
} | null {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    return {
      apiKey: groqKey,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
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

function formatSymptomLabel(s: string): string {
  return s.replace(/_/g, " ");
}

// ADDED — sanitise a single log entry before it enters the prompt
function sanitiseLog(raw: any): HealthPulseLog | null {
  if (!raw || typeof raw !== "object") return null;
  if (typeof raw.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date)) return null;
  const score = typeof raw.wellnessScore === "number" ? Math.round(raw.wellnessScore) : null;
  if (score === null || score < 1 || score > 10) return null;

  return {
    date: raw.date,
    wellnessScore: score,
    // ADDED — allowlist symptom values to prevent prompt injection
    bodySymptoms: Array.isArray(raw.bodySymptoms)
      ? raw.bodySymptoms.filter((s: any) => typeof s === "string" && VALID_BODY_SYMPTOMS.has(s)) as BodySymptom[]
      : [],
    mindSymptoms: Array.isArray(raw.mindSymptoms)
      ? raw.mindSymptoms.filter((s: any) => typeof s === "string" && VALID_MIND_SYMPTOMS.has(s)) as MindSymptom[]
      : [],
    symptomIntensity: {},
    // ADDED — truncate and strip note to plain text only (no special chars that aid injection)
    note: typeof raw.note === "string"
      ? raw.note.slice(0, 300).replace(/[<>{}[\]\\]/g, "")
      : undefined,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
  };
}

function buildBriefPrompt(logs: HealthPulseLog[], rangeDays: number): string {
  if (logs.length === 0) return "No health check-in data available for this period.";

  const scores = logs.map((l) => l.wellnessScore);
  const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);

  const bodyFreq: Record<string, number> = {};
  const mindFreq: Record<string, number> = {};
  for (const log of logs) {
    for (const s of log.bodySymptoms) bodyFreq[s] = (bodyFreq[s] ?? 0) + 1;
    for (const s of log.mindSymptoms) mindFreq[s] = (mindFreq[s] ?? 0) + 1;
  }

  const topBody = Object.entries(bodyFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${formatSymptomLabel(k)} (${v}x)`);
  const topMind = Object.entries(mindFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${formatSymptomLabel(k)} (${v}x)`);

  const lowDays = logs.filter((l) => l.wellnessScore <= 4);
  const highDays = logs.filter((l) => l.wellnessScore >= 8);

  const firstHalf = scores.slice(Math.floor(scores.length / 2));
  const secondHalf = scores.slice(0, Math.floor(scores.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);
  const trend =
    secondAvg > firstAvg + 0.5 ? "improving"
      : secondAvg < firstAvg - 0.5 ? "declining"
        : "stable";

  const notes = logs
    .filter((l) => l.note)
    .slice(0, 5)
    .map((l) => `• ${l.date}: "${l.note}"`);

  const dataBlock = [
    `Period: last ${rangeDays} days (${logs.length} check-ins logged)`,
    `Average wellness score: ${avg}/10`,
    `Trend: ${trend}`,
    `Low-score days (≤4): ${lowDays.length}`,
    `High-score days (≥8): ${highDays.length}`,
    topBody.length ? `Physical symptoms: ${topBody.join(", ")}` : "Physical symptoms: none reported",
    topMind.length ? `Mental symptoms: ${topMind.join(", ")}` : "Mental symptoms: none reported",
    notes.length ? `User notes:\n${notes.join("\n")}` : "",
  ].filter(Boolean).join("\n");

  return `You are a medical documentation assistant helping a patient prepare a structured summary for their doctor.

Using the following self-reported health check-in data, generate a concise, factual PATIENT SUMMARY in plain text — no markdown, no bullet symbols other than dashes, no headings with # symbols. Use plain section titles in ALL CAPS followed by a colon.

${dataBlock}

Format the output EXACTLY like this example structure:

PATIENT SUMMARY — [Date Range]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECK-IN OVERVIEW:
[number] check-ins logged over [range] days
Average wellness score: [X]/10 ([label])
Overall trend: [improving/stable/declining]

PHYSICAL SYMPTOMS REPORTED:
[symptom (Nx), symptom (Nx), ...]

MENTAL/EMOTIONAL SYMPTOMS REPORTED:
[symptom (Nx), ...]

NOTABLE PATTERNS:
[1-3 bullet points using dashes about patterns, low days, or correlations observed]

PATIENT NOTES:
[any free-text notes the patient wrote, verbatim, with dates]

DISCLAIMER:
This summary was generated from self-reported daily check-ins in the NOVA Health app and is intended to supplement — not replace — clinical assessment.

Generate the summary now. Be factual. Do NOT add wellness advice or recommendations.`;
}

function buildFallbackBrief(logs: HealthPulseLog[], rangeDays: number): string {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
  const scores = logs.map((l) => l.wellnessScore);
  const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  const avgLabel =
    parseFloat(avg) >= 8 ? "Excellent"
      : parseFloat(avg) >= 6 ? "Good"
        : parseFloat(avg) >= 4 ? "Moderate"
          : "Low";

  const bodyFreq: Record<string, number> = {};
  const mindFreq: Record<string, number> = {};
  for (const log of logs) {
    for (const s of log.bodySymptoms) bodyFreq[s] = (bodyFreq[s] ?? 0) + 1;
    for (const s of log.mindSymptoms) mindFreq[s] = (mindFreq[s] ?? 0) + 1;
  }

  const topBody = Object.entries(bodyFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${formatSymptomLabel(k)} (${v}x)`)
    .join(", ") || "None reported";
  const topMind = Object.entries(mindFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${formatSymptomLabel(k)} (${v}x)`)
    .join(", ") || "None reported";

  const lowDays = logs.filter((l) => l.wellnessScore <= 4).length;
  const highDays = logs.filter((l) => l.wellnessScore >= 8).length;
  const notes = logs
    .filter((l) => l.note)
    .slice(0, 5)
    .map((l) => `  ${l.date}: "${l.note}"`)
    .join("\n");
  const dateRange = logs.length >= 2
    ? `${logs[logs.length - 1].date} to ${logs[0].date}`
    : logs[0]?.date ?? today;

  return [
    `PATIENT SUMMARY — ${dateRange}`,
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "CHECK-IN OVERVIEW:",
    `${logs.length} check-ins logged over ${rangeDays} days`,
    `Average wellness score: ${avg}/10 (${avgLabel})`,
    `Low-score days (score ≤4): ${lowDays}`,
    `High-score days (score ≥8): ${highDays}`,
    "",
    "PHYSICAL SYMPTOMS REPORTED:",
    topBody,
    "",
    "MENTAL/EMOTIONAL SYMPTOMS REPORTED:",
    topMind,
    ...(notes ? ["", "PATIENT NOTES:", notes] : []),
    "",
    "DISCLAIMER:",
    "This summary was generated from self-reported daily check-ins in the NOVA Health app and is",
    "intended to supplement — not replace — clinical assessment. Generated on " + today + ".",
  ].join("\n");
}

export async function POST(req: Request) {
  // ADDED — require auth; this endpoint burns LLM tokens and handles health data
  const authHeader = req.headers.get("authorization") || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader;
  if (!idToken) {
    return NextResponse.json({ error: "Authentication token missing." }, { status: 401 });
  }
  try {
    await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid authentication token." }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    // ADDED — validate rangeDays against allowlist
    const rangeDays: number = VALID_RANGE_DAYS.has(body?.rangeDays) ? body.rangeDays : 7;

    // ADDED — cap and sanitise logs array
    const rawLogs: unknown[] = Array.isArray(body.logs) ? body.logs.slice(0, MAX_LOGS_INPUT) : [];
    const logs: HealthPulseLog[] = rawLogs
      .map(sanitiseLog)
      .filter((l): l is HealthPulseLog => l !== null);

    if (logs.length === 0) {
      return NextResponse.json(
        { brief: "No valid check-in data found for the selected period. Complete at least one HealthPulse check-in first." },
        { status: 200 }
      );
    }

    const prompt = buildBriefPrompt(logs, rangeDays);
    const provider = resolveProvider();

    if (!provider) {
      return NextResponse.json({ brief: buildFallbackBrief(logs, rangeDays) });
    }

    // ADDED — timeout on LLM call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BRIEF_TIMEOUT_MS);

    let brief: string;
    try {
      const response = await fetch(provider.endpoint, {
        method: "POST",
        headers: provider.headers,
        signal: controller.signal,
        body: JSON.stringify({
          model: provider.model,
          messages: [{ role: "user", content: prompt }],
          stream: false,
          temperature: 0.2,
          max_tokens: 600,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        brief = buildFallbackBrief(logs, rangeDays);
      } else {
        const data = await response.json().catch(() => null);
        brief = data?.choices?.[0]?.message?.content?.trim() || buildFallbackBrief(logs, rangeDays);
      }
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      // Timeout or network error — use fallback
      brief = buildFallbackBrief(logs, rangeDays);
    }

    return NextResponse.json({ brief });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}