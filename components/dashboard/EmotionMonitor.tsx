"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Camera, CameraOff, Shield, Activity as ActivityIcon } from "lucide-react";
import { useEmotion } from "@/contexts/EmotionContext";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { EmotionDetector } from "./EmotionDetector";

const C = {
  bg: "#F8F9FC",
  surface: "#FFFFFF",
  surface2: "#F1F3F8",
  border: "#E2E8F0",
  indigo: "#5B5EF4",
  indigoDark: "#4338CA",
  indigoLight: "#C7D2FE",
  gold: "#D97706",
  goldLight: "#F59E0B",
  rose: "#E11D48",
  text: "#0F172A",
  textMid: "#334155",
  textSoft: "#64748B",
};

const EMOTION_CONFIG: Record<string, { color: string; bg: string; border: string; label: string; emoji: string; advice: string }> = {
  happy: {
    color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0",
    label: "Joyful", emoji: "😊",
    advice: "Excellent emotional state. This is a great time for goal-setting or social connection to reinforce your positive momentum.",
  },
  sad: {
    color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE",
    label: "Melancholic", emoji: "😢",
    advice: "Signs of sadness detected. Low-impact activity like a short walk or listening to uplifting music can help shift your perspective.",
  },
  angry: {
    color: "#EF4444", bg: "#FEF2F2", border: "#FECDD3",
    label: "Elevated Stress", emoji: "😠",
    advice: "Elevated frustration markers detected. Try 4-7-8 breathing: inhale 4, hold 7, exhale 8. This physiologically dampens the stress response.",
  },
  neutral: {
    color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0",
    label: "Balanced", emoji: "😐",
    advice: "A calm, balanced state. Perfect for focused work or mindfulness practice to maintain this equilibrium.",
  },
  surprised: {
    color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A",
    label: "High Arousal", emoji: "😲",
    advice: "Heightened engagement detected. Ensure you're staying hydrated and grounded during this period of high stimulation.",
  },
  fearful: {
    color: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE",
    label: "Anxious", emoji: "😨",
    advice: "Anxiety markers identified. Try '5-4-3-2-1' grounding: name 5 things you see, 4 you feel, 3 you hear, 2 you smell, and 1 you taste.",
  },
  disgusted: {
    color: "#B45309", bg: "#FFFBEB", border: "#FEF3C7",
    label: "Averse", emoji: "😒",
    advice: "Negative aversion detected. A change of scenery or a brief mindfulness pause can help reset your emotional baseline.",
  },
};

export function EmotionMonitor() {
  const { emotion, isCapturing, setIsCapturing, updateEmotion, clearEmotion } = useEmotion();
  const [activeInsightTab, setActiveInsightTab] = useState<"radar" | "bars">("bars");

  const config = emotion ? (EMOTION_CONFIG[emotion.dominant] ?? EMOTION_CONFIG.neutral) : null;

  const radarData = emotion ? [
    { subject: "Stress", value: Math.round(emotion.stress * 100) },
    { subject: "Sadness", value: Math.round(emotion.sadness * 100) },
    { subject: "Fatigue", value: Math.round(emotion.fatigue * 100) },
    { subject: "Joy", value: Math.round(emotion.joy * 100) },
    { subject: "Neutral", value: emotion.dominant === 'neutral' ? 80 : 20 },
    { subject: "Stability", value: 85 },
  ] : [];

  const bars = emotion ? [
    { label: "Joy", value: emotion.joy, color: "#10B981" },
    { label: "Stress", value: emotion.stress, color: "#EF4444" },
    { label: "Fatigue", value: emotion.fatigue, color: "#F59E0B" },
    { label: "Sadness", value: emotion.sadness, color: "#3B82F6" },
  ] : [];

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-5 relative overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #4338CA 0%, #5B5EF4 55%, #7C3AED 100%)",
          border: "1px solid #C7D2FE",
        }}>
        <div className="absolute top-0 right-0 w-44 h-44 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 65%)", filter: "blur(32px)" }} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-80 text-white">Privacy-First · On-Device AI</p>
            <h2 className="text-2xl font-black text-white leading-tight" style={{ fontFamily: "var(--font-outfit, sans-serif)", letterSpacing: "-0.025em" }}>
              Emotion Monitor
            </h2>
            <p className="text-sm mt-1 leading-relaxed opacity-90 text-white">
              No images ever leave your device
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/10 border border-white/20">
             <ActivityIcon size={26} color="white" />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4">
        {/* Viewfinder Section */}
        <div className="space-y-4">
          <div className="relative rounded-[32px] overflow-hidden bg-slate-950 border border-slate-800 shadow-xl group">
             <EmotionDetector 
               active={isCapturing} 
               onEmotionChange={(dom, conf) => updateEmotion(dom, conf)} 
             />
             
             {!isCapturing && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                 <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 border border-indigo-500/30">
                    <CameraOff size={32} className="text-indigo-400" />
                 </div>
                 <p className="text-white font-bold">Camera is inactive</p>
                 <p className="text-indigo-200/60 text-xs mt-1">Tap the button below to start monitoring</p>
               </div>
             )}
          </div>

          <div className="flex justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCapturing(!isCapturing)}
              className={`flex items-center gap-3 px-8 py-4 rounded-full font-black text-sm transition-all shadow-xl ${
                isCapturing 
                ? "bg-rose-500 text-white shadow-rose-500/30" 
                : "bg-indigo-600 text-white shadow-indigo-600/30"
              }`}
            >
              {isCapturing ? <CameraOff size={18} /> : <Camera size={18} />}
              {isCapturing ? "STOP MONITORING" : "START EMOTION SCAN"}
            </motion.button>

            {emotion && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearEmotion}
                className="w-14 h-14 flex items-center justify-center bg-white rounded-full border border-slate-200 shadow-lg"
              >
                <RefreshCw size={18} className="text-slate-600" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Insights Section */}
        <AnimatePresence mode="wait">
          {emotion ? (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              <div className="flex gap-1.5 p-1.5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                {(["bars", "radar"] as const).map((tab) => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveInsightTab(tab)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
                      activeInsightTab === tab ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {tab === "bars" ? "EMOTION BREAKDOWN" : "BIOMETRIC RADAR"}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-3xl p-6 bg-white border border-slate-100 shadow-sm flex flex-col justify-center min-h-[250px]">
                  {activeInsightTab === "bars" ? (
                    <div className="space-y-4">
                      {bars.map((item, i) => (
                        <div key={item.label} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                            <span className="text-xs font-black" style={{ color: item.color }}>{Math.round(item.value * 100)}%</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.value * 100}%` }}
                              className="h-full rounded-full"
                              style={{ background: item.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#E2E8F0" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 900, fill: "#94A3B8" }} />
                          <Radar dataKey="value" stroke={config?.color} fill={config?.color} fillOpacity={0.15} strokeWidth={3} />
                          <Tooltip 
                             contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                             itemStyle={{ fontWeight: 900, fontSize: '11px' }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="rounded-3xl p-6 flex flex-col gap-4 border shadow-sm" style={{ background: config?.bg, borderColor: config?.border }}>
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl shadow-lg bg-white">
                         {config?.emoji}
                      </div>
                      <div>
                        <h4 className="text-lg font-black leading-tight" style={{ color: config?.color }}>{config?.label}</h4>
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest" style={{ color: config?.color }}>Detected State</p>
                      </div>
                   </div>
                   
                   <div className="p-4 rounded-2xl bg-white/50 border border-white/50 text-xs leading-relaxed text-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield size={14} className="opacity-50" />
                        <span className="font-black uppercase tracking-tighter text-[10px] opacity-40">AI Recommendation</span>
                      </div>
                      {config?.advice}
                   </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[40px] p-12 bg-white border border-slate-100 shadow-sm text-center flex flex-col items-center gap-6"
            >
              <div className="w-24 h-24 rounded-[32px] bg-slate-50 flex items-center justify-center border border-slate-100">
                 <ActivityIcon size={40} className="text-slate-200" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-2">No Active Biometrics</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                  Start a scan to enable real-time emotional tracking and receive personalized wellness insights from NOVA.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Privacy Notice */}
      <div className="rounded-2xl p-4 bg-indigo-50 border border-indigo-100 flex items-start gap-4">
         <Shield size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
         <p className="text-[11px] leading-relaxed text-indigo-900/70">
           <span className="font-black text-indigo-900">Privacy Guarantee:</span> Your privacy is our priority. All facial analysis is performed locally on your device&apos;s hardware. Frames and biometric vectors are never transmitted to any server or stored beyond the current session&apos;s tracking window.
         </p>
      </div>
    </div>
  );
}
