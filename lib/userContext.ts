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
  } = {}
): UserActivityContext {
  const today = new Date().toISOString().slice(0, 10);
  const moodLogs = options.moodLogs ?? [];
  const journalEntries = options.journalEntries ?? [];

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
