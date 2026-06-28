import type { UserProfile } from "@/contexts/AuthContext";
import type { EmotionState } from "@/contexts/EmotionContext";
import type { ChatLanguageCode } from "@/lib/chatLanguages";
import { getTimeGreeting, getWelcomeStrings } from "@/lib/chatLanguages";

export type JournalType = "mental" | "physical";

export type MoodLog = {
  id?: string;
  score: number;
  label: string;
  date: string;
  note?: string;
};

// ── HealthPulse types ────────────────────────────────────────────────────────

export type BodySymptom =
  | "fatigue"
  | "headache"
  | "nausea"
  | "pain"
  | "joint_pain"
  | "back_pain"
  | "shortness_of_breath"
  | "dizziness"
  | "fever"
  | "chest_tightness"
  | "stomach_ache"
  | "muscle_ache";

export type MindSymptom =
  | "anxious"
  | "stressed"
  | "low"
  | "tired"
  | "foggy"
  | "calm"
  | "irritable"
  | "overwhelmed"
  | "hopeful"
  | "restless";

export type HealthPulseLog = {
  id?: string;
  date: string; // ISO date "YYYY-MM-DD"
  wellnessScore: number; // 1–10
  bodySymptoms: BodySymptom[];
  mindSymptoms: MindSymptom[];
  symptomIntensity?: Record<string, "mild" | "moderate" | "severe">;
  note?: string;
  createdAt: string; // ISO datetime
};

export type HealthPulseInsight = {
  type: "pattern" | "streak" | "correlation" | "low_score";
  message: string;
  date: string;
};

// ── Medication types ─────────────────────────────────────────────────────────

export type MedicationFrequency = "once_daily" | "twice_daily" | "three_times" | "as_needed" | "weekly";

export type MedicationTime = "morning" | "afternoon" | "evening" | "night" | "with_meal";

export type MedicationSchedule = {
  id?: string;
  name: string;
  dosage: string;           // e.g. "500mg", "1 tablet"
  frequency: MedicationFrequency;
  times: MedicationTime[];  // which parts of day
  notes?: string;
  startDate: string;        // ISO date
  active: boolean;
  color?: string;           // for UI pill badge
};

export type MedicationLog = {
  id?: string;
  scheduleId: string;
  medicationName: string;
  scheduledTime: MedicationTime;
  date: string;             // ISO date "YYYY-MM-DD"
  takenAt?: string;         // ISO datetime when actually taken
  skipped?: boolean;
  skipReason?: string;
  createdAt: string;
};

export type JournalEntry = {
  id?: string;
  type: JournalType;
  content: string;
  mood?: string;
  symptoms?: string[];
  createdAt: string;
};

export type VaultSummary = {
  fileName: string;
  type?: string;
  riskLevel?: string;
  findings?: string[];
  uploadedAt?: string;
};

export type UserActivityContext = {
  isReturning: boolean;
  messageCount: number;
  clinical?: {
    bloodGroup?: string;
    bloodPressure?: string;
    allergies?: string[];
    medications?: string[];
    height?: number;
    weight?: number;
  };
  todayMood?: MoodLog;
  recentMoods: MoodLog[];
  mentalJournals: JournalEntry[];
  physicalJournals: JournalEntry[];
  vaultSummaries: VaultSummary[];
  emotionTrend?: {
    dominant?: string;
    stress?: number;
    sadness?: number;
    joy?: number;
    fatigue?: number;
  };
  emotionHistory?: EmotionState[];
  // HealthPulse
  todayPulse?: HealthPulseLog;
  recentPulses: HealthPulseLog[];
  pulseStreak: number; // consecutive days checked in
  medicationSchedules: MedicationSchedule[];
  todayMedLogs: MedicationLog[];
  medicationAdherence7d?: number; // 0–1 ratio
};

export function buildUserActivityContext(
  user: UserProfile | null,
  options: {
    messageCount?: number;
    moodLogs?: MoodLog[];
    journalEntries?: JournalEntry[];
    vaultSummaries?: VaultSummary[];
    currentEmotion?: EmotionState | null;
    emotionHistory?: EmotionState[];
    healthPulseLogs?: HealthPulseLog[];
    medicationSchedules?: MedicationSchedule[];
    medicationLogs?: MedicationLog[];
  } = {}
): UserActivityContext {
  const today = new Date().toISOString().slice(0, 10);
  const moodLogs = options.moodLogs ?? [];
  const journalEntries = options.journalEntries ?? [];
  const pulseLogs = options.healthPulseLogs ?? [];

  // Calculate streak from consecutive days (newest first assumed)
  const sortedPulses = [...pulseLogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  let pulseStreak = 0;
  {
    const cursor = new Date();
    for (const pulse of sortedPulses) {
      const expected = cursor.toISOString().slice(0, 10);
      if (pulse.date === expected) {
        pulseStreak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return {
    isReturning: (options.messageCount ?? 0) > 0,
    messageCount: options.messageCount ?? 0,
    clinical: user
      ? {
          bloodGroup: user.bloodGroup,
          bloodPressure: user.bloodPressure,
          allergies: user.allergies,
          medications: user.medications,
          height: user.height,
          weight: user.weight,
        }
      : undefined,
    todayMood: moodLogs.find((m) => m.date === today),
    recentMoods: moodLogs.slice(0, 7),
    mentalJournals: journalEntries.filter((j) => j.type === "mental").slice(0, 3),
    physicalJournals: journalEntries.filter((j) => j.type === "physical").slice(0, 3),
    vaultSummaries: options.vaultSummaries ?? [],
    emotionTrend: options.currentEmotion
      ? {
          dominant: options.currentEmotion.dominant,
          stress: options.currentEmotion.stress,
          sadness: options.currentEmotion.sadness,
          joy: options.currentEmotion.joy,
          fatigue: options.currentEmotion.fatigue,
        }
      : undefined,
    emotionHistory: options.emotionHistory?.slice(0, 5),
    todayPulse: sortedPulses.find((p) => p.date === today),
    recentPulses: sortedPulses.slice(0, 7),
    pulseStreak,
    medicationSchedules: options.medicationSchedules ?? [],
    todayMedLogs: (options.medicationLogs ?? []).filter(l => l.date === today),
    medicationAdherence7d: (() => {
      const logs = options.medicationLogs ?? [];
      const last7 = logs.filter(l => {
        const diff = (Date.now() - new Date(l.date).getTime()) / 86400000;
        return diff <= 7;
      });
      if (!last7.length) return undefined;
      const taken = last7.filter(l => l.takenAt && !l.skipped).length;
      return parseFloat((taken / last7.length).toFixed(2));
    })(),
  };
}

export function formatUserContextForPrompt(ctx: UserActivityContext, userName?: string): string {
  const lines: string[] = [
    "═══════════════════════════════════════════════",
    "USER ACTIVITY CONTEXT (background awareness — use silently, never lecture)",
    "═══════════════════════════════════════════════",
    `Session: ${ctx.isReturning ? "returning user" : "new or fresh session"} (${ctx.messageCount} prior messages in history)`,
  ];

  if (ctx.clinical) {
    const parts: string[] = [];
    if (ctx.clinical.bloodGroup) parts.push(`blood group ${ctx.clinical.bloodGroup}`);
    if (ctx.clinical.bloodPressure) parts.push(`BP ${ctx.clinical.bloodPressure}`);
    if (ctx.clinical.allergies?.length) parts.push(`allergies: ${ctx.clinical.allergies.join(", ")}`);
    if (ctx.clinical.medications?.length) parts.push(`medications: ${ctx.clinical.medications.join(", ")}`);
    if (ctx.clinical.height && ctx.clinical.weight) {
      parts.push(`height ${ctx.clinical.height}cm, weight ${ctx.clinical.weight}kg`);
    }
    if (parts.length) lines.push(`Clinical profile: ${parts.join("; ")}`);
  }

  if (ctx.todayMood) {
    lines.push(`Today's mood check-in: ${ctx.todayMood.score}/10 (${ctx.todayMood.label})${ctx.todayMood.note ? ` — note: "${ctx.todayMood.note}"` : ""}`);
  } else if (ctx.recentMoods.length) {
    const last = ctx.recentMoods[0];
    lines.push(`Last mood check-in: ${last.score}/10 (${last.label}) on ${last.date}`);
  }

  if (ctx.recentMoods.length >= 2) {
    const scores = ctx.recentMoods.map((m) => m.score).join(", ");
    lines.push(`Recent mood scores (newest first): ${scores}`);
  }

  for (const entry of ctx.mentalJournals) {
    const preview = entry.content.slice(0, 200);
    lines.push(`Mental health journal (${entry.createdAt.slice(0, 10)}): "${preview}${entry.content.length > 200 ? "..." : ""}"${entry.mood ? ` [mood: ${entry.mood}]` : ""}`);
  }

  for (const entry of ctx.physicalJournals) {
    const preview = entry.content.slice(0, 200);
    const symptoms = entry.symptoms?.length ? ` symptoms: ${entry.symptoms.join(", ")}` : "";
    lines.push(`Physical health journal (${entry.createdAt.slice(0, 10)}): "${preview}${entry.content.length > 200 ? "..." : ""}"${symptoms}`);
  }

  for (const vault of ctx.vaultSummaries.slice(0, 2)) {
    const findings = vault.findings?.slice(0, 2).join("; ") || "no findings listed";
    lines.push(`Medical vault — ${vault.fileName} (${vault.type || "document"}, ${vault.riskLevel || "unknown"} risk): ${findings}`);
  }

  if (ctx.emotionTrend?.dominant) {
    lines.push(
      `Latest emotion scan: dominant ${ctx.emotionTrend.dominant}, stress ${Math.round((ctx.emotionTrend.stress ?? 0) * 100)}%, sadness ${Math.round((ctx.emotionTrend.sadness ?? 0) * 100)}%, joy ${Math.round((ctx.emotionTrend.joy ?? 0) * 100)}%`
    );
  }

  // ── HealthPulse ──────────────────────────────────────────────────────────
  if (ctx.todayPulse) {
    const p = ctx.todayPulse;
    const body = p.bodySymptoms.length ? p.bodySymptoms.join(", ") : "none";
    const mind = p.mindSymptoms.length ? p.mindSymptoms.join(", ") : "none";
    lines.push(
      `HealthPulse today (${p.date}): wellness score ${p.wellnessScore}/10` +
      ` | body: ${body}` +
      ` | mind: ${mind}` +
      (p.note ? ` | note: "${p.note}"` : "")
    );
    if (ctx.pulseStreak > 1) {
      lines.push(`HealthPulse streak: ${ctx.pulseStreak} consecutive days`);
    }
  } else if (ctx.recentPulses.length) {
    const last = ctx.recentPulses[0];
    const body = last.bodySymptoms.length ? last.bodySymptoms.join(", ") : "none";
    const mind = last.mindSymptoms.length ? last.mindSymptoms.join(", ") : "none";
    lines.push(
      `Last HealthPulse (${last.date}): wellness score ${last.wellnessScore}/10 | body: ${body} | mind: ${mind}`
    );
  }

  if (ctx.recentPulses.length >= 3) {
    const scores = ctx.recentPulses.map((p) => `${p.date.slice(5)}:${p.wellnessScore}`).join(", ");
    lines.push(`HealthPulse trend (recent): ${scores}`);

    // Flag persistent low scores
    const consecutiveLow = ctx.recentPulses.filter((p) => p.wellnessScore <= 4);
    if (consecutiveLow.length >= 3) {
      lines.push(
        `ALERT: User has reported wellness score ≤4 for ${consecutiveLow.length} of their last ${ctx.recentPulses.length} check-ins — approach with extra care.`
      );
    }

    // Aggregate common symptoms
    const bodyFreq: Record<string, number> = {};
    const mindFreq: Record<string, number> = {};
    for (const p of ctx.recentPulses) {
      for (const s of p.bodySymptoms) bodyFreq[s] = (bodyFreq[s] ?? 0) + 1;
      for (const s of p.mindSymptoms) mindFreq[s] = (mindFreq[s] ?? 0) + 1;
    }
    const topBody = Object.entries(bodyFreq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}(${v}x)`);
    const topMind = Object.entries(mindFreq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}(${v}x)`);
    if (topBody.length) lines.push(`Frequent body symptoms: ${topBody.join(", ")}`);
    if (topMind.length) lines.push(`Frequent mind symptoms: ${topMind.join(", ")}`);
  }

  // ── Medications ──────────────────────────────────────────────────────────────
  if (ctx.medicationSchedules?.length) {
    const active = ctx.medicationSchedules.filter(m => m.active);
    if (active.length) {
      lines.push(`Active medications: ${active.map(m => `${m.name} ${m.dosage} (${m.frequency.replace(/_/g, " ")})`).join("; ")}`);
    }
  }
  if (ctx.medicationAdherence7d !== undefined) {
    const pct = Math.round(ctx.medicationAdherence7d * 100);
    lines.push(`Medication adherence (last 7 days): ${pct}%${pct < 70 ? " — consider checking in gently" : ""}`);
  }
  if (ctx.todayMedLogs?.length) {
    const taken = ctx.todayMedLogs.filter(l => l.takenAt && !l.skipped).length;
    lines.push(`Medications taken today: ${taken}/${ctx.todayMedLogs.length}`);
  }

  if (lines.length <= 3) {
    lines.push("No mood logs, journals, or vault data available yet.");
  }

  lines.push(
    "",
    "IMPORTANT: This context is for your awareness only. Do NOT recite it back as a list. Do NOT tell the user to journal, check in, upload documents, or do exercises unless they ask."
  );

  return lines.join("\n");
}

function buildAwarenessSnippets(ctx: UserActivityContext | undefined, code: ChatLanguageCode): string[] {
  if (!ctx) return [];
  const awareness: string[] = [];
  const lang = code === "auto" ? "en" : code;

  if (ctx.todayMood) {
    const { label, score } = ctx.todayMood;
    if (lang === "hi") awareness.push(`आपने आज **${label.toLowerCase()}** (${score}/10) महसूस किया`);
    else if (lang === "ta") awareness.push(`நீங்கள் இன்று **${label.toLowerCase()}** (${score}/10) உணர்ந்தீர்கள்`);
    else if (lang === "te") awareness.push(`మీరు ఈ రోజు **${label.toLowerCase()}** (${score}/10) అనిపించింది`);
    else if (lang === "bn") awareness.push(`আপনি আজ **${label.toLowerCase()}** (${score}/10) অনুভব করেছেন`);
    else if (lang === "mr") awareness.push(`तुम्ही आज **${label.toLowerCase()}** (${score}/10) जाणवले`);
    else awareness.push(`you checked in today feeling **${label.toLowerCase()}** (${score}/10)`);
  } else if (ctx.recentMoods[0]) {
    const last = ctx.recentMoods[0];
    if (lang === "hi") awareness.push(`आपका आखिरी check-in **${last.label.toLowerCase()}** (${last.score}/10) था`);
    else awareness.push(`your last check-in was **${last.label.toLowerCase()}** (${last.score}/10)`);
  }

  if (ctx.mentalJournals[0] && daysSince(ctx.mentalJournals[0].createdAt) <= 3) {
    if (lang === "hi") awareness.push("आप हाल ही में अपनी mental health journal में reflect कर रहे हैं");
    else awareness.push("you've been reflecting in your mental health journal recently");
  }

  if (ctx.physicalJournals[0] && daysSince(ctx.physicalJournals[0].createdAt) <= 3) {
    if (lang === "hi") awareness.push("आपने हाल में physical health journal में कुछ लिखा है");
    else awareness.push("you've noted some physical health thoughts in your journal");
  }

  if (ctx.isReturning && ctx.messageCount > 2) {
    if (lang === "hi") awareness.push("हम पहले भी बात कर चुके हैं");
    else awareness.push("we've spoken before");
  }

  if (ctx.todayPulse) {
    const score = ctx.todayPulse.wellnessScore;
    if (lang === "hi") awareness.push(`आपका आज का wellness score **${score}/10** है`);
    else awareness.push(`your HealthPulse today is **${score}/10**`);
  }

  return awareness;
}

export function buildWelcomeMessage(
  userName?: string,
  ctx?: UserActivityContext,
  language: ChatLanguageCode = "auto"
): string {
  const name = userName?.split(" ")[0] || "there";
  const strings = getWelcomeStrings(language);
  const timeGreeting = getTimeGreeting(language);
  const parts: string[] = [
    strings.greeting(name, timeGreeting),
    "",
    strings.safeSpace,
  ];

  const awareness = buildAwarenessSnippets(ctx, language);
  if (awareness.length) {
    parts.push("", strings.awareness(formatAwarenessList(awareness)));
  }

  parts.push("", strings.closing);
  return parts.join("\n");
}

function daysSince(isoDate: string): number {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function formatAwarenessList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
