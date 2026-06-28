"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { saveJournalEntry, fetchJournalEntries } from "@/lib/activityStore";
import type { JournalEntry, JournalType } from "@/lib/userContext";
import { Search, X, MessageCircle, BookOpen, Sparkles } from "lucide-react";

const C = {
  surface: "#FFFFFF",
  surface2: "#F1F3F8",
  border: "#E2E8F0",
  indigo: "#5B5EF4",
  indigoDark: "#4338CA",
  indigoLight: "#C7D2FE",
  text: "#0F172A",
  textMid: "#334155",
  textSoft: "#64748B",
  teal: "#0D9488",
  rose: "#E11D48",
  gold: "#D97706",
  green: "#10B981",
};

const TABS: { id: JournalType; label: string; placeholder: string; hint: string }[] = [
  {
    id: "mental",
    label: "Mental Health",
    placeholder: "How have you been feeling? What's been on your mind, weighing on you, or bringing you peace?",
    hint: "Thoughts, emotions, worries, gratitude — anything that helps you process.",
  },
  {
    id: "physical",
    label: "Physical Health",
    placeholder: "How is your body feeling? Note any symptoms, energy levels, sleep, or physical changes.",
    hint: "Symptoms, pain, sleep, appetite, energy — observations about your body.",
  },
];

// ADDED — mood chips for mental journal
const MOOD_CHIPS = [
  { id: "anxious", emoji: "😰", label: "Anxious" },
  { id: "calm", emoji: "😌", label: "Calm" },
  { id: "hopeful", emoji: "🌱", label: "Hopeful" },
  { id: "low", emoji: "😔", label: "Low" },
  { id: "grateful", emoji: "🙏", label: "Grateful" },
  { id: "stressed", emoji: "😤", label: "Stressed" },
  { id: "content", emoji: "😊", label: "Content" },
  { id: "overwhelmed", emoji: "🤯", label: "Overwhelmed" },
  { id: "lonely", emoji: "🫂", label: "Lonely" },
  { id: "energised", emoji: "⚡", label: "Energised" },
];

// ADDED — symptom chips for physical journal (subset of BodySymptom)
const SYMPTOM_CHIPS = [
  { id: "fatigue", label: "Fatigue", emoji: "😴" },
  { id: "headache", label: "Headache", emoji: "🤕" },
  { id: "nausea", label: "Nausea", emoji: "🤢" },
  { id: "pain", label: "Pain", emoji: "😣" },
  { id: "shortness_of_breath", label: "Breathless", emoji: "😮‍💨" },
  { id: "dizziness", label: "Dizzy", emoji: "😵" },
  { id: "fever", label: "Fever", emoji: "🌡️" },
  { id: "stomach_ache", label: "Stomach", emoji: "🤧" },
  { id: "muscle_ache", label: "Muscle ache", emoji: "💪" },
  { id: "poor_sleep", label: "Poor sleep", emoji: "🛏️" },
  { id: "low_appetite", label: "Low appetite", emoji: "🍽️" },
  { id: "chest_tightness", label: "Chest tight", emoji: "💢" },
];

// ADDED — writing prompts shown when textarea is empty
const MENTAL_PROMPTS = [
  "What's been taking up the most space in your mind lately?",
  "Is there something you've been putting off thinking about?",
  "What would feel like a win, however small, today?",
  "How have your relationships been feeling this week?",
  "What emotion has been showing up most — and what do you think it's telling you?",
  "Is there something you wish someone understood about how you're feeling?",
  "What's one thing you're grateful for that you haven't said out loud?",
];

const PHYSICAL_PROMPTS = [
  "How has your energy been over the last few days — morning, afternoon, evening?",
  "How has your sleep been — quality, hours, how you feel waking up?",
  "Have you noticed any physical tension or discomfort? Where in your body?",
  "How has your appetite been? Any changes in what you're craving or avoiding?",
  "Any new or recurring symptoms you want to note down?",
  "How has your body been responding to exercise or movement lately?",
  "What does your body most need right now?",
];

function PromptSuggestions({
  type,
  onSelect,
}: {
  type: JournalType;
  onSelect: (prompt: string) => void;
}) {
  const prompts = type === "mental" ? MENTAL_PROMPTS : PHYSICAL_PROMPTS;
  // Pick 3 random prompts, stable per tab switch
  const [selected] = useState(() => {
    const shuffled = [...prompts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-2 mb-3">
      <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
        style={{ color: C.textSoft }}>
        <Sparkles size={10} color={C.gold} />
        Start with a prompt
      </p>
      {selected.map((p, i) => (
        <motion.button
          key={i}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(p + "\n\n")}
          className="w-full text-left px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed font-semibold transition-all"
          style={{
            background: C.surface2,
            border: `1px solid ${C.border}`,
            color: C.textMid,
          }}>
          "{p}"
        </motion.button>
      ))}
    </motion.div>
  );
}

// ADDED — expandable entry card
function EntryCard({
  entry,
  onTalkToNOVA,
}: {
  entry: JournalEntry;
  onTalkToNOVA: (entry: JournalEntry) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const PREVIEW_LENGTH = 180;
  const isLong = entry.content.length > PREVIEW_LENGTH;
  const displayContent = expanded || !isLong
    ? entry.content
    : entry.content.slice(0, PREVIEW_LENGTH) + "…";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 mb-3 last:mb-0"
      style={{ background: "#F8F9FC", border: `1px solid ${C.border}` }}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold" style={{ color: C.textSoft }}>
          {new Date(entry.createdAt).toLocaleDateString("en-IN", {
            weekday: "short", month: "short", day: "numeric",
          })}
        </span>
        <div className="flex items-center gap-1.5">
          {entry.mood && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ background: "#EEF2FF", color: C.indigoDark }}>
              {entry.mood}
            </span>
          )}
          {/* ADDED — Talk to NOVA CTA per entry */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onTalkToNOVA(entry)}
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "#EEF2FF", border: `1px solid ${C.indigoLight}` }}
            title="Talk to NOVA about this">
            <MessageCircle size={11} color={C.indigo} />
          </motion.button>
        </div>
      </div>

      {/* Content with expand/collapse */}
      <p className="text-sm leading-relaxed" style={{ color: C.textMid }}>
        {displayContent}
      </p>

      {/* ADDED — expand/collapse toggle */}
      {isLong && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-1.5 text-[10px] font-black"
          style={{ color: C.indigo }}>
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {/* Symptoms */}
      {entry.symptoms?.length ? (
        <div className="flex flex-wrap gap-1 mt-2">
          {entry.symptoms.map(s => (
            <span key={s}
              className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: "#F0FDFA", color: C.teal, border: "1px solid #99F6E4" }}>
              {s.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      ) : null}

      {/* ADDED — word count */}
      <p className="text-[9px] mt-2 text-right" style={{ color: C.textSoft }}>
        {entry.content.split(/\s+/).filter(Boolean).length} words
      </p>
    </motion.div>
  );
}

export function JournalPanel({ onNavigateToChat }: { onNavigateToChat?: (prefill?: string) => void }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<JournalType>("mental");
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // ADDED — search state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadEntries = useCallback(async () => {
    if (!user?.id) return;
    const data = await fetchJournalEntries(user.id, 30);
    setEntries(data);
  }, [user?.id]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Reset per-tab fields when switching tabs
  const handleTabSwitch = (tab: JournalType) => {
    setActiveTab(tab);
    setSelectedMood("");
    setSelectedSymptoms([]);
    setSearchQuery("");
  };

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!user?.id || !content.trim()) return;
    setSaving(true);
    try {
      const entry = await saveJournalEntry(user.id, {
        type: activeTab,
        content: content.trim(),
        mood: activeTab === "mental" && selectedMood ? selectedMood : undefined,
        symptoms: activeTab === "physical" && selectedSymptoms.length > 0
          ? selectedSymptoms
          : undefined,
      });
      setEntries(prev => [entry, ...prev]);
      setContent("");
      setSelectedMood("");
      setSelectedSymptoms([]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  // ADDED — Talk to NOVA about a specific entry
  const handleTalkToNOVA = useCallback((entry: JournalEntry) => {
    const prefill = entry.type === "mental"
      ? `I wrote in my mental health journal: "${entry.content.slice(0, 300)}${entry.content.length > 300 ? "…" : ""}". Can we talk about this?`
      : `I noted in my physical health journal: "${entry.content.slice(0, 300)}${entry.content.length > 300 ? "…" : ""}". Can you help me understand what might be going on?`;
    onNavigateToChat?.(prefill);
  }, [onNavigateToChat]);

  const tabConfig = TABS.find(t => t.id === activeTab)!;

  // ADDED — filter entries by tab and search query
  const filtered = entries
    .filter(e => e.type === activeTab)
    .filter(e => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.content.toLowerCase().includes(q) ||
        e.mood?.toLowerCase().includes(q) ||
        e.symptoms?.some(s => s.toLowerCase().includes(q))
      );
    });

  // ADDED — streak: consecutive days with an entry of this type
  const streak = (() => {
    const typedEntries = entries.filter(e => e.type === activeTab);
    if (typedEntries.length === 0) return 0;
    const dates = new Set(typedEntries.map(e => e.createdAt.slice(0, 10)));
    let count = 0;
    const cursor = new Date();
    while (true) {
      if (dates.has(cursor.toISOString().slice(0, 10))) {
        count++;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }
    return count;
  })();

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">

      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0D9488 0%, #0891B2 55%, #5B5EF4 100%)",
          border: "1px solid #99F6E4",
          boxShadow: "0 16px 48px rgba(13,148,136,0.20)",
        }}>
        <div className="absolute top-0 right-0 w-44 h-44 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 65%)", filter: "blur(32px)" }} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-75 text-white">
              Private · Secure · Yours
            </p>
            <h2 className="text-2xl font-black text-white leading-tight"
              style={{ fontFamily: "var(--font-outfit, sans-serif)", letterSpacing: "-0.025em" }}>
              Health Journal
            </h2>
            <p className="text-sm mt-0.5 text-white/80">
              {entries.length === 0
                ? "Your first entry helps NOVA know you better"
                : `${entries.length} entr${entries.length === 1 ? "y" : "ies"} · ${entries.filter(e => e.type === "mental").length} mental · ${entries.filter(e => e.type === "physical").length} physical`}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            {/* ADDED — streak counter */}
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
                <BookOpen size={22} color="white" />
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Write panel */}
      <div className="rounded-3xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-4">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => handleTabSwitch(tab.id)}
              className="flex-1 py-2.5 rounded-2xl text-xs font-black transition-all"
              style={{
                background: activeTab === tab.id ? "#EEF2FF" : C.surface2,
                color: activeTab === tab.id ? C.indigoDark : C.textSoft,
                border: `1.5px solid ${activeTab === tab.id ? "#C7D2FE" : C.border}`,
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        <p className="text-[11px] mb-3" style={{ color: C.textSoft }}>{tabConfig.hint}</p>

        {/* ADDED — prompt suggestions when content is empty */}
        <AnimatePresence>
          {content.length === 0 && (
            <PromptSuggestions
              type={activeTab}
              onSelect={p => {
                setContent(p);
                textareaRef.current?.focus();
              }}
            />
          )}
        </AnimatePresence>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={tabConfig.placeholder}
          rows={5}
          className="w-full rounded-2xl p-4 text-sm resize-none outline-none"
          style={{ background: "#F8F9FC", border: `1px solid ${C.border}`, color: C.textMid }}
        />

        {/* ADDED — word / char count */}
        {content.length > 0 && (
          <div className="flex justify-end gap-3 mt-1 px-1">
            <span className="text-[10px] font-bold" style={{ color: C.textSoft }}>
              {wordCount} word{wordCount !== 1 ? "s" : ""}
            </span>
            <span className="text-[10px]" style={{ color: C.border }}>·</span>
            <span className="text-[10px] font-bold" style={{ color: C.textSoft }}>
              {charCount} chars
            </span>
          </div>
        )}

        {/* ADDED — mood chips for mental */}
        {activeTab === "mental" && (
          <div className="mt-3">
            <p className="text-[10px] font-black uppercase tracking-widest mb-2"
              style={{ color: C.textSoft }}>
              Today's mood <span className="font-normal normal-case tracking-normal">(optional)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {MOOD_CHIPS.map(m => {
                const sel = selectedMood === m.id;
                return (
                  <motion.button key={m.id} whileTap={{ scale: 0.92 }}
                    onClick={() => setSelectedMood(sel ? "" : m.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                    style={{
                      background: sel ? "#EEF2FF" : C.surface2,
                      border: `1.5px solid ${sel ? C.indigo : C.border}`,
                      color: sel ? C.indigoDark : C.textSoft,
                    }}>
                    <span>{m.emoji}</span>{m.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* ADDED — symptom chips for physical */}
        {activeTab === "physical" && (
          <div className="mt-3">
            <p className="text-[10px] font-black uppercase tracking-widest mb-2"
              style={{ color: C.textSoft }}>
              Symptoms <span className="font-normal normal-case tracking-normal">(optional)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_CHIPS.map(s => {
                const sel = selectedSymptoms.includes(s.id);
                return (
                  <motion.button key={s.id} whileTap={{ scale: 0.92 }}
                    onClick={() => toggleSymptom(s.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                    style={{
                      background: sel ? "#F0FDFA" : C.surface2,
                      border: `1.5px solid ${sel ? C.teal : C.border}`,
                      color: sel ? C.teal : C.textSoft,
                    }}>
                    <span>{s.emoji}</span>{s.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={!content.trim() || saving}
          className="w-full mt-4 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.indigoDark})` }}>
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save entry"}
        </motion.button>
      </div>

      {/* Entry list */}
      <div className="rounded-3xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        {/* List header with search toggle */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-sm" style={{ color: C.text }}>
            {activeTab === "mental" ? "Mental" : "Physical"} entries
            {filtered.length > 0 && (
              <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: C.surface2, color: C.textSoft }}>
                {filtered.length}
              </span>
            )}
          </h3>
          {/* ADDED — search toggle */}
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => { setShowSearch(v => !v); setSearchQuery(""); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: showSearch ? "#EEF2FF" : C.surface2,
              border: `1px solid ${showSearch ? C.indigoLight : C.border}`,
            }}>
            {showSearch
              ? <X size={13} color={C.indigo} />
              : <Search size={13} color={C.textSoft} />}
          </motion.button>
        </div>

        {/* ADDED — search input */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-3">
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search entries…"
                className="w-full rounded-2xl px-4 py-2.5 text-sm outline-none"
                style={{ background: C.surface2, border: `1.5px solid ${C.border}`, color: C.textMid }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-xs text-center py-6"
              style={{ color: C.textSoft }}>
              {searchQuery
                ? "No entries match your search."
                : "No entries yet. Write whenever it feels right — there's no schedule."}
            </motion.p>
          ) : (
            filtered.slice(0, 10).map(entry => (
              <EntryCard
                key={entry.id || entry.createdAt}
                entry={entry}
                onTalkToNOVA={handleTalkToNOVA}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}