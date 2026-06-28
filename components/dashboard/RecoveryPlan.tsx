"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, Clock, Flame, Info,
  Dumbbell, Wind, Sun, X, MessageCircle, RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const C = {
  surface: "#FFFFFF",
  surface2: "#F1F3F8",
  border: "#E2E8F0",
  indigo: "#5B5EF4",
  indigoDark: "#4338CA",
  teal: "#0D9488",
  gold: "#D97706",
  rose: "#F43F5E",
  green: "#10B981",
  text: "#0F172A",
  textMid: "#334155",
  textSoft: "#64748B",
};

type ExCategory = "Breathing" | "Yoga" | "Mobility" | "Strength" | "Mindfulness";

interface Exercise {
  id: string;
  name: string;
  durMins: number;
  level: string;
  cat: ExCategory;
  color: string;
  desc: string;
  steps?: string[];
  tags: string[]; // symptom tags that make this relevant
}

// Full exercise library — NOVA picks from this based on user context
const EXERCISE_LIBRARY: Exercise[] = [
  {
    id: "anulom-vilom",
    name: "Anulom Vilom",
    durMins: 10,
    level: "Beginner",
    cat: "Breathing",
    color: "#5B5EF4",
    desc: "Alternate nostril breathing to balance energy and reduce stress.",
    steps: [
      "Sit comfortably with spine straight.",
      "Close right nostril with thumb. Inhale slowly through left nostril for 4 counts.",
      "Close both nostrils. Hold for 2 counts.",
      "Open right nostril. Exhale for 4 counts.",
      "Inhale through right nostril for 4 counts. Hold. Exhale left.",
      "Repeat 10–15 cycles.",
    ],
    tags: ["anxious", "stressed", "overwhelmed", "shortness_of_breath"],
  },
  {
    id: "bhramari",
    name: "Bhramari Pranayama",
    durMins: 5,
    level: "Stress Relief",
    cat: "Breathing",
    color: "#4338CA",
    desc: "Humming bee breath to calm the nervous system.",
    steps: [
      "Sit quietly. Close eyes.",
      "Place index fingers gently on the cartilage between cheek and ear.",
      "Inhale deeply through nose.",
      "Exhale slowly while making a humming 'mmm' sound.",
      "Feel the vibration in your head. Repeat 5–7 times.",
    ],
    tags: ["anxious", "stressed", "foggy", "headache"],
  },
  {
    id: "box-breathing",
    name: "Box Breathing",
    durMins: 5,
    level: "Beginner",
    cat: "Breathing",
    color: "#0891B2",
    desc: "4-4-4-4 square breath used by Navy SEALs to control acute stress.",
    steps: [
      "Inhale for 4 counts.",
      "Hold for 4 counts.",
      "Exhale for 4 counts.",
      "Hold empty for 4 counts.",
      "Repeat 4–6 cycles.",
    ],
    tags: ["anxious", "overwhelmed", "chest_tightness", "irritable"],
  },
  {
    id: "shoulder-rotations",
    name: "Shoulder Rotations",
    durMins: 5,
    level: "Beginner",
    cat: "Mobility",
    color: "#0D9488",
    desc: "Gentle rotations to relieve tension in the upper back and neck.",
    steps: [
      "Stand or sit tall.",
      "Roll shoulders forward 10 times in large slow circles.",
      "Reverse direction for 10 circles.",
      "Add neck rolls side to side if comfortable.",
    ],
    tags: ["muscle_ache", "fatigue", "pain", "back_pain"],
  },
  {
    id: "cat-cow",
    name: "Cat-Cow Stretch",
    durMins: 8,
    level: "Low Impact",
    cat: "Yoga",
    color: "#D97706",
    desc: "Improve spinal flexibility and core awareness.",
    steps: [
      "Come to hands and knees (tabletop position).",
      "Inhale — drop belly, lift chest and tailbone (Cow).",
      "Exhale — round spine, tuck chin and tailbone (Cat).",
      "Flow between the two with your breath. 10 cycles.",
    ],
    tags: ["back_pain", "muscle_ache", "fatigue", "pain"],
  },
  {
    id: "childs-pose",
    name: "Child's Pose",
    durMins: 5,
    level: "Restorative",
    cat: "Yoga",
    color: "#F43F5E",
    desc: "Deep relaxation for the lower back and mind.",
    steps: [
      "Kneel, sit back on heels.",
      "Extend arms forward on floor, forehead resting down.",
      "Breathe deeply into the back body.",
      "Hold for 1–3 minutes.",
    ],
    tags: ["back_pain", "stressed", "overwhelmed", "fatigue"],
  },
  {
    id: "legs-up-wall",
    name: "Legs Up the Wall",
    durMins: 10,
    level: "Restorative",
    cat: "Yoga",
    color: "#7C3AED",
    desc: "Reduces leg fatigue, calms the nervous system, and aids sleep.",
    steps: [
      "Sit sideways next to a wall.",
      "Swing legs up as you lie back.",
      "Rest with legs vertical against the wall.",
      "Arms at sides, palms up. Stay 5–15 minutes.",
    ],
    tags: ["fatigue", "poor_sleep", "restless", "muscle_ache"],
  },
  {
    id: "body-scan",
    name: "Body Scan Meditation",
    durMins: 10,
    level: "Mindfulness",
    cat: "Mindfulness",
    color: "#0D9488",
    desc: "Systematically relax each part of the body to reduce physical tension.",
    steps: [
      "Lie down comfortably. Close eyes.",
      "Start at the top of your head. Notice any sensation without judgment.",
      "Slowly move awareness down — face, neck, shoulders, chest, belly, arms, legs, feet.",
      "With each exhale, allow that area to soften.",
      "Complete the scan in 8–12 minutes.",
    ],
    tags: ["anxious", "stressed", "pain", "poor_sleep", "restless"],
  },
  {
    id: "surya-namaskar",
    name: "Surya Namaskar",
    durMins: 12,
    level: "Moderate",
    cat: "Yoga",
    color: "#F59E0B",
    desc: "Sun salutation sequence for full-body activation and energy.",
    steps: [
      "Mountain pose → raised arms → forward fold → lunge.",
      "Plank → lower down → upward dog → downward dog.",
      "Step forward → forward fold → raised arms → mountain.",
      "Start with 3 rounds and build up.",
    ],
    tags: ["fatigue", "low", "foggy"],
  },
  {
    id: "wall-sit",
    name: "Wall Sit",
    durMins: 5,
    level: "Moderate",
    cat: "Strength",
    color: "#DC2626",
    desc: "Builds leg strength without equipment — good on low-energy days.",
    steps: [
      "Stand with back flat against wall.",
      "Slide down until thighs are parallel to floor.",
      "Hold for 30–60 seconds. Rest. Repeat 3×.",
    ],
    tags: ["fatigue", "low", "muscle_ache"],
  },
  {
    id: "nadi-shodhana",
    name: "Nadi Shodhana",
    durMins: 8,
    level: "Intermediate",
    cat: "Breathing",
    color: "#059669",
    desc: "Channel-purifying breath to improve focus and reduce mental fog.",
    steps: [
      "Sit comfortably. Right hand in Vishnu mudra.",
      "Close right nostril — inhale left 4 counts.",
      "Close both — hold 16 counts.",
      "Open right — exhale 8 counts.",
      "Inhale right 4 — hold 16 — exhale left 8. One round.",
      "Repeat 5 rounds.",
    ],
    tags: ["foggy", "low", "stressed", "anxious"],
  },
  {
    id: "progressive-relaxation",
    name: "Progressive Muscle Relaxation",
    durMins: 12,
    level: "Beginner",
    cat: "Mindfulness",
    color: "#6366F1",
    desc: "Tense and release each muscle group to break the stress-pain cycle.",
    steps: [
      "Lie down. Start with feet.",
      "Tense foot muscles firmly for 5 seconds.",
      "Release completely. Notice the difference.",
      "Move up — calves, thighs, abdomen, hands, arms, shoulders, face.",
      "End with 3 slow deep breaths.",
    ],
    tags: ["pain", "muscle_ache", "stressed", "poor_sleep", "anxious"],
  },
];

// ADDED — select exercises based on today's symptoms and mood
function selectExercisesForContext(
  bodySymptoms: string[],
  mindSymptoms: string[],
  wellnessScore: number | null
): Exercise[] {
  const allSymptoms = [...bodySymptoms, ...mindSymptoms];

  // Score each exercise by how many of the user's symptoms it addresses
  const scored = EXERCISE_LIBRARY.map(ex => ({
    ex,
    score: ex.tags.filter(t => allSymptoms.includes(t)).length,
  }));

  // Sort: most relevant first, then shuffle within equal score tiers
  scored.sort((a, b) => b.score - a.score);

  // If wellness score is low, prioritise restorative / breathing over strength
  const filtered =
    wellnessScore !== null && wellnessScore <= 4
      ? scored.filter(s => s.ex.cat !== "Strength")
      : scored;

  // Pick top 5, ensure category variety (no more than 2 of same cat)
  const picked: Exercise[] = [];
  const catCounts: Record<string, number> = {};
  for (const { ex } of filtered) {
    if (picked.length >= 5) break;
    const count = catCounts[ex.cat] ?? 0;
    if (count < 2) {
      picked.push(ex);
      catCounts[ex.cat] = count + 1;
    }
  }

  // If fewer than 5, fill from remaining
  if (picked.length < 5) {
    for (const { ex } of scored) {
      if (picked.length >= 5) break;
      if (!picked.find(p => p.id === ex.id)) picked.push(ex);
    }
  }

  return picked;
}

// ADDED — load today's completion state from localStorage
const STORAGE_PREFIX = "nova_recovery_plan:";

function todayKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}:${new Date().toISOString().slice(0, 10)}`;
}

function loadCompleted(userId: string): string[] {
  try {
    const raw = localStorage.getItem(todayKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCompleted(userId: string, ids: string[]) {
  try { localStorage.setItem(todayKey(userId), JSON.stringify(ids)); } catch { }
}

// ADDED — load streak from localStorage
function loadStreak(userId: string): number {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}:streak`);
    return raw ? JSON.parse(raw).count ?? 0 : 0;
  } catch { return 0; }
}

function updateStreak(userId: string, completedAll: boolean) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const key = `${STORAGE_PREFIX}${userId}:streak`;
    const raw = localStorage.getItem(key);
    const prev = raw ? JSON.parse(raw) : { count: 0, lastDate: "" };
    if (prev.lastDate === today) return prev.count;
    if (completedAll) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const newCount = prev.lastDate === yesterday.toISOString().slice(0, 10)
        ? prev.count + 1
        : 1;
      localStorage.setItem(key, JSON.stringify({ count: newCount, lastDate: today }));
      return newCount;
    }
    return prev.count;
  } catch { return 0; }
}

// ADDED — category filter chip
function CategoryChip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.93 }} onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
      style={{
        background: active ? C.indigo : C.surface2,
        color: active ? "#fff" : C.textSoft,
        border: `1.5px solid ${active ? C.indigo : C.border}`,
      }}>
      {label}
    </motion.button>
  );
}

const CAT_ICON: Record<ExCategory, React.ReactNode> = {
  Breathing: <Wind size={18} />,
  Yoga: <Sun size={18} />,
  Mobility: <Dumbbell size={18} />,
  Strength: <Dumbbell size={18} />,
  Mindfulness: <Sun size={18} />,
};

export function RecoveryPlan({ onNavigateToChat }: { onNavigateToChat?: () => void }) {
  const { user } = useAuth();

  // ADDED — load today's HealthPulse from localStorage for context
  const { bodySymptoms, mindSymptoms, wellnessScore } = useMemo(() => {
    if (!user?.id) return { bodySymptoms: [], mindSymptoms: [], wellnessScore: null };
    try {
      const key = `nova_health_pulse_logs:${user.id}`;
      const logs: { date: string; wellnessScore: number; bodySymptoms: string[]; mindSymptoms: string[] }[] =
        JSON.parse(localStorage.getItem(key) || "[]");
      const today = new Date().toISOString().slice(0, 10);
      const todayLog = logs.find(l => l.date === today) ?? logs[0];
      return {
        bodySymptoms: todayLog?.bodySymptoms ?? [],
        mindSymptoms: todayLog?.mindSymptoms ?? [],
        wellnessScore: todayLog?.wellnessScore ?? null,
      };
    } catch {
      return { bodySymptoms: [], mindSymptoms: [], wellnessScore: null };
    }
  }, [user?.id]);

  // ADDED — select exercises based on context
  const [exercises] = useState<Exercise[]>(() =>
    selectExercisesForContext(bodySymptoms, mindSymptoms, wellnessScore)
  );

  // ADDED — persist completed state
  const [completedIds, setCompletedIds] = useState<string[]>(() =>
    user?.id ? loadCompleted(user.id) : []
  );

  // ADDED — streak
  const [streak, setStreak] = useState(() => user?.id ? loadStreak(user.id) : 0);

  const [activeEx, setActiveEx] = useState<Exercise | null>(null);
  // ADDED — category filter
  const [catFilter, setCatFilter] = useState<ExCategory | "All">("All");

  const toggleComplete = (id: string) => {
    const next = completedIds.includes(id)
      ? completedIds.filter(c => c !== id)
      : [...completedIds, id];
    setCompletedIds(next);
    if (user?.id) {
      saveCompleted(user.id, next);
      const allDone = exercises.every(e => next.includes(e.id));
      if (allDone) {
        const newStreak = updateStreak(user.id, true);
        setStreak(newStreak);
      }
    }
  };

  const completedCount = exercises.filter(e => completedIds.includes(e.id)).length;
  const progress = exercises.length > 0 ? (completedCount / exercises.length) * 100 : 0;
  const allDone = completedCount === exercises.length;

  // ADDED — total duration
  const totalMins = exercises.reduce((sum, e) => sum + e.durMins, 0);

  // ADDED — filtered exercises by category
  const displayExercises = catFilter === "All"
    ? exercises
    : exercises.filter(e => e.cat === catFilter);

  const categories = ["All", ...Array.from(new Set(exercises.map(e => e.cat)))] as ("All" | ExCategory)[];

  // ADDED — context label for header
  const contextLabel = (() => {
    if (wellnessScore === null) return "General wellness";
    if (wellnessScore <= 3) return "Low energy — restorative focus";
    if (wellnessScore <= 6) return "Moderate — balanced session";
    return "Good energy — full session";
  })();

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-12">

      {/* ── Header card ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-5 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #312E81 100%)",
          boxShadow: "0 20px 40px rgba(15,23,42,0.22)",
        }}>
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Flame size={100} />
        </div>

        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-1">
            Recovery Plan
          </p>
          <div className="flex items-end justify-between mb-1">
            <div>
              <h2 className="text-3xl font-black leading-none"
                style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
                {completedCount}<span className="text-lg text-slate-400 font-bold">/{exercises.length}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{contextLabel}</p>
            </div>
            {/* ADDED — streak badge */}
            {streak > 0 && (
              <div className="rounded-2xl px-3 py-2 text-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)" }}>
                <p className="text-xl font-black leading-none">{streak}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                  day{streak !== 1 ? "s" : ""} 🔥
                </p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span>Today's progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #5B5EF4, #818CF8)",
                  boxShadow: "0 0 12px rgba(99,102,241,0.6)",
                }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-3 mt-4">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
              <Clock size={11} />
              {totalMins} min total
            </div>
            {(bodySymptoms.length > 0 || mindSymptoms.length > 0) && (
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
                <span>·</span>
                Tailored to your check-in
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ADDED — all done celebration */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="rounded-3xl p-5 text-center"
            style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0" }}>
            <p className="text-2xl mb-2">🎉</p>
            <p className="font-black text-sm" style={{ color: C.green }}>
              All sessions complete{streak > 1 ? ` — ${streak}-day streak!` : "!"}
            </p>
            <p className="text-xs mt-1" style={{ color: C.textSoft }}>
              NOVA has noted your recovery activity for today.
            </p>
            {onNavigateToChat && (
              <motion.button whileTap={{ scale: 0.96 }} onClick={onNavigateToChat}
                className="mt-3 px-5 py-2 rounded-full text-xs font-black text-white inline-flex items-center gap-2"
                style={{ background: C.indigo }}>
                <MessageCircle size={12} /> Tell NOVA how it felt
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADDED — category filter */}
      {categories.length > 2 && (
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <CategoryChip key={cat} label={cat} active={catFilter === cat}
              onClick={() => setCatFilter(cat === catFilter ? "All" : cat)} />
          ))}
        </div>
      )}

      {/* Exercise list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: C.textSoft }}>
            Scheduled for today
          </h3>
          <div className="flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full"
            style={{ background: "#EEF2FF", color: C.indigoDark, border: "1px solid #C7D2FE" }}>
            <Clock size={10} /> {totalMins} min
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {displayExercises.map((ex, i) => {
            const done = completedIds.includes(ex.id);
            const isOpen = activeEx?.id === ex.id;

            return (
              <motion.div key={ex.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-3xl overflow-hidden"
                style={{
                  background: C.surface,
                  border: `1px solid ${isOpen ? C.indigo : C.border}`,
                  opacity: done ? 0.75 : 1,
                }}>

                <div className="p-4 flex items-center gap-3">
                  {/* Complete toggle */}
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => toggleComplete(ex.id)}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: done ? "#ECFDF5" : C.surface2,
                      border: `1.5px solid ${done ? "#A7F3D0" : C.border}`,
                    }}>
                    {done
                      ? <CheckCircle2 size={18} color={C.green} />
                      : <Circle size={18} color={C.textSoft} />}
                  </motion.button>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-black truncate ${done ? "line-through" : ""}`}
                      style={{ color: done ? C.textSoft : C.text }}>
                      {ex.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold flex items-center gap-0.5"
                        style={{ color: C.textSoft }}>
                        <Clock size={9} /> {ex.durMins}m
                      </span>
                      <span className="text-[10px]" style={{ color: C.border }}>·</span>
                      <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                        style={{ background: `${ex.color}18`, color: ex.color }}>
                        {ex.cat}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* ADDED — Talk to NOVA about this exercise */}
                    {onNavigateToChat && (
                      <motion.button whileTap={{ scale: 0.9 }} onClick={onNavigateToChat}
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}
                        title="Ask NOVA about this">
                        <MessageCircle size={13} color={C.indigo} />
                      </motion.button>
                    )}
                    {/* Info toggle */}
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={() => setActiveEx(isOpen ? null : ex)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                      style={{
                        background: isOpen ? "#EEF2FF" : C.surface2,
                        border: `1px solid ${isOpen ? "#C7D2FE" : C.border}`,
                      }}>
                      {isOpen
                        ? <X size={13} color={C.indigo} />
                        : <Info size={13} color={C.textSoft} />}
                    </motion.button>
                  </div>
                </div>

                {/* ADDED — expanded step-by-step guide */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden">
                      <div className="px-4 pb-4 pt-1">
                        <div className="rounded-2xl p-4"
                          style={{ background: `${ex.color}0D`, border: `1px solid ${ex.color}28` }}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white"
                              style={{ background: ex.color }}>
                              {CAT_ICON[ex.cat]}
                            </div>
                            <div>
                              <p className="text-xs font-black" style={{ color: C.text }}>{ex.name}</p>
                              <p className="text-[9px] font-bold uppercase tracking-widest"
                                style={{ color: ex.color }}>{ex.level}</p>
                            </div>
                          </div>
                          <p className="text-xs leading-relaxed mb-3" style={{ color: C.textMid }}>
                            {ex.desc}
                          </p>
                          {ex.steps && (
                            <div className="space-y-1.5">
                              {ex.steps.map((step, si) => (
                                <div key={si} className="flex gap-2.5 items-start">
                                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white flex-shrink-0 mt-0.5"
                                    style={{ background: ex.color }}>
                                    {si + 1}
                                  </span>
                                  <p className="text-[11px] leading-relaxed" style={{ color: C.textMid }}>
                                    {step}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ADDED — regenerate plan hint */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
        <RefreshCw size={13} color={C.textSoft} />
        <p className="text-[11px] leading-relaxed flex-1" style={{ color: C.textSoft }}>
          Your plan updates each day based on your latest HealthPulse check-in.
          Log a check-in to get a more personalised session.
        </p>
      </motion.div>

      {/* Disclaimer */}
      <div className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
        <Info size={14} color="#D97706" className="flex-shrink-0 mt-0.5" />
        <p className="text-[10px] font-medium leading-relaxed" style={{ color: "#92400E" }}>
          These sessions are selected by NOVA based on your recent check-in data.
          If you feel sharp pain or discomfort, stop immediately and use the SOS feature.
          This is not medical advice.
        </p>
      </div>
    </div>
  );
}