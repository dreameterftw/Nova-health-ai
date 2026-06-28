"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { LOGO_URL } from "@/lib/constants";
import { saveMoodLog, saveMoodLogLocal, fetchMoodLogs, fetchHealthPulseLogs, fetchVaultSummaries } from "@/lib/activityStore";
import type { MoodLog } from "@/lib/userContext";
import { Activity, Check, FileText, MessageCircle, Pill, TrendingUp } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

// FIXED — import Firestore client for real-time listeners
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const C = {
  bg: "#F8F9FC",
  surface: "#FFFFFF",
  surface2: "#F1F3F8",
  surface3: "#E8ECF4",
  border: "#E2E8F0",
  borderMid: "#C6CEDF",
  indigo: "#5B5EF4",
  indigoDark: "#4338CA",
  indigoLight: "#A5B4FC",
  gold: "#D97706",
  goldDark: "#B45309",
  goldLight: "#F59E0B",
  rose: "#E11D48",
  text: "#0F172A",
  textMid: "#334155",
  textSoft: "#64748B",
  teal: "#0D9488",
};

const MOODS = [
  { score: 1, emoji: "😞", label: "Very Low", color: "#BE123C", bg: "#FFF1F2" },
  { score: 2, emoji: "😟", label: "Low", color: "#C2410C", bg: "#FFF7ED" },
  { score: 3, emoji: "😕", label: "Low", color: "#B45309", bg: "#FFFBEB" },
  { score: 4, emoji: "😐", label: "Meh", color: "#92400E", bg: "#FFFBEB" },
  { score: 5, emoji: "🙂", label: "Okay", color: "#D97706", bg: "#FFFBEB" },
  { score: 6, emoji: "😊", label: "Good", color: "#F59E0B", bg: "#FFFBEB" },
  { score: 7, emoji: "😄", label: "Great", color: "#FBBF24", bg: "#FFFBEB" },
  { score: 8, emoji: "😁", label: "Excellent", color: "#5B5EF4", bg: "#EEF2FF" },
  { score: 9, emoji: "🤩", label: "Excellent", color: "#4338CA", bg: "#EEF2FF" },
  { score: 10, emoji: "🌟", label: "Radiant", color: "#3730A3", bg: "#EEF2FF" },
];

function getTimeGradient(hour: number) {
  if (hour < 6) return { from: "#312E81", via: "#4C1D95", angle: 145, label: "Late Night" };
  if (hour < 12) return { from: "#1D4ED8", via: "#4338CA", angle: 135, label: "Morning" };
  if (hour < 17) return { from: "#2563EB", via: "#4F46E5", angle: 140, label: "Afternoon" };
  if (hour < 20) return { from: "#4338CA", via: "#6D28D9", angle: 135, label: "Evening" };
  return { from: "#312E81", via: "#4C1D95", angle: 150, label: "Night" };
}

function QuickCard({ id, label, sub, color, accent, Icon, onClick }: {
  id: string; label: string; sub: string; color: string; accent: string;
  Icon: React.ReactNode; onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="rounded-3xl p-4 text-left relative overflow-hidden group flex flex-col"
      style={{ background: C.surface, border: `1.5px solid ${C.border}` }}>
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 70% 70% at 0% 100%, ${color}12 0%, transparent 70%)` }} />
      <div className="w-9 h-9 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
        style={{ background: accent, border: `1.5px solid ${color}28` }}>
        {Icon}
      </div>
      <p className="font-black text-sm leading-tight mb-0.5" style={{ color: C.text }}>{label}</p>
      <p className="text-[11px] leading-snug" style={{ color: C.textSoft }}>{sub}</p>
    </motion.button>
  );
}

function buildChartDays(moodLogs: MoodLog[]): { day: string; score: number | null }[] {
  const days: { day: string; score: number | null }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const log = moodLogs.find((m) => m.date === dateStr);
    days.push({ day: label, score: log?.score ?? null });
  }
  return days;
}

function getTodayLabel() {
  return new Date().toLocaleDateString("en-US", { weekday: "short" });
}

function MoodTrendTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) {
  if (!active || !payload?.length || payload[0].value == null) return null;
  const score = payload[0].value as number;
  const mood = MOODS[Math.min(Math.round(score) - 1, 9)];
  return (
    <div className="rounded-2xl px-3.5 py-2.5 shadow-xl"
      style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", minWidth: 110 }}>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none">{mood?.emoji}</span>
        <div>
          <p className="text-base font-black leading-none" style={{ color: mood?.color }}>
            {score}<span className="text-xs font-semibold text-slate-400">/10</span>
          </p>
          <p className="text-[10px] font-semibold" style={{ color: "#64748B" }}>{mood?.label}</p>
        </div>
      </div>
    </div>
  );
}

function MoodTrendGraph({ moodLogs, checkedIn, todayScore }: {
  moodLogs: MoodLog[]; checkedIn: boolean; todayScore: number | null;
}) {
  const todayLabel = getTodayLabel();
  const today = new Date().toISOString().slice(0, 10);
  const chartData = buildChartDays(moodLogs).map((d, i) => {
    const isToday = i === 6;
    if (isToday && checkedIn && todayScore !== null) return { day: todayLabel, score: todayScore };
    if (isToday && !moodLogs.find((m) => m.date === today)) return { day: todayLabel, score: null };
    return d;
  });

  const hasAnyData = chartData.some(d => d.score !== null);
  const data = chartData.map(d => ({ day: d.day, score: d.score ?? undefined }));
  const avg = hasAnyData
    ? Math.round(chartData.filter(d => d.score !== null).reduce((a, b) => a + (b.score ?? 0), 0) /
      chartData.filter(d => d.score !== null).length)
    : null;

  const logged = chartData.filter(d => d.score !== null);
  const trend = logged.length >= 2
    ? (logged[logged.length - 1].score ?? 0) - (logged[logged.length - 2].score ?? 0)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
      className="rounded-3xl overflow-hidden"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}>

      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="#5B5EF4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h3 className="font-black text-sm" style={{ color: C.text }}>Mood Trend</h3>
            <p className="text-[10px]" style={{ color: C.textSoft }}>Last 7 days</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {avg !== null && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
              <span className="text-[10px] font-black" style={{ color: "#4338CA" }}>avg {avg}/10</span>
            </div>
          )}
          {logged.length >= 2 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{
                background: trend >= 0 ? "#EEF2FF" : "#FFF1F2",
                border: `1px solid ${trend >= 0 ? "#C7D2FE" : "#FECDD3"}`,
              }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                <path d={trend >= 0 ? "M12 19V5M5 12l7-7 7 7" : "M12 5v14M5 12l7 7 7-7"}
                  stroke={trend >= 0 ? C.indigo : "#E11D48"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[10px] font-black" style={{ color: trend >= 0 ? C.indigo : "#E11D48" }}>
                {trend >= 0 ? "+" : ""}{trend}
              </span>
            </div>
          )}
        </div>
      </div>

      {hasAnyData ? (
        <div className="px-2 pb-4" style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5B5EF4" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#5B5EF4" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#F1F5F9" strokeDasharray="0" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fontWeight: 700, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tick={{ fontSize: 9, fill: "#CBD5E1" }} axisLine={false} tickLine={false} />
              {avg !== null && <ReferenceLine y={avg} stroke="#C7D2FE" strokeDasharray="4 3" strokeWidth={1.5} />}
              <Tooltip content={<MoodTrendTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />
              <Area
                type="monotone" dataKey="score" stroke="#5B5EF4" strokeWidth={2.5}
                fill="url(#moodGrad)"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.score == null) return <g key={`dot-${cx}`} />;
                  const mood = MOODS[Math.min(Math.round(payload.score) - 1, 9)];
                  const isToday = payload.day === todayLabel;
                  return (
                    <circle key={`dot-${cx}`} cx={cx} cy={cy} r={isToday ? 5 : 4}
                      fill={mood?.color || "#5B5EF4"} stroke="white" strokeWidth={2} />
                  );
                }}
                activeDot={{ r: 6, fill: "#5B5EF4", stroke: "white", strokeWidth: 2 }}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="px-5 pb-6 flex flex-col items-center gap-2 text-center">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-1"
            style={{ background: "#F1F5F9", border: "1px solid #E2E8F0" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm font-bold" style={{ color: C.textMid }}>No mood data yet</p>
          <p className="text-xs" style={{ color: C.textSoft }}>Complete your daily check-in to start tracking your trend</p>
        </div>
      )}

      {hasAnyData && (
        <div className="flex justify-around px-5 pb-4 pt-0 border-t" style={{ borderColor: "#F1F5F9" }}>
          {chartData.map((d) => {
            const isToday = d.day === todayLabel;
            const mood = d.score !== null ? MOODS[Math.min(Math.round(d.score) - 1, 9)] : null;
            return (
              <div key={d.day} className="flex flex-col items-center gap-1 pt-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                  style={{
                    background: mood ? `${mood.color}18` : "#F1F5F9",
                    border: `1.5px solid ${isToday ? "#5B5EF4" : mood ? `${mood.color}40` : "#E2E8F0"}`,
                    fontFamily: "sans-serif",
                  }}>
                  {mood ? mood.emoji : "·"}
                </div>
                <span className="text-[9px] font-bold"
                  style={{ color: isToday ? "#5B5EF4" : "#94A3B8" }}>
                  {isToday ? "Today" : d.day}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

type ActiveTab = "home" | "chat" | "pulse" | "vault" | "recovery" | "journal" | "profile" | "resources" | "emotion" | "medicine";

type TimeGrad = { from: string; via: string; angle: number; label: string };

type BriefingItem = {
  icon: string;
  text: string;
  action?: string;
  actionTab?: ActiveTab;
  accent: string;
  dot?: string;
};

type DailyBriefing = {
  date: string;
  greeting: string;
  observation: string;
  pills: {
    id: string;
    icon: string;
    label: string;
    value: string;
    detail: string;
    trend?: "up" | "down" | "flat" | "alert";
    actionTab: ActiveTab;
  }[];
  actions: {
    id: string;
    label: string;
    detail: string;
    actionTab: ActiveTab;
  }[];
};

function BriefingIcon({ name, trend }: {
  name: string; trend?: DailyBriefing["pills"][number]["trend"];
}) {
  const color =
    trend === "up" ? "#10B981" :
      trend === "down" || trend === "alert" ? "#F43F5E" :
        name === "pill" ? "#7C3AED" :
          name === "document" ? C.gold :
            C.teal;
  const common = { size: 16, strokeWidth: 2.2, color };
  if (name === "pill") return <Pill {...common} />;
  if (name === "document") return <FileText {...common} />;
  if (name === "pulse") return <Activity {...common} />;
  return <TrendingUp {...common} />;
}

function buildBriefingItems(opts: {
  moodData: (typeof MOODS)[0] | null;
  checkedIn: boolean;
  pulsedToday: boolean;
  pulseStreak: number;
  medications: string[];
  vaultCount: number;
}): BriefingItem[] {
  const items: BriefingItem[] = [];
  const { moodData, checkedIn, pulsedToday, pulseStreak, medications, vaultCount } = opts;

  if (checkedIn && moodData) {
    const score = moodData.score;
    const trendIcon = score >= 7 ? "↑" : score >= 5 ? "→" : "↓";
    const trendColor = score >= 7 ? "#10B981" : score >= 5 ? "#D97706" : "#F43F5E";
    items.push({
      icon: score >= 7 ? "✨" : score >= 5 ? "🙂" : "💙",
      text: `Wellness ${trendIcon} ${moodData.label} today — ${score}/10`,
      accent: trendColor,
    });
  }

  if (medications.length > 0) {
    const hour = new Date().getHours();
    const timeHint = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    items.push({
      icon: "💊",
      text: `${medications[0]}${medications.length > 1 ? ` +${medications.length - 1} more` : ""} — ${timeHint} dose`,
      accent: "#7C3AED",
      dot: "#7C3AED",
    });
  }

  if (!pulsedToday) {
    items.push({
      icon: "📋",
      text: "HealthPulse not logged yet today",
      action: "Log now",
      actionTab: "pulse" as ActiveTab,
      accent: "#0D9488",
    });
  }

  if (pulseStreak >= 3) {
    items.push({
      icon: "🔥",
      text: `${pulseStreak}-day check-in streak — keep it going`,
      accent: "#D97706",
    });
  }

  if (vaultCount > 0) {
    items.push({
      icon: "📁",
      text: `${vaultCount} report${vaultCount !== 1 ? "s" : ""} in vault — ask NOVA about your latest results`,
      action: "View vault",
      actionTab: "vault" as ActiveTab,
      accent: "#5B5EF4",
    });
  }

  return items;
}

function DailyBriefingCard({
  firstName, greeting, dateLabel, timeGrad,
  checkedIn, moodData, selectedMood, pulseStreak, pulsedToday,
  medications, vaultCount, onNavigate, onSOS, briefing, completedActions, onToggleAction,
}: {
  firstName: string;
  greeting: string;
  dateLabel: string;
  timeGrad: TimeGrad;
  checkedIn: boolean;
  moodData: (typeof MOODS)[0] | null;
  selectedMood: number | null;
  pulseStreak: number;
  pulsedToday: boolean;
  medications: string[];
  vaultCount: number;
  onNavigate: (tab: ActiveTab) => void;
  onSOS: () => void;
  briefing: DailyBriefing | null;
  completedActions: string[];
  onToggleAction: (id: string) => void;
}) {
  const briefingItems = buildBriefingItems({ moodData, checkedIn, pulsedToday, pulseStreak, medications, vaultCount });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden relative"
      style={{
        background: `linear-gradient(${timeGrad.angle}deg, ${timeGrad.from} 0%, ${timeGrad.via} 55%, #6366F1 100%)`,
        border: "1px solid rgba(91,94,244,0.18)",
        boxShadow: "0 20px 56px rgba(91,94,244,0.20)",
      }}>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute" style={{ top: -60, right: -60, width: 220, height: 220, background: "radial-gradient(circle, rgba(91,94,244,0.30) 0%, transparent 65%)", filter: "blur(40px)" }} />
        <div className="absolute" style={{ bottom: -40, left: 20, width: 160, height: 160, background: "radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 65%)", filter: "blur(30px)" }} />
      </div>

      <div className="relative z-10 p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-base text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.10))", border: "1.5px solid rgba(255,255,255,0.24)", backdropFilter: "blur(8px)" }}>
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.55)" }}>
                {timeGrad.label}
              </p>
              <p className="text-lg font-black text-white leading-tight" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
                {briefing?.greeting || `${greeting}, ${firstName}`}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[11px] font-bold text-white opacity-80">{dateLabel}</p>
            <div className="flex items-center gap-1.5 justify-end mt-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4ADE80", boxShadow: "0 0 6px rgba(74,222,128,0.9)" }} />
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.55)" }}>NOVA active</span>
            </div>
          </div>
        </div>

        {briefing?.pills?.length ? (
          <div className="grid gap-2 mb-4">
            {briefing.pills.map((pill) => (
              <button
                key={pill.id}
                onClick={() => onNavigate(pill.actionTab)}
                className="w-full rounded-2xl px-3.5 py-3 text-left flex items-center gap-3"
                style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)" }}>
                <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.92)" }}>
                  <BriefingIcon name={pill.icon} trend={pill.trend} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-white/50">{pill.label}</span>
                  <span className="block text-sm font-black text-white leading-tight capitalize">{pill.value}</span>
                  <span className="block text-[11px] text-white/65 truncate">{pill.detail}</span>
                </span>
              </button>
            ))}
          </div>
        ) : briefingItems.length > 0 && (
          <div className="rounded-2xl mb-4 overflow-hidden divide-y divide-white/10"
            style={{ background: "rgba(0,0,0,0.22)", borderColor: "rgba(255,255,255,0.10)" }}>
            {briefingItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-3.5 py-2.5">
                <span className="text-sm leading-none flex-shrink-0">{item.icon}</span>
                <p className="flex-1 text-[11px] font-semibold text-white/80 leading-snug">{item.text}</p>
                {item.action && item.actionTab && (
                  <button
                    onClick={() => onNavigate(item.actionTab!)}
                    className="text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: `${item.accent}35`, color: "white", border: `1px solid ${item.accent}55` }}>
                    {item.action}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {briefing?.observation && (
          <div className="rounded-2xl p-4 mb-4"
            style={{ background: "rgba(255,255,255,0.92)", border: "1px solid rgba(255,255,255,0.35)" }}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: C.indigoDark }}>
              NOVA noticed
            </p>
            <p className="text-sm leading-relaxed font-semibold" style={{ color: C.textMid }}>
              {briefing.observation}
            </p>
            <button
              onClick={() => onNavigate("chat")}
              className="mt-3 text-xs font-black rounded-full px-3 py-2 text-white inline-flex items-center gap-2"
              style={{ background: C.indigo }}>
              <MessageCircle size={13} />
              Talk to NOVA about this
            </button>
          </div>
        )}

        {briefing?.actions?.length ? (
          <div className="rounded-2xl mb-4 overflow-hidden"
            style={{ background: "rgba(0,0,0,0.20)", border: "1px solid rgba(255,255,255,0.10)" }}>
            {briefing.actions.map((action) => {
              const done = completedActions.includes(action.id);
              return (
                <div key={action.id} className="flex items-center gap-3 px-3.5 py-2.5 border-b border-white/10 last:border-b-0">
                  <button
                    onClick={() => onToggleAction(action.id)}
                    className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{
                      background: done ? "#10B981" : "rgba(255,255,255,0.12)",
                      border: `1px solid ${done ? "#34D399" : "rgba(255,255,255,0.26)"}`,
                    }}>
                    {done && <Check size={13} color="white" strokeWidth={3} />}
                  </button>
                  <button onClick={() => onNavigate(action.actionTab)} className="flex-1 min-w-0 text-left">
                    <span className={`block text-[12px] font-black text-white leading-tight ${done ? "line-through opacity-60" : ""}`}>
                      {action.label}
                    </span>
                    <span className="block text-[10px] text-white/55 truncate">{action.detail}</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "MOOD", value: checkedIn && moodData ? moodData.score.toString() : "—", unit: checkedIn ? "/10" : "tap ↓" },
            { label: "STREAK", value: pulseStreak > 0 ? pulseStreak.toString() : "0", unit: "day streak" },
            { label: "PULSE", value: pulsedToday ? "✓" : "—", unit: pulsedToday ? "logged" : "pending" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl px-2 py-2.5 text-center"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.22)", backdropFilter: "blur(8px)" }}>
              <p className="text-[7px] font-black uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.50)" }}>{s.label}</p>
              <p className="text-lg font-black text-white leading-none mb-0.5" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>{s.value}</p>
              <p className="text-[7px]" style={{ color: "rgba(255,255,255,0.45)" }}>{s.unit}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2.5">
          <motion.button whileTap={{ scale: 0.96 }} onClick={onSOS}
            className="flex-1 rounded-2xl py-2.5 text-sm font-black text-white flex items-center justify-center gap-2"
            style={{ background: "rgba(244,63,94,0.32)", border: "1.5px solid rgba(244,63,94,0.50)" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="rgba(244,63,94,0.50)" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 9v4M12 17h.01" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Emergency
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => onNavigate("chat")}
            className="flex-1 rounded-2xl py-2.5 text-sm font-black flex items-center justify-center gap-2"
            style={{ background: "rgba(255,255,255,0.95)", color: C.indigoDark }}>
            Talk to NOVA
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export function DashboardHome({
  onNavigate,
  onSOS,
}: {
  onNavigate: (tab: ActiveTab) => void;
  onSOS: () => void;
}) {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [pulseStreak, setPulseStreak] = useState(0);
  const [pulsedToday, setPulsedToday] = useState(false);
  const [vaultCount, setVaultCount] = useState(0);
  const [dailyBriefing, setDailyBriefing] = useState<DailyBriefing | null>(null);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [greeting] = useState(() => {
    const h = new Date().getHours();
    return h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  });
  const [timeGrad] = useState(() => getTimeGradient(new Date().getHours()));
  const [tipIndex, setTipIndex] = useState(0);
  const [dateLabel] = useState(() =>
    new Date().toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })
  );
  const [isMounted, setIsMounted] = useState(false);

  const TIPS = [
    "NOVA suggests: Anulom Vilom pranayama for 10 minutes daily lowers cortisol and improves lung capacity.",
    "NOVA reminds you: 15 minutes of morning sun (before 9 AM) helps boost your Vitamin D levels.",
    "NOVA recommends: The 4-7-8 breath technique activates your parasympathetic system within 60 seconds.",
    "NOVA notes: Ragi (finger millet) is a nutrient-dense superfood with a low glycaemic index.",
    "NOVA advises: A 10-minute walk after meals can reduce post-meal blood glucose spikes by up to 30%.",
  ];

  useEffect(() => {
    setIsMounted(true);
    const t = setInterval(() => setTipIndex(i => (i + 1) % TIPS.length), 12000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetchMoodLogs(user.id, 14).then((logs) => {
      setMoodLogs(logs);
      const today = new Date().toISOString().slice(0, 10);
      const todayLog = logs.find((m) => m.date === today);
      if (todayLog) {
        setSelectedMood(todayLog.score);
        setCheckedIn(true);
      }
    });
    fetchHealthPulseLogs(user.id, 30).then((pulseLogs) => {
      const today = new Date().toISOString().slice(0, 10);
      setPulsedToday(pulseLogs.some((l) => l.date === today));
      const sorted = [...pulseLogs].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      let streak = 0;
      const cursor = new Date();
      for (const log of sorted) {
        if (log.date === cursor.toISOString().slice(0, 10)) {
          streak++;
          cursor.setDate(cursor.getDate() - 1);
        } else break;
      }
      setPulseStreak(streak);
    });
    fetchVaultSummaries(user.id, 20).then((summaries) => {
      setVaultCount(summaries.length);
    });
  }, [user?.id]);

  // FIXED — real-time Firestore listener on health graph
  // Pills and streak update immediately when HealthPulse or Vault writes new data
  useEffect(() => {
    if (!user?.id) return;

    const userDocRef = doc(db, "users", user.id);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      const graph = data?.healthGraph;
      if (!graph) return;

      // Update pulse streak from graph in real time
      const scores: { date: string; score: number }[] = graph.wellnessScores ?? [];
      const sorted = [...scores].sort((a, b) => b.date.localeCompare(a.date));
      const today = new Date().toISOString().slice(0, 10);

      let streak = 0;
      const cursor = new Date();
      for (const entry of sorted) {
        if (entry.date === cursor.toISOString().slice(0, 10)) {
          streak++;
          cursor.setDate(cursor.getDate() - 1);
        } else break;
      }
      setPulseStreak(streak);
      setPulsedToday(sorted[0]?.date === today);

      // Update vault count from graph documents in real time
      // FIXED — only count undiscussed documents for the pending pill
      const documents: { discussedWithNOVA?: boolean }[] = graph.documents ?? [];
      const undiscussedCount = documents.filter((d) => !d.discussedWithNOVA).length;
      setVaultCount(undiscussedCount);
    }, (error) => {
      console.error("[NOVA] Health graph listener error:", error);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // FIXED — load completed actions from Firestore session doc, not localStorage
  // Falls back to localStorage for offline resilience
  useEffect(() => {
    if (!user?.id) return;
    const today = new Date().toISOString().slice(0, 10);

    const loadCompletedActions = async () => {
      try {
        const { auth } = await import("@/lib/firebase");
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          // Offline fallback
          const key = `nova_daily_briefing_done:${user.id}:${today}`;
          try { setCompletedActions(JSON.parse(localStorage.getItem(key) || "[]")); } catch { /* ignore */ }
          return;
        }

        // Read from Firestore session doc via client SDK
        const { getDoc } = await import("firebase/firestore");
        const sessionRef = doc(db, "users", user.id, "sessions", `dailyBriefing-${today}`);
        const sessionSnap = await getDoc(sessionRef);
        if (sessionSnap.exists()) {
          const data = sessionSnap.data();
          setCompletedActions(Array.isArray(data?.completedActions) ? data.completedActions : []);
        }
      } catch {
        const key = `nova_daily_briefing_done:${user.id}:${today}`;
        try { setCompletedActions(JSON.parse(localStorage.getItem(key) || "[]")); } catch { /* ignore */ }
      }
    };

    loadCompletedActions();
  }, [user?.id]);

  // FIXED — fetch briefing with proper auth token guard
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const fetchBriefing = async () => {
      try {
        const { auth } = await import("@/lib/firebase");
        // FIXED — wait for auth to be ready before fetching
        const token = await auth.currentUser?.getIdToken(true);
        if (!token || cancelled) return;

        const response = await fetch("/api/daily-briefing", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userName: user.name }),
        });
        if (!response.ok || cancelled) return;
        const data = await response.json();
        if (!cancelled && data?.briefing) {
          setDailyBriefing(data.briefing as DailyBriefing);
        }
      } catch {
        // Deterministic local dashboard remains usable if briefing fails
      }
    };

    fetchBriefing();
    return () => { cancelled = true; };
  }, [user?.id, user?.name]);

  // FIXED — persist completed actions to Firestore session doc
  const toggleBriefingAction = useCallback(async (id: string) => {
    if (!user?.id) return;
    const today = new Date().toISOString().slice(0, 10);

    setCompletedActions((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];

      // Write to Firestore session doc
      const persist = async () => {
        try {
          const { setDoc } = await import("firebase/firestore");
          const sessionRef = doc(db, "users", user.id, "sessions", `dailyBriefing-${today}`);
          await setDoc(sessionRef, { completedActions: next }, { merge: true });
        } catch {
          // Fallback to localStorage
          const key = `nova_daily_briefing_done:${user.id}:${today}`;
          try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
        }
      };
      void persist();
      return next;
    });
  }, [user?.id]);

  const handleMoodCheckIn = async () => {
    if (selectedMood === null || !user?.id) {
      setCheckedIn(true);
      return;
    }
    const moodData = MOODS[selectedMood - 1];
    const today = new Date().toISOString().slice(0, 10);
    const log: MoodLog = { score: selectedMood, label: moodData.label, date: today };
    setCheckedIn(true);
    setMoodLogs((prev) => [log, ...prev.filter((m) => m.date !== today)]);
    saveMoodLogLocal(user.id, log);
    try {
      await saveMoodLog(user.id, log);
    } catch {
      // local backup already saved
    }
  };

  if (!isMounted) return null;

  const firstName = (user?.name || "there").split(" ")[0];
  const moodData = selectedMood !== null ? MOODS[selectedMood - 1] : null;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">

      <DailyBriefingCard
        firstName={firstName}
        greeting={greeting}
        dateLabel={dateLabel}
        timeGrad={timeGrad}
        checkedIn={checkedIn}
        moodData={moodData}
        selectedMood={selectedMood}
        pulseStreak={pulseStreak}
        pulsedToday={pulsedToday}
        medications={user?.medications ?? []}
        vaultCount={vaultCount}
        onNavigate={onNavigate}
        onSOS={onSOS}
        briefing={dailyBriefing}
        completedActions={completedActions}
        onToggleAction={toggleBriefingAction}
      />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
        className="rounded-3xl overflow-hidden"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}>

        <AnimatePresence mode="wait">
          {checkedIn && moodData ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="p-6 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-3xl flex items-center justify-center text-3xl"
                style={{ background: moodData.bg, border: `1.5px solid ${moodData.color}35` }}>
                {moodData.emoji}
              </div>
              <div>
                <p className="font-black text-base" style={{ color: C.text }}>
                  Checked in — <span style={{ color: moodData.color }}>{moodData.label}</span>
                </p>
                <p className="text-sm mt-1" style={{ color: C.textSoft }}>
                  You rated <strong style={{ color: moodData.color }}>{moodData.score}/10</strong>. NOVA has noted your state today.
                </p>
              </div>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => onNavigate("chat")}
                className="mt-1 px-6 py-2.5 rounded-full text-sm font-black text-white btn-primary press-feedback">
                Talk to NOVA about it
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                    style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                        stroke={C.indigoLight} strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-black text-sm" style={{ color: C.text }}>Daily Check-in</h3>
                    <p className="text-[10px]" style={{ color: C.textSoft }}>How are you feeling today?</p>
                  </div>
                </div>
                <div className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "#EEF2FF", color: "#4338CA", border: "1px solid #C7D2FE" }}>
                  {dateLabel.split(",")[0] || ""}
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {MOODS.map((m) => {
                  const sel = selectedMood === m.score;
                  return (
                    <motion.button key={m.score}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => setSelectedMood(m.score)}
                      className="flex flex-col items-center gap-1 rounded-2xl transition-all py-2.5"
                      style={{
                        background: sel ? m.bg : "#F1F5F9",
                        border: `2px solid ${sel ? m.color : "#E2E8F0"}`,
                        boxShadow: sel ? `0 4px 12px ${m.color}22` : "none",
                      }}>
                      <span className="text-lg leading-none">{m.emoji}</span>
                      <span className="text-[9px] font-black leading-none text-center" style={{ color: sel ? m.color : C.textSoft }}>
                        {m.score}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {selectedMood !== null && (
                  <motion.button
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleMoodCheckIn}
                    className="w-full mt-3 py-3 rounded-2xl text-sm font-black text-white btn-primary press-feedback">
                    Log {moodData?.emoji} {moodData?.label} — {selectedMood}/10
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <MoodTrendGraph moodLogs={moodLogs} checkedIn={checkedIn} todayScore={selectedMood} />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <p className="label-xs mb-3 px-1" style={{ color: C.textSoft }}>Quick access</p>
        <div className="grid grid-cols-2 gap-3">
          <QuickCard id="chat" label="Talk to NOVA" sub="Wellness conversation" color={C.indigo} accent="#EEF2FF"
            Icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={C.indigo} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            onClick={() => onNavigate("chat")} />
          <QuickCard id="pulse" label="HealthPulse" sub={pulsedToday ? "Today logged ✓" : "30-sec check-in"} color={C.teal} accent="#F0FDFA"
            Icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={C.teal} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            onClick={() => onNavigate("pulse")} />
          <QuickCard id="vault" label="Upload Report" sub="Parse medical docs" color={C.gold} accent="#FFFBEB"
            Icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" stroke={C.gold} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            onClick={() => onNavigate("vault")} />
          <QuickCard id="journal" label="Health Journal" sub="Mental & physical reflections" color={C.teal} accent="#F0FDFA"
            Icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={C.teal} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke={C.teal} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            onClick={() => onNavigate("journal")} />
          <QuickCard id="medicine" label="Meds Tracker" sub="Log & track medications" color={C.indigo} accent="#EEF2FF"
            Icon={<Pill size={16} color={C.indigo} strokeWidth={2.2} />}
            onClick={() => onNavigate("medicine")} />
          <QuickCard id="resources" label="Health Resources" sub="Verified Indian health resources" color={C.indigo} accent="#EEF2FF"
            Icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={C.indigo} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke={C.indigo} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            onClick={() => onNavigate("resources")} />
        </div>
      </motion.div>

      <AnimatePresence>
        {!pulsedToday && (
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-3xl p-4 flex items-center gap-4"
            style={{ background: "#F0FDFA", border: "1.5px solid #99F6E4" }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#CCFBF1", border: "1px solid #5EEAD4" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={C.teal} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm" style={{ color: C.teal }}>No HealthPulse today</p>
              <p className="text-xs" style={{ color: C.textSoft }}>30 seconds to log — NOVA will personalise your session</p>
            </div>
            <motion.button whileTap={{ scale: 0.94 }} onClick={() => onNavigate("pulse")}
              className="px-3 py-2 rounded-xl text-xs font-black text-white flex-shrink-0"
              style={{ background: C.teal }}>
              Check in
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        className="rounded-3xl p-4 flex gap-3 relative overflow-hidden"
        style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 nova-idle"
          style={{ background: "#E0E7FF", border: "1px solid #A5B4FC" }}>
          <img src={LOGO_URL} alt="NOVA" className="w-5 h-5 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wide mb-1.5" style={{ color: C.indigoLight }}>NOVA — Tip of the day</p>
          <AnimatePresence mode="wait">
            <motion.p key={tipIndex}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              className="text-xs leading-relaxed" style={{ color: C.textMid }}>
              {TIPS[tipIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-1 absolute bottom-3 right-4">
          {TIPS.map((_, i) => (
            <div key={i} className="rounded-full transition-all"
              style={{ width: i === tipIndex ? 12 : 4, height: 4, background: i === tipIndex ? C.indigoLight : "#CBD5E1" }} />
          ))}
        </div>
      </motion.div>

      <div className="rounded-2xl p-4 text-xs leading-relaxed"
        style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}>
        NOVA provides wellness support and educational information only — not medical advice. In a medical emergency, call <strong>112</strong> (Emergency) or <strong>108</strong> (Ambulance). Mental health crisis: iCall <strong>9152987821</strong>.
      </div>
    </div>
  );
}