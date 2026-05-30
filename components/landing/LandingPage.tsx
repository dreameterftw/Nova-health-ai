"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ArrowRight, Shield, MessageCircle, Upload, Heart, Zap, Menu, X, Check, Star } from "lucide-react";
import Link from "next/link";

import { LOGO_URL } from "@/lib/constants";
import { InstallButton } from "@/components/pwa/InstallButton";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#F8F9FC",
  surface: "#FFFFFF",
  surface2: "#F1F3F8",
  surface3: "#E8ECF4",
  border: "#E2E8F0",
  borderMid: "#C6CEDF",
  indigo: "#5B5EF4",
  indigoDark: "#4338CA",
  gold: "#D97706",
  teal: "#0D9488",
  rose: "#E11D48",
  text: "#0F172A",
  textMid: "#334155",
  textSoft: "#64748B",
};

// Gradient helper — violet to gold, exactly as in the reference screenshot
const VG_GRAD = "linear-gradient(135deg, #4338CA 0%, #5B5EF4 40%, #D97706 80%, #F59E0B 100%)";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>
      {children}
    </motion.div>
  );
}

function FadeIn({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.55, delay }}
      className={className}>
      {children}
    </motion.div>
  );
}

// Gradient text span
function GradText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      background: VG_GRAD,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    }}>{children}</span>
  );
}

// ─── Phone mockup — fully light mode ─────────────────────────────────────────
function PhoneMockup() {
  const [screen, setScreen] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const t = setInterval(() => setScreen(s => (s + 1) % 3), 3400);
    return () => clearInterval(t);
  }, [autoPlay]);

  const screens = [
    {
      label: "NOVA",
      dotColor: C.teal,
      content: (
        <div className="flex flex-col h-full">
          {/* Chat header */}
          <div className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
            style={{ borderBottom: `1px solid ${C.border}`, background: C.surface }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)", border: "1px solid #C7D2FE" }}>
              <img src={LOGO_URL} alt="" className="w-4 h-4 object-contain" />
            </div>
            <div>
              <p className="text-[10px] font-black" style={{ color: C.text }}>NOVA</p>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#16A34A" }} />
                <span className="text-[8px]" style={{ color: C.textSoft }}>Active now</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 px-3 py-3 space-y-2 overflow-hidden" style={{ background: C.bg }}>
            {[
              { role: "ai", text: "Good morning! How are you feeling today?" },
              { role: "user", text: "A bit tired — knee is still sore." },
              { role: "ai", text: "Your B12 was low last week — that may be adding to your fatigue. Should I adjust your 9 AM reminder?" },
            ].map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.18 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="rounded-2xl px-3 py-2 max-w-[84%] text-[9px] leading-relaxed"
                  style={m.role === "ai"
                    ? { background: C.surface, color: C.textMid, border: `1px solid ${C.border}` }
                    : { background: C.indigo, color: "#FFFFFF", boxShadow: "0 3px 10px rgba(91,94,244,0.28)" }
                  }>{m.text}</div>
              </motion.div>
            ))}
            {/* Typing dots */}
            <div className="flex gap-1 items-center">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
                <img src={LOGO_URL} alt="" className="w-3.5 h-3.5" />
              </div>
              <div className="rounded-2xl px-3 py-2.5 flex gap-1.5"
                style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                {[0, 0.15, 0.3].map((d, i) => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                    style={{ background: C.indigo }}
                    animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.65, repeat: Infinity, delay: d }} />
                ))}
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div className="px-3 pb-3 pt-2 flex-shrink-0" style={{ background: C.surface }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
              style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
              <span className="text-[9px] flex-1" style={{ color: C.textSoft }}>Message NOVA…</span>
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: C.indigo }}>
                <ArrowRight size={8} color="white" />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "Scan",
      dotColor: C.indigo,
      content: (
        <div className="flex flex-col h-full px-4 pt-3" style={{ background: C.bg }}>
          <p className="text-[10px] font-black mb-3" style={{ color: C.text }}>Emotion Monitor</p>
          {/* Viewfinder */}
          <div className="rounded-2xl flex flex-col items-center justify-center gap-2.5 mb-3 relative overflow-hidden"
            style={{ height: 110, background: C.surface, border: `1px solid ${C.border}` }}>
            <div className="scan-line" />
            <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: "#EEF2FF", border: `1.5px solid ${C.indigo}` }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={C.indigo} strokeWidth="1.5" />
                <circle cx="12" cy="12" r="3" stroke={C.indigo} strokeWidth="1.5" />
              </svg>
            </motion.div>
            <span className="text-[7px] font-semibold" style={{ color: "#4338CA" }}>Processing on-device only</span>
          </div>

          {/* Detected state */}
          <div className="rounded-xl p-2.5 mb-2.5"
            style={{ background: "#F0FDFA", border: "1px solid #99F6E4" }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#CCFBF1" }}>
                <span className="text-xs font-black" style={{ color: C.teal }}>C</span>
              </div>
              <div>
                <p className="text-[10px] font-black" style={{ color: C.text }}>Calm &amp; Focused</p>
                <p className="text-[8px]" style={{ color: C.teal }}>NOVA has adjusted its tone</p>
              </div>
            </div>
          </div>

          {/* Bars */}
          {[
            { l: "Joy", v: 72, c: "#16A34A" },
            { l: "Stress", v: 22, c: C.rose },
            { l: "Focus", v: 68, c: C.indigo },
          ].map((b) => (
            <div key={b.l} className="mb-1.5">
              <div className="flex justify-between text-[8px] mb-0.5">
                <span style={{ color: C.textSoft }}>{b.l}</span>
                <span style={{ color: b.c }} className="font-bold">{b.v}%</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: C.surface3 }}>
                <motion.div className="h-full rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${b.v}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                  style={{ background: b.c }} />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      label: "Vault",
      dotColor: C.gold,
      content: (
        <div className="flex flex-col h-full px-4 pt-3" style={{ background: C.bg }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black" style={{ color: C.text }}>Medical Vault</p>
            <span className="text-[8px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}>
              3 docs
            </span>
          </div>

          {/* Blood test card */}
          <div className="rounded-xl p-3 mb-2.5"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <p className="text-[8px] font-bold mb-2 uppercase tracking-wide" style={{ color: "#4338CA" }}>Blood Test — Mar 15</p>
            {[
              { l: "Vitamin B12", v: "158 pg/mL", s: "Low", c: "#9F1239", sbg: "#FFF1F2", sb: "#FECDD3" },
              { l: "Glucose", v: "92 mg/dL", s: "Normal", c: "#166534", sbg: "#F0FDF4", sb: "#BBF7D0" },
              { l: "Haemoglobin", v: "13.2 g/dL", s: "Normal", c: "#166534", sbg: "#F0FDF4", sb: "#BBF7D0" },
            ].map((m) => (
              <div key={m.l} className="flex items-center justify-between mb-1.5">
                <span className="text-[8px]" style={{ color: C.textSoft }}>{m.l}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-medium" style={{ color: C.textMid }}>{m.v}</span>
                  <span className="text-[7px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: m.sbg, color: m.c, border: `1px solid ${m.sb}` }}>{m.s}</span>
                </div>
              </div>
            ))}
          </div>

          {/* NOVA insight */}
          <div className="rounded-xl p-2.5" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
            <div className="flex items-start gap-2">
              <img src={LOGO_URL} alt="" className="w-4 h-4 mt-0.5" />
              <p className="text-[8px] leading-relaxed" style={{ color: "#92400E" }}>
                <span className="font-bold">NOVA:</span> Your B12 is below range. This likely explains your fatigue this week.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="relative mx-auto" style={{ width: 256, height: 520 }}>
      {/* Phone glow */}
      <div className="absolute pointer-events-none"
        style={{ inset: 0, borderRadius: 40, background: "radial-gradient(ellipse 140% 80% at 50% 110%, rgba(91,94,244,0.14) 0%, transparent 60%)", filter: "blur(20px)", transform: "scaleX(0.85) translateY(22px)" }} />

      {/* Phone shell — silver gradient */}
      <div className="absolute inset-0 rounded-[38px]"
        style={{
          background: "linear-gradient(160deg, #E2E8F0 0%, #CBD5E1 55%, #B8C4D4 100%)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.75), 0 0 0 1.5px rgba(148,163,184,0.55), 0 32px 64px rgba(15,23,42,0.16), 0 8px 24px rgba(15,23,42,0.09)",
        }} />

      {/* Side buttons */}
      <div className="absolute rounded-full" style={{ right: -2, top: 90, width: 3, height: 32, background: "rgba(148,163,184,0.65)" }} />
      <div className="absolute rounded-full" style={{ left: -2, top: 80, width: 3, height: 24, background: "rgba(148,163,184,0.65)" }} />
      <div className="absolute rounded-full" style={{ left: -2, top: 116, width: 3, height: 24, background: "rgba(148,163,184,0.65)" }} />

      {/* Screen */}
      <div className="absolute rounded-[30px] overflow-hidden flex flex-col" style={{ inset: 7, background: C.surface }}>

        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2 flex-shrink-0" style={{ background: C.surface }}>
          <span className="text-[9px] font-black" style={{ color: C.text }}>9:41</span>
          <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-14 h-3.5 rounded-full" style={{ background: "#CBD5E1" }} />
          <div className="flex items-center gap-0.5">
            {[5, 4, 3, 2].map((h, i) => (
              <div key={i} style={{ width: 2, height: h + 1, background: i === 3 ? "#CBD5E1" : C.textMid, borderRadius: 1 }} />
            ))}
          </div>
        </div>

        {/* Tab pills */}
        <div className="flex gap-1 px-3 pb-2.5 flex-shrink-0" style={{ background: C.surface }}>
          {screens.map((s, i) => (
            <button key={s.label} onClick={() => { setScreen(i); setAutoPlay(false); }}
              className="flex-1 py-1.5 rounded-xl text-[8px] font-black transition-all flex items-center justify-center gap-1"
              style={screen === i
                ? { background: C.indigo, color: "#FFFFFF", boxShadow: "0 3px 10px rgba(91,94,244,0.28)" }
                : { background: C.surface2, color: C.textSoft, border: `1px solid ${C.border}` }
              }>
              <div className="w-1 h-1 rounded-full"
                style={{ background: screen === i ? "rgba(255,255,255,0.70)" : s.dotColor }} />
              {s.label}
            </button>
          ))}
        </div>

        <div style={{ height: 1, background: C.border, flexShrink: 0 }} />

        {/* Screen content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={screen}
              initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="h-full">
              {screens[screen].content}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Desktop phone badges anchored to the phone mockup */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none">
        <StatBadge value="98%" label="Private" delay={0.55} style={{ top: 22, right: -86 }} />
        <StatBadge value="24/7" label="Available" delay={0.65} style={{ bottom: 92, right: -86 }} />
      </div>
    </div>
  );
}

// ─── Floating stat badge ──────────────────────────────────────────────────────
function StatBadge({ value, label, delay = 0, style }: { value: string; label: string; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="absolute rounded-2xl px-4 py-3 flex flex-col gap-0.5"
      style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 12px 32px rgba(15,23,42,0.09)", ...style }}>
      <span className="text-lg font-black leading-none" style={{ fontFamily: "var(--font-outfit, sans-serif)", background: VG_GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{value}</span>
      <span className="text-[10px] font-medium" style={{ color: C.textSoft }}>{label}</span>
    </motion.div>
  );
}

// ─── Feature grid ─────────────────────────────────────────────────────────────
function FeatureGrid() {
  const features = [
    {
      icon: <MessageCircle size={20} color="#4338CA" />,
      tag: "AI Chat", title: "NOVA — Your AI Companion",
      desc: "Private, empathetic AI that reads your reports, tracks your meds, and shifts its tone to how you actually feel today.",
      wide: true, accent: "#4338CA", tagBg: "#EEF2FF", tagBorder: "#C7D2FE", iconBg: "#EEF2FF",
    },
    {
      icon: <Upload size={20} color="#92400E" />,
      tag: "Clinical OCR", title: "Medical Vault",
      desc: "Upload blood tests, X-rays, or prescriptions. NOVA extracts markers, flags anomalies, and grounds every reply in your real data.",
      wide: false, accent: "#92400E", tagBg: "#FFFBEB", tagBorder: "#FDE68A", iconBg: "#FFFBEB",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#0D9488" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="3" stroke="#0D9488" strokeWidth="1.6" />
        </svg>
      ),
      tag: "Privacy-first", title: "Emotion Scan",
      desc: "One button. One private snapshot. NOVA reads your face locally — zero data ever leaves your device.",
      wide: false, accent: "#0D9488", tagBg: "#F0FDFA", tagBorder: "#99F6E4", iconBg: "#F0FDFA",
    },
    {
      icon: <Zap size={20} color="#9F1239" />,
      tag: "Visual AI", title: "Injury Triage",
      desc: "Photograph a swollen joint. NOVA identifies trauma, suggests R.I.C.E. protocol, and builds low-impact exercises for your specific injury.",
      wide: false, accent: "#9F1239", tagBg: "#FFF1F2", tagBorder: "#FECDD3", iconBg: "#FFF1F2",
    },
    {
      icon: <Heart size={20} color="#6D28D9" />,
      tag: "Real-time", title: "Medication Tracker",
      desc: "NOVA tracks your schedule and checks in mid-conversation — gently, not as a notification alarm.",
      wide: false, accent: "#6D28D9", tagBg: "#F5F3FF", tagBorder: "#DDD6FE", iconBg: "#F5F3FF",
    },
    {
      icon: <Shield size={20} color="#166534" />,
      tag: "Safety net", title: "Smart SOS",
      desc: "Add trusted contacts, keep crisis hotlines close, and use direct-call SOS options. SMS alerts can be enabled later with provider credentials.",
      wide: true, accent: "#166534", tagBg: "#F0FDF4", tagBorder: "#BBF7D0", iconBg: "#F0FDF4",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {features.map((f, i) => (
        <FadeUp key={f.title} delay={i * 0.05} className={f.wide ? "md:col-span-2 lg:col-span-2" : ""}>
          <motion.div
            whileHover={{ y: -3, boxShadow: "0 12px 40px rgba(15,23,42,0.08)" }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="h-full rounded-3xl p-6 relative overflow-hidden group cursor-default"
            style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>

            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: `radial-gradient(ellipse 70% 70% at 0% 100%, ${f.tagBg} 0%, transparent 70%)` }} />

            <div className="relative z-10">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                style={{ background: f.iconBg, border: `1px solid ${f.tagBorder}` }}>
                {f.icon}
              </div>
              <span className="inline-block text-[10px] font-black px-2.5 py-1 rounded-full mb-3 uppercase tracking-wide"
                style={{ background: f.tagBg, color: f.accent, border: `1px solid ${f.tagBorder}` }}>
                {f.tag}
              </span>
              <h3 className="font-black text-base mb-2 text-balance" style={{ fontFamily: "var(--font-outfit, sans-serif)", color: C.text }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: C.textMid }}>{f.desc}</p>
            </div>
          </motion.div>
        </FadeUp>
      ))}
    </div>
  );
}

const STATS = [
  { value: "98%", label: "Privacy Score", sub: "Zero cloud biometrics" },
  { value: "<1s", label: "Analysis Speed", sub: "On-device inference" },
  { value: "24/7", label: "NOVA Available", sub: "Always there for you" },
  { value: "5-star", label: "Early Reviews", sub: "Loved by beta users" },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bg, color: C.text }}>

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 fade-in-down"
        style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(24px)", borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)", border: "1px solid #C7D2FE" }}>
              <img src={LOGO_URL} alt="NOVA" className="w-5 h-5 object-contain" />
            </div>
            <span className="font-black text-lg tracking-tight" style={{ fontFamily: "var(--font-outfit, sans-serif)", color: C.text }}>NOVA</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {["Features", "How it works", "Privacy"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm font-medium transition-colors"
                style={{ color: C.textMid }}>{item}</a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <InstallButton variant="header" />
            <Link href="/auth?mode=login" className="text-sm font-semibold" style={{ color: C.textMid }}>
              Sign in
            </Link>
            <Link href="/auth?mode=register"
              className="btn-primary text-sm px-5 py-2.5 rounded-full font-bold text-white inline-flex items-center gap-2">
              Sign up <ArrowRight size={14} />
            </Link>
          </div>

          <button className="md:hidden press-feedback" onClick={() => setMenuOpen(!menuOpen)} style={{ color: C.textMid }}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
              style={{ background: C.surface, borderTop: `1px solid ${C.border}` }}>
              <div className="px-6 py-5 flex flex-col gap-4">
                {["Features", "How it works", "Privacy"].map((item) => (
                  <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                    className="text-sm font-medium" style={{ color: C.textMid }}
                    onClick={() => setMenuOpen(false)}>{item}</a>
                ))}
                <Link href="/auth?mode=login" className="py-3 rounded-full text-sm font-bold text-center"
                  style={{ color: C.textMid, border: `1px solid ${C.border}` }}
                  onClick={() => setMenuOpen(false)}>
                  Sign in
                </Link>
                <Link href="/auth?mode=register" className="btn-primary py-3 rounded-full text-sm font-bold text-center text-white"
                  onClick={() => setMenuOpen(false)}>
                  Sign up
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-16 px-5 overflow-hidden flex items-center"
        style={{ background: "linear-gradient(160deg, #EEF2FF 0%, #F8F9FC 40%, #FFFBEB 100%)", minHeight: "100svh" }}>

        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute" style={{
            top: "-15%", left: "-10%", width: 700, height: 700,
            background: "radial-gradient(circle, rgba(91,94,244,0.12) 0%, transparent 65%)", filter: "blur(80px)"
          }} />
          <div className="absolute" style={{
            top: "5%", right: "-15%", width: 600, height: 600,
            background: "radial-gradient(circle, rgba(217,119,6,0.10) 0%, transparent 65%)", filter: "blur(100px)"
          }} />
          <div className="absolute" style={{
            bottom: "-20%", left: "40%", width: 500, height: 500,
            background: "radial-gradient(circle, rgba(13,148,136,0.07) 0%, transparent 60%)", filter: "blur(90px)"
          }} />
          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(rgba(15,23,42,0.6) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        </div>

        <div className="max-w-6xl mx-auto w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

            {/* Left — copy */}
            <div className="text-center lg:text-left">

              {/* Pill badge */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-bold mb-6"
                style={{ background: "#EEF2FF", color: "#4338CA", border: "1px solid #C7D2FE" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#16A34A" }} />
                Private by design — all AI runs on your device
              </motion.div>

              {/* Hero headline */}
              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontFamily: "var(--font-outfit, Outfit, sans-serif)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em", color: C.text }}
                className="text-[38px] sm:text-[54px] lg:text-[64px] mb-6 text-balance">
                Health AI that{" "}
                <GradText>actually</GradText>{" "}
                knows you.
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.14 }}
                className="text-base lg:text-lg leading-relaxed mb-7 mx-auto lg:mx-0"
                style={{ color: C.textMid, maxWidth: 480 }}>
                Emotion-aware conversations, medical report analysis, and personalised recovery plans — running privately on your device.
              </motion.p>

              {/* CTAs */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.22 }}
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
                <Link href="/auth?mode=register"
                  className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-bold text-white press-feedback">
                  Start for free <ArrowRight size={15} />
                </Link>
                <Link href="#features"
                  className="btn-ghost inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-semibold press-feedback">
                  See features
                </Link>
              </motion.div>

              {/* Social proof */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                className="flex items-center gap-4 justify-center lg:justify-start flex-wrap">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#D97706" color="#D97706" />)}
                  <span className="text-xs font-semibold ml-1.5" style={{ color: C.textMid }}>Loved by early users</span>
                </div>
                <div className="w-px h-4" style={{ background: C.border }} />
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
                  <Shield size={11} color="#4338CA" />
                  <span className="text-[10px] font-bold" style={{ color: "#4338CA" }}>HIPAA-ready</span>
                </div>
              </motion.div>
            </div>

            {/* Right — phone */}
            <div className="relative flex items-center justify-center lg:justify-end mt-8 lg:mt-0">
              <div className="relative">
                <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.9, delay: 0.20, ease: [0.22, 1, 0.36, 1] }}
                  className="relative scale-[0.82] sm:scale-90 lg:scale-100 origin-center">
                  <PhoneMockup />
                </motion.div>

                <div className="absolute inset-0 pointer-events-none">
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.80, type: "spring", stiffness: 280, damping: 20 }}
                    className="absolute rounded-2xl px-3 py-2.5 flex items-center gap-2"
                    style={{ top: 152, right: -72, background: C.surface, border: "1px solid #FECDD3", boxShadow: "0 8px 24px rgba(15,23,42,0.09)" }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#FFF1F2" }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: C.rose }} />
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: "#9F1239" }}>SOS Calls</span>
                  </motion.div>
                </div>
              </div>

              {/* Mobile inline stat pills — shown only on mobile */}
              <div className="lg:hidden absolute bottom-0 left-0 right-0 flex justify-center gap-3 pointer-events-none">
                <div className="rounded-2xl px-4 py-2 flex flex-col gap-0.5"
                  style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 8px 24px rgba(15,23,42,0.08)" }}>
                  <span className="text-base font-black leading-none" style={{ fontFamily: "var(--font-outfit, sans-serif)", background: "linear-gradient(135deg,#4338CA,#5B5EF4,#D97706,#F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>98%</span>
                  <span className="text-[10px] font-medium" style={{ color: C.textSoft }}>Private</span>
                </div>
                <div className="rounded-2xl px-4 py-2 flex flex-col gap-0.5"
                  style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 8px 24px rgba(15,23,42,0.08)" }}>
                  <span className="text-base font-black leading-none" style={{ fontFamily: "var(--font-outfit, sans-serif)", background: "linear-gradient(135deg,#4338CA,#5B5EF4,#D97706,#F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>24/7</span>
                  <span className="text-[10px] font-medium" style={{ color: C.textSoft }}>Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.textSoft }}>Scroll to explore</span>
          <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.6, repeat: Infinity }}
            className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5"
            style={{ borderColor: C.borderMid }}>
            <div className="w-1 h-2 rounded-full" style={{ background: "#4338CA" }} />
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────────── */}
      <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.07}>
              <div className="text-center">
                <p className="text-3xl font-black mb-1" style={{ fontFamily: "var(--font-outfit, sans-serif)", background: VG_GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{s.value}</p>
                <p className="text-sm font-bold mb-0.5" style={{ color: C.text }}>{s.label}</p>
                <p className="text-xs" style={{ color: C.textSoft }}>{s.sub}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="label-xs mb-4" style={{ color: "#4338CA" }}>Everything you need</p>
            <h2 className="text-4xl lg:text-5xl font-black text-balance mx-auto mb-5"
              style={{ fontFamily: "var(--font-outfit, sans-serif)", letterSpacing: "-0.025em", maxWidth: 600, color: C.text }}>
              One AI. Every part of your health.
            </h2>
            <p className="text-lg mx-auto" style={{ color: C.textMid, maxWidth: 480 }}>
              Built for people who want real intelligence — not generic chatbot advice.
            </p>
          </FadeUp>
          <FeatureGrid />
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6"
        style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="label-xs mb-4" style={{ color: "#4338CA" }}>Simple by design</p>
            <h2 className="text-4xl font-black text-balance mx-auto"
              style={{ fontFamily: "var(--font-outfit, sans-serif)", letterSpacing: "-0.025em", maxWidth: 560, color: C.text }}>
              Up and running in under a minute.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create your account", desc: "Sign up and complete a brief privacy consent. Your profile is encrypted end-to-end.", color: "#4338CA", iconBg: "#EEF2FF", iconBorder: "#C7D2FE" },
              { step: "02", title: "Upload your first report", desc: "Drop in a blood test, prescription, or injury photo. NOVA extracts the data instantly.", color: "#92400E", iconBg: "#FFFBEB", iconBorder: "#FDE68A" },
              { step: "03", title: "Talk to NOVA", desc: "Ask anything. NOVA uses your data to give responses grounded in your actual health picture.", color: "#0D9488", iconBg: "#F0FDFA", iconBorder: "#99F6E4" },
            ].map((s, i) => (
              <FadeUp key={s.step} delay={i * 0.08}>
                <div className="rounded-3xl p-7 relative overflow-hidden h-full"
                  style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                  <div className="absolute top-4 right-5 font-black select-none pointer-events-none"
                    style={{ fontSize: 64, lineHeight: 1, color: `${s.color}14`, fontFamily: "var(--font-outfit, sans-serif)" }}>
                    {s.step}
                  </div>
                  <div className="relative z-10">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-5"
                      style={{ background: s.iconBg, border: `1px solid ${s.iconBorder}` }}>
                      <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: s.color }}>Step {s.step}</p>
                    <h3 className="font-black text-lg mb-2" style={{ fontFamily: "var(--font-outfit, sans-serif)", color: C.text }}>{s.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: C.textMid }}>{s.desc}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIVACY ────────────────────────────────────────────────────────── */}
      <section id="privacy" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(13,148,136,0.05) 0%, transparent 65%)" }} />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <FadeUp>
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-8"
              style={{ background: "#F0FDFA", border: "1px solid #99F6E4", boxShadow: "0 0 32px rgba(13,148,136,0.10)" }}>
              <Shield size={28} color="#0D9488" />
            </div>
            <p className="label-xs mb-4" style={{ color: "#0D9488" }}>Privacy by default</p>
            <h2 className="text-4xl lg:text-5xl font-black text-balance mb-6"
              style={{ fontFamily: "var(--font-outfit, sans-serif)", letterSpacing: "-0.025em", color: C.text }}>
              Your health data stays{" "}<GradText>yours.</GradText>
            </h2>
            <p className="text-lg leading-relaxed mb-10" style={{ color: C.textMid }}>
              No data brokers. No cloud analysis of your biometrics. All facial scanning, report parsing, and AI inference runs locally on your device — always.
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              {["On-device AI inference", "Zero biometric uploads", "End-to-end encryption", "No third-party sharing", "HIPAA-ready architecture"].map((b) => (
                <div key={b} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ background: "#F0FDFA", color: "#0D9488", border: "1px solid #99F6E4" }}>
                  <Check size={12} /> {b}
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 35%, #FFFBEB 70%, #FFF7ED 100%)", borderTop: `1px solid ${C.border}` }}>
        {/* Subtle center glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 80% at 50% 50%, rgba(91,94,244,0.06) 0%, transparent 65%)" }} />

        <FadeUp>
          <div className="max-w-2xl mx-auto text-center relative z-10">
            <h2 className="text-4xl lg:text-5xl font-black text-balance mb-5"
              style={{ fontFamily: "var(--font-outfit, sans-serif)", letterSpacing: "-0.025em", color: C.text }}>
              Ready to meet your <GradText>AI health companion?</GradText>
            </h2>
            <p className="text-lg mb-10" style={{ color: C.textMid }}>
              Free to start. Private by default. Always there.
            </p>
            <Link href="/auth?mode=register"
              className="btn-primary inline-flex items-center gap-2 px-10 py-4 rounded-full text-base font-bold text-white press-feedback">
              Get started for free <ArrowRight size={16} />
            </Link>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="px-6 py-10" style={{ borderTop: `1px solid ${C.border}`, background: C.surface }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)", border: "1px solid #C7D2FE" }}>
              <img src={LOGO_URL} alt="NOVA" className="w-4 h-4 object-contain" />
            </div>
            <span className="font-black" style={{ fontFamily: "var(--font-outfit, sans-serif)", color: C.text }}>NOVA</span>
          </div>
          <p className="text-xs text-center" style={{ color: C.textSoft, maxWidth: 420 }}>
            NOVA provides wellness information only — not medical advice. Always consult a qualified healthcare professional.
          </p>
          <p className="text-xs" style={{ color: C.textSoft }}>&copy; 2026 NOVA Health AI</p>
        </div>
      </footer>
    </div>
  );
}
