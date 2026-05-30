"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, Check, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LOGO_URL } from "@/lib/constants";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:          "#F8F9FC",
  surface:     "#FFFFFF",
  surface2:    "#F1F3F8",
  surface3:    "#E8ECF4",
  border:      "#DDE3EF",
  borderFocus: "rgba(91,94,244,0.70)",
  indigo:      "#5B5EF4",
  indigoDark:  "#4338CA",
  indigoLight: "#4338CA",
  gold:        "#D97706",
  goldLight:   "#F59E0B",
  text:        "#0F172A",
  textMid:     "#334155",
  textSoft:    "#64748B",
};

type AuthView = "login" | "register" | "consent";
type ConsentState = {
  healthDataProcessing: boolean;
  emotionAnalysis: boolean;
  aiInteraction: boolean;
};

// ─── Input field ───────────────────────────────────────────────────────────────
function Field({ label, type, value, onChange, placeholder, icon, showToggle }: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder: string; icon: React.ReactNode; showToggle?: boolean;
}) {
  const [show, setShow] = useState(false);
  const inputType = showToggle ? (show ? "text" : "password") : type;
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: C.textSoft }}>
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: focused ? C.indigoLight : C.textSoft }}>
          {icon}
        </div>
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`nova-input !pl-12 ${showToggle ? "!pr-11" : ""}`}
          style={{
            background: focused ? "#FFFFFF" : "#F1F5F9",
            borderColor: focused ? C.borderFocus : C.border,
            boxShadow: focused ? `0 0 0 3px rgba(99,102,241,0.12)` : "none",
            color: "#0F172A",
          }}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: C.textSoft }}
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Error banner ──────────────────────────────────────────────────────────────
function ErrorBanner({ msg }: { msg: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="mb-5 p-4 rounded-2xl flex items-start gap-3"
      style={{ background: "#FFF1F2", border: "1px solid #FECDD3" }}>
      <AlertCircle size={15} style={{ color: "#9F1239", flexShrink: 0, marginTop: 1 }} />
      <p className="text-sm" style={{ color: "#9F1239" }}>{msg}</p>
    </motion.div>
  );
}

// ─── Login form ────────────────────────────────────────────────────────────────
function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { login, loginWithGoogle, authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      // Don't navigate here - let the useEffect in AuthPage handle it
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      await loginWithGoogle();
      // Don't navigate here - let the useEffect in AuthPage handle it
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google login failed");
    }
  };

  return (
    <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.28 }}>
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.indigoLight }}>Welcome back</p>
      <h2 className="text-2xl sm:text-3xl font-black mb-6 sm:mb-8" style={{ fontFamily: "var(--font-outfit, sans-serif)", color: C.text }}>Sign in to NOVA</h2>

      {error && <ErrorBanner msg={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={<Mail size={15} />} />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Enter your password" icon={<Lock size={15} />} showToggle />

        <button type="submit" disabled={authLoading}
          className="w-full py-4 rounded-2xl font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2 btn-primary text-sm">
          {authLoading
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <>Sign In <ArrowRight size={15} /></>}
        </button>
      </form>

      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor: C.border }}></div></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="px-3" style={{ background: C.surface, color: C.textSoft }}>Or continue with</span></div>
      </div>

      <button
        onClick={handleGoogleLogin}
        disabled={authLoading}
        className="w-full py-3.5 rounded-2xl font-bold border-2 transition-all flex items-center justify-center gap-3 text-sm hover:bg-slate-50"
        style={{ borderColor: C.border, color: C.textMid }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Google
      </button>

      <p className="text-center text-sm mt-7" style={{ color: C.textSoft }}>
        {"Don't have an account? "}
        <button onClick={onSwitch} className="font-bold transition-colors hover:underline" style={{ color: C.indigoLight }}>
          Create one
        </button>
      </p>
    </motion.div>
  );
}

// ─── Register form ─────────────────────────────────────────────────────────────
function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { register, loginWithGoogle, authLoading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      await register(name, email, password);
      // Don't navigate here - let the useEffect in AuthPage handle it
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      await loginWithGoogle();
      // Don't navigate here - let the useEffect in AuthPage handle it
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google login failed");
    }
  };

  return (
    <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.28 }}>
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.indigoLight }}>Get started</p>
      <h2 className="text-2xl sm:text-3xl font-black mb-6 sm:mb-8" style={{ fontFamily: "var(--font-outfit, sans-serif)", color: C.text }}>Create your account</h2>

      {error && <ErrorBanner msg={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name" type="text" value={name} onChange={setName} placeholder="Your name" icon={<User size={15} />} />
        <Field label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={<Mail size={15} />} />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" icon={<Lock size={15} />} showToggle />

        <button type="submit" disabled={authLoading}
          className="w-full py-4 rounded-2xl font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2 btn-primary text-sm">
          {authLoading
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <>Create Account <ArrowRight size={15} /></>}
        </button>
      </form>

      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor: C.border }}></div></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="px-3" style={{ background: C.surface, color: C.textSoft }}>Or continue with</span></div>
      </div>

      <button
        onClick={handleGoogleLogin}
        disabled={authLoading}
        className="w-full py-3.5 rounded-2xl font-bold border-2 transition-all flex items-center justify-center gap-3 text-sm hover:bg-slate-50"
        style={{ borderColor: C.border, color: C.textMid }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Google
      </button>

      <p className="text-center text-sm mt-7" style={{ color: C.textSoft }}>
        Already have an account?{" "}
        <button onClick={onSwitch} className="font-bold transition-colors hover:underline" style={{ color: C.indigoLight }}>
          Sign in
        </button>
      </p>
    </motion.div>
  );
}

// ─── Left panel — decorative ───────────────────────────────────────────────────
function AuthDecorPanel() {
  const bullets = [
    { icon: <Shield size={14} />, text: "On-device AI — your data never leaves your phone" },
    { icon: <Check size={14} />, text: "Medical report analysis for readable uploads" },
    { icon: <Check size={14} />, text: "24/7 AI wellness companion" },
    { icon: <Check size={14} />, text: "Emergency SOS with direct call options" },
  ];

  return (
    <div className="relative overflow-hidden flex flex-col justify-between p-12" style={{ background: C.surface2 }}>
      {/* Orb decorations */}
      <div className="absolute top-0 left-0 w-80 h-80 orb-indigo pointer-events-none" style={{ opacity: 0.7, transform: "translate(-30%,-30%)" }} />
      <div className="absolute bottom-0 right-0 w-60 h-60 orb-gold pointer-events-none" style={{ opacity: 0.5, transform: "translate(30%,30%)" }} />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-16">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
            <img src={LOGO_URL} alt="NOVA" className="w-5 h-5 object-contain" />
          </div>
          <span className="font-black text-xl" style={{ fontFamily: "var(--font-outfit, sans-serif)", color: C.text }}>NOVA</span>
        </div>

        <h2 className="text-4xl font-black leading-[1.3] mb-5 text-balance pb-1" style={{ fontFamily: "var(--font-outfit, sans-serif)", color: C.text }}>
          Your health, <span className="text-gradient-indigo">intelligently</span> supported.
        </h2>
        <p className="text-sm leading-relaxed mb-10" style={{ color: C.textMid }}>
          Emotion-aware conversations, medical report analysis, and personalised recovery plans — all in one private space.
        </p>

        <div className="space-y-4">
          {bullets.map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
              className="flex items-center gap-3 text-sm" style={{ color: C.textMid }}>
              <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#EEF2FF", color: C.indigoLight }}>
                {b.icon}
              </div>
              {b.text}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom badge */}
      <div className="relative z-10 rounded-2xl p-4"
        style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
        <p className="text-xs font-semibold leading-relaxed" style={{ color: C.textMid }}>
          NOVA is available 24/7 to support your wellness journey. All data stays private and encrypted.
        </p>
      </div>
    </div>
  );
}

// ─── Consent screen ────────────────────────────────────────────────────────────
export function ConsentScreen() {
  const { user, authLoading, updateConsent } = useAuth();
  const router = useRouter();
  const [selectedConsents, setSelectedConsents] = useState<ConsentState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const savedConsents = useMemo<ConsentState>(() => ({
    healthDataProcessing: !!user?.consent?.healthDataProcessing,
    emotionAnalysis: !!user?.consent?.emotionAnalysis,
    aiInteraction: !!user?.consent?.aiInteraction,
  }), [user?.consent?.aiInteraction, user?.consent?.emotionAnalysis, user?.consent?.healthDataProcessing]);
  const consents = selectedConsents ?? savedConsents;
  const allConsented = Object.values(consents).every(Boolean);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/auth");
      return;
    }

    if (Object.values(savedConsents).every(Boolean)) {
      router.replace("/dashboard");
    }
  }, [authLoading, router, savedConsents, user]);

  const items = [
    {
      key: "healthDataProcessing" as const,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Health Data Processing",
      desc: "We process and store your health information securely to deliver personalised support.",
    },
    {
      key: "emotionAnalysis" as const,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ),
      title: "Facial Emotion Analysis",
      desc: "Device camera detects emotions locally. All processing stays on your device — no images are ever uploaded.",
    },
    {
      key: "aiInteraction" as const,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "AI Interaction Storage",
      desc: "Conversations with NOVA are stored securely to provide continuous, personalised support.",
    },
  ];

  const handleAccept = async () => {
    if (!allConsented) return;
    setLoading(true);
    setError("");

    try {
      await updateConsent({ ...consents, timestamp: new Date(), version: "1.0" });
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save your consent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center nova-bg">
        <div className="w-8 h-8 border-4 border-[#5B5EF4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 nova-bg">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
              <img src={LOGO_URL} alt="NOVA" className="w-6 h-6 object-contain" />
            </div>
            <span className="font-black text-xl" style={{ fontFamily: "var(--font-outfit, sans-serif)", color: C.text }}>NOVA</span>
          </div>
        </div>

        <div className="rounded-3xl p-5 sm:p-8" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-5" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
              <Shield size={24} color={C.indigoLight} />
            </div>
            <h1 className="text-2xl font-black mb-2" style={{ fontFamily: "var(--font-outfit, sans-serif)", color: C.text }}>
              Welcome, {(user?.name || "").split(" ")[0] || "there"}
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: C.textMid }}>
              Before we begin, please review how NOVA uses your data.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {items.map((item) => {
              const checked = consents[item.key];
              return (
                <motion.button
                  key={item.key}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedConsents((p) => {
                    const current = p ?? savedConsents;
                    return { ...current, [item.key]: !current[item.key] };
                  })}
                  className="w-full text-left p-4 rounded-2xl transition-all"
                  style={{
                    background: checked ? "#EEF2FF" : C.surface2,
                    border: `1px solid ${checked ? "#C7D2FE" : C.border}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: checked ? "#E0E7FF" : C.surface3, color: checked ? C.indigoLight : C.textSoft }}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: C.text }}>{item.title}</p>
                      <p className="text-xs mt-0.5 leading-snug" style={{ color: C.textSoft }}>{item.desc}</p>
                    </div>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                      style={{ background: checked ? C.indigo : "transparent", border: `2px solid ${checked ? C.indigo : C.border}` }}>
                      {checked && <Check size={11} color="white" strokeWidth={2.5} />}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="rounded-2xl p-4 mb-6 text-xs leading-relaxed" style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}>
            All three consents are required to use NOVA. Your data is encrypted and never sold to third parties.
          </div>

          {error && <ErrorBanner msg={error} />}

          <button onClick={handleAccept} disabled={!allConsented || loading}
            className={`w-full py-4 rounded-2xl font-bold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2 text-sm ${allConsented ? "btn-primary" : ""}`}
            style={!allConsented ? { background: C.surface3, color: C.textSoft } : {}}>
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : allConsented
              ? <>Accept &amp; Enter NOVA <ArrowRight size={15} /></>
              : "Please accept all consents"}
          </button>

          <p className="text-xs text-center mt-5" style={{ color: C.textSoft }}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Auth Page ────────────────────────────────────────────────────────────
export function AuthPage({ initialView = "login" }: { initialView?: AuthView }) {
  const [view, setView] = useState<AuthView>(initialView);
  const { user, authLoading } = useAuth();
  const router = useRouter();

  const showLogin = () => {
    setView("login");
    router.replace("/auth?mode=login");
  };

  const showRegister = () => {
    setView("register");
    router.replace("/auth?mode=register");
  };

  useEffect(() => {
    if (!authLoading && user?.isAuthenticated) {
      // Check if user has all required consents
      const hasAllConsents = user.consent?.healthDataProcessing && 
                             user.consent?.emotionAnalysis && 
                             user.consent?.aiInteraction;
      
      if (hasAllConsents) {
        router.push("/dashboard");
      } else {
        router.push("/consent");
      }
    }
  }, [user, authLoading, router]);

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center nova-bg">
        <div className="w-8 h-8 border-4 border-[#5B5EF4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex nova-bg">
      {/* Left — decorative (desktop only) */}
      <div className="hidden lg:block w-[440px] flex-shrink-0">
        <AuthDecorPanel />
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8 relative overflow-hidden">
        {/* Subtle bg orb */}
        <div className="absolute top-0 right-0 w-96 h-96 orb-indigo pointer-events-none opacity-30" style={{ transform: "translate(30%,-30%)" }} />

        {/* Back link */}
        <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-75" style={{ color: C.textSoft }}>
          <ArrowLeft size={14} /> Back to home
        </Link>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-10">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
              <img src={LOGO_URL} alt="NOVA" className="w-5 h-5 object-contain" />
            </div>
            <span className="font-black text-xl" style={{ fontFamily: "var(--font-outfit, sans-serif)", color: C.text }}>NOVA</span>
          </div>

          {/* Form card */}
          <motion.div layout className="rounded-3xl p-6 sm:p-8" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <AnimatePresence mode="wait">
              {view === "login"
                ? <LoginForm key="login" onSwitch={showRegister} />
                : <RegisterForm key="register" onSwitch={showLogin} />}
            </AnimatePresence>
          </motion.div>

          <p className="text-xs text-center mt-6" style={{ color: C.textSoft }}>
            NOVA provides wellness information only — not medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}
