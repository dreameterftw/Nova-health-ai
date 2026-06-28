"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, MessageCircle, X, AlertTriangle, MapPin, Wind } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SOSOverlayProps {
  active: boolean;
  onClose: () => void;
}

const C = {
  surface: "#FFFFFF",
  surface2: "#F1F3F8",
  border: "#E2E8F0",
  rose: "#E11D48",
  roseLight: "#F43F5E",
  roseBg: "#FFF1F2",
  roseBorder: "#FECDD3",
  amber: "#D97706",
  amberBg: "#FFFBEB",
  amberBorder: "#FDE68A",
  indigo: "#5B5EF4",
  indigoLight: "#4338CA",
  indigoBg: "#EEF2FF",
  indigoBorder: "#C7D2FE",
  green: "#10B981",
  text: "#0F172A",
  textMid: "#334155",
  textSoft: "#64748B",
};

const SMS_COUNTDOWN_SECS = 4;

type Hotline = {
  name: string;
  number: string;
  desc: string;
  category: "crisis" | "emergency" | "support" | "family";
  tel: string;
};

const HOTLINES: Hotline[] = [
  {
    name: "iCall (TISS Mumbai)",
    number: "9152987821",
    desc: "Trained psychologists — Mon to Sat, 8 AM–10 PM",
    category: "crisis",
    tel: "tel:9152987821",
  },
  {
    name: "AASRA Helpline",
    number: "9820466627",
    desc: "24/7 suicide prevention & crisis support, free",
    category: "crisis",
    tel: "tel:9820466627",
  },
  {
    name: "Vandrevala Foundation",
    number: "1860-2662-345",
    desc: "24/7 mental health crisis line across India",
    category: "support",
    tel: "tel:18602662345",
  },
  {
    name: "Emergency Services",
    number: "112",
    desc: "All-in-one emergency — Police, Fire, Ambulance",
    category: "emergency",
    tel: "tel:112",
  },
  {
    name: "Ambulance (CATS / 108)",
    number: "108",
    desc: "Free ambulance service — all states in India",
    category: "emergency",
    tel: "tel:108",
  },
];

const CATEGORY_STYLE = {
  crisis: { color: C.rose, bg: C.roseBg, border: C.roseBorder },
  emergency: { color: "#C2410C", bg: "#FFF7ED", border: "#FED7AA" },
  support: { color: C.indigoLight, bg: "#EEF2FF", border: "#C7D2FE" },
  family: { color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
};

// ADDED — 4-7-8 breathing guide shown while waiting for help
function BreathingGuide({ onDismiss }: { onDismiss: () => void }) {
  const PHASES = [
    { label: "Breathe in", secs: 4, color: "#5B5EF4", scale: 1.35 },
    { label: "Hold", secs: 7, color: "#D97706", scale: 1.35 },
    { label: "Breathe out", secs: 8, color: "#0D9488", scale: 1.0 },
  ];

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const total = PHASES[phaseIdx].secs;
        if (prev + 1 >= total) {
          setPhaseIdx(i => (i + 1) % PHASES.length);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phaseIdx]);

  const phase = PHASES[phaseIdx];
  const progress = elapsed / phase.secs;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="rounded-2xl p-5 text-center"
      style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Wind size={13} color={C.textSoft} />
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: C.textSoft }}>
            4-7-8 Breathing
          </p>
        </div>
        <button onClick={onDismiss}
          className="text-[10px] font-black px-2 py-1 rounded-full"
          style={{ background: C.border, color: C.textSoft }}>
          Hide
        </button>
      </div>

      {/* Animated circle */}
      <div className="relative mx-auto mb-3 flex items-center justify-center"
        style={{ width: 100, height: 100 }}>
        <svg width="100" height="100" className="absolute inset-0">
          <circle cx="50" cy="50" r="44" fill="none"
            stroke={C.border} strokeWidth="5" />
          <motion.circle
            cx="50" cy="50" r="44"
            fill="none"
            stroke={phase.color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 44}`}
            animate={{ strokeDashoffset: (1 - progress) * 2 * Math.PI * 44 }}
            transition={{ duration: 0.9, ease: "linear" }}
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
          />
        </svg>
        <motion.div
          animate={{ scale: phase.scale }}
          transition={{ duration: phase.secs * 0.9, ease: phase.label === "Breathe out" ? "easeIn" : "easeOut" }}
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: `${phase.color}20` }}>
          <p className="text-lg font-black" style={{ color: phase.color }}>
            {phase.secs - elapsed}
          </p>
        </motion.div>
      </div>

      <p className="font-black text-sm" style={{ color: C.text }}>{phase.label}</p>
      <p className="text-[10px] mt-1" style={{ color: C.textSoft }}>
        Inhale 4 · Hold 7 · Exhale 8 — repeat 3 times
      </p>
    </motion.div>
  );
}

// ADDED — resolves geolocation to a readable string for the SMS body
async function resolveLocation(): Promise<string | null> {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        resolve(`https://maps.google.com/?q=${latitude.toFixed(5)},${longitude.toFixed(5)}`);
      },
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}

export function SOSOverlay({ active, onClose }: SOSOverlayProps) {
  const { user } = useAuth();

  const [showSmsNotice, setShowSmsNotice] = useState(false);
  const [smsStatus, setSmsStatus] = useState<"idle" | "countdown" | "sending" | "sent" | "failed">("idle");
  const [smsError, setSmsError] = useState<string | null>(null);
  // ADDED — countdown state
  const [countdown, setCountdown] = useState(SMS_COUNTDOWN_SECS);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);
  // ADDED — location string resolved before sending
  const [locationUrl, setLocationUrl] = useState<string | null>(null);
  // ADDED — breathing guide visibility
  const [showBreathing, setShowBreathing] = useState(false);

  const familyMembers = user?.familyCircle || [];
  const firstName = (user?.name || "").split(" ")[0] || "friend";
  const hasContacts = familyMembers.length > 0;

  // ADDED — reset all state when overlay closes and reopens
  useEffect(() => {
    if (!active) {
      setShowSmsNotice(false);
      setSmsStatus("idle");
      setSmsError(null);
      setCountdown(SMS_COUNTDOWN_SECS);
      setLocationUrl(null);
      setShowBreathing(false);
      cancelledRef.current = false;
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
  }, [active]);

  const handleClose = () => {
    cancelledRef.current = true;
    if (countdownRef.current) clearInterval(countdownRef.current);
    onClose();
  };

  // ADDED — request location as soon as overlay opens, silently
  useEffect(() => {
    if (!active) return;
    resolveLocation().then(setLocationUrl);
  }, [active]);

  // ADDED — start 4-second countdown then fire SMS
  const handleSendAlert = useCallback(async () => {
    if (!hasContacts) {
      setSmsError("Add at least one emergency contact to your family circle before sending an SOS SMS.");
      setSmsStatus("failed");
      setShowSmsNotice(true);
      return;
    }

    cancelledRef.current = false;
    setSmsStatus("countdown");
    setCountdown(SMS_COUNTDOWN_SECS);
    setShowSmsNotice(true);

    let remaining = SMS_COUNTDOWN_SECS;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownRef.current!);
        if (!cancelledRef.current) void fireSMS();
      }
    }, 1000);
  }, [hasContacts, locationUrl]);

  // ADDED — cancel during countdown window
  const handleCancelCountdown = useCallback(() => {
    cancelledRef.current = true;
    if (countdownRef.current) clearInterval(countdownRef.current);
    setSmsStatus("idle");
    setShowSmsNotice(false);
    setCountdown(SMS_COUNTDOWN_SECS);
  }, []);

  const fireSMS = async () => {
    setSmsStatus("sending");
    setSmsError(null);

    const recipients = familyMembers.map(m => m.phone?.trim()).filter(Boolean);
    const locationPart = locationUrl ? ` Location: ${locationUrl}` : "";
    const message = `NOVA SOS: ${firstName} needs urgent help. Please call immediately.${locationPart}`;

    try {
      const response = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients, message }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || json?.details || "Failed to deliver SMS.");
      setSmsStatus("sent");
    } catch (error: any) {
      setSmsStatus("failed");
      setSmsError(error?.message || "Unable to send SMS at this time.");
    }
  };

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="sos-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3"
          style={{ background: "rgba(3,5,12,0.92)", backdropFilter: "blur(14px)" }}>

          {/* Pulsing rose border */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              boxShadow: [
                "inset 0 0 0 0px rgba(244,63,94,0.00)",
                "inset 0 0 0 5px rgba(244,63,94,0.42)",
                "inset 0 0 0 0px rgba(244,63,94,0.00)",
              ],
            }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />

          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: C.surface, border: "1px solid rgba(244,63,94,0.22)" }}>

            {/* Header */}
            <div className="relative overflow-hidden px-5 pt-6 pb-5 text-center"
              style={{
                background: "linear-gradient(165deg, rgba(244,63,94,0.22) 0%, rgba(244,63,94,0.05) 100%)",
                borderBottom: `1px solid ${C.roseBorder}`,
              }}>
              <div className="mx-auto mb-3 relative" style={{ width: 70, height: 70 }}>
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-2 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(244,63,94,0.18)",
                    border: "2px solid rgba(244,63,94,0.55)",
                    boxShadow: "0 0 28px rgba(244,63,94,0.40)",
                  }}>
                  <AlertTriangle size={22} color={C.roseLight} strokeWidth={2} />
                </motion.div>
              </div>

              <h2 className="text-xl font-black mb-0.5"
                style={{ fontFamily: "var(--font-outfit, sans-serif)", color: C.text }}>
                Emergency SOS
              </h2>
              <p className="text-xs" style={{ color: "#BE123C" }}>
                You are not alone — NOVA is here with you
              </p>

              {/* ADDED — location indicator */}
              {locationUrl && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={{ background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0" }}>
                  <MapPin size={10} />
                  Location ready to share
                </motion.div>
              )}

              <button onClick={handleClose}
                className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 text-slate-500">
                <X size={13} />
              </button>
            </div>

            {/* ADDED — scrollable content area with enough height on small phones */}
            <div className="px-4 py-4 overflow-y-auto" style={{ maxHeight: "62svh" }}>
              <AnimatePresence mode="wait">

                {/* ── Main panel (before SMS flow) ── */}
                {!showSmsNotice && (
                  <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                    <p className="text-sm text-center mb-4" style={{ color: C.textMid }}>
                      <strong style={{ color: C.text }}>{firstName}</strong>, help is available. Tap to call:
                    </p>

                    {/* ADDED — no contacts warning shown proactively before button tap */}
                    {!hasContacts && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="rounded-2xl px-4 py-3 mb-4 flex items-start gap-2"
                        style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}` }}>
                        <AlertTriangle size={13} color={C.amber} className="flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] font-semibold leading-relaxed" style={{ color: "#92400E" }}>
                          No emergency contacts added. Go to Profile → Family Circle to add someone who can receive your SOS SMS.
                        </p>
                      </motion.div>
                    )}

                    <div className="space-y-2 mb-5">
                      {/* Family members */}
                      {familyMembers.map((m, i) => (
                        <motion.a key={`f-${i}`} href={`tel:${m.phone}`}
                          className="flex items-center gap-3 p-3 rounded-2xl no-underline border transition-all active:scale-[0.98]"
                          style={{ background: CATEGORY_STYLE.family.bg, borderColor: CATEGORY_STYLE.family.border }}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-green-100 border border-green-200">
                            <Phone size={13} className="text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold">{m.name}</p>
                            <p className="text-[10px] text-green-700 font-bold">{m.relation} · {m.phone}</p>
                          </div>
                          <div className="w-6 h-6 rounded-lg bg-green-600 flex items-center justify-center">
                            <Phone size={11} color="white" />
                          </div>
                        </motion.a>
                      ))}

                      {/* Hotlines */}
                      {HOTLINES.map((h) => {
                        const st = CATEGORY_STYLE[h.category];
                        return (
                          <motion.a key={h.name} href={h.tel}
                            className="flex items-center gap-3 p-3 rounded-2xl no-underline border transition-all active:scale-[0.98]"
                            style={{ background: st.bg, borderColor: st.border }}>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                              style={{ background: `${st.color}15`, border: `1px solid ${st.border}` }}>
                              <Phone size={13} color={st.color} />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold leading-tight">{h.name}</p>
                              <p className="text-[11px]" style={{ color: C.textSoft }}>{h.desc}</p>
                              <p className="text-sm font-black mt-0.5" style={{ color: st.color }}>{h.number}</p>
                            </div>
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                              style={{ background: st.color }}>
                              <Phone size={11} color="white" />
                            </div>
                          </motion.a>
                        );
                      })}
                    </div>

                    {/* ADDED — breathing guide toggle */}
                    <div className="mb-4">
                      <AnimatePresence>
                        {showBreathing ? (
                          <BreathingGuide onDismiss={() => setShowBreathing(false)} />
                        ) : (
                          <motion.button
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setShowBreathing(true)}
                            className="w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2"
                            style={{
                              background: C.indigoBg,
                              border: `1px solid ${C.indigoBorder}`,
                              color: C.indigoLight,
                            }}>
                            <Wind size={13} />
                            Feeling overwhelmed? Try a breathing exercise
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px bg-slate-100" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Broadcast Alert
                      </span>
                      <div className="flex-1 h-px bg-slate-100" />
                    </div>

                    <div className="flex gap-2.5">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSendAlert}
                        className="flex-1 py-3.5 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2"
                        style={{
                          background: "linear-gradient(135deg, #F43F5E 0%, #DC2626 100%)",
                          boxShadow: "0 6px 20px rgba(244,63,94,0.38)",
                          opacity: !hasContacts ? 0.5 : 1,
                        }}>
                        <MessageCircle size={14} />
                        {locationUrl ? "Send SOS + Location" : "Send SOS SMS"}
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleClose}
                        className="flex-1 py-3.5 rounded-2xl font-bold text-sm bg-slate-100 text-slate-600">
                        I'm Safe
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* ── Countdown panel ── ADDED */}
                {showSmsNotice && smsStatus === "countdown" && (
                  <motion.div key="countdown"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6">
                    <motion.div
                      className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center"
                      style={{ background: C.roseBg, border: `2px solid ${C.roseBorder}` }}
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}>
                      <p className="text-5xl font-black" style={{ color: C.rose }}>{countdown}</p>
                    </motion.div>
                    <h3 className="text-lg font-black mb-1" style={{ color: C.text }}>
                      Sending SOS in {countdown}…
                    </h3>
                    <p className="text-xs mb-6" style={{ color: C.textSoft }}>
                      {locationUrl ? "Your location will be included." : "Location unavailable — sending without it."}
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleCancelCountdown}
                      className="w-full py-3.5 rounded-2xl font-black text-sm"
                      style={{ background: C.surface2, color: C.textMid, border: `1px solid ${C.border}` }}>
                      Cancel — I'm Safe
                    </motion.button>
                  </motion.div>
                )}

                {/* ── Sending / sent / failed panel ── */}
                {showSmsNotice && smsStatus !== "countdown" && smsStatus !== "idle" && (
                  <motion.div key="after-send"
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4">

                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{
                        background: smsStatus === "sent" ? "#F0FDF4" : C.amberBg,
                        border: `2px solid ${smsStatus === "sent" ? "#BBF7D0" : C.amberBorder}`,
                      }}>
                      {smsStatus === "sending" ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-8 h-8 rounded-full border-4 border-amber-200 border-t-amber-500" />
                      ) : smsStatus === "sent" ? (
                        <MessageCircle size={28} color={C.green} />
                      ) : (
                        <AlertTriangle size={28} color={C.amber} />
                      )}
                    </div>

                    {smsStatus === "sending" && (
                      <>
                        <h3 className="text-lg font-black mb-2" style={{ color: C.text }}>Sending Alert…</h3>
                        <p className="text-sm mb-4" style={{ color: C.textSoft }}>
                          Broadcasting your SOS to {familyMembers.length} contact{familyMembers.length > 1 ? "s" : ""}.
                        </p>
                      </>
                    )}

                    {smsStatus === "sent" && (
                      <>
                        <h3 className="text-lg font-black mb-2" style={{ color: C.text }}>SOS Sent ✓</h3>
                        <p className="text-sm mb-4" style={{ color: C.textSoft }}>
                          {familyMembers.length} contact{familyMembers.length > 1 ? "s have" : " has"} been notified.
                          {locationUrl ? " Your location was included." : ""}
                          {" "}Follow up by phone if needed.
                        </p>
                      </>
                    )}

                    {smsStatus === "failed" && (
                      <>
                        <h3 className="text-lg font-black mb-2" style={{ color: C.text }}>SMS Failed</h3>
                        <p className="text-sm mb-3" style={{ color: C.textSoft }}>
                          Please call the numbers directly — they are always available.
                        </p>
                        {smsError && (
                          <div className="p-3 rounded-2xl mb-4"
                            style={{ background: C.roseBg, border: `1px solid ${C.roseBorder}` }}>
                            <p className="text-[10px] font-bold" style={{ color: C.rose }}>{smsError}</p>
                          </div>
                        )}
                      </>
                    )}

                    <button
                      onClick={() => { setShowSmsNotice(false); setSmsStatus("idle"); }}
                      className="w-full py-3.5 rounded-2xl font-bold text-white text-sm"
                      style={{ background: C.indigo, boxShadow: "0 8px 24px rgba(91,94,244,0.32)" }}>
                      Back to Call Options
                    </button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 pt-2 text-center">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                NOVA SOS is a support tool. For life-threatening emergencies, call{" "}
                <strong>112</strong> or <strong>108</strong> immediately.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}