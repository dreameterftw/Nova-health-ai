"use client";

/**
 * Health Memory Graph — persists a structured long-term health profile per user.
 * Stored in Firestore under users/{id}/healthMemory (single document, merged).
 * Also cached in localStorage for instant load.
 */

import type { HealthPulseLog, MoodLog, VaultSummary } from "@/lib/userContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChronicCondition = {
  name: string;
  confirmedByUser: boolean;
  firstMentionedAt: string; // ISO date
  source: "user_declared" | "vault_inferred" | "chat_inferred";
};

export type MedicationRecord = {
  name: string;
  dose?: string;
  frequency?: string;
  addedAt: string; // ISO date
  active: boolean;
};

export type SymptomFrequencyMap = Record<string, number>; // symptom → count over last 30 days

export type ConversationMilestone = {
  date: string; // ISO date
  summary: string; // e.g. "Mentioned persistent migraines and work stress"
};

export type HealthMemoryGraph = {
  userId: string;
  updatedAt: string; // ISO datetime
  chronicConditions: ChronicCondition[];
  medications: MedicationRecord[];
  symptomFrequency: SymptomFrequencyMap;
  emotionalBaseline: {
    avgWellnessScore: number | null; // rolling 30-day avg
    dominantMindSymptoms: string[]; // top 3 most frequent
    trend: "improving" | "stable" | "declining" | "unknown";
  };
  vaultIndex: {
    documentCount: number;
    lastUploadedAt: string | null;
    reportTypes: string[]; // e.g. ["CBC", "Lipid Panel"]
  };
  conversationMilestones: ConversationMilestone[]; // last 10
  lastGreeting: string | null; // ISO date — used to avoid repeating the same intro
};

const MEMORY_KEY = "nova_health_memory:";
const DEFAULT_MEMORY: Omit<HealthMemoryGraph, "userId" | "updatedAt"> = {
  chronicConditions: [],
  medications: [],
  symptomFrequency: {},
  emotionalBaseline: { avgWellnessScore: null, dominantMindSymptoms: [], trend: "unknown" },
  vaultIndex: { documentCount: 0, lastUploadedAt: null, reportTypes: [] },
  conversationMilestones: [],
  lastGreeting: null,
};

// ─── Local cache ──────────────────────────────────────────────────────────────

function loadLocalMemory(userId: string): HealthMemoryGraph | null {
  try {
    const raw = localStorage.getItem(`${MEMORY_KEY}${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalMemory(memory: HealthMemoryGraph) {
  try {
    localStorage.setItem(`${MEMORY_KEY}${memory.userId}`, JSON.stringify(memory));
  } catch {
    // best-effort
  }
}

// ─── Firestore CRUD ───────────────────────────────────────────────────────────

export async function fetchHealthMemory(userId: string): Promise<HealthMemoryGraph> {
  // Return local cache immediately if present (stale-while-revalidate)
  const local = loadLocalMemory(userId);

  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");
    const snap = await getDoc(doc(db, "users", userId, "healthMemory", "graph"));
    if (snap.exists()) {
      const remote = snap.data() as HealthMemoryGraph;
      saveLocalMemory(remote);
      return remote;
    }
  } catch {
    // fall through to local/default
  }

  if (local) return local;
  return { userId, updatedAt: new Date().toISOString(), ...DEFAULT_MEMORY };
}

export async function saveHealthMemory(memory: HealthMemoryGraph): Promise<void> {
  const updated = { ...memory, updatedAt: new Date().toISOString() };
  saveLocalMemory(updated);
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");
    await setDoc(doc(db, "users", memory.userId, "healthMemory", "graph"), updated, { merge: true });
  } catch {
    // local is already saved — silent fail
  }
}

// ─── Builder — synthesise memory from existing activity data ─────────────────

export function buildHealthMemoryFromActivity(
  existing: HealthMemoryGraph,
  opts: {
    moodLogs?: MoodLog[];
    pulseLogs?: HealthPulseLog[];
    vaultSummaries?: VaultSummary[];
    userMedications?: string[];
    userConditions?: string[];
  }
): HealthMemoryGraph {
  const memory = { ...existing };
  const now = new Date().toISOString();

  // ── Emotional baseline from last 30 mood logs ───────────────────────────
  if (opts.moodLogs?.length) {
    const scores = opts.moodLogs.map((m) => m.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const prevAvg = existing.emotionalBaseline.avgWellnessScore ?? avg;
    const trend: HealthMemoryGraph["emotionalBaseline"]["trend"] =
      avg > prevAvg + 0.5 ? "improving" :
      avg < prevAvg - 0.5 ? "declining" : "stable";
    memory.emotionalBaseline = { ...memory.emotionalBaseline, avgWellnessScore: Math.round(avg * 10) / 10, trend };
  }

  // ── Symptom frequency from pulse logs ──────────────────────────────────
  if (opts.pulseLogs?.length) {
    const freq: SymptomFrequencyMap = {};
    for (const log of opts.pulseLogs) {
      for (const s of [...log.bodySymptoms, ...log.mindSymptoms]) {
        freq[s] = (freq[s] ?? 0) + 1;
      }
    }
    memory.symptomFrequency = freq;

    // Top mind symptoms
    const mindSymptoms = ["anxious", "low", "foggy", "irritable", "overwhelmed", "restless"];
    const dominantMind = Object.entries(freq)
      .filter(([k]) => mindSymptoms.includes(k))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k);
    memory.emotionalBaseline = { ...memory.emotionalBaseline, dominantMindSymptoms: dominantMind };
  }

  // ── Vault index ─────────────────────────────────────────────────────────
  if (opts.vaultSummaries?.length) {
    const types = [...new Set(opts.vaultSummaries.map((v) => v.type).filter(Boolean) as string[])];
    const lastUpload = opts.vaultSummaries[0]?.uploadedAt ?? null;
    memory.vaultIndex = {
      documentCount: opts.vaultSummaries.length,
      lastUploadedAt: lastUpload,
      reportTypes: types,
    };
  }

  // ── Medications from user profile ───────────────────────────────────────
  if (opts.userMedications?.length) {
    const existingNames = new Set(memory.medications.map((m) => m.name.toLowerCase()));
    for (const med of opts.userMedications) {
      if (!existingNames.has(med.toLowerCase())) {
        memory.medications.push({ name: med, addedAt: now, active: true });
      }
    }
  }

  // ── Conditions from user profile ────────────────────────────────────────
  if (opts.userConditions?.length) {
    const existingNames = new Set(memory.chronicConditions.map((c) => c.name.toLowerCase()));
    for (const cond of opts.userConditions) {
      if (!existingNames.has(cond.toLowerCase())) {
        memory.chronicConditions.push({
          name: cond,
          confirmedByUser: true,
          firstMentionedAt: now,
          source: "user_declared",
        });
      }
    }
  }

  return memory;
}

// ─── Prompt formatter ─────────────────────────────────────────────────────────

export function formatHealthMemoryForPrompt(memory: HealthMemoryGraph): string {
  const lines: string[] = [
    "═══════════════════════════════════════════════",
    "HEALTH MEMORY GRAPH (long-term — highest priority context)",
    "═══════════════════════════════════════════════",
  ];

  if (memory.chronicConditions.length) {
    lines.push(
      `Known conditions: ${memory.chronicConditions
        .filter((c) => c.confirmedByUser)
        .map((c) => c.name)
        .join(", ")}`
    );
  }

  if (memory.medications.filter((m) => m.active).length) {
    lines.push(
      `Active medications: ${memory.medications
        .filter((m) => m.active)
        .map((m) => m.dose ? `${m.name} ${m.dose}` : m.name)
        .join(", ")}`
    );
  }

  const topSymptoms = Object.entries(memory.symptomFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  if (topSymptoms.length) {
    lines.push(
      `Frequent symptoms (30-day): ${topSymptoms
        .map(([k, v]) => `${k.replace(/_/g, " ")} (${v}x)`)
        .join(", ")}`
    );
  }

  const baseline = memory.emotionalBaseline;
  if (baseline.avgWellnessScore !== null) {
    lines.push(
      `Emotional baseline: avg ${baseline.avgWellnessScore}/10, trend ${baseline.trend}` +
      (baseline.dominantMindSymptoms.length ? `, dominant: ${baseline.dominantMindSymptoms.join(", ")}` : "")
    );
  }

  if (memory.vaultIndex.documentCount > 0) {
    lines.push(
      `Vault: ${memory.vaultIndex.documentCount} document${memory.vaultIndex.documentCount !== 1 ? "s" : ""}` +
      (memory.vaultIndex.reportTypes.length ? ` (${memory.vaultIndex.reportTypes.join(", ")})` : "") +
      (memory.vaultIndex.lastUploadedAt ? `, last uploaded ${memory.vaultIndex.lastUploadedAt?.slice(0, 10)}` : "")
    );
  }

  if (memory.conversationMilestones.length) {
    lines.push("Recent conversation milestones:");
    for (const m of memory.conversationMilestones.slice(0, 3)) {
      lines.push(`  • ${m.date}: ${m.summary}`);
    }
  }

  lines.push(
    "",
    "USE THIS CONTEXT to open conversations with continuity — reference what you know naturally, never recite it as a list.",
    "NEVER say 'according to your health memory' or similar — just know it and speak from it.",
    "═══════════════════════════════════════════════"
  );

  return lines.join("\n");
}

export function addConversationMilestone(
  memory: HealthMemoryGraph,
  summary: string
): HealthMemoryGraph {
  const milestone: ConversationMilestone = {
    date: new Date().toISOString().slice(0, 10),
    summary: summary.slice(0, 150),
  };
  return {
    ...memory,
    conversationMilestones: [milestone, ...memory.conversationMilestones].slice(0, 10),
  };
}
