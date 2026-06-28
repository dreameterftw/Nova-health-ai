"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchMedicationSchedules,
  fetchMedicationLogs,
  saveMedicationSchedule,
  saveMedicationLog,
  updateMedicationSchedule,
} from "@/lib/activityStore";
import type { MedicationLog, MedicationSchedule, MedicationTime, MedicationFrequency } from "@/lib/userContext";
import { Plus, Pill, Check, X, ChevronRight, Clock, BarChart2, AlertCircle, Edit2 } from "lucide-react";

const C = {
  bg: "#F8F9FC",
  surface: "#FFFFFF",
  surface2: "#F1F3F8",
  border: "#E2E8F0",
  indigo: "#5B5EF4",
  indigoDark: "#4338CA",
  indigoLight: "#C7D2FE",
  teal: "#0D9488",
  rose: "#F43F5E",
  gold: "#D97706",
  green: "#10B981",
  text: "#0F172A",
  textMid: "#334155",
  textSoft: "#64748B",
  purple: "#7C3AED",
};

// Pill badge colours — cycles through these for new medications
const MED_COLORS = [
  "#5B5EF4", "#0D9488", "#7C3AED", "#D97706", "#E11D48",
  "#0891B2", "#059669", "#DC2626", "#9333EA", "#0284C7",
];

const FREQUENCY_LABELS: Record<MedicationFrequency, string> = {
  once_daily: "Once daily",
  twice_daily: "Twice daily",
  three_times: "3× daily",
  as_needed: "As needed",
  weekly: "Weekly",
};

const FREQUENCY_TIMES: Record<MedicationFrequency, MedicationTime[]> = {
  once_daily: ["morning"],
  twice_daily: ["morning", "evening"],
  three_times: ["morning", "afternoon", "evening"],
  as_needed: ["morning"],
  weekly: ["morning"],
};

const TIME_LABELS: Record<MedicationTime, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
  with_meal: "With meal",
};

const TIME_ICONS: Record<MedicationTime, string> = {
  morning: "🌅",
  afternoon: "☀️",
  evening: "🌆",
  night: "🌙",
  with_meal: "🍽️",
};

const TIME_ORDER: MedicationTime[] = ["morning", "afternoon", "with_meal", "evening", "night"];

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function todayStr() {
  return toDateStr(new Date());
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dateStr === toDateStr(today)) return "Today";
  if (dateStr === toDateStr(yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
}

// Compute adherence % for a schedule over the last N days
function computeAdherence(
  schedule: MedicationSchedule,
  logs: MedicationLog[],
  days = 7
): number {
  if (schedule.frequency === "as_needed") return 1;
  const scheduleLogs = logs.filter(l => l.scheduleId === schedule.id);
  let expected = 0;
  let taken = 0;
  const cursor = new Date();
  for (let i = 0; i < days; i++) {
    const d = toDateStr(cursor);
    if (d < schedule.startDate) break;
    expected += schedule.times.length;
    for (const time of schedule.times) {
      const log = scheduleLogs.find(l => l.date === d && l.scheduledTime === time);
      if (log?.takenAt && !log.skipped) taken++;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return expected === 0 ? 1 : parseFloat((taken / expected).toFixed(2));
}

// Build the list of doses due today for a schedule
function todayDoses(
  schedule: MedicationSchedule
): { time: MedicationTime; label: string; icon: string }[] {
  if (!schedule.active) return [];
  return TIME_ORDER.filter(t => schedule.times.includes(t)).map(t => ({
    time: t,
    label: TIME_LABELS[t],
    icon: TIME_ICONS[t],
  }));
}

// ── Add / Edit medication sheet ───────────────────────────────────────────────

function MedicationFormSheet({
  initial,
  existingCount,
  onSave,
  onClose,
}: {
  initial?: MedicationSchedule;
  existingCount: number;
  onSave: (s: Omit<MedicationSchedule, "id">) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [dosage, setDosage] = useState(initial?.dosage ?? "");
  const [frequency, setFrequency] = useState<MedicationFrequency>(initial?.frequency ?? "once_daily");
  const [times, setTimes] = useState<MedicationTime[]>(initial?.times ?? ["morning"]);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const color = initial?.color ?? MED_COLORS[existingCount % MED_COLORS.length];

  // When frequency changes, auto-set sensible default times
  const handleFrequencyChange = (f: MedicationFrequency) => {
    setFrequency(f);
    setTimes(FREQUENCY_TIMES[f]);
  };

  const toggleTime = (t: MedicationTime) => {
    setTimes(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Medication name is required."); return; }
    if (!dosage.trim()) { setError("Dosage is required."); return; }
    if (times.length === 0) { setError("Select at least one time."); return; }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        dosage: dosage.trim(),
        frequency,
        times,
        notes: notes.trim() || undefined,
        startDate: initial?.startDate ?? todayStr(),
        active: true,
        color,
      });
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        className="w-full max-w-lg rounded-t-[32px] overflow-hidden"
        style={{ background: C.surface, maxHeight: "90vh" }}
        onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full" style={{ background: C.border }} />
        </div>

        <div className="px-5 pb-8 overflow-y-auto" style={{ maxHeight: "calc(90vh - 28px)" }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-black" style={{ color: C.text }}>
                {initial ? "Edit Medication" : "Add Medication"}
              </h2>
              <p className="text-xs" style={{ color: C.textSoft }}>
                {initial ? "Update schedule details" : "Set up your medication schedule"}
              </p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: C.surface2 }}>
              <X size={16} color={C.textSoft} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs font-black mb-1.5 block" style={{ color: C.textMid }}>
                Medication name
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Metformin, Vitamin D"
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                style={{ background: C.surface2, border: `1.5px solid ${C.border}`, color: C.text }}
              />
            </div>

            {/* Dosage */}
            <div>
              <label className="text-xs font-black mb-1.5 block" style={{ color: C.textMid }}>
                Dosage
              </label>
              <input
                value={dosage}
                onChange={e => setDosage(e.target.value)}
                placeholder="e.g. 500mg, 1 tablet, 10ml"
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                style={{ background: C.surface2, border: `1.5px solid ${C.border}`, color: C.text }}
              />
            </div>

            {/* Frequency */}
            <div>
              <label className="text-xs font-black mb-2 block" style={{ color: C.textMid }}>
                Frequency
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(FREQUENCY_LABELS) as MedicationFrequency[]).map(f => (
                  <button key={f} onClick={() => handleFrequencyChange(f)}
                    className="py-2.5 rounded-2xl text-xs font-black transition-all"
                    style={{
                      background: frequency === f ? C.indigo : C.surface2,
                      color: frequency === f ? "#fff" : C.textSoft,
                      border: `1.5px solid ${frequency === f ? C.indigo : C.border}`,
                    }}>
                    {FREQUENCY_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>

            {/* Times */}
            <div>
              <label className="text-xs font-black mb-2 block" style={{ color: C.textMid }}>
                When to take
              </label>
              <div className="flex flex-wrap gap-2">
                {TIME_ORDER.map(t => {
                  const sel = times.includes(t);
                  return (
                    <button key={t} onClick={() => toggleTime(t)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all"
                      style={{
                        background: sel ? "#EEF2FF" : C.surface2,
                        border: `1.5px solid ${sel ? C.indigo : C.border}`,
                        color: sel ? C.indigoDark : C.textSoft,
                      }}>
                      <span>{TIME_ICONS[t]}</span>
                      {TIME_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-black mb-1.5 block" style={{ color: C.textMid }}>
                Notes <span className="font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Take with food, avoid grapefruit…"
                rows={2}
                className="w-full rounded-2xl px-4 py-3 text-sm resize-none outline-none"
                style={{ background: C.surface2, border: `1.5px solid ${C.border}`, color: C.text, fontFamily: "inherit" }}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
                style={{ background: "#FFF1F2", border: "1px solid #FECDD3" }}>
                <AlertCircle size={14} color={C.rose} />
                <p className="text-xs font-bold" style={{ color: C.rose }}>{error}</p>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.indigoDark})` }}>
              {saving ? (
                <motion.div animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>{initial ? "Save changes" : "Add medication"}</>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Skip reason sheet ─────────────────────────────────────────────────────────

const SKIP_REASONS = [
  "Forgot", "Side effects", "Out of stock", "Doctor advised stop",
  "Felt better", "Other",
];

function SkipReasonSheet({
  onConfirm,
  onClose,
}: {
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        className="w-full max-w-lg rounded-t-[32px] p-5 pb-8"
        style={{ background: C.surface }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center mb-4">
          <div className="w-8 h-1 rounded-full" style={{ background: C.border }} />
        </div>
        <h3 className="font-black text-base mb-1" style={{ color: C.text }}>Why are you skipping?</h3>
        <p className="text-xs mb-4" style={{ color: C.textSoft }}>This helps NOVA track patterns.</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {SKIP_REASONS.map(r => (
            <button key={r} onClick={() => setSelected(r)}
              className="px-3 py-2 rounded-full text-xs font-bold transition-all"
              style={{
                background: selected === r ? "#FFF1F2" : C.surface2,
                border: `1.5px solid ${selected === r ? C.rose : C.border}`,
                color: selected === r ? C.rose : C.textSoft,
              }}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.96 }}
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected}
            className="flex-1 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-40"
            style={{ background: C.rose }}>
            Skip dose
          </motion.button>
          <button onClick={onClose}
            className="px-5 py-3 rounded-2xl text-sm font-black"
            style={{ background: C.surface2, color: C.textSoft }}>
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Adherence mini-chart ──────────────────────────────────────────────────────

function AdherenceBar({ value, color }: { value: number; color: string }) {
  const pct = Math.round(value * 100);
  const barColor = pct >= 80 ? C.green : pct >= 50 ? C.gold : C.rose;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: C.surface2 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: barColor }}
        />
      </div>
      <span className="text-[10px] font-black w-8 text-right" style={{ color: barColor }}>
        {pct}%
      </span>
    </div>
  );
}

// ── Today's dose card ─────────────────────────────────────────────────────────

function DoseCard({
  schedule,
  time,
  log,
  onTake,
  onSkip,
}: {
  schedule: MedicationSchedule;
  time: MedicationTime;
  log?: MedicationLog;
  onTake: () => void;
  onSkip: () => void;
}) {
  const taken = !!(log?.takenAt && !log.skipped);
  const skipped = !!(log?.skipped);
  const pending = !taken && !skipped;

  return (
    <motion.div
      layout
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{
        background: taken ? "#F0FDF4" : skipped ? "#FFF1F2" : C.surface,
        border: `1.5px solid ${taken ? "#BBF7D0" : skipped ? "#FECDD3" : C.border}`,
        opacity: skipped ? 0.7 : 1,
      }}>
      {/* Colour dot */}
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${schedule.color}18`, border: `1.5px solid ${schedule.color}35` }}>
        <Pill size={18} color={schedule.color ?? C.indigo} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-black text-sm truncate" style={{ color: C.text }}>{schedule.name}</p>
        <p className="text-[10px] font-bold" style={{ color: C.textSoft }}>
          {schedule.dosage} · {TIME_ICONS[time]} {TIME_LABELS[time]}
        </p>
        {taken && log?.takenAt && (
          <p className="text-[10px]" style={{ color: C.green }}>
            Taken at {new Date(log.takenAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
        {skipped && log?.skipReason && (
          <p className="text-[10px]" style={{ color: C.rose }}>Skipped · {log.skipReason}</p>
        )}
      </div>

      {pending && (
        <div className="flex gap-1.5 flex-shrink-0">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onTake}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
            <Check size={16} color={C.green} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onSkip}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "#FFF1F2", border: "1px solid #FECDD3" }}>
            <X size={16} color={C.rose} />
          </motion.button>
        </div>
      )}

      {taken && (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
          <Check size={16} color={C.green} />
        </div>
      )}

      {skipped && (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "#FFF1F2", border: "1px solid #FECDD3" }}>
          <X size={16} color={C.rose} />
        </div>
      )}
    </motion.div>
  );
}

// ── History view — last 7 days ────────────────────────────────────────────────

function HistoryView({
  schedules,
  logs,
}: {
  schedules: MedicationSchedule[];
  logs: MedicationLog[];
}) {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toDateStr(d));
  }

  const active = schedules.filter(s => s.active);
  if (active.length === 0) {
    return (
      <div className="rounded-3xl p-8 text-center"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <p className="font-black text-sm" style={{ color: C.textMid }}>No medications added yet</p>
        <p className="text-xs mt-1" style={{ color: C.textSoft }}>Add your first medication to start tracking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {active.map(schedule => {
        const adherence = computeAdherence(schedule, logs, 7);
        return (
          <div key={schedule.id}
            className="rounded-3xl p-4"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            {/* Schedule header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${schedule.color}18`, border: `1.5px solid ${schedule.color}35` }}>
                <Pill size={14} color={schedule.color ?? C.indigo} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm" style={{ color: C.text }}>{schedule.name}</p>
                <p className="text-[10px]" style={{ color: C.textSoft }}>
                  {schedule.dosage} · {FREQUENCY_LABELS[schedule.frequency]}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black" style={{ color: C.textSoft }}>7-day</p>
              </div>
            </div>

            <AdherenceBar value={adherence} color={schedule.color ?? C.indigo} />

            {/* Dot calendar */}
            <div className="flex justify-between mt-3">
              {days.map(d => {
                const dayLogs = logs.filter(l => l.scheduleId === schedule.id && l.date === d);
                const allTaken = schedule.times.every(t =>
                  dayLogs.some(l => l.scheduledTime === t && l.takenAt && !l.skipped)
                );
                const anySkipped = dayLogs.some(l => l.skipped);
                const hasAny = dayLogs.length > 0;
                const isFuture = d > todayStr();

                const dotColor = isFuture
                  ? C.border
                  : !hasAny
                  ? C.surface2
                  : allTaken
                  ? C.green
                  : anySkipped
                  ? C.rose
                  : C.gold;

                return (
                  <div key={d} className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full"
                      style={{ background: dotColor, border: `1.5px solid ${dotColor === C.surface2 ? C.border : dotColor}` }} />
                    <span className="text-[8px] font-bold" style={{ color: C.textSoft }}>
                      {new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type ActiveView = "today" | "history" | "manage";

export function MedicineTracker({ onNavigateToChat }: { onNavigateToChat?: () => void }) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>("today");
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editTarget, setEditTarget] = useState<MedicationSchedule | null>(null);
  const [skipTarget, setSkipTarget] = useState<{ schedule: MedicationSchedule; time: MedicationTime } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const today = todayStr();

  useEffect(() => {
    setIsMounted(true);
    if (!user?.id) { setLoading(false); return; }

    Promise.all([
      fetchMedicationSchedules(user.id),
      fetchMedicationLogs(user.id, 30),
    ]).then(([s, l]) => {
      setSchedules(s);
      setLogs(l);
      setLoading(false);
    });
  }, [user?.id]);

  // All doses due today, grouped by time slot
  const todayDosesByTime = useMemo(() => {
    const active = schedules.filter(s => s.active && s.startDate <= today);
    const grouped: Record<MedicationTime, { schedule: MedicationSchedule; time: MedicationTime }[]> = {
      morning: [], afternoon: [], with_meal: [], evening: [], night: [],
    };
    for (const s of active) {
      for (const t of s.times) {
        grouped[t].push({ schedule: s, time: t });
      }
    }
    return grouped;
  }, [schedules, today]);

  const getLog = useCallback((scheduleId: string, time: MedicationTime) =>
    logs.find(l => l.scheduleId === scheduleId && l.date === today && l.scheduledTime === time),
    [logs, today]
  );

  const handleTake = useCallback(async (schedule: MedicationSchedule, time: MedicationTime) => {
    if (!user?.id) return;
    const log: Omit<MedicationLog, "id"> = {
      scheduleId: schedule.id!,
      medicationName: schedule.name,
      scheduledTime: time,
      date: today,
      takenAt: new Date().toISOString(),
      skipped: false,
      createdAt: new Date().toISOString(),
    };
    // Optimistic update
    setLogs(prev => [
      { ...log, id: `opt-${Date.now()}` },
      ...prev.filter(l => !(l.scheduleId === schedule.id && l.date === today && l.scheduledTime === time)),
    ]);
    await saveMedicationLog(user.id, log);
  }, [user?.id, today]);

  const handleSkip = useCallback(async (schedule: MedicationSchedule, time: MedicationTime, reason: string) => {
    if (!user?.id) return;
    const log: Omit<MedicationLog, "id"> = {
      scheduleId: schedule.id!,
      medicationName: schedule.name,
      scheduledTime: time,
      date: today,
      skipped: true,
      skipReason: reason,
      createdAt: new Date().toISOString(),
    };
    setLogs(prev => [
      { ...log, id: `opt-${Date.now()}` },
      ...prev.filter(l => !(l.scheduleId === schedule.id && l.date === today && l.scheduledTime === time)),
    ]);
    await saveMedicationLog(user.id, log);
    setSkipTarget(null);
  }, [user?.id, today]);

  const handleAddSave = useCallback(async (s: Omit<MedicationSchedule, "id">) => {
    if (!user?.id) return;
    const saved = await saveMedicationSchedule(user.id, s);
    setSchedules(prev => [saved, ...prev]);
  }, [user?.id]);

  const handleEditSave = useCallback(async (s: Omit<MedicationSchedule, "id">) => {
    if (!user?.id || !editTarget?.id) return;
    await updateMedicationSchedule(user.id, editTarget.id, s);
    setSchedules(prev => prev.map(x => x.id === editTarget.id ? { ...x, ...s } : x));
    setEditTarget(null);
  }, [user?.id, editTarget]);

  const handleDeactivate = useCallback(async (schedule: MedicationSchedule) => {
    if (!user?.id || !schedule.id) return;
    await updateMedicationSchedule(user.id, schedule.id, { active: false });
    setSchedules(prev => prev.map(s => s.id === schedule.id ? { ...s, active: false } : s));
  }, [user?.id]);

  const handleReactivate = useCallback(async (schedule: MedicationSchedule) => {
    if (!user?.id || !schedule.id) return;
    await updateMedicationSchedule(user.id, schedule.id, { active: true });
    setSchedules(prev => prev.map(s => s.id === schedule.id ? { ...s, active: true } : s));
  }, [user?.id]);

  // Today's summary stats
  const totalDueSections = TIME_ORDER.flatMap(t => todayDosesByTime[t]);
  const takenCount = totalDueSections.filter(({ schedule, time }) => {
    const log = getLog(schedule.id!, time);
    return log?.takenAt && !log.skipped;
  }).length;
  const totalDue = totalDueSections.length;
  const allDone = totalDue > 0 && takenCount === totalDue;

  // Overall 7-day adherence across all active schedules
  const overallAdherence = useMemo(() => {
    const active = schedules.filter(s => s.active);
    if (active.length === 0) return null;
    const avg = active.reduce((sum, s) => sum + computeAdherence(s, logs, 7), 0) / active.length;
    return parseFloat(avg.toFixed(2));
  }, [schedules, logs]);

  if (!isMounted || loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <motion.div animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-500" />
      </div>
    );
  }

  const NAV: { id: ActiveView; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "history", label: "History" },
    { id: "manage", label: "Manage" },
  ];

  return (
    <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">

      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #7C3AED 0%, #5B5EF4 55%, #4338CA 100%)",
          border: "1px solid #C4B5FD",
          boxShadow: "0 16px 48px rgba(124,58,237,0.22)",
        }}>
        <div className="absolute top-0 right-0 w-44 h-44 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.20) 0%, transparent 65%)", filter: "blur(32px)" }} />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-75 text-white">
              Daily · Scheduled · Private
            </p>
            <h2 className="text-2xl font-black text-white leading-tight"
              style={{ fontFamily: "var(--font-outfit, sans-serif)", letterSpacing: "-0.025em" }}>
              Medicine Tracker
            </h2>
            <p className="text-sm mt-0.5 text-white/80">
              {totalDue === 0
                ? "No doses scheduled today"
                : allDone
                ? "All doses taken today ✓"
                : `${takenCount} of ${totalDue} doses taken`}
            </p>
          </div>

          <div className="flex flex-col items-center gap-1">
            {totalDue > 0 ? (
              <div className="rounded-2xl px-3 py-2.5 text-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)" }}>
                <p className="text-2xl font-black text-white leading-none">{takenCount}/{totalDue}</p>
                <p className="text-[9px] font-black text-white/70 uppercase tracking-widest mt-0.5">today</p>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)" }}>
                <Pill size={22} color="white" />
              </div>
            )}
          </div>
        </div>

        {/* Overall adherence pill */}
        {overallAdherence !== null && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-2xl px-4 py-2.5 flex items-center gap-3"
            style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)" }}>
            <BarChart2 size={16} color="white" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-black text-white">7-day adherence</p>
                <p className="text-xs font-black text-white">{Math.round(overallAdherence * 100)}%</p>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.25)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(overallAdherence * 100)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: overallAdherence >= 0.8 ? "#4ADE80" : overallAdherence >= 0.5 ? "#FCD34D" : "#F87171" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Nav tabs */}
      <div className="flex gap-1.5 p-1.5 rounded-2xl"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        {NAV.map(({ id, label }) => (
          <motion.button key={id} onClick={() => setActiveView(id)}
            className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
            style={{
              background: activeView === id ? C.purple : "transparent",
              color: activeView === id ? "#fff" : C.textSoft,
            }}>
            {label}
            {id === "today" && allDone && totalDue > 0 && (
              <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-green-400 align-middle" />
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* TODAY VIEW */}
        {activeView === "today" && (
          <motion.div key="today"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4">

            {totalDue === 0 ? (
              <div className="rounded-3xl p-8 text-center"
                style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="text-4xl mb-3">💊</div>
                <p className="font-black text-sm" style={{ color: C.text }}>No doses scheduled today</p>
                <p className="text-xs mt-1 max-w-xs mx-auto" style={{ color: C.textSoft }}>
                  Add a medication to start tracking your daily schedule.
                </p>
                <motion.button whileTap={{ scale: 0.96 }}
                  onClick={() => setShowAddSheet(true)}
                  className="mt-4 px-5 py-2.5 rounded-full text-sm font-black text-white inline-flex items-center gap-2"
                  style={{ background: C.purple }}>
                  <Plus size={14} /> Add medication
                </motion.button>
              </div>
            ) : (
              TIME_ORDER.map(time => {
                const doses = todayDosesByTime[time];
                if (doses.length === 0) return null;
                return (
                  <div key={time}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 px-1"
                      style={{ color: C.textSoft }}>
                      {TIME_ICONS[time]} {TIME_LABELS[time]}
                    </p>
                    <div className="space-y-2">
                      {doses.map(({ schedule, time: t }) => (
                        <DoseCard
                          key={`${schedule.id}-${t}`}
                          schedule={schedule}
                          time={t}
                          log={getLog(schedule.id!, t)}
                          onTake={() => handleTake(schedule, t)}
                          onSkip={() => setSkipTarget({ schedule, time: t })}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}

            {/* All done celebration */}
            {allDone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl p-5 text-center"
                style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0" }}>
                <p className="text-2xl mb-2">🎉</p>
                <p className="font-black text-sm" style={{ color: C.green }}>
                  All doses taken today!
                </p>
                <p className="text-xs mt-1" style={{ color: C.textSoft }}>
                  NOVA has noted your adherence for today.
                </p>
              </motion.div>
            )}

            <div className="rounded-2xl p-4 text-xs leading-relaxed"
              style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}>
              Medication reminders are for tracking only. Always follow your doctor's prescription. Do not adjust doses without medical advice.
            </div>
          </motion.div>
        )}

        {/* HISTORY VIEW */}
        {activeView === "history" && (
          <motion.div key="history"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}>
            <HistoryView schedules={schedules} logs={logs} />
          </motion.div>
        )}

        {/* MANAGE VIEW */}
        {activeView === "manage" && (
          <motion.div key="manage"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3">

            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => setShowAddSheet(true)}
              className="w-full rounded-2xl p-4 flex items-center gap-3 text-left"
              style={{ background: C.surface, border: `1.5px dashed ${C.border}` }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "#EEF2FF", border: `1px solid ${C.indigoLight}` }}>
                <Plus size={18} color={C.indigo} />
              </div>
              <div>
                <p className="font-black text-sm" style={{ color: C.text }}>Add new medication</p>
                <p className="text-xs" style={{ color: C.textSoft }}>Set up a name, dosage, and schedule</p>
              </div>
            </motion.button>

            {schedules.length === 0 && (
              <div className="rounded-3xl p-8 text-center"
                style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <p className="font-black text-sm" style={{ color: C.textMid }}>No medications yet</p>
                <p className="text-xs mt-1" style={{ color: C.textSoft }}>
                  Add your first medication above to get started.
                </p>
              </div>
            )}

            {/* Active */}
            {schedules.filter(s => s.active).length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2 px-1"
                  style={{ color: C.textSoft }}>Active</p>
                <div className="space-y-2">
                  {schedules.filter(s => s.active).map(s => (
                    <div key={s.id}
                      className="rounded-2xl p-4 flex items-center gap-3"
                      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${s.color}18`, border: `1.5px solid ${s.color}35` }}>
                        <Pill size={18} color={s.color ?? C.indigo} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm" style={{ color: C.text }}>{s.name}</p>
                        <p className="text-[10px]" style={{ color: C.textSoft }}>
                          {s.dosage} · {FREQUENCY_LABELS[s.frequency]}
                        </p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {s.times.map(t => (
                            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                              style={{ background: `${s.color}18`, color: s.color ?? C.indigo }}>
                              {TIME_ICONS[t]} {TIME_LABELS[t]}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => setEditTarget(s)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: C.surface2 }}>
                          <Edit2 size={13} color={C.textSoft} />
                        </button>
                        <button onClick={() => handleDeactivate(s)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: "#FFF1F2" }}>
                          <X size={13} color={C.rose} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inactive */}
            {schedules.filter(s => !s.active).length > 0 && (
              <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-widest mb-2 px-1"
                  style={{ color: C.textSoft }}>Inactive</p>
                <div className="space-y-2">
                  {schedules.filter(s => !s.active).map(s => (
                    <div key={s.id}
                      className="rounded-2xl p-4 flex items-center gap-3 opacity-60"
                      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: C.surface2, border: `1.5px solid ${C.border}` }}>
                        <Pill size={18} color={C.textSoft} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm" style={{ color: C.text }}>{s.name}</p>
                        <p className="text-[10px]" style={{ color: C.textSoft }}>
                          {s.dosage} · {FREQUENCY_LABELS[s.frequency]}
                        </p>
                      </div>
                      <button onClick={() => handleReactivate(s)}
                        className="px-3 py-1.5 rounded-xl text-xs font-black"
                        style={{ background: C.surface2, color: C.textMid }}>
                        Reactivate
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {showAddSheet && (
        <MedicationFormSheet
          existingCount={schedules.length}
          onSave={handleAddSave}
          onClose={() => setShowAddSheet(false)}
        />
      )}

      {editTarget && (
        <MedicationFormSheet
          initial={editTarget}
          existingCount={schedules.length}
          onSave={handleEditSave}
          onClose={() => setEditTarget(null)}
        />
      )}

      {skipTarget && (
        <SkipReasonSheet
          onConfirm={(reason) => handleSkip(skipTarget.schedule, skipTarget.time, reason)}
          onClose={() => setSkipTarget(null)}
        />
      )}
    </div>
  );
}
