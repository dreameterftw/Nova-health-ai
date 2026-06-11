"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { saveJournalEntry, fetchJournalEntries } from "@/lib/activityStore";
import type { JournalEntry, JournalType } from "@/lib/userContext";

const C = {
  surface: "#FFFFFF",
  border: "#E2E8F0",
  indigo: "#5B5EF4",
  indigoDark: "#4338CA",
  text: "#0F172A",
  textMid: "#334155",
  textSoft: "#64748B",
  teal: "#0D9488",
  rose: "#E11D48",
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

export function JournalPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<JournalType>("mental");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!user?.id) return;
    const data = await fetchJournalEntries(user.id, 20);
    setEntries(data);
  }, [user?.id]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleSave = async () => {
    if (!user?.id || !content.trim()) return;
    setSaving(true);
    try {
      const entry = await saveJournalEntry(user.id, {
        type: activeTab,
        content: content.trim(),
        mood: activeTab === "mental" && mood.trim() ? mood.trim() : undefined,
        symptoms:
          activeTab === "physical" && symptoms.trim()
            ? symptoms.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
      });
      setEntries((prev) => [entry, ...prev]);
      setContent("");
      setMood("");
      setSymptoms("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const tabConfig = TABS.find((t) => t.id === activeTab)!;
  const filtered = entries.filter((e) => e.type === activeTab);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="rounded-3xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <h2 className="font-black text-base mb-1" style={{ color: C.text }}>Health Journal</h2>
        <p className="text-xs mb-4" style={{ color: C.textSoft }}>
          Private reflections that help NOVA understand you better — without you having to repeat yourself.
        </p>

        <div className="flex gap-2 mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 rounded-2xl text-xs font-black transition-all"
              style={{
                background: activeTab === tab.id ? "#EEF2FF" : "#F1F5F9",
                color: activeTab === tab.id ? C.indigoDark : C.textSoft,
                border: `1.5px solid ${activeTab === tab.id ? "#C7D2FE" : C.border}`,
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        <p className="text-[11px] mb-3" style={{ color: C.textSoft }}>{tabConfig.hint}</p>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={tabConfig.placeholder}
          rows={5}
          className="w-full rounded-2xl p-4 text-sm resize-none outline-none"
          style={{ background: "#F8F9FC", border: `1px solid ${C.border}`, color: C.textMid }}
        />

        {activeTab === "mental" && (
          <input
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="One word for your mood (optional) — e.g. anxious, calm, hopeful"
            className="w-full mt-3 rounded-2xl px-4 py-3 text-sm outline-none"
            style={{ background: "#F8F9FC", border: `1px solid ${C.border}`, color: C.textMid }}
          />
        )}

        {activeTab === "physical" && (
          <input
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Symptoms (optional, comma-separated) — e.g. headache, fatigue"
            className="w-full mt-3 rounded-2xl px-4 py-3 text-sm outline-none"
            style={{ background: "#F8F9FC", border: `1px solid ${C.border}`, color: C.textMid }}
          />
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={!content.trim() || saving}
          className="w-full mt-4 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.indigoDark})` }}>
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save entry"}
        </motion.button>
      </div>

      <div className="rounded-3xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <h3 className="font-black text-sm mb-3" style={{ color: C.text }}>
          Recent {activeTab === "mental" ? "mental" : "physical"} entries
        </h3>

        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: C.textSoft }}>
              No entries yet. Write whenever it feels right — there's no schedule.
            </p>
          ) : (
            filtered.slice(0, 8).map((entry) => (
              <motion.div
                key={entry.id || entry.createdAt}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4 mb-3 last:mb-0"
                style={{ background: "#F8F9FC", border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold" style={{ color: C.textSoft }}>
                    {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {entry.mood && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: "#EEF2FF", color: C.indigoDark }}>
                      {entry.mood}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: C.textMid }}>
                  {entry.content}
                </p>
                {entry.symptoms?.length ? (
                  <p className="text-[11px] mt-2" style={{ color: C.teal }}>
                    {entry.symptoms.join(" · ")}
                  </p>
                ) : null}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
