"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ProfilePanel } from "@/components/dashboard/ProfilePanel";
import { RecoveryPlan } from "@/components/dashboard/RecoveryPlan";
import { JournalPanel } from "@/components/dashboard/JournalPanel";
import { ResourcesPanel } from "@/components/dashboard/ResourcesPanel";
import { ChatPanel } from "@/components/dashboard/ChatPanel";
import { EmotionMonitor } from "@/components/dashboard/EmotionMonitor";
import { HealthPulse } from "@/components/dashboard/HealthPulse";
import { UploadVault } from "@/components/dashboard/UploadVault";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { SOSOverlay } from "@/components/dashboard/SOSOverlay";
import { MedicineTracker } from "@/components/dashboard/MedicineTracker";
import { useChat } from "@/contexts/ChatContext";
import { LOGO_URL } from "@/lib/constants";
import { InstallButton } from "@/components/pwa/InstallButton";

const C = {
  bg: "#F8F9FC",
  surface: "#FFFFFF",
  surface2: "#F1F3F8",
  border: "#E2E8F0",
  indigo: "#5B5EF4",
  indigoDark: "#4338CA",
  indigoLight: "#7E82F8",
  gold: "#D97706",
  rose: "#F43F5E",
  text: "#0F172A",
  textMid: "#334155",
  textSoft: "#64748B",
  navIcon: "#94A3B8",
  navIconActive: "#5B5EF4",
  teal: "#0D9488",
  green: "#10B981",
};

type ActiveTab =
  | "home" | "chat" | "pulse" | "vault"
  | "recovery" | "journal" | "profile"
  | "resources" | "emotion" | "medicine";

// ADDED — ordered tab list for directional slide transitions
const TAB_ORDER: ActiveTab[] = [
  "home", "chat", "pulse", "resources", "vault",
  "journal", "medicine", "recovery", "profile", "emotion",
];

// ─── SVG nav icons ────────────────────────────────────────────────────────────
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-5H9v5H4a1 1 0 01-1-1V9.5z"
        stroke={active ? C.navIconActive : C.navIcon}
        fill={active ? "#EEF2FF" : "none"}
        strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        stroke={active ? C.navIconActive : C.navIcon}
        fill={active ? "#EEF2FF" : "none"}
        strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PulseIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"
        stroke={active ? C.navIconActive : C.navIcon}
        strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function VaultIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        stroke={active ? C.navIconActive : C.navIcon}
        strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ResourcesIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"
        stroke={active ? C.navIconActive : C.navIcon}
        strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
        stroke={active ? C.navIconActive : C.navIcon}
        fill={active ? "#EEF2FF" : "none"}
        strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 7h6M9 11h4"
        stroke={active ? C.navIconActive : C.navIcon}
        strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4"
        stroke={active ? C.navIconActive : C.navIcon}
        fill={active ? "#EEF2FF" : "none"}
        strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke={active ? C.navIconActive : C.navIcon}
        strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

const NAV_ITEMS: {
  id: ActiveTab;
  label: string;
  Icon: React.ComponentType<{ active: boolean }>;
}[] = [
    { id: "home", label: "Home", Icon: HomeIcon },
    { id: "chat", label: "NOVA", Icon: ChatIcon },
    { id: "pulse", label: "Pulse", Icon: PulseIcon },
    { id: "resources", label: "Learn", Icon: ResourcesIcon },
    { id: "vault", label: "Vault", Icon: VaultIcon },
    { id: "profile", label: "Me", Icon: ProfileIcon },
  ];

// ADDED — tab titles including all routes
const TAB_TITLES: Record<ActiveTab, string> = {
  home: "Good morning", // overwritten dynamically
  chat: "NOVA",
  pulse: "HealthPulse",
  emotion: "Emotion Scan",
  vault: "Medical Vault",
  recovery: "Recovery Plan",
  journal: "Health Journal",
  profile: "My Profile",
  resources: "Learn",
  medicine: "Medicine Tracker",
};

// ADDED — badge counts per tab (pulse, vault, medicine)
type BadgeCounts = {
  pulse: boolean;   // true = not checked in today
  vault: number;    // undiscussed documents
  medicine: number; // doses pending today
};

const STORAGE_KEY = "nova_active_tab";

export function DashboardShell() {
  const { user, logout, authLoading } = useAuth();
  const { crisisAlert, dismissCrisis } = useChat();
  const router = useRouter();

  // ADDED — restore last tab from sessionStorage
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window === "undefined") return "home";
    const saved = sessionStorage.getItem(STORAGE_KEY) as ActiveTab | null;
    return saved && TAB_ORDER.includes(saved) ? saved : "home";
  });

  // ADDED — track previous tab for directional slide
  const prevTabRef = useRef<ActiveTab>(activeTab);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);

  const [chatPrefill, setChatPrefill] = useState("");
  const [sosActive, setSosActive] = useState(false);

  // ADDED — badge counts (kept simple — updated by child callbacks)
  const [badges, setBadges] = useState<BadgeCounts>({
    pulse: false,
    vault: 0,
    medicine: 0,
  });

  const [headerTitle, setHeaderTitle] = useState(() => {
    const h = new Date().getHours();
    const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    TAB_TITLES.home = greeting;
    return greeting;
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
  }, [user, authLoading, router]);

  // ADDED — navigate with directional awareness + sessionStorage persistence
  const navigate = useCallback((tab: ActiveTab) => {
    const fromIdx = TAB_ORDER.indexOf(activeTab);
    const toIdx = TAB_ORDER.indexOf(tab);
    setSlideDir(toIdx >= fromIdx ? 1 : -1);
    prevTabRef.current = activeTab;
    setActiveTab(tab);
    try { sessionStorage.setItem(STORAGE_KEY, tab); } catch { }
  }, [activeTab]);

  // ADDED — handle browser back gesture: go to home if not already there
  useEffect(() => {
    const handlePopState = () => {
      if (activeTab !== "home") {
        navigate("home");
        window.history.pushState(null, "", window.location.href);
      }
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeTab, navigate]);

  // ADDED — pulse badge: check if today's HealthPulse is missing
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const key = `nova_health_pulse_logs:${user?.id}`;
    try {
      const raw = localStorage.getItem(key);
      const logs: { date: string }[] = raw ? JSON.parse(raw) : [];
      setBadges(prev => ({ ...prev, pulse: !logs.some(l => l.date === today) }));
    } catch {
      setBadges(prev => ({ ...prev, pulse: false }));
    }
  }, [user?.id, activeTab]);

  // ADDED — medicine badge: count pending doses for today
  useEffect(() => {
    if (!user?.id) return;
    const today = new Date().toISOString().slice(0, 10);
    try {
      const schedKey = `nova_med_schedules:${user.id}`;
      const logKey = `nova_med_logs:${user.id}`;
      const schedules: { id: string; active: boolean; times: string[]; startDate: string }[] =
        JSON.parse(localStorage.getItem(schedKey) || "[]");
      const logs: { scheduleId: string; date: string; scheduledTime: string; takenAt?: string; skipped?: boolean }[] =
        JSON.parse(localStorage.getItem(logKey) || "[]");

      const active = schedules.filter(s => s.active && s.startDate <= today);
      let pending = 0;
      for (const s of active) {
        for (const t of s.times) {
          const log = logs.find(l =>
            l.scheduleId === s.id && l.date === today && l.scheduledTime === t
          );
          if (!log?.takenAt && !log?.skipped) pending++;
        }
      }
      setBadges(prev => ({ ...prev, medicine: pending }));
    } catch {
      setBadges(prev => ({ ...prev, medicine: 0 }));
    }
  }, [user?.id, activeTab]);

  // ADDED — directional slide variants
  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 24, y: 0 }),
    center: { opacity: 1, x: 0, y: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -16, y: 0 }),
  };

  // ADDED — nav badge renderer
  const navBadge = (id: ActiveTab): number | boolean => {
    if (id === "pulse") return badges.pulse;
    if (id === "vault") return badges.vault > 0 ? badges.vault : false;
    return false;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: C.bg }}>

      {/* ── TOP HEADER ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 relative z-20"
        style={{
          height: 56,
          background: "rgba(255,255,255,0.97)",
          borderBottom: `1px solid ${C.border}`,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
            <img src={LOGO_URL} alt="NOVA" className="w-4 h-4 object-contain" />
          </div>
          <AnimatePresence mode="wait">
            <motion.span key={activeTab}
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="text-sm font-black"
              style={{ color: C.text, fontFamily: "var(--font-outfit, sans-serif)" }}>
              {activeTab === "home" ? headerTitle : TAB_TITLES[activeTab]}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <InstallButton variant="dashboard" />

          {/* ADDED — medicine badge on header pill if doses pending */}
          {badges.medicine > 0 && activeTab !== "medicine" && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate("medicine")}
              className="h-8 px-3 rounded-full text-xs font-black flex items-center gap-1.5"
              style={{
                background: "#F5F3FF",
                border: "1px solid #C4B5FD",
                color: "#7C3AED",
              }}>
              💊 {badges.medicine} due
            </motion.button>
          )}

          {/* SOS */}
          <motion.button
            onClick={() => setSosActive(true)}
            whileTap={{ scale: 0.92 }}
            className="h-8 px-3.5 rounded-full text-xs font-black text-white flex items-center gap-1.5 sos-pulse"
            style={{ background: C.rose, boxShadow: "0 4px 16px rgba(244,63,94,0.45)" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 9v4M12 17h.01" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            SOS
          </motion.button>

          {/* Avatar */}
          <motion.button
            onClick={() => navigate("profile")}
            whileTap={{ scale: 0.90 }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white"
            style={{
              background: `linear-gradient(135deg, ${C.indigo}, ${C.indigoDark})`,
              boxShadow: "0 2px 12px rgba(91,94,244,0.42)",
            }}>
            {(user?.name || "U").charAt(0).toUpperCase()}
          </motion.button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-hidden flex flex-col" style={{ paddingBottom: 62 }}>
        <AnimatePresence mode="wait" custom={slideDir}>
          <motion.div
            key={activeTab}
            custom={slideDir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={`flex-1 flex flex-col min-h-0 ${activeTab === "chat"
                ? "overflow-hidden p-4 pb-0"
                : "overflow-y-auto p-4"
              }`}>

            {activeTab === "home" && (
              <DashboardHome
                onNavigate={navigate}
                onSOS={() => setSosActive(true)}
              />
            )}
            {activeTab === "chat" && (
              <ChatPanel
                prefill={chatPrefill}
                onPrefillConsumed={() => setChatPrefill("")}
              />
            )}
            {activeTab === "pulse" && (
              <HealthPulse
                onNavigateToChat={() => navigate("chat")}
              />
            )}
            {activeTab === "emotion" && <EmotionMonitor />}
            {/* ADDED — onNavigateToChat wired so comparison "Ask NOVA" works */}
            {activeTab === "vault" && (
              <UploadVault
                onNavigateToChat={() => navigate("chat")}
              />
            )}
            {activeTab === "recovery" && <RecoveryPlan />}
            {activeTab === "journal" && (
              <JournalPanel
                onNavigateToChat={(text) => {
                  setChatPrefill(text || "");
                  navigate("chat");
                }}
              />
            )}
            {activeTab === "resources" && <ResourcesPanel />}
            {activeTab === "profile" && <ProfilePanel />}
            {activeTab === "medicine" && (
              <MedicineTracker
                onNavigateToChat={() => navigate("chat")}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── BOTTOM NAV ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav"
        style={{ height: 62, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex items-center h-full">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            const badge = navBadge(id);

            return (
              <motion.button
                key={id}
                onClick={() => navigate(id)}
                whileTap={{ scale: 0.90 }}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative">

                {/* Active pill */}
                {isActive && (
                  <motion.div
                    layoutId="nav-active-pill"
                    className="absolute rounded-xl"
                    style={{
                      top: 8, width: 40, height: 38,
                      background: "#EEF2FF",
                      border: "1px solid rgba(91,94,244,0.22)",
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 36 }} />
                )}

                <div className="relative z-10 flex flex-col items-center gap-0.5">
                  <div className="relative" style={{ transform: "scale(0.86)", transformOrigin: "center" }}>
                    <Icon active={isActive} />
                    {/* ADDED — badge dot */}
                    {badge && !isActive && (
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 rounded-full flex items-center justify-center"
                        style={{
                          width: typeof badge === "number" && badge > 1 ? 14 : 8,
                          height: 8,
                          background: id === "pulse" ? C.teal : C.rose,
                          minWidth: 8,
                        }}>
                        {typeof badge === "number" && badge > 1 && (
                          <span className="text-[7px] font-black text-white leading-none px-0.5">
                            {badge > 9 ? "9+" : badge}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </div>
                  <motion.span
                    animate={{ color: isActive ? C.navIconActive : C.navIcon }}
                    transition={{ duration: 0.18 }}
                    className="text-[8px] font-black leading-none tracking-tight">
                    {label}
                  </motion.span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </nav>

      <SOSOverlay
        active={sosActive}
        onClose={() => {
          setSosActive(false);
          dismissCrisis();
        }}
      />
    </div>
  );
}