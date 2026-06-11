"use client";

import type { JournalEntry, JournalType, MoodLog, VaultSummary } from "@/lib/userContext";

export async function saveMoodLog(
  userId: string,
  log: Omit<MoodLog, "id">
): Promise<void> {
  const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
  const { db } = await import("@/lib/firebase");

  await addDoc(collection(db, "users", userId, "moodLogs"), {
    ...log,
    createdAt: serverTimestamp(),
  });
}

export async function fetchMoodLogs(userId: string, limit = 14): Promise<MoodLog[]> {
  try {
    const { collection, query, orderBy, limit: firestoreLimit, getDocs } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    const q = query(
      collection(db, "users", userId, "moodLogs"),
      orderBy("createdAt", "desc"),
      firestoreLimit(limit)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() ?? new Date();
      return {
        id: doc.id,
        score: data.score,
        label: data.label,
        date: data.date || createdAt.toISOString().slice(0, 10),
        note: data.note,
      } as MoodLog;
    });
  } catch {
    return loadLocalMoodLogs(userId);
  }
}

export async function saveJournalEntry(
  userId: string,
  entry: Omit<JournalEntry, "id" | "createdAt"> & { createdAt?: string }
): Promise<JournalEntry> {
  const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
  const { db } = await import("@/lib/firebase");

  const createdAt = entry.createdAt || new Date().toISOString();
  const docRef = await addDoc(collection(db, "users", userId, "journalEntries"), {
    type: entry.type,
    content: entry.content,
    mood: entry.mood || null,
    symptoms: entry.symptoms || [],
    createdAt: serverTimestamp(),
    createdAtIso: createdAt,
  });

  const saved: JournalEntry = {
    id: docRef.id,
    type: entry.type,
    content: entry.content,
    mood: entry.mood,
    symptoms: entry.symptoms,
    createdAt,
  };

  appendLocalJournal(userId, saved);
  return saved;
}

export async function fetchJournalEntries(userId: string, limit = 10): Promise<JournalEntry[]> {
  try {
    const { collection, query, orderBy, limit: firestoreLimit, getDocs } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    const q = query(
      collection(db, "users", userId, "journalEntries"),
      orderBy("createdAt", "desc"),
      firestoreLimit(limit)
    );
    const snapshot = await getDocs(q);

    const entries = snapshot.docs.map((doc) => {
      const data = doc.data();
      const createdAt = data.createdAtIso
        || data.createdAt?.toDate?.()?.toISOString()
        || new Date().toISOString();
      return {
        id: doc.id,
        type: data.type as JournalType,
        content: data.content,
        mood: data.mood,
        symptoms: data.symptoms,
        createdAt,
      } as JournalEntry;
    });

    saveLocalJournals(userId, entries);
    return entries;
  } catch {
    return loadLocalJournals(userId);
  }
}

export async function fetchVaultSummaries(userId: string, limit = 3): Promise<VaultSummary[]> {
  try {
    const { collection, query, where, orderBy, limit: firestoreLimit, getDocs } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    const q = query(
      collection(db, "medicalVault"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      firestoreLimit(limit)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const analysis = data.result || data.analysis || {};
      return {
        fileName: data.name || data.fileName || "Medical document",
        type: analysis.type,
        riskLevel: analysis.riskLevel,
        findings: Array.isArray(analysis.findings) ? analysis.findings : [],
        uploadedAt: data.createdAt?.toDate?.()?.toISOString(),
      } as VaultSummary;
    });
  } catch {
    return [];
  }
}

const MOOD_KEY = "nova_mood_logs:";
const JOURNAL_KEY = "nova_journal_entries:";

function loadLocalMoodLogs(userId: string): MoodLog[] {
  try {
    const raw = localStorage.getItem(`${MOOD_KEY}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMoodLogs(userId: string, logs: MoodLog[]) {
  try {
    localStorage.setItem(`${MOOD_KEY}${userId}`, JSON.stringify(logs));
  } catch {
    // best-effort
  }
}

function appendLocalMood(userId: string, log: MoodLog) {
  const existing = loadLocalMoodLogs(userId).filter((l) => l.date !== log.date);
  saveLocalMoodLogs(userId, [log, ...existing].slice(0, 30));
}

export function saveMoodLogLocal(userId: string, log: MoodLog) {
  appendLocalMood(userId, log);
}

function loadLocalJournals(userId: string): JournalEntry[] {
  try {
    const raw = localStorage.getItem(`${JOURNAL_KEY}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalJournals(userId: string, entries: JournalEntry[]) {
  try {
    localStorage.setItem(`${JOURNAL_KEY}${userId}`, JSON.stringify(entries));
  } catch {
    // best-effort
  }
}

function appendLocalJournal(userId: string, entry: JournalEntry) {
  const existing = loadLocalJournals(userId);
  saveLocalJournals(userId, [entry, ...existing].slice(0, 30));
}

export async function fetchUserActivityData(userId: string) {
  const [moodLogs, journalEntries, vaultSummaries] = await Promise.all([
    fetchMoodLogs(userId),
    fetchJournalEntries(userId),
    fetchVaultSummaries(userId),
  ]);

  return { moodLogs, journalEntries, vaultSummaries };
}
