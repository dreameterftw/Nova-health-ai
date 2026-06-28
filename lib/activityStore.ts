"use client";

import type { HealthPulseLog, JournalEntry, JournalType, MoodLog, VaultSummary } from "@/lib/userContext";

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
  const [moodLogs, journalEntries, vaultSummaries, healthPulseLogs] = await Promise.all([
    fetchMoodLogs(userId),
    fetchJournalEntries(userId),
    fetchVaultSummaries(userId),
    fetchHealthPulseLogs(userId),
  ]);

  return { moodLogs, journalEntries, vaultSummaries, healthPulseLogs };
}

// ── HealthPulse CRUD ─────────────────────────────────────────────────────────

const PULSE_KEY = "nova_health_pulse_logs:";

function loadLocalPulseLogs(userId: string): HealthPulseLog[] {
  try {
    const raw = localStorage.getItem(`${PULSE_KEY}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalPulseLogs(userId: string, logs: HealthPulseLog[]) {
  try {
    localStorage.setItem(`${PULSE_KEY}${userId}`, JSON.stringify(logs));
  } catch {
    // best-effort
  }
}

function appendLocalPulse(userId: string, log: HealthPulseLog) {
  const existing = loadLocalPulseLogs(userId).filter((l) => l.date !== log.date);
  saveLocalPulseLogs(userId, [log, ...existing].slice(0, 90));
}

export function saveHealthPulseLogLocal(userId: string, log: HealthPulseLog) {
  appendLocalPulse(userId, log);
}

export async function saveHealthPulseLog(
  userId: string,
  log: Omit<HealthPulseLog, "id">
): Promise<void> {
  // Optimistic local save first so the UI is always fast
  appendLocalPulse(userId, log as HealthPulseLog);

  const { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc } =
    await import("firebase/firestore");
  const { db } = await import("@/lib/firebase");

  // Delete any existing log for the same date (upsert behaviour)
  const q = query(
    collection(db, "users", userId, "healthPulseLogs"),
    where("date", "==", log.date)
  );
  const existing = await getDocs(q);
  await Promise.all(
    existing.docs.map((d) => deleteDoc(doc(db, "users", userId, "healthPulseLogs", d.id)))
  );

  await addDoc(collection(db, "users", userId, "healthPulseLogs"), {
    ...log,
    serverCreatedAt: serverTimestamp(),
  });
}

export async function fetchHealthPulseLogs(
  userId: string,
  limitCount = 30
): Promise<HealthPulseLog[]> {
  try {
    const { collection, query, orderBy, limit: firestoreLimit, getDocs } =
      await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    const q = query(
      collection(db, "users", userId, "healthPulseLogs"),
      orderBy("date", "desc"),
      firestoreLimit(limitCount)
    );
    const snapshot = await getDocs(q);

    const logs = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        date: data.date,
        wellnessScore: data.wellnessScore,
        bodySymptoms: data.bodySymptoms ?? [],
        mindSymptoms: data.mindSymptoms ?? [],
        symptomIntensity: data.symptomIntensity ?? {},
        note: data.note,
        createdAt: data.createdAt ?? data.date,
      } as HealthPulseLog;
    });

    // Keep local cache in sync
    saveLocalPulseLogs(userId, logs);
    return logs;
  } catch {
    return loadLocalPulseLogs(userId);
  }
}

// ── Medication CRUD ──────────────────────────────────────────────────────────

import type { MedicationLog, MedicationSchedule } from "@/lib/userContext";

const MED_SCHEDULE_KEY = "nova_med_schedules:";
const MED_LOG_KEY = "nova_med_logs:";

function loadLocalMedSchedules(userId: string): MedicationSchedule[] {
  try {
    const raw = localStorage.getItem(`${MED_SCHEDULE_KEY}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLocalMedSchedules(userId: string, schedules: MedicationSchedule[]) {
  try { localStorage.setItem(`${MED_SCHEDULE_KEY}${userId}`, JSON.stringify(schedules)); } catch {}
}

function loadLocalMedLogs(userId: string): MedicationLog[] {
  try {
    const raw = localStorage.getItem(`${MED_LOG_KEY}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLocalMedLogs(userId: string, logs: MedicationLog[]) {
  try { localStorage.setItem(`${MED_LOG_KEY}${userId}`, JSON.stringify(logs)); } catch {}
}

export async function saveMedicationSchedule(
  userId: string,
  schedule: Omit<MedicationSchedule, "id">
): Promise<MedicationSchedule> {
  const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
  const { db } = await import("@/lib/firebase");

  const docRef = await addDoc(collection(db, "users", userId, "medicationSchedules"), {
    ...schedule,
    createdAt: serverTimestamp(),
  });

  const saved: MedicationSchedule = { ...schedule, id: docRef.id };
  const existing = loadLocalMedSchedules(userId).filter(s => s.id !== saved.id);
  saveLocalMedSchedules(userId, [saved, ...existing]);
  return saved;
}

export async function updateMedicationSchedule(
  userId: string,
  scheduleId: string,
  patch: Partial<MedicationSchedule>
): Promise<void> {
  const { doc, updateDoc } = await import("firebase/firestore");
  const { db } = await import("@/lib/firebase");

  await updateDoc(doc(db, "users", userId, "medicationSchedules", scheduleId), patch);

  const existing = loadLocalMedSchedules(userId).map(s =>
    s.id === scheduleId ? { ...s, ...patch } : s
  );
  saveLocalMedSchedules(userId, existing);
}

export async function fetchMedicationSchedules(userId: string): Promise<MedicationSchedule[]> {
  try {
    const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    const q = query(
      collection(db, "users", userId, "medicationSchedules"),
      orderBy("startDate", "desc")
    );
    const snapshot = await getDocs(q);
    const schedules = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    })) as MedicationSchedule[];

    saveLocalMedSchedules(userId, schedules);
    return schedules;
  } catch {
    return loadLocalMedSchedules(userId);
  }
}

export async function saveMedicationLog(
  userId: string,
  log: Omit<MedicationLog, "id">
): Promise<MedicationLog> {
  // Optimistic local save
  const tempLog: MedicationLog = { ...log, id: `local-${Date.now()}` };
  const existingLogs = loadLocalMedLogs(userId).filter(
    l => !(l.scheduleId === log.scheduleId && l.date === log.date && l.scheduledTime === log.scheduledTime)
  );
  saveLocalMedLogs(userId, [tempLog, ...existingLogs].slice(0, 500));

  const { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc } =
    await import("firebase/firestore");
  const { db } = await import("@/lib/firebase");

  // Upsert — delete any existing log for same schedule+date+time
  const q = query(
    collection(db, "users", userId, "medicationLogs"),
    where("scheduleId", "==", log.scheduleId),
    where("date", "==", log.date),
    where("scheduledTime", "==", log.scheduledTime)
  );
  const existing = await getDocs(q);
  await Promise.all(existing.docs.map(d =>
    deleteDoc(doc(db, "users", userId, "medicationLogs", d.id))
  ));

  const docRef = await addDoc(collection(db, "users", userId, "medicationLogs"), {
    ...log,
    serverCreatedAt: serverTimestamp(),
  });

  const saved: MedicationLog = { ...log, id: docRef.id };
  const refreshed = loadLocalMedLogs(userId).filter(l => l.id !== tempLog.id);
  saveLocalMedLogs(userId, [saved, ...refreshed].slice(0, 500));
  return saved;
}

export async function fetchMedicationLogs(
  userId: string,
  limitDays = 30
): Promise<MedicationLog[]> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - limitDays);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const { collection, query, where, orderBy, getDocs } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    const q = query(
      collection(db, "users", userId, "medicationLogs"),
      where("date", ">=", cutoffStr),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    })) as MedicationLog[];

    saveLocalMedLogs(userId, logs);
    return logs;
  } catch {
    return loadLocalMedLogs(userId);
  }
}
