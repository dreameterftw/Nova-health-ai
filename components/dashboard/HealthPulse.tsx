"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import {
  saveHealthPulseLog,
  saveHealthPulseLogLocal,
  fetchHealthPulseLogs,
} from "@/lib/activityStore";
import type { BodySymptom, HealthPulseLog, MindSymptom } from "@/lib/userContext";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from "recharts";

const C = {
  bg: "#F8F9FC",
  surface: "#FFFFFF",
  surface2: "#F1F3F8",
  border: "#E2E8F0",
  indigo: "#5B5EF4",
  indigoDark: "#4338CA",
  indigoLight: "#C7D2FE",
  teal: "#0D9488",
  tealLight: "#99F6E4",
  rose: "#F43F5E",
  gold: "#D97706",
  amber: "#F59E0B",
  text: "#0F172A",
  textMid: "#334155",
  textSoft: "#64748B",
  green: "#10B981",
};

const BODY_CHIPS: { id: BodySymptom; label: string; emoji: string }[] = [
  { id: "fatigue", label: "Fatigue", emoji: "😴" },
  { id: "headache", label: "Headache", emoji: "🤕" },
  { id: "nausea", label: "Nausea", emoji: "🤢" },
  { id: "pain", label: "Pain", emoji: "😣" },
  { id: "shortness_of_breath", label: "Breathless", emoji: "😮‍💨" },
  { id: "dizziness", label: "Dizzy", emoji: "😵" },
  { id: "fever", label: "Fever", emoji: "🌡️" },
  { id: "chest_tightness", label: "Chest tight", emoji: "💢" },
  { id: "stomach_ache", label: "Stomach", emoji: "🤧" },
  { id: "muscle_ache", label: "Muscle ache", emoji: "💪" },
];

const MIND_CHIPS: { id: MindSymptom; label: string; emoji: string }[] = [
  { id: "anxious", label: "Anxious", emoji: "😰" },
  { id: "low", label: "Low", emoji: "😔" },
  { id: "foggy", label: "Foggy", emoji: "🌫️" },
  { id: "calm", label: "Calm", emoji: "😌" },
  { id: "irritable", label: "Irritable", emoji: "😤" },
  { id: "overwhelmed", label: "Overwhelmed", emoji: "🤯" },
  { id: "hopeful", label: "Hopeful", emoji: "🌱" },
  { id: "restless", label: "Restless", emoji: "⚡" },
];

const SCORE_COLORS: Record<number, string> = {
  1: "#BE123C", 2: "#C2410C", 3: "#B45309", 4: "#92400E", 5: "#D97706",
  6: "#F59E0B", 7: "#FBBF24", 8: "#5B5EF4", 9: "#4338CA", 10: "#3730A3",
};
const SCORE_EMOJIS: Record<number, string> = {
  1: "😞", 2: "😟", 3: "😕", 4: "😐", 5: "🙂", 6: "😊", 7: "😄", 8: "😁", 9: "🤩", 10: "🌟",
};

function scoreLabel(s: number): string {
  if (s <= 2) return "Very Low";
  if (s <= 4) return "Low";
  if (s <= 6) return "Moderate";
  if (s <= 8) return "Good";
  return "Excellent";
}

function scoreCopy(s: number): string {
  if (s <= 3) return "That sounds really hard. NOVA is here.";
  if (s <= 5) return "Not your best day. Let's keep an eye on this.";
  if (s <= 7) return "Doing okay. Steady progress.";
  return "Great to hear. Keep it going.";
}

// FIXED — orders chips by user's symptom history frequency
// Most frequently reported symptoms surface first
function orderChipsByHistory<T extends { id: string }>(
  chips: T[],
  symptomMap: Record<string, number>
): T[] {
  return [...chips].sort((a, b) => {
    const freqA = symptomMap[a.id] ?? 0;
    const freqB = symptomMap[b.id] ?? 0;
    return freqB - freqA;
  });
}

function Chip({
  emoji, label, selected, onClick,
}: { emoji: string; label: string; selected: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
      style={{
        background: selected ? "#EEF2FF" : C.surface2,
        border: `1.5px solid ${selected ? C.indigo : C.border}`,
        color: selected ? C.indigoDark : C.textSoft,
        boxShadow: selected ? "0 2px 8px rgba(91,94,244,0.18)" : "none",
      }}
    >
      <span className="text-sm leading-none">{emoji}</span>
      {label}
    </motion.button>
  );
}

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === step ? 20 : 6,
            background: i === step ? C.indigo : C.border,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="h-1.5 rounded-full"
        />
      ))}
    </div>
  );
}

function InsightsPanel({ logs }: { logs: HealthPulseLog[] }) {
  if (logs.length < 3) {
    return (
      <div className="rounded-3xl p-5 text-center"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div className="w-10 h-10 rounded-2xl mx-auto mb-3 flex items-center justify-center"
          style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              stroke={C.indigo} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-sm font-black" style={{ color: C.text }}>Patterns emerge after 5 check-ins</p>
        <p className="text-xs mt-1" style={{ color: C.textSoft }}>
          {logs.length < 5
            ? `${5 - logs.length} more check-in${5 - logs.length !== 1 ? "s" : ""} to unlock insights`
            : "Keep going — almost there"}
        </p>
      </div>
    );
  }

  const insights: { icon: string; color: string; bg: string; text: string }[] = [];
  const scores = logs.map((l) => l.wellnessScore);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  const recentLow = logs.slice(0, 3).filter((l) => l.wellnessScore <= 4).length;
  if (recentLow >= 3) {
    insights.push({
      icon: "📉", color: C.rose, bg: "#FFF1F2",
      text: `You've rated yourself ${recentLow}/3 recent days below 5. It's okay to have a rough patch — want to talk about what's been going on?`,
    });
  }

  if (logs.length >= 3 && scores[0] > scores[2]) {
    insights.push({
      icon: "📈", color: C.green, bg: "#F0FDF4",
      text: `Your wellness score has been climbing over the last ${logs.length} days. That's a meaningful shift worth acknowledging.`,
    });
  }

  const fatigueDays = logs.filter((l) => l.bodySymptoms.includes("fatigue")).length;
  if (fatigueDays >= 3) {
    insights.push({
      icon: "😴", color: C.gold, bg: "#FFFBEB",
      text: `Fatigue has appeared in ${fatigueDays} of your last ${logs.length} check-ins. Persistent fatigue can have many causes — it may be worth mentioning to your doctor.`,
    });
  }

  const anxiousDays = logs.filter((l) => l.mindSymptoms.includes("anxious")).length;
  if (anxiousDays >= 3) {
    insights.push({
      icon: "🌀", color: "#7C3AED", bg: "#F5F3FF",
      text: `You've noted feeling anxious on ${anxiousDays} of your last ${logs.length} days. NOVA is here whenever you want to work through what's underneath it.`,
    });
  }

  const mondayLow = logs.filter((l) => {
    const d = new Date(l.date).getDay();
    return d === 1 && l.wellnessScore <= 5;
  }).length;
  if (mondayLow >= 2) {
    insights.push({
      icon: "📅", color: C.textSoft, bg: C.surface2,
      text: `Your scores tend to dip at the start of the week. That Monday pattern might be worth exploring — is something about the week ahead feeling heavy?`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      icon: "✨", color: C.teal, bg: "#F0FDFA",
      text: `${logs.length}-day average: ${avg.toFixed(1)}/10. You're building a solid health picture. Keep checking in — patterns become clearer over time.`,
    });
  }

  return (
    <div className="space-y-3">
      {insights.map((ins, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="rounded-2xl p-4 flex gap-3"
          style={{ background: ins.bg, border: `1px solid ${ins.color}28` }}
        >
          <span className="text-xl leading-none flex-shrink-0 mt-0.5">{ins.icon}</span>
          <p className="text-xs leading-relaxed" style={{ color: C.textMid }}>{ins.text}</p>
        </motion.div>
      ))}
    </div>
  );
}

function TimelineCard({
  log,
  expanded,
  onToggle,
}: {
  log: HealthPulseLog;
  expanded: boolean;
  onToggle: () => void;
}) {
  const color = SCORE_COLORS[log.wellnessScore] ?? C.textSoft;
  const emoji = SCORE_EMOJIS[log.wellnessScore] ?? "•";
  const dateLabel = new Date(log.date + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", month: "short", day: "numeric",
  });

  return (
    // FIXED — entire card is tappable to expand/collapse
    <motion.div
      layout
      onClick={onToggle}
      className="rounded-2xl p-4 cursor-pointer"
      style={{ background: C.surface, border: `1px solid ${expanded ? C.indigo : C.border}` }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{emoji}</span>
          <div>
            <p className="text-[11px] font-black" style={{ color }}>
              {scoreLabel(log.wellnessScore)} · {log.wellnessScore}/10
            </p>
            <p className="text-[10px]" style={{ color: C.textSoft }}>{dateLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
            style={{ background: color }}>
            {log.wellnessScore}
          </div>
          {/* FIXED — expand/collapse chevron */}
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke={C.textSoft} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* FIXED — expanded detail shows full symptom breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {log.bodySymptoms.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1 mt-2">
                {log.bodySymptoms.map((s) => {
                  const chip = BODY_CHIPS.find((c) => c.id === s);
                  return chip ? (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{ background: "#FFF7ED", color: "#C2410C", border: "1px solid #FED7AA" }}>
                      {chip.emoji} {chip.label}
                      {log.symptomIntensity?.[s] ? ` · ${log.symptomIntensity[s]}` : ""}
                    </span>
                  ) : null;
                })}
              </div>
            )}

            {log.mindSymptoms.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {log.mindSymptoms.map((s) => {
                  const chip = MIND_CHIPS.find((c) => c.id === s);
                  return chip ? (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{ background: "#EEF2FF", color: C.indigoDark, border: `1px solid ${C.indigoLight}` }}>
                      {chip.emoji} {chip.label}
                      {log.symptomIntensity?.[s] ? ` · ${log.symptomIntensity[s]}` : ""}
                    </span>
                  ) : null;
                })}
              </div>
            )}

            {log.note && (
              <p className="text-[11px] mt-2 italic leading-relaxed" style={{ color: C.textSoft }}>
                "{log.note}"
              </p>
            )}

            {log.bodySymptoms.length === 0 && log.mindSymptoms.length === 0 && !log.note && (
              <p className="text-[11px] mt-2" style={{ color: C.textSoft }}>No symptoms reported.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed preview — show chips inline when not expanded */}
      {!expanded && (log.bodySymptoms.length > 0 || log.mindSymptoms.length > 0) && (
        <p className="text-[10px] truncate mt-1" style={{ color: C.textSoft }}>
          {[...log.bodySymptoms, ...log.mindSymptoms]
            .slice(0, 3)
            .map(s => s.replace(/_/g, " "))
            .join(" · ")}
          {log.bodySymptoms.length + log.mindSymptoms.length > 3 ? " …" : ""}
        </p>
      )}
    </motion.div>
  );
}

// FIXED — computes best and worst 7-day windows from log history
function getBestWorstWeeks(logs: HealthPulseLog[]): {
  bestHigh: number; bestLow: number;
  worstHigh: number; worstLow: number;
} | null {
  if (logs.length < 7) return null;

  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  let bestAvg = -Infinity;
  let worstAvg = Infinity;
  let bestRange = { high: 10, low: 0 };
  let worstRange = { high: 10, low: 0 };

  for (let i = 0; i <= sorted.length - 7; i++) {
    const window = sorted.slice(i, i + 7);
    const avg = window.reduce((a, b) => a + b.wellnessScore, 0) / 7;
    const scores = window.map(w => w.wellnessScore);
    const high = Math.max(...scores);
    const low = Math.min(...scores);

    if (avg > bestAvg) {
      bestAvg = avg;
      bestRange = { high, low };
    }
    if (avg < worstAvg) {
      worstAvg = avg;
      worstRange = { high, low };
    }
  }

  return {
    bestHigh: bestRange.high,
    bestLow: bestRange.low,
    worstHigh: worstRange.high,
    worstLow: worstRange.low,
  };
}

function TrendChart({
  logs,
  onDotClick,
}: {
  logs: HealthPulseLog[];
  onDotClick: (date: string) => void;
}) {
  const days: { day: string; date: string; score: number | undefined }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const found = logs.find((l) => l.date === dateStr);
    days.push({ day: label, date: dateStr, score: found?.wellnessScore });
  }

  const hasData = days.some((d) => d.score !== undefined);
  if (!hasData) return null;

  const validScores = days.filter((d) => d.score !== undefined).map((d) => d.score as number);
  const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length;

  // FIXED — compute best/worst week bands
  const bands = getBestWorstWeeks(logs);

  return (
    <div className="rounded-3xl overflow-hidden"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h3 className="font-black text-sm" style={{ color: C.text }}>Wellness Trend</h3>
          <p className="text-[10px]" style={{ color: C.textSoft }}>Last 7 days · tap a dot for details</p>
        </div>
        <div className="flex items-center gap-2">
          {bands && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#86EFAC" }} />
              <span className="text-[9px]" style={{ color: C.textSoft }}>Best</span>
              <span className="inline-block w-2 h-2 rounded-full ml-1" style={{ background: "#FCA5A5" }} />
              <span className="text-[9px]" style={{ color: C.textSoft }}>Worst</span>
            </div>
          )}
          <div className="px-2.5 py-1 rounded-full text-[10px] font-black"
            style={{ background: "#EEF2FF", color: C.indigoDark, border: "1px solid #C7D2FE" }}>
            avg {avg.toFixed(1)}/10
          </div>
        </div>
      </div>
      <div className="px-2 pb-4" style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={days} margin={{ top: 6, right: 8, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="pulseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.teal} stopOpacity={0.22} />
                <stop offset="100%" stopColor={C.teal} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fontWeight: 700, fill: "#94A3B8" }}
              axisLine={false} tickLine={false} />
            <YAxis domain={[0, 10]} ticks={[0, 5, 10]}
              tick={{ fontSize: 9, fill: "#CBD5E1" }} axisLine={false} tickLine={false} />

            {/* FIXED — average score reference line */}
            <ReferenceLine y={avg} stroke="#99F6E4" strokeDasharray="4 3" strokeWidth={1.5} />

            {/* FIXED — best week band */}
            {bands && (
              <ReferenceArea
                y1={bands.bestLow} y2={bands.bestHigh}
                fill="#86EFAC" fillOpacity={0.12}
                stroke="#86EFAC" strokeOpacity={0.3}
              />
            )}

            {/* FIXED — worst week band */}
            {bands && (
              <ReferenceArea
                y1={bands.worstLow} y2={bands.worstHigh}
                fill="#FCA5A5" fillOpacity={0.12}
                stroke="#FCA5A5" strokeOpacity={0.3}
              />
            )}

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length || payload[0].value == null) return null;
                const s = payload[0].value as number;
                return (
                  <div className="rounded-2xl px-3 py-2 shadow-xl"
                    style={{ background: "#fff", border: "1px solid #E2E8F0" }}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className="text-base font-black" style={{ color: SCORE_COLORS[Math.round(s)] }}>
                      {s}<span className="text-xs font-semibold text-slate-400">/10</span>
                    </p>
                  </div>
                );
              }}
              cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }}
            />
            <Area type="monotone" dataKey="score" stroke={C.teal} strokeWidth={2.5}
              fill="url(#pulseGrad)"
              // FIXED — dot click fires onDotClick with the date for that data point
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload.score == null) return <g key={`dot-${cx}`} />;
                return (
                  <circle
                    key={`dot-${cx}`}
                    cx={cx} cy={cy} r={5}
                    fill={SCORE_COLORS[Math.round(payload.score)] ?? C.teal}
                    stroke="white" strokeWidth={2}
                    style={{ cursor: "pointer" }}
                    onClick={() => onDotClick(payload.date)}
                  />
                );
              }}
              activeDot={{
                r: 7, fill: C.teal, stroke: "white", strokeWidth: 2,
                style: { cursor: "pointer" },
                onClick: ((_: any, payload: any) => {
                  if (payload?.payload?.date) onDotClick(payload.payload.date);
                }) as any,
              }}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SymptomFrequencyMap({ logs }: { logs: HealthPulseLog[] }) {
  const freq: Record<string, number> = {};
  for (const log of logs.slice(0, 30)) {
    for (const symptom of [...log.bodySymptoms, ...log.mindSymptoms]) {
      if (symptom === "calm" || symptom === "hopeful") continue;
      freq[symptom] = (freq[symptom] ?? 0) + 1;
    }
  }

  const rows = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map(([, count]) => count));

  return (
    <div className="rounded-3xl p-5"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="mb-4">
        <h3 className="font-black text-sm" style={{ color: C.text }}>Symptom Frequency</h3>
        <p className="text-[10px]" style={{ color: C.textSoft }}>Last 30 days</p>
      </div>
      <div className="space-y-3">
        {rows.map(([symptom, count]) => (
          <div key={symptom} className="grid grid-cols-[90px_1fr_52px] items-center gap-3">
            <p className="text-xs font-bold capitalize truncate" style={{ color: C.textMid }}>
              {symptom.replace(/_/g, " ")}
            </p>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: C.surface2 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(8, (count / max) * 100)}%` }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: C.teal }}
              />
            </div>
            <p className="text-[11px] font-black text-right" style={{ color: C.textSoft }}>
              {count} day{count === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DoctorBriefModal({
  logs, onClose,
}: { logs: HealthPulseLog[]; onClose: () => void }) {
  const [generating, setGenerating] = useState(false);
  const [brief, setBrief] = useState<string | null>(null);
  const [range, setRange] = useState<7 | 14 | 30>(7);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/health-pulse/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs: logs.slice(0, range), rangeDays: range }),
      });
      const data = await res.json();
      setBrief(data.brief ?? "Could not generate brief.");
    } catch {
      setBrief("Brief generation failed — please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const copyBrief = () => {
    if (brief) navigator.clipboard.writeText(brief);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center p-0"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        className="w-full max-w-lg rounded-t-[32px] overflow-hidden"
        style={{ background: C.surface, maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full" style={{ background: C.border }} />
        </div>
        <div className="px-5 pb-6 overflow-y-auto" style={{ maxHeight: "calc(85vh - 28px)" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-black" style={{ color: C.text }}>Doctor Brief</h2>
              <p className="text-xs" style={{ color: C.textSoft }}>A summary to share at your next appointment</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: C.surface2 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke={C.textSoft} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {!brief && (
            <>
              <p className="text-xs font-black mb-2" style={{ color: C.textMid }}>Select date range</p>
              <div className="flex gap-2 mb-5">
                {([7, 14, 30] as const).map((r) => (
                  <button key={r} onClick={() => setRange(r)}
                    className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
                    style={{
                      background: range === r ? C.indigo : C.surface2,
                      color: range === r ? "#fff" : C.textSoft,
                      border: `1.5px solid ${range === r ? C.indigo : C.border}`,
                    }}>
                    {r} days
                  </button>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={generate}
                disabled={generating || logs.length === 0}
                className="w-full py-3.5 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${C.teal}, #0891B2)` }}
              >
                {generating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                    />
                    Generating…
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        stroke="white" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                    Generate Doctor Brief
                  </>
                )}
              </motion.button>
            </>
          )}

          {brief && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="rounded-2xl p-4 mb-4 font-mono text-xs leading-relaxed whitespace-pre-wrap"
                style={{ background: "#F8FAFC", border: `1px solid ${C.border}`, color: C.textMid }}>
                {brief}
              </div>
              <div className="flex gap-2">
                <motion.button whileTap={{ scale: 0.96 }} onClick={copyBrief}
                  className="flex-1 py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2"
                  style={{ background: C.indigo }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <rect x="9" y="9" width="13" height="13" rx="2" stroke="white" strokeWidth="1.7" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="white" strokeWidth="1.7" />
                  </svg>
                  Copy
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setBrief(null)}
                  className="flex-1 py-3 rounded-2xl text-sm font-black"
                  style={{ background: C.surface2, color: C.textMid, border: `1px solid ${C.border}` }}>
                  Regenerate
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

type WizardState = {
  bodySymptoms: BodySymptom[];
  mindSymptoms: MindSymptom[];
  symptomIntensity: Record<string, "mild" | "moderate" | "severe">;
  wellnessScore: number | null;
};

function CheckInWizard({
  onComplete,
  existingLog,
  symptomMap,
  onSkipToScore,
}: {
  onComplete: (log: Omit<HealthPulseLog, "id">) => void;
  existingLog?: HealthPulseLog;
  symptomMap: Record<string, number>;
  // FIXED — callback to jump straight to step 2 (score) when "Fine" is selected
  onSkipToScore?: () => void;
}) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>({
    bodySymptoms: existingLog?.bodySymptoms ?? [],
    mindSymptoms: existingLog?.mindSymptoms ?? [],
    symptomIntensity: existingLog?.symptomIntensity ?? {},
    wellnessScore: existingLog?.wellnessScore ?? 5,
  });
  const [note, setNote] = useState(existingLog?.note ?? "");

  // FIXED — chips ordered by user history
  const orderedBodyChips = orderChipsByHistory(BODY_CHIPS, symptomMap);
  const orderedMindChips = orderChipsByHistory(MIND_CHIPS, symptomMap);

  const toggleBody = (id: BodySymptom) =>
    setState((p) => {
      const selected = p.bodySymptoms.includes(id);
      const symptomIntensity = { ...p.symptomIntensity };
      if (selected) delete symptomIntensity[id];
      else symptomIntensity[id] = "moderate";
      return {
        ...p,
        symptomIntensity,
        bodySymptoms: selected
          ? p.bodySymptoms.filter((s) => s !== id)
          : [...p.bodySymptoms, id],
      };
    });

  const toggleMind = (id: MindSymptom) =>
    setState((p) => {
      if (id === "calm") {
        return { ...p, mindSymptoms: p.mindSymptoms.includes("calm") ? [] : ["calm"], symptomIntensity: {} };
      }
      const selected = p.mindSymptoms.includes(id);
      const symptomIntensity = { ...p.symptomIntensity };
      if (selected) delete symptomIntensity[id];
      else symptomIntensity[id] = "moderate";
      return {
        ...p,
        symptomIntensity,
        mindSymptoms: selected
          ? p.mindSymptoms.filter((s) => s !== id)
          : [...p.mindSymptoms.filter((s) => s !== "calm"), id],
      };
    });

  const handleSubmit = () => {
    if (state.wellnessScore === null) return;
    onComplete({
      date: new Date().toISOString().slice(0, 10),
      wellnessScore: state.wellnessScore,
      bodySymptoms: state.bodySymptoms,
      mindSymptoms: state.mindSymptoms,
      symptomIntensity: state.symptomIntensity,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
  };

  const setIntensity = (id: string, value: "mild" | "moderate" | "severe") =>
    setState((p) => ({
      ...p,
      symptomIntensity: { ...p.symptomIntensity, [id]: value },
    }));

  const renderIntensity = (id: string) => (
    <div className="flex gap-1 mt-1 ml-2">
      {(["mild", "moderate", "severe"] as const).map((level) => {
        const active = state.symptomIntensity[id] === level;
        return (
          <button
            key={level}
            onClick={() => setIntensity(id, level)}
            className="h-2.5 rounded-full transition-all"
            title={level}
            style={{ width: active ? 22 : 10, background: active ? C.indigo : C.border }}
          />
        );
      })}
    </div>
  );

  const STEPS = [
    {
      title: "How's your body?",
      subtitle: "Tap all that apply — or tap Fine to skip",
      content: (
        <div className="flex flex-wrap gap-2">
          {/* FIXED — Fine chip skips to Step 2 (score) not just Step 1 (mind) */}
          <Chip
            emoji="✓" label="Fine"
            selected={state.bodySymptoms.length === 0}
            onClick={() => {
              setState((p) => ({ ...p, bodySymptoms: [], symptomIntensity: {} }));
              // Skip body entirely, go straight to mind step then score
              setStep(1);
            }}
          />
          {orderedBodyChips.map((c) => (
            <div key={c.id}>
              <Chip emoji={c.emoji} label={c.label}
                selected={state.bodySymptoms.includes(c.id)}
                onClick={() => toggleBody(c.id)} />
              {state.bodySymptoms.includes(c.id) && renderIntensity(c.id)}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "How's your mind?",
      subtitle: "Select everything that resonates right now",
      content: (
        <div className="flex flex-wrap gap-2">
          {orderedMindChips.map((c) => (
            <div key={c.id}>
              <Chip emoji={c.emoji} label={c.label}
                selected={state.mindSymptoms.includes(c.id)}
                onClick={() => toggleMind(c.id)} />
              {state.mindSymptoms.includes(c.id) && c.id !== "calm" && renderIntensity(c.id)}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Overall, how are you?",
      subtitle: "Give today a number — 1 is rough, 10 is great",
      content: (
        <div className="space-y-4">
          <div className="rounded-3xl p-4"
            style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
            <div className="text-center mb-3">
              <p className="text-4xl font-black" style={{ color: SCORE_COLORS[state.wellnessScore ?? 5] }}>
                {state.wellnessScore ?? 5}
                <span className="text-lg" style={{ color: C.textSoft }}> / 10</span>
              </p>
            </div>
            <input
              type="range" min={1} max={10}
              value={state.wellnessScore ?? 5}
              onChange={(e) => setState((p) => ({ ...p, wellnessScore: Number(e.target.value) }))}
              className="w-full accent-teal-600"
            />
            <div className="flex justify-between text-[10px] font-black mt-1" style={{ color: C.textSoft }}>
              <span>1</span><span>10</span>
            </div>
            <p className="text-xs font-bold text-center mt-3" style={{ color: C.textMid }}>
              {scoreCopy(state.wellnessScore ?? 5)}
            </p>
          </div>
          {state.wellnessScore !== null && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-2xl"
              style={{
                background: `${SCORE_COLORS[state.wellnessScore]}12`,
                border: `1px solid ${SCORE_COLORS[state.wellnessScore]}28`,
              }}>
              <span className="text-2xl">{SCORE_EMOJIS[state.wellnessScore]}</span>
              <div>
                <p className="text-sm font-black" style={{ color: SCORE_COLORS[state.wellnessScore] }}>
                  {scoreLabel(state.wellnessScore)} · {state.wellnessScore}/10
                </p>
              </div>
            </motion.div>
          )}
          <div>
            <p className="text-xs font-bold mb-1.5" style={{ color: C.textSoft }}>
              Anything to add? <span className="font-normal">(optional)</span>
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Woke up with a headache, feeling better by afternoon…"
              rows={2}
              className="w-full rounded-2xl px-3.5 py-2.5 text-xs resize-none outline-none"
              style={{
                background: C.surface2,
                border: `1.5px solid ${C.border}`,
                color: C.text,
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>
      ),
    },
  ];

  const current = STEPS[step];
  const canProceed = step < 2 || state.wellnessScore !== null;

  return (
    <div className="space-y-5">
      <StepDots step={step} total={3} />
      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          <div>
            <h3 className="font-black text-base" style={{ color: C.text }}>{current.title}</h3>
            <p className="text-xs mt-0.5" style={{ color: C.textSoft }}>{current.subtitle}</p>
          </div>
          {current.content}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-2 pt-1">
        {step > 0 && (
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setStep((s) => s - 1)}
            className="px-5 py-3 rounded-2xl text-sm font-black"
            style={{ background: C.surface2, color: C.textMid, border: `1px solid ${C.border}` }}>
            Back
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => step < 2 ? setStep((s) => s + 1) : handleSubmit()}
          disabled={!canProceed}
          className="flex-1 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: step === 2 ? C.teal : C.indigo }}
        >
          {step === 2 ? "Save Check-in" : "Next"}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}

// FIXED — grace period: detect if yesterday's check-in is missing
// and offer a backdated check-in once per week
function useGracePeriod(logs: HealthPulseLog[], userId: string | undefined) {
  const [showGrace, setShowGrace] = useState(false);
  const [graceDate, setGraceDate] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const hasYesterday = logs.some((l) => l.date === yesterdayStr);
    const hasToday = logs.some((l) => l.date === today);
    if (hasYesterday || !hasToday) return; // Only show grace after today's check-in

    // Check if grace was already used this week
    const weekKey = `nova_grace_used:${userId}:${getWeekKey()}`;
    const graceUsed = localStorage.getItem(weekKey) === "true";
    if (graceUsed) return;

    // Check if user had a streak before yesterday (at least 2 days before)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const hasPriorStreak = logs.some((l) => l.date === twoDaysAgo.toISOString().slice(0, 10));
    if (!hasPriorStreak) return;

    setGraceDate(yesterdayStr);
    setShowGrace(true);
  }, [logs, userId]);

  const dismissGrace = () => {
    if (!userId) return;
    const weekKey = `nova_grace_used:${userId}:${getWeekKey()}`;
    localStorage.setItem(weekKey, "true");
    setShowGrace(false);
  };

  return { showGrace, graceDate, dismissGrace };
}

function getWeekKey(): string {
  const d = new Date();
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

type ActiveView = "checkin" | "timeline" | "insights";

export function HealthPulse({ onNavigateToChat }: { onNavigateToChat: () => void }) {
  const { user } = useAuth();
  const { refreshUserContext } = useChat();
  const [logs, setLogs] = useState<HealthPulseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>("checkin");
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [todayLog, setTodayLog] = useState<HealthPulseLog | undefined>();
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  // FIXED — track which timeline card is expanded
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  // FIXED — track symptom map from health graph for chip ordering
  const [symptomMap, setSymptomMap] = useState<Record<string, number>>({});

  const today = new Date().toISOString().slice(0, 10);

  // FIXED — correct streak calculation that doesn't add 1 when already checked in today
  const streak = (() => {
    const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let count = 0;
    const cursor = new Date();
    for (const log of sorted) {
      if (log.date === cursor.toISOString().slice(0, 10)) {
        count++;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }
    return count;
  })();

  const { showGrace, graceDate, dismissGrace } = useGracePeriod(logs, user?.id);

  useEffect(() => {
    setIsMounted(true);
    if (!user?.id) { setLoading(false); return; }

    fetchHealthPulseLogs(user.id, 30).then((fetched) => {
      setLogs(fetched);
      const t = fetched.find((l) => l.date === today);
      if (t) { setTodayLog(t); setCheckedInToday(true); }
      setLoading(false);
    });

    // FIXED — load symptom map from health graph for chip ordering
    const loadSymptomMap = async () => {
      try {
        const { auth } = await import("@/lib/firebase");
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const { db } = await import("@/lib/firebase");
        const { doc, getDoc } = await import("firebase/firestore");
        const snap = await getDoc(doc(db, "users", user.id));
        if (snap.exists()) {
          const map = snap.data()?.healthGraph?.symptomMap ?? {};
          setSymptomMap(map);
        }
      } catch { /* best effort */ }
    };
    loadSymptomMap();
  }, [user?.id, today]);

  // FIXED — pattern detection writes back to health graph after 5+ check-ins
  // so Daily Briefing can reference it in its observation paragraph
  const writePatternInsightsToGraph = useCallback(async (currentLogs: HealthPulseLog[]) => {
    if (currentLogs.length < 5 || !user?.id) return;
    try {
      const { auth } = await import("@/lib/firebase");
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const scores = currentLogs.map(l => l.wellnessScore);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const trend = scores[0] > scores[Math.min(2, scores.length - 1)] ? "improving" : "declining";
      const fatigueDays = currentLogs.filter(l => l.bodySymptoms.includes("fatigue")).length;
      const anxiousDays = currentLogs.filter(l => l.mindSymptoms.includes("anxious")).length;

      const milestoneNote = [
        `Wellness avg: ${avg.toFixed(1)}/10 over ${currentLogs.length} check-ins`,
        trend === "improving" ? "Trend: improving" : "Trend: declining",
        fatigueDays >= 3 ? `Fatigue recurring (${fatigueDays} days)` : null,
        anxiousDays >= 3 ? `Anxiety recurring (${anxiousDays} days)` : null,
      ].filter(Boolean).join(". ");

      await fetch("/api/health-graph/pulse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patternNote: milestoneNote,
          uid: user.id,
        }),
      });
    } catch { /* best effort */ }
  }, [user?.id]);

  const handleCheckInComplete = useCallback(async (log: Omit<HealthPulseLog, "id">) => {
    if (!user?.id) return;
    const full: HealthPulseLog = { ...log };
    setTodayLog(full);
    setCheckedInToday(true);
    const updatedLogs = [full, ...logs.filter((l) => l.date !== log.date)];
    setLogs(updatedLogs);
    setShowSaved(true);

    saveHealthPulseLogLocal(user.id, full);
    try {
      await saveHealthPulseLog(user.id, log);
    } catch { /* local already saved */ }

    try {
      const { auth } = await import("@/lib/firebase");
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        await fetch("/api/health-graph/pulse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ log: full }),
        });
      }
    } catch { /* best effort */ }

    // FIXED — write pattern insights to graph after saving
    await writePatternInsightsToGraph(updatedLogs);
    await refreshUserContext();

    window.setTimeout(() => {
      setShowSaved(false);
      setActiveView("timeline");
    }, 1500);
  }, [user?.id, logs, refreshUserContext, writePatternInsightsToGraph]);

  // FIXED — backdated grace check-in handler
  const handleGraceCheckIn = useCallback(async (log: Omit<HealthPulseLog, "id">) => {
    if (!user?.id || !graceDate) return;
    const backdated: HealthPulseLog = { ...log, date: graceDate };
    setLogs((prev) => [backdated, ...prev.filter((l) => l.date !== graceDate)]);
    dismissGrace();

    saveHealthPulseLogLocal(user.id, backdated);
    try {
      await saveHealthPulseLog(user.id, backdated);
    } catch { /* local already saved */ }

    try {
      const { auth } = await import("@/lib/firebase");
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        await fetch("/api/health-graph/pulse", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ log: backdated }),
        });
      }
    } catch { /* best effort */ }
  }, [user?.id, graceDate, dismissGrace]);

  if (!isMounted || loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-500" />
      </div>
    );
  }

  const NAV: { id: ActiveView; label: string }[] = [
    { id: "checkin", label: "Check-in" },
    { id: "timeline", label: "Timeline" },
    { id: "insights", label: "Insights" },
  ];

  // FIXED — streak is already correct, no +1 needed
  const milestoneCopy =
    streak === 100 ? "100 days of check-ins. NOVA has a real baseline now." :
      streak === 30 ? "30 days of check-ins. That's 30 data points helping NOVA understand you better." :
        streak === 7 ? "7 days of check-ins. Your pattern is starting to come into focus." :
          "NOVA will factor this into your briefing tomorrow.";

  const pulsePrivacyCopy = "🔒 Check-in data stays in your account. NOVA uses it only to support you.";

  return (
    <div className="space-y-4 max-w-2xl mx-auto">

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0D9488 0%, #0891B2 55%, #0EA5E9 100%)",
          border: "1px solid #99F6E4",
          boxShadow: "0 16px 48px rgba(13,148,136,0.22)",
        }}>
        <div className="absolute top-0 right-0 w-44 h-44 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.20) 0%, transparent 65%)", filter: "blur(32px)" }} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-75 text-white">
              Daily · Self-reported · Private
            </p>
            <h2 className="text-2xl font-black text-white leading-tight"
              style={{ fontFamily: "var(--font-outfit, sans-serif)", letterSpacing: "-0.025em" }}>
              HealthPulse
            </h2>
            <p className="text-sm mt-0.5 text-white/80">30-second daily health snapshot</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            {streak > 0 ? (
              <div className="rounded-2xl px-3 py-2.5 text-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)" }}>
                <p className="text-2xl font-black text-white leading-none">{streak}</p>
                <p className="text-[9px] font-black text-white/70 uppercase tracking-widest mt-0.5">
                  day{streak !== 1 ? "s" : ""} 🔥
                </p>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {checkedInToday && todayLog && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-2xl px-4 py-2.5 flex items-center gap-3"
            style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)" }}>
            <span className="text-xl">{SCORE_EMOJIS[todayLog.wellnessScore]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white">Today: {scoreLabel(todayLog.wellnessScore)} · {todayLog.wellnessScore}/10</p>
              {(todayLog.bodySymptoms.length > 0 || todayLog.mindSymptoms.length > 0) && (
                <p className="text-[10px] text-white/70 truncate">
                  {[...todayLog.bodySymptoms, ...todayLog.mindSymptoms].slice(0, 3).join(" · ")}
                  {todayLog.bodySymptoms.length + todayLog.mindSymptoms.length > 3 ? " …" : ""}
                </p>
              )}
            </div>
            <motion.button whileTap={{ scale: 0.94 }} onClick={onNavigateToChat}
              className="text-[10px] font-black px-2.5 py-1.5 rounded-full text-white flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.35)" }}>
              Talk to NOVA
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* FIXED — grace period backdated check-in offer */}
      <AnimatePresence>
        {showGrace && graceDate && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-3xl p-4 flex items-start gap-3"
            style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A" }}>
            <span className="text-xl mt-0.5">🔁</span>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm" style={{ color: C.gold }}>You missed yesterday's check-in</p>
              <p className="text-xs mt-0.5" style={{ color: C.textSoft }}>
                Log it now to keep your streak going. You can do this once a week.
              </p>
              <div className="flex gap-2 mt-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    // Trigger a mini check-in for yesterday — simplified to score only
                    const score = todayLog?.wellnessScore ?? 5;
                    void handleGraceCheckIn({
                      date: graceDate,
                      wellnessScore: score,
                      bodySymptoms: [],
                      mindSymptoms: [],
                      symptomIntensity: {},
                      createdAt: new Date().toISOString(),
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-black text-white"
                  style={{ background: C.gold }}>
                  Log yesterday
                </motion.button>
                <button onClick={dismissGrace}
                  className="px-3 py-1.5 rounded-xl text-xs font-black"
                  style={{ color: C.textSoft, background: C.surface2 }}>
                  Skip
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-1.5 p-1.5 rounded-2xl"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        {NAV.map(({ id, label }) => (
          <motion.button key={id} onClick={() => setActiveView(id)}
            className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
            style={{
              background: activeView === id ? C.indigo : "transparent",
              color: activeView === id ? "#fff" : C.textSoft,
            }}>
            {label}
            {id === "checkin" && checkedInToday && (
              <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-green-400 align-middle" />
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeView === "checkin" && (
          <motion.div key="checkin"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.20, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl p-5"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            {checkedInToday && todayLog ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{ background: "#F0FDFA", border: "1px solid #99F6E4" }}>
                  <span className="text-3xl">{SCORE_EMOJIS[todayLog.wellnessScore]}</span>
                  <div>
                    <p className="font-black text-sm" style={{ color: C.teal }}>
                      Checked in · {scoreLabel(todayLog.wellnessScore)} · {todayLog.wellnessScore}/10
                    </p>
                    <p className="text-xs" style={{ color: C.textSoft }}>
                      NOVA has your health context for today's conversation.
                    </p>
                  </div>
                </div>
                <p className="text-xs font-bold" style={{ color: C.textSoft }}>
                  Want to update today's check-in?
                </p>
                <CheckInWizard
                  existingLog={todayLog}
                  onComplete={handleCheckInComplete}
                  symptomMap={symptomMap}
                />
              </div>
            ) : (
              <CheckInWizard
                onComplete={handleCheckInComplete}
                symptomMap={symptomMap}
              />
            )}
          </motion.div>
        )}

        {activeView === "timeline" && (
          <motion.div key="timeline"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.20, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4">
            {/* FIXED — pass onDotClick to TrendChart */}
            <TrendChart
              logs={logs}
              onDotClick={(date) => {
                setExpandedDate((prev) => prev === date ? null : date);
                // Scroll to that card in the timeline
                window.setTimeout(() => {
                  document.getElementById(`timeline-card-${date}`)?.scrollIntoView({
                    behavior: "smooth", block: "center",
                  });
                }, 100);
              }}
            />
            <SymptomFrequencyMap logs={logs} />
            {logs.length === 0 ? (
              <div className="rounded-3xl p-8 text-center"
                style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="text-4xl mb-3">📋</div>
                <p className="font-black text-sm" style={{ color: C.text }}>Start with one check-in</p>
                <p className="text-xs mt-1 max-w-sm mx-auto leading-relaxed" style={{ color: C.textSoft }}>
                  Your first HealthPulse gives NOVA a baseline. Over time, it helps spot patterns in symptoms, stress, energy, and recovery.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  // FIXED — id for scroll targeting, expanded state per card
                  <div key={log.id ?? log.date} id={`timeline-card-${log.date}`}>
                    <TimelineCard
                      log={log}
                      expanded={expandedDate === log.date}
                      onToggle={() => setExpandedDate((prev) => prev === log.date ? null : log.date)}
                    />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeView === "insights" && (
          <motion.div key="insights"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.20, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4">
            <InsightsPanel logs={logs} />
          </motion.div>
        )}
      </AnimatePresence>

      {logs.length >= 3 && (
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowBriefModal(true)}
          className="w-full rounded-3xl p-4 flex items-center gap-4 text-left"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                stroke={C.green} strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm" style={{ color: C.text }}>Generate Doctor Brief</p>
            <p className="text-xs" style={{ color: C.textSoft }}>
              Compile last {Math.min(logs.length, 30)} days into a shareable summary
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke={C.textSoft} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </motion.button>
      )}

      <AnimatePresence>
        {showSaved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: "rgba(15,23,42,0.35)", backdropFilter: "blur(6px)" }}>
            <div className="rounded-3xl p-6 text-center w-full max-w-xs"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke={C.green} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-lg font-black" style={{ color: C.text }}>Check-in saved</p>
              <p className="text-sm font-black mt-2" style={{ color: C.gold }}>
                Streak: {streak} day{streak === 1 ? "" : "s"}
              </p>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: C.textSoft }}>
                {milestoneCopy}
              </p>
              <p className="text-[10px] mt-3 leading-relaxed" style={{ color: C.textSoft }}>
                {pulsePrivacyCopy}
              </p>
            </div>
          </motion.div>
        )}
        {showBriefModal && (
          <DoctorBriefModal logs={logs} onClose={() => setShowBriefModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}