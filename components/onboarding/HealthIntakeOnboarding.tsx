"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { saveHealthPulseLog, saveHealthPulseLogLocal } from "@/lib/activityStore";
import type { BodySymptom, HealthPulseLog, MindSymptom } from "@/lib/userContext";
import { ArrowRight, Check, Upload } from "lucide-react";

const C = {
  surface: "#FFFFFF",
  surface2: "#F1F3F8",
  border: "#E2E8F0",
  indigo: "#5B5EF4",
  indigoDark: "#4338CA",
  teal: "#0D9488",
  text: "#0F172A",
  textMid: "#334155",
  textSoft: "#64748B",
};

const AGE_RANGES = ["Under 18", "18-25", "26-35", "36-45", "46-60", "60+"];
const CONDITIONS = ["Diabetes", "Hypertension", "Anxiety/Depression", "Thyroid", "Asthma", "Heart condition", "PCOS", "Migraines", "None / Prefer not to say"];
const GOALS = ["Understanding my reports", "Tracking my symptoms", "Mental wellness support", "Medication reminders", "Preparing for doctor visits", "General health questions"];
const BODY: { id: BodySymptom; label: string }[] = [
  { id: "fatigue", label: "Fatigue" },
  { id: "headache", label: "Headache" },
  { id: "pain", label: "Pain" },
  { id: "dizziness", label: "Dizzy" },
  { id: "nausea", label: "Nausea" },
  { id: "chest_tightness", label: "Chest tight" },
];
const MIND: { id: MindSymptom; label: string }[] = [
  { id: "calm", label: "Calm" },
  { id: "anxious", label: "Anxious" },
  { id: "low", label: "Low" },
  { id: "stressed", label: "Stressed" },
  { id: "foggy", label: "Foggy" },
  { id: "overwhelmed", label: "Overwhelmed" },
];

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl px-3.5 py-2.5 text-sm font-bold transition-all text-left"
      style={{
        background: active ? "#EEF2FF" : C.surface2,
        color: active ? C.indigoDark : C.textMid,
        border: `1.5px solid ${active ? "#C7D2FE" : C.border}`,
      }}>
      {children}
    </button>
  );
}

export function HealthIntakeOnboarding() {
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ageRange, setAgeRange] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [meds, setMeds] = useState([{ name: "", dose: "", time: "Morning" }]);
  const [uploadSummary, setUploadSummary] = useState("");
  const [uploading, setUploading] = useState(false);
  const [bodySymptoms, setBodySymptoms] = useState<BodySymptom[]>([]);
  const [mindSymptoms, setMindSymptoms] = useState<MindSymptom[]>(["calm"]);
  const [score, setScore] = useState(6);
  const firstName = (user?.name || "there").split(" ")[0];

  const selectedMeds = useMemo(() => meds.filter((m) => m.name.trim()), [meds]);

  const finish = async (skipped = false) => {
    if (!user?.id) return router.replace("/dashboard");
    const medicationNames = selectedMeds.map((m) => m.name.trim());
    await updateProfile({
      onboardingComplete: !skipped,
      onboardingSkipped: skipped,
      ageRange,
      conditions: conditions.filter((c) => !c.includes("Prefer")),
      goals,
      medications: medicationNames,
    });

    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        await fetch("/api/health-graph/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            ageRange,
            conditions: conditions.filter((c) => !c.includes("Prefer")),
            goals,
            medications: medicationNames,
          }),
        });
      }
    } catch {
      // profile save still succeeds locally/cloud through AuthContext
    }

    router.replace("/dashboard");
  };

  const savePulse = async () => {
    if (!user?.id) return;
    const log: HealthPulseLog = {
      date: new Date().toISOString().slice(0, 10),
      wellnessScore: score,
      bodySymptoms,
      mindSymptoms,
      symptomIntensity: {},
      createdAt: new Date().toISOString(),
    };
    saveHealthPulseLogLocal(user.id, log);
    try { await saveHealthPulseLog(user.id, log); } catch {}
    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        await fetch("/api/health-graph/pulse", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ log }),
        });
      }
    } catch {}
    setStep(5);
  };

  const uploadReport = async (file: File) => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("fileName", file.name);
      data.append("type", "medical-document");
      const res = await fetch("/api/vault/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: data });
      const json = await res.json();
      const findings = json?.result?.findings?.slice(0, 3)?.join("\n- ");
      setUploadSummary(`${json?.result?.type || "Medical report"}\n- ${findings || "Uploaded and stored in Vision Vault."}`);
    } catch {
      setUploadSummary("Uploaded report could not be processed right now. You can retry in Vision Vault.");
    } finally {
      setUploading(false);
    }
  };

  const screens = [
    <div key="welcome" className="space-y-6">
      <h1 className="text-3xl font-black" style={{ color: C.text }}>Hi. I'm NOVA.</h1>
      <p className="text-base leading-relaxed" style={{ color: C.textMid }}>
        I'm not a doctor, but I can help you understand your health, track how you're feeling, and make sure you never face a medical question alone.
      </p>
      <p className="text-sm" style={{ color: C.textSoft }}>This takes about 5 minutes. You can skip anything.</p>
    </div>,
    <div key="about" className="space-y-6">
      <div>
        <h2 className="text-xl font-black mb-3" style={{ color: C.text }}>First, how old are you?</h2>
        <div className="grid grid-cols-2 gap-2">{AGE_RANGES.map((a) => <Chip key={a} active={ageRange === a} onClick={() => setAgeRange(a)}>{a}</Chip>)}</div>
      </div>
      <div>
        <h2 className="text-xl font-black mb-3" style={{ color: C.text }}>Do you manage any ongoing conditions?</h2>
        <div className="flex flex-wrap gap-2">{CONDITIONS.map((c) => <Chip key={c} active={conditions.includes(c)} onClick={() => setConditions((p) => c.includes("Prefer") ? [c] : p.includes(c) ? p.filter((x) => x !== c) : [...p.filter((x) => !x.includes("Prefer")), c])}>{c}</Chip>)}</div>
      </div>
      <div>
        <h2 className="text-xl font-black mb-3" style={{ color: C.text }}>What do you mostly want help with?</h2>
        <div className="flex flex-wrap gap-2">{GOALS.map((g) => <Chip key={g} active={goals.includes(g)} onClick={() => setGoals((p) => p.includes(g) ? p.filter((x) => x !== g) : p.length < 2 ? [...p, g] : [p[1], g])}>{g}</Chip>)}</div>
      </div>
    </div>,
    <div key="meds" className="space-y-5">
      <h2 className="text-xl font-black" style={{ color: C.text }}>Any medications or supplements?</h2>
      <p className="text-xs font-semibold leading-relaxed" style={{ color: C.textSoft }}>
        Your medication data is stored securely and never used for advertising.
      </p>
      {meds.map((m, i) => (
        <div key={i} className="grid gap-2 rounded-3xl p-4" style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
          <input value={m.name} onChange={(e) => setMeds((p) => p.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="Vitamin D" className="rounded-2xl px-3 py-2 text-sm" />
          <input value={m.dose} onChange={(e) => setMeds((p) => p.map((x, idx) => idx === i ? { ...x, dose: e.target.value } : x))} placeholder="1 tablet" className="rounded-2xl px-3 py-2 text-sm" />
          <select value={m.time} onChange={(e) => setMeds((p) => p.map((x, idx) => idx === i ? { ...x, time: e.target.value } : x))} className="rounded-2xl px-3 py-2 text-sm">
            <option>Morning</option><option>Afternoon</option><option>Evening</option><option>Night</option>
          </select>
        </div>
      ))}
      <button onClick={() => setMeds((p) => [...p, { name: "", dose: "", time: "Morning" }])} className="text-sm font-black" style={{ color: C.indigo }}>+ Add another</button>
    </div>,
    <div key="report" className="space-y-5">
      <h2 className="text-xl font-black" style={{ color: C.text }}>Have a recent health report?</h2>
      <p className="text-sm" style={{ color: C.textSoft }}>Upload a blood test, prescription, or recent visit note if you have one.</p>
      <label className="rounded-3xl p-8 border-2 border-dashed flex flex-col items-center gap-3 cursor-pointer" style={{ borderColor: C.border, background: C.surface2 }}>
        <Upload size={26} color={C.indigo} />
        <span className="font-black text-sm">{uploading ? "Processing..." : "Upload a report"}</span>
        <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadReport(e.target.files[0])} />
      </label>
      {uploadSummary && <pre className="whitespace-pre-wrap rounded-2xl p-4 text-xs" style={{ background: "#F8FAFC", color: C.textMid, border: `1px solid ${C.border}` }}>{uploadSummary}</pre>}
    </div>,
    <div key="pulse" className="space-y-5">
      <h2 className="text-xl font-black" style={{ color: C.text }}>Last thing. How are you feeling today?</h2>
      <div>
        <p className="text-xs font-black uppercase mb-2" style={{ color: C.textSoft }}>Body</p>
        <div className="flex flex-wrap gap-2">{BODY.map((b) => <Chip key={b.id} active={bodySymptoms.includes(b.id)} onClick={() => setBodySymptoms((p) => p.includes(b.id) ? p.filter((x) => x !== b.id) : [...p, b.id])}>{b.label}</Chip>)}</div>
      </div>
      <div>
        <p className="text-xs font-black uppercase mb-2" style={{ color: C.textSoft }}>Mind</p>
        <div className="flex flex-wrap gap-2">{MIND.map((m) => <Chip key={m.id} active={mindSymptoms.includes(m.id)} onClick={() => setMindSymptoms((p) => m.id === "calm" ? ["calm"] : p.includes(m.id) ? p.filter((x) => x !== m.id) : [...p.filter((x) => x !== "calm"), m.id])}>{m.label}</Chip>)}</div>
      </div>
      <div className="rounded-3xl p-5" style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
        <p className="text-center text-4xl font-black" style={{ color: C.teal }}>{score}<span className="text-lg" style={{ color: C.textSoft }}> / 10</span></p>
        <input type="range" min={1} max={10} value={score} onChange={(e) => setScore(Number(e.target.value))} className="w-full accent-teal-600" />
      </div>
    </div>,
    <div key="intro" className="space-y-5">
      <h1 className="text-2xl font-black" style={{ color: C.text }}>Nice to meet you, {firstName}.</h1>
      <p className="text-sm leading-relaxed" style={{ color: C.textMid }}>
        Here's what I know so far: {ageRange ? `you're in the ${ageRange} range, ` : ""}{conditions.length ? `you mentioned ${conditions.join(", ")}, ` : ""}{goals.length ? `and you're mainly here for ${goals.join(" and ")}. ` : ""}{selectedMeds.length ? `You're taking ${selectedMeds.map((m) => m.name).join(", ")}. ` : ""}Today you're feeling {score}/10{bodySymptoms.length ? ` with ${bodySymptoms.join(", ").replace(/_/g, " ")}` : ""}.
      </p>
      <p className="text-sm" style={{ color: C.textSoft }}>I'll keep this in mind in your briefings and conversations.</p>
    </div>,
  ];

  return (
    <div className="min-h-screen nova-bg flex items-center justify-center p-5">
      <div className="w-full max-w-2xl rounded-[32px] p-6 sm:p-8" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
            {screens[step]}
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-3 mt-8">
          <button onClick={() => step === 0 ? finish(true) : setStep((s) => Math.max(0, s - 1))} className="px-4 py-3 rounded-2xl text-sm font-black" style={{ background: C.surface2, color: C.textSoft }}>
            {step === 0 ? "I'll do this later" : "Back"}
          </button>
          <button onClick={() => step === 4 ? savePulse() : step === 5 ? finish(false) : setStep((s) => s + 1)} className="flex-1 py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2" style={{ background: C.indigo }}>
            {step === 5 ? "Enter NOVA" : step === 4 ? "Save check-in" : "Continue"} {step !== 5 ? <ArrowRight size={15} /> : <Check size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
