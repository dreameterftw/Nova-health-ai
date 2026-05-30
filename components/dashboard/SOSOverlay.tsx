"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, MessageCircle, X, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SOSOverlayProps {
  active: boolean;
  onClose: () => void;
}

const C = {
  surface:     "#FFFFFF",
  surface2:    "#F1F3F8",
  border:      "#E2E8F0",
  rose:        "#E11D48",
  roseLight:   "#F43F5E",
  roseBg:      "#FFF1F2",
  roseBorder:  "#FECDD3",
  amber:       "#D97706",
  amberBg:     "#FFFBEB",
  amberBorder: "#FDE68A",
  indigo:      "#5B5EF4",
  indigoLight: "#4338CA",
  indigoBg:    "#EEF2FF",
  indigoBorder:"#C7D2FE",
  text:        "#0F172A",
  textMid:     "#334155",
  textSoft:    "#64748B",
};

type Hotline = {
  name: string;
  number: string;
  desc: string;
  category: "crisis" | "emergency" | "support" | "family";
  tel: string;
};

// India-centric emergency and mental health hotlines
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
  crisis:    { color: C.rose,        bg: C.roseBg,   border: C.roseBorder },
  emergency: { color: "#C2410C",     bg: "#FFF7ED",  border: "#FED7AA" },
  support:   { color: C.indigoLight, bg: "#EEF2FF",  border: "#C7D2FE" },
  family:    { color: "#16A34A",     bg: "#F0FDF4",  border: "#BBF7D0" },
};

export function SOSOverlay({ active, onClose }: SOSOverlayProps) {
  const { user } = useAuth();
  const [showSmsNotice, setShowSmsNotice] = useState(false);
  const [smsStatus, setSmsStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [smsError, setSmsError] = useState<string | null>(null);

  const handleSendAlert = async () => {
    const recipients = (familyMembers || []).map((m) => m.phone?.trim()).filter(Boolean);
    if (!recipients.length) {
      setSmsError("Add at least one emergency contact to your family circle before sending an SOS SMS.");
      setSmsStatus("failed");
      setShowSmsNotice(true);
      return;
    }

    setSmsStatus("sending");
    setSmsError(null);
    setShowSmsNotice(true);

    try {
      const response = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          message: `NOVA SOS alert: ${firstName} needs urgent help. Please check in immediately and call if you can.`,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || json?.details || "Failed to deliver SMS.");
      }

      setSmsStatus("sent");
    } catch (error: any) {
      setSmsStatus("failed");
      setSmsError(error?.message || "Unable to send SMS at this time.");
    }
  };

  const handleClose = () => {
    setShowSmsNotice(false);
    setSmsStatus("idle");
    setSmsError(null);
    onClose();
  };

  const familyMembers = user?.familyCircle || [];
  const firstName = (user?.name || "").split(" ")[0] || "friend";

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

            <div className="relative overflow-hidden px-5 pt-6 pb-5 text-center"
              style={{
                background: "linear-gradient(165deg, rgba(244,63,94,0.22) 0%, rgba(244,63,94,0.05) 100%)",
                borderBottom: `1px solid ${C.roseBorder}`,
              }}>
              <div className="mx-auto mb-3" style={{ width: 70, height: 70 }}>
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

              <h2 className="text-xl font-black mb-0.5" style={{ fontFamily: "var(--font-outfit, sans-serif)", color: C.text }}>Emergency SOS</h2>
              <p className="text-xs" style={{ color: "#BE123C" }}>You are not alone — NOVA is here with you</p>

              <button onClick={handleClose} className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 text-slate-500">
                <X size={13} />
              </button>
            </div>

            <div className="px-4 py-4 overflow-y-auto" style={{ maxHeight: "58svh" }}>
              <AnimatePresence mode="wait">
                {!showSmsNotice ? (
                  <motion.div key="before-send" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p className="text-sm text-center mb-4" style={{ color: C.textMid }}>
                      <strong style={{ color: C.text }}>{firstName}</strong>, help is available. Tap to call:
                    </p>

                    <div className="space-y-2 mb-6">
                      {/* Family members at top if they exist */}
                      {familyMembers.map((m, i) => (
                        <motion.a key={`f-${i}`} href={`tel:${m.phone}`}
                          className="flex items-center gap-3 p-3 rounded-2xl no-underline border transition-all active:scale-[0.98]"
                          style={{ background: CATEGORY_STYLE.family.bg, borderColor: CATEGORY_STYLE.family.border }}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-green-100 border border-green-200">
                            <Phone size={13} className="text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold">{m.name}</p>
                            <p className="text-[10px] text-green-700 font-bold">{m.relation} &middot; {m.phone}</p>
                          </div>
                          <div className="w-6 h-6 rounded-lg bg-green-600 flex items-center justify-center">
                            <Phone size={11} color="white" />
                          </div>
                        </motion.a>
                      ))}

                      {HOTLINES.map((h, i) => {
                        const st = CATEGORY_STYLE[h.category];
                        return (
                          <motion.a key={h.name} href={h.tel}
                            className="flex items-center gap-3 p-3 rounded-2xl no-underline border transition-all active:scale-[0.98]"
                            style={{ background: st.bg, borderColor: st.border }}>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${st.color}15`, border: `1px solid ${st.border}` }}>
                              <Phone size={13} color={st.color} />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold leading-tight">{h.name}</p>
                              <p className="text-sm font-black mt-0.5" style={{ color: st.color }}>{h.number}</p>
                            </div>
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: st.color }}>
                              <Phone size={11} color="white" />
                            </div>
                          </motion.a>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px bg-slate-100" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Broadcast Alert</span>
                      <div className="flex-1 h-px bg-slate-100" />
                    </div>

                    <div className="flex gap-2.5">
                      <motion.button onClick={handleSendAlert}
                        className="flex-1 py-3.5 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2"
                        style={{ background: "linear-gradient(135deg, #F43F5E 0%, #DC2626 100%)", boxShadow: "0 6px 20px rgba(244,63,94,0.38)" }}>
                        <MessageCircle size={14} /> Send SOS SMS
                      </motion.button>
                      <motion.button onClick={handleClose} className="flex-1 py-3.5 rounded-2xl font-bold text-sm bg-slate-100 text-slate-600">
                        {"I'm Safe"}
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="after-send" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle size={28} className="text-amber-600" />
                    </div>
                    {smsStatus === "sending" ? (
                      <>
                        <h3 className="text-xl font-black mb-2">Sending Alert...</h3>
                        <p className="text-sm text-slate-600 mb-4">NOVA is broadcasting your SOS message via Textbelt.</p>
                      </>
                    ) : smsStatus === "sent" ? (
                      <>
                        <h3 className="text-xl font-black mb-2">SOS Broadcast Sent</h3>
                        <p className="text-sm text-slate-600 mb-4">Your emergency contacts have been notified. Please follow up by phone if needed.</p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-black mb-2">SMS Broadcast Failed</h3>
                        <p className="text-sm text-slate-600 mb-4">
                          NOVA could not send the SOS SMS. Please call the numbers above directly.
                        </p>
                        {smsError && (
                          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 mb-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">{smsError}</p>
                          </div>
                        )}
                      </>
                    )}
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 mb-6">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                        SMS is sent through Textbelt. Configure TEXTBELT_KEY and TEXTBELT_URL in your environment.
                      </p>
                    </div>
                    <button onClick={() => setShowSmsNotice(false)} className="w-full py-3.5 rounded-2xl font-bold text-white text-sm bg-indigo-600" style={{ boxShadow: "0 8px 24px rgba(91,94,244,0.32)" }}>
                      Back to Call Options
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="px-5 pb-5 pt-2 text-center">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                NOVA SOS is a support tool. For life-threatening emergencies, call <strong>112</strong> or <strong>108</strong> immediately.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
