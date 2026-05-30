"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2, ThumbsUp, ThumbsDown, X, Phone, Sparkles } from "lucide-react";
import { useChat, type Message } from "@/contexts/ChatContext";
import { useEmotion } from "@/contexts/EmotionContext";
import ReactMarkdown from "react-markdown";

const C = {
  bg:          "#F8F9FC",
  surface:     "#FFFFFF",
  surface2:    "#F1F3F8",
  surface3:    "#E8ECF4",
  border:      "#E2E8F0",
  borderMid:   "#C6CEDF",
  indigo:      "#5B5EF4",
  indigoDark:  "#4338CA",
  indigoLight: "#A5B4FC",
  gold:        "#D97706",
  goldDark:    "#B45309",
  goldLight:   "#F59E0B",
  rose:        "#E11D48",
  text:        "#0F172A",
  textMid:     "#334155",
  textSoft:    "#64748B",
};

import { LOGO_URL } from "@/lib/constants";

const SUGGESTIONS = [
  { text: "I feel stressed today",     icon: "🌊" },
  { text: "Help me breathe",           icon: "💨" },
  { text: "Pain management tips",      icon: "🩹" },
  { text: "Improve my sleep",          icon: "🌙" },
  { text: "Track my mood",             icon: "📊" },
];

// ─── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, onFeedback }: { msg: Message; onFeedback?: (id: string, v: 1 | -1) => void }) {
  const isNova = msg.role === "assistant";
  const isCrisis = msg.content.includes("988") || msg.content.includes("crisis") || msg.content.includes("emergency");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-end gap-2.5 ${isNova ? "flex-row" : "flex-row-reverse"}`}>

      {/* Avatar */}
      {isNova ? (
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-1"
          style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
          <img src={LOGO_URL} alt="NOVA" className="w-4 h-4 object-contain" />
        </div>
      ) : (
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-1 text-[9px] font-black text-white"
          style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.indigoDark})` }}>
          You
        </div>
      )}

      <div className={`max-w-[80%] ${isNova ? "" : "items-end flex flex-col"}`}>
        <div className="rounded-3xl px-4 py-3 text-sm leading-relaxed"
          style={
            isCrisis ? {
              background: "#FFF1F2",
              border: "1px solid #FECDD3",
              color: "#9F1239",
            } : isNova ? {
              background: C.surface2,
              border: `1px solid ${C.border}`,
              color: C.textMid,
              boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
            } : {
              background: `linear-gradient(135deg, ${C.indigo}, ${C.indigoDark})`,
              color: "#FFFFFF",
              boxShadow: "0 6px 20px rgba(91,94,244,0.30)",
            }
          }>
          {isCrisis && (
            <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: "1px solid #FECDD3" }}>
              <Phone size={11} style={{ color: "#9F1239" }} />
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#9F1239" }}>Crisis Support</span>
            </div>
          )}
          <div className="prose prose-sm max-w-none text-[13px]">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1 px-1">
          <p className="text-[9px]" style={{ color: C.textSoft }}>
            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          {isNova && onFeedback && (
            <div className="flex items-center gap-1">
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => onFeedback(msg.id, 1)}
                className={`p-0.5 rounded transition-colors ${msg.feedback === 1 ? "text-green-700" : "text-slate-300 hover:text-green-700"}`}>
                <ThumbsUp size={10} />
              </motion.button>
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => onFeedback(msg.id, -1)}
                className={`p-0.5 rounded transition-colors ${msg.feedback === -1 ? "text-red-700" : "text-slate-300 hover:text-red-700"}`}>
                <ThumbsDown size={10} />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-end gap-2.5">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-1 nova-idle"
        style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
        <img src={LOGO_URL} alt="NOVA" className="w-4 h-4 object-contain" />
      </div>
      <div className="rounded-3xl px-4 py-3.5 flex items-center gap-1.5"
        style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
        {[0, 0.18, 0.36].map((delay, i) => (
          <motion.div key={i} className="rounded-full"
            style={{ width: 7, height: 7, background: C.indigoLight }}
            animate={{ y: [0, -6, 0], opacity: [0.35, 1, 0.35], scale: [1, 1.15, 1] }}
            transition={{ duration: 0.72, repeat: Infinity, delay }} />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Crisis banner ─────────────────────────────────────────────────────────────
function CrisisBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-3 p-3.5 rounded-2xl flex items-start justify-between gap-3"
      style={{ background: "#FFF1F2", border: "1px solid #FECDD3" }}>
      <div className="flex items-start gap-2.5">
        <Phone size={12} style={{ color: "#9F1239", flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="text-xs font-black" style={{ color: "#9F1239" }}>Crisis Support Available</p>
          <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#BE123C" }}>
            iCall: <strong>9152987821</strong> · AASRA: <strong>9820466627</strong> · Emergency: <strong>112</strong>
          </p>
        </div>
      </div>
      <button onClick={onDismiss} style={{ color: "#FDA4AF" }}
        className="hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
        <X size={12} />
      </button>
    </motion.div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onSuggest }: { onSuggest: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 pb-4">
      {/* Animated NOVA avatar */}
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.04, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(91,94,244,0.20) 0%, transparent 70%)", filter: "blur(20px)", transform: "scale(1.4)" }} />
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-20 h-20 rounded-3xl flex items-center justify-center nova-idle"
          style={{ background: "#EEF2FF", border: "1.5px solid #C7D2FE", boxShadow: "0 0 32px rgba(91,94,244,0.15)" }}>
          <img src={LOGO_URL} alt="NOVA" className="w-11 h-11 object-contain" />
        </motion.div>
      </div>

      <div className="text-center px-6">
        <h3 className="font-black text-xl mb-2" style={{ fontFamily: "var(--font-outfit, sans-serif)", color: C.text }}>
          Hello, I&apos;m NOVA
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: C.textMid, maxWidth: 280, margin: "0 auto" }}>
          Your private AI wellness companion. Share how you feel, ask about your health, or let me check in on you.
        </p>
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2 justify-center px-4">
        {SUGGESTIONS.map((s) => (
          <motion.button key={s.text}
            whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.96 }}
            onClick={() => onSuggest(s.text)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all"
            style={{ background: "#EEF2FF", color: "#4338CA", border: "1px solid #C7D2FE" }}>
            <Sparkles size={10} />
            {s.text}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Main ChatPanel ────────────────────────────────────────────────────────────
export function ChatPanel() {
  const { messages, isTyping, sendMessage, clearChat, crisisAlert, dismissCrisis, submitFeedback } = useChat();
  const { emotion } = useEmotion();
  const [input, setInput] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput("");
    await sendMessage(text, emotion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isEmpty = messages.length <= 1;

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>

      {/* ── NOVA header card ─────────────────────────────────────────────── */}
      <div className="rounded-3xl p-4 mb-3 flex items-center justify-between flex-shrink-0"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
              <img src={LOGO_URL} alt="NOVA" className="w-7 h-7 object-contain nova-idle" />
            </div>
            {/* Online dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style={{ background: "#16A34A", boxShadow: "0 0 8px rgba(22,163,74,0.50)", borderColor: C.surface }} />
          </div>
          <div>
            <p className="font-black text-sm" style={{ color: C.text }}>NOVA</p>
            <p className="text-[10px]" style={{ color: C.textSoft }}>Your AI wellness companion</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {emotion && (
            <span className="text-[10px] font-black px-2.5 py-1.5 rounded-full"
              style={{ background: "#FDE68A", color: "#B45309", border: "1px solid #D97706" }}>
              {emotion.dominant}
            </span>
          )}
          <motion.button whileTap={{ scale: 0.9 }} onClick={clearChat}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-red-500/10"
            style={{ color: C.textSoft, border: `1px solid ${C.border}` }}>
            <Trash2 size={13} />
          </motion.button>
        </div>
      </div>

      {/* ── Crisis banner ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {crisisAlert && !crisisAlert.acknowledged && <CrisisBanner onDismiss={dismissCrisis} />}
      </AnimatePresence>

      {/* ── Messages area ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-2 scrollbar-hide relative">
        {isEmpty ? (
          <EmptyState onSuggest={(text) => sendMessage(text, emotion)} />
        ) : (
          <div className="space-y-4 pr-1">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} onFeedback={submitFeedback} />
            ))}
            <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Suggestion chips (when messages exist) ────────────────────────── */}
      {!isEmpty && messages.length <= 3 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 flex-wrap mb-3 flex-shrink-0">
          {SUGGESTIONS.slice(0, 3).map((s) => (
            <motion.button key={s.text} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => sendMessage(s.text, emotion)}
              className="flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-2xl transition-all font-semibold"
              style={{ background: "#EEF2FF", color: "#4338CA", border: "1px solid #C7D2FE" }}>
              <Sparkles size={9} /> {s.text}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* ── Input bar — with ambient glow when focused ────────────────────── */}
      <div className="flex-shrink-0 relative">
        {/* Ambient glow behind input */}
        <AnimatePresence>
          {inputFocused && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute -inset-3 rounded-3xl pointer-events-none"
              style={{ background: "radial-gradient(ellipse 90% 60% at 50% 100%, rgba(91,94,244,0.18) 0%, transparent 70%)", filter: "blur(12px)" }} />
          )}
        </AnimatePresence>

        <div className="relative rounded-3xl p-3 flex items-end gap-3"
          style={{
            background: C.surface,
            border: `1.5px solid ${inputFocused ? "rgba(91,94,244,0.50)" : C.border}`,
            boxShadow: inputFocused ? "0 0 0 3px rgba(91,94,244,0.10)" : "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Share how you&apos;re feeling, or ask a health question…"
            rows={1}
            className="flex-1 bg-transparent text-sm outline-none resize-none max-h-32 leading-relaxed"
            style={{ color: C.text, minHeight: 36, caretColor: C.indigoLight }}
          />
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            whileHover={input.trim() ? { scale: 1.08 } : {}}
            whileTap={input.trim() ? { scale: 0.90 } : {}}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30 press-feedback"
            style={{
              background: input.trim()
                ? `linear-gradient(135deg, ${C.indigo}, ${C.indigoDark})`
                : "#F1F3F8",
              boxShadow: input.trim() ? "0 4px 16px rgba(91,94,244,0.35)" : "none",
            }}>
            <Send size={14} color={input.trim() ? "#FFFFFF" : C.textSoft} />
          </motion.button>
        </div>
      </div>

      <p className="text-[10px] text-center mt-2 flex-shrink-0" style={{ color: C.textSoft }}>
        NOVA provides wellness information only — not medical advice. In emergencies, call 112 or 108.
      </p>
    </div>
  );
}
