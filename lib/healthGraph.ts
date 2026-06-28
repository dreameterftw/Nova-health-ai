import { getAdminDb } from "@/lib/firebaseAdmin";
import type { BodySymptom, HealthPulseLog, MindSymptom, VaultSummary } from "@/lib/userContext";
import { evaluateEarlyWarning } from "@/lib/earlyWarning";

export type HealthGraph = {
  profile: {
    age: number | null;
    ageRange: string | null;
    conditions: string[];
    goals: string[];
    bloodGroup: string | null;
  };
  medications: {
    name: string;
    dose?: string;
    time?: string;
    adherenceRate?: number;
    isMentalHealth?: boolean; // NEW — flags psychiatric medications for Early Warning
  }[];
  symptomMap: Record<string, number>;
  wellnessScores: { date: string; score: number }[];
  documents: {
    type: string;
    uploadedOn: string;
    keyMarkers: string[];
    discussedWithNOVA?: boolean; // NEW — tracks whether this doc has been discussed in chat
  }[];
  conversationMilestones: { date: string; note: string }[];
  chatSentiment: {
    date: string;
    valence: "positive" | "neutral" | "negative";
    negativeSelfReference: boolean;
    crisisLanguage: boolean;
  }[];
  earlyWarning: {
    level: "none" | "yellow" | "orange" | "red";
    reasons: string[];
    updatedAt: string;
  };
  lastUpdated: string;
};

export type HealthGraphPatch = Partial<{
  profile: Partial<HealthGraph["profile"]>;
  medications: HealthGraph["medications"];
  symptomMap: Record<string, number>;
  wellnessScores: HealthGraph["wellnessScores"];
  documents: HealthGraph["documents"];
  conversationMilestones: HealthGraph["conversationMilestones"];
  chatSentiment: HealthGraph["chatSentiment"];
  earlyWarning: HealthGraph["earlyWarning"];
}>;

const EMPTY_GRAPH: HealthGraph = {
  profile: {
    age: null,
    ageRange: null,
    conditions: [],
    goals: [],
    bloodGroup: null,
  },
  medications: [],
  symptomMap: {},
  wellnessScores: [],
  documents: [],
  conversationMilestones: [],
  chatSentiment: [],
  earlyWarning: { level: "none", reasons: [], updatedAt: new Date().toISOString() },
  lastUpdated: new Date().toISOString().slice(0, 10),
};

export const HEALTH_GRAPH_FIELD = "healthGraph";

// Returns the user document ref — graph is stored as a field on this doc
// via HEALTH_GRAPH_FIELD. Use HEALTH_GRAPH_FIELD when reading/writing.
export function getUserDocRef(uid: string) {
  return getAdminDb().collection("users").doc(uid);
}

// CHANGED — renamed from getHealthGraphRef to getUserDocRef for clarity.
// Any file importing getHealthGraphRef needs updating to getUserDocRef.
// getHealthGraphRef is kept as a deprecated alias to avoid breaking
// anything during migration — remove it once all imports are updated.
export const getHealthGraphRef = getUserDocRef;

function normalizeGraph(data?: Partial<HealthGraph>): HealthGraph {
  return {
    profile: {
      ...EMPTY_GRAPH.profile,
      ...(data?.profile ?? {}),
      conditions: data?.profile?.conditions ?? [],
      goals: data?.profile?.goals ?? [],
    },
    medications: Array.isArray(data?.medications) ? data.medications : [],
    symptomMap: data?.symptomMap ?? {},
    wellnessScores: Array.isArray(data?.wellnessScores) ? data.wellnessScores : [],
    documents: Array.isArray(data?.documents) ? data.documents : [],
    conversationMilestones: Array.isArray(data?.conversationMilestones)
      ? data.conversationMilestones
      : [],
    chatSentiment: Array.isArray(data?.chatSentiment) ? data.chatSentiment : [],
    earlyWarning: data?.earlyWarning ?? EMPTY_GRAPH.earlyWarning,
    lastUpdated: data?.lastUpdated ?? EMPTY_GRAPH.lastUpdated,
  };
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export async function getGraph(uid: string): Promise<HealthGraph> {
  const snap = await getUserDocRef(uid).get();
  if (!snap.exists) return normalizeGraph();
  return normalizeGraph(snap.data()?.[HEALTH_GRAPH_FIELD] as Partial<HealthGraph> | undefined);
}

export async function updateGraph(uid: string, patch: HealthGraphPatch): Promise<HealthGraph> {
  const current = await getGraph(uid);
  const next = normalizeGraph({
    ...current,
    ...patch,
    profile: {
      ...current.profile,
      ...(patch.profile ?? {}),
      conditions: uniqueStrings([
        ...current.profile.conditions,
        ...(patch.profile?.conditions ?? []),
      ]),
      goals: uniqueStrings([
        ...current.profile.goals,
        ...(patch.profile?.goals ?? []),
      ]),
    },
    medications: patch.medications ?? current.medications,
    symptomMap: {
      ...current.symptomMap,
      ...(patch.symptomMap ?? {}),
    },
    wellnessScores: patch.wellnessScores ?? current.wellnessScores,
    documents: patch.documents ?? current.documents,
    conversationMilestones: patch.conversationMilestones ?? current.conversationMilestones,
    chatSentiment: patch.chatSentiment ?? current.chatSentiment,
    earlyWarning: patch.earlyWarning ?? current.earlyWarning,
    lastUpdated: new Date().toISOString().slice(0, 10),
  });

  await getUserDocRef(uid).set({ [HEALTH_GRAPH_FIELD]: next }, { merge: true });
  return next;
}

// NEW — marks a document as discussed in chat
// Call this from the chat API when NOVA references a specific uploaded document
export async function markDocumentDiscussed(
  uid: string,
  uploadedOn: string
): Promise<void> {
  const graph = await getGraph(uid);
  const documents = graph.documents.map((doc) =>
    doc.uploadedOn === uploadedOn ? { ...doc, discussedWithNOVA: true } : doc
  );
  await getUserDocRef(uid).set(
    { [HEALTH_GRAPH_FIELD]: { ...graph, documents } },
    { merge: true }
  );
}

export async function seedGraphFromProfile(uid: string, profile: {
  age?: number | null;
  ageRange?: string | null;
  conditions?: string[];
  goals?: string[];
  bloodGroup?: string | null;
  medications?: string[];
}): Promise<HealthGraph> {
  const medications = (profile.medications ?? []).map((name) => ({ name }));
  return updateGraph(uid, {
    profile: {
      age: profile.age ?? null,
      ageRange: profile.ageRange ?? null,
      conditions: profile.conditions ?? [],
      goals: profile.goals ?? [],
      bloodGroup: profile.bloodGroup ?? null,
    },
    ...(medications.length ? { medications } : {}),
  });
}

export async function updateGraphFromPulse(uid: string, log: HealthPulseLog): Promise<HealthGraph> {
  const graph = await getGraph(uid);
  const symptomMap = { ...graph.symptomMap };
  const symptoms = [...log.bodySymptoms, ...log.mindSymptoms] as (BodySymptom | MindSymptom)[];
  for (const symptom of symptoms) {
    symptomMap[symptom] = (symptomMap[symptom] ?? 0) + 1;
  }

  const wellnessScores = [
    { date: log.date, score: log.wellnessScore },
    ...graph.wellnessScores.filter((entry) => entry.date !== log.date),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 90);

  const draft = { ...graph, symptomMap, wellnessScores };
  return updateGraph(uid, { symptomMap, wellnessScores, earlyWarning: evaluateEarlyWarning(draft) });
}

export async function updateGraphFromVault(uid: string, vault: VaultSummary): Promise<HealthGraph> {
  const graph = await getGraph(uid);
  const uploadedOn = vault.uploadedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  const keyMarkers = (vault.findings ?? []).slice(0, 8);
  const document = {
    type: vault.type || "Medical document",
    uploadedOn,
    keyMarkers,
    discussedWithNOVA: false, // NEW — initialised as false on every upload
  };

  return updateGraph(uid, {
    documents: [document, ...graph.documents].slice(0, 30),
  });
}

export function buildSystemPrompt(graph: HealthGraph): string {
  const topSymptoms = Object.entries(graph.symptomMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([symptom, count]) => `${symptom.replace(/_/g, " ")} (${count}x)`);

  const recentScores = [...graph.wellnessScores]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-3);
  const trend = recentScores.length >= 2
    ? recentScores.map((entry) => entry.score).join(" -> ")
    : null;

  const lastMilestone = graph.conversationMilestones[0];

  // NEW — only surface documents not yet discussed, prioritise most recent
  const undiscussedDoc = graph.documents.find((d) => !d.discussedWithNOVA)
    ?? graph.documents[0];

  const warning = graph.earlyWarning;

  return [
    "You are NOVA. Here is what you know about this user:",
    graph.profile.age ? `- ${graph.profile.age} years old` : "",
    graph.profile.conditions.length ? `- Conditions: ${graph.profile.conditions.join(", ")}` : "",
    graph.profile.goals.length ? `- Goals: ${graph.profile.goals.join(", ")}` : "",
    graph.profile.bloodGroup ? `- Blood group: ${graph.profile.bloodGroup}` : "",
    graph.medications.length
      ? `- Medications: ${graph.medications.map((m) => {
          const adherence = typeof m.adherenceRate === "number" ? ` (${m.adherenceRate}% adherent)` : "";
          const flag = m.isMentalHealth ? " [mental health]" : "";
          return `${m.name}${m.dose ? ` ${m.dose}` : ""}${m.time ? ` at ${m.time}` : ""}${adherence}${flag}`;
        }).join(", ")}`
      : "",
    topSymptoms.length ? `- Most reported symptoms: ${topSymptoms.join(", ")}` : "",
    trend ? `- Recent wellness trend: ${trend}` : "",
    lastMilestone ? `- Last conversation note: ${lastMilestone.note} on ${lastMilestone.date}` : "",
    // NEW — tells NOVA whether this document has been discussed before
    undiscussedDoc
      ? `- Uploaded ${undiscussedDoc.type} on ${undiscussedDoc.uploadedOn}${undiscussedDoc.keyMarkers.length ? `: ${undiscussedDoc.keyMarkers.join("; ")}` : ""} — not yet discussed`
      : graph.documents[0]
      ? `- Uploaded ${graph.documents[0].type} on ${graph.documents[0].uploadedOn}${graph.documents[0].keyMarkers.length ? `: ${graph.documents[0].keyMarkers.join("; ")}` : ""} — already discussed`
      : "",
    warning?.level && warning.level !== "none" ? `- Early warning level: ${warning.level}. Reasons: ${warning.reasons.join("; ")}` : "",
    "",
    "Open the conversation aware of this context. Do not recite it back to the user. Let it inform your tone and responses naturally.",
    warning?.level === "yellow" ? "If this is a new chat, open with a gentle check-in. Do not mention scoring or monitoring." : "",
    warning?.level === "orange" ? "If this is a new chat, warmly name that the user seems to have had a tough stretch and invite them to talk. Do not alarm them." : "",
    warning?.level === "red" ? "Be explicit, warm, and supportive. Include crisis resources if the user sounds unsafe, and encourage contacting trusted people or emergency support." : "",
  ].filter(Boolean).join("\n");
}