"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Clock, Flame, ChevronRight, Info, Dumbbell, Wind, Sun } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  dur: string;
  level: string;
  cat: string;
  color: string;
  desc: string;
  completed: boolean;
}

const DEFAULT_EXERCISES: Exercise[] = [
  { id: "1", name: "Anulom Vilom", dur: "10m", level: "Beginner", cat: "Breathing", color: "#5B5EF4", desc: "Alternate nostril breathing to balance energy and reduce stress.", completed: false },
  { id: "2", name: "Shoulder Rotations", dur: "5m", level: "Beginner", cat: "Mobility", color: "#14B8A6", desc: "Gentle rotations to relieve tension in the upper back and neck.", completed: false },
  { id: "3", name: "Cat-Cow Stretch", dur: "8m", level: "Low Impact", cat: "Yoga", color: "#F59E0B", desc: "Improve spinal flexibility and core awareness.", completed: false },
  { id: "4", name: "Bhramari Pranayama", dur: "5m", level: "Stress Relief", cat: "Breathing", color: "#4338CA", desc: "Humming bee breath to call the nervous system.", completed: false },
  { id: "5", name: "Child's Pose", dur: "5m", level: "Restorative", cat: "Yoga", color: "#F43F5E", desc: "Deep relaxation for the lower back and mind.", completed: false },
];

export function RecoveryPlan() {
  const [exercises, setExercises] = useState<Exercise[]>(DEFAULT_EXERCISES);
  const [activeEx, setActiveEx] = useState<Exercise | null>(null);

  const toggleComplete = (id: string) => {
    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, completed: !ex.completed } : ex));
  };

  const completedCount = exercises.filter(e => e.completed).length;
  const progress = (completedCount / exercises.length) * 100;

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      
      {/* ── Progress Card ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="rounded-[2.5rem] p-6 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", boxShadow: "0 20px 40px rgba(15,23,42,0.2)" }}>
        <div className="absolute top-0 right-0 p-8 opacity-10"><Flame size={120} /></div>
        
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Weekly Momentum</p>
          <div className="flex items-end gap-3 mb-6">
            <h2 className="text-4xl font-black">{completedCount}</h2>
            <p className="text-sm font-bold text-slate-400 mb-1">/ {exercises.length} sessions done</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span>Today&apos;s Goal</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden border border-white/5 p-0.5">
              <motion.div 
                initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.5)]" 
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Exercise List ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Scheduled for today</h3>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
             <Clock size={10} /> 30 MINS TOTAL
          </div>
        </div>

        <div className="space-y-3">
          {exercises.map((ex, i) => (
            <motion.div key={ex.id}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className={`group rounded-3xl p-4 flex items-center gap-4 transition-all border ${ex.completed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}`}>
              
              <button onClick={() => toggleComplete(ex.id)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${ex.completed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-300 hover:text-indigo-400'}`}>
                {ex.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              </button>

              <div className="flex-1 min-w-0 pointer-events-none">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={`text-sm font-black truncate ${ex.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{ex.name}</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                   <span className="flex items-center gap-0.5"><Clock size={10}/> {ex.dur}</span>
                   <span>&bull;</span>
                   <span className="uppercase tracking-wider">{ex.cat}</span>
                </div>
              </div>

              <button onClick={() => setActiveEx(activeEx?.id === ex.id ? null : ex)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-300 group-hover:text-slate-900">
                <Info size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Detailed Info Overlay ─────────────────────────────────────── */}
      <AnimatePresence>
        {activeEx && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="p-5 rounded-3xl bg-indigo-50 border border-indigo-100 shadow-lg mt-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white" style={{ background: activeEx.color }}>
                  {activeEx.cat === 'Breathing' ? <Wind size={20} /> : activeEx.cat === 'Yoga' ? <Sun size={20} /> : <Dumbbell size={20} />}
                </div>
                <div>
                  <h4 className="text-sm font-black text-indigo-950">{activeEx.name}</h4>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{activeEx.level}</p>
                </div>
              </div>
              <button onClick={() => setActiveEx(null)} className="p-1 text-indigo-300 hover:text-indigo-600"><X size={14} /></button>
            </div>
            <p className="text-xs text-indigo-800/80 leading-relaxed font-medium bg-white/50 p-3 rounded-2xl border border-white/80">
              {activeEx.desc}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 rounded-3xl bg-amber-50 border border-amber-100 flex items-start gap-3">
        <Info size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] font-medium text-amber-800 leading-relaxed">
           <strong>Personalised Guidance:</strong> These sessions are generated by NOVA based on your stress levels and physical data. If you feel any sharp pain, stop immediately and use the SOS feature.
        </p>
      </div>

    </div>
  );
}

function X({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>;
}
