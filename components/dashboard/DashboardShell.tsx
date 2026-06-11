"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ProfilePanel } from "@/components/dashboard/ProfilePanel";
import { RecoveryPlan } from "@/components/dashboard/RecoveryPlan";
import { JournalPanel } from "@/components/dashboard/JournalPanel";
import { ResourcesPanel } from "@/components/dashboard/ResourcesPanel";
import { ChatPanel } from "@/components/dashboard/ChatPanel";
import { EmotionMonitor } from "@/components/dashboard/EmotionMonitor";
import { UploadVault } from "@/components/dashboard/UploadVault";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { SOSOverlay } from "@/components/dashboard/SOSOverlay";
import { useChat } from "@/contexts/ChatContext";
import { LOGO_URL } from "@/lib/constants";
import { InstallButton } from "@/components/pwa/InstallButton";
import {
  Home, MessageCircle, BarChart2, Shield, User, LogOut,
  Menu, X, ArrowRight, BookOpen, Heart, Phone, ExternalLink
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
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
};

type ActiveTab = "home" | "chat" | "emotion" | "vault" | "recovery" | "journal" | "profile" | "resources";

// ─── SVG icon helpers ─────────────────────────────────────────────────────────
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
function EyeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={active ? C.navIconActive : C.navIcon} strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3"
        stroke={active ? C.navIconActive : C.navIcon}
        fill={active ? "#EEF2FF" : "none"}
        strokeWidth="1.7" />
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
function RecoveryIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        stroke={active ? C.navIconActive : C.navIcon}
        strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
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

const NAV_ITEMS: { id: ActiveTab; label: string; Icon: React.ComponentType<{ active: boolean }> }[] = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "chat", label: "NOVA", Icon: ChatIcon },
  { id: "emotion", label: "Scan", Icon: EyeIcon },
  { id: "resources", label: "Learn", Icon: ResourcesIcon },
  { id: "vault", label: "Vault", Icon: VaultIcon },
  { id: "profile", label: "Me", Icon: ProfileIcon },
];

export function DashboardShell() {
  const { user, logout, authLoading } = useAuth();
  const { crisisAlert, dismissCrisis } = useChat();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [sosActive, setSosActive] = useState(false);
  const [homeTitle, setHomeTitle] = useState(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  });

  // Auto-redirect to auth if no user
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  const handleProfile = () => { setActiveTab("profile"); };

  const tabTitles: Record<ActiveTab, string> = {
    home: homeTitle,
    chat: "NOVA",
    emotion: "Emotion Scan",
    vault: "Medical Vault",
    recovery: "Recovery Plan",
    journal: "Journal",
    profile: "My Profile",
    resources: "Learn",
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: C.bg }}>

      {/* ── TOP HEADER ──────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 relative z-20"
        style={{
          height: 56,
          background: "rgba(255,255,255,0.97)",
          borderBottom: `1px solid ${C.border}`,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}>

        {/* Logo + tab title */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
            <img src={LOGO_URL}
              alt="NOVA" className="w-4 h-4 object-contain" />
          </div>
          <AnimatePresence mode="wait">
            <motion.span key={activeTab}
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="text-sm font-black" style={{ color: C.text, fontFamily: "var(--font-outfit, sans-serif)" }}>
              {tabTitles[activeTab]}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Install App Button */}
          <InstallButton variant="dashboard" />
          
          {/* SOS — pulsing */}
          <motion.button
            onClick={() => setSosActive(true)}
            whileTap={{ scale: 0.92 }}
            className="h-8 px-3.5 rounded-full text-xs font-black text-white flex items-center gap-1.5 sos-pulse"
            style={{ background: C.rose, boxShadow: "0 4px 16px rgba(244,63,94,0.45)" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 9v4M12 17h.01" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            SOS
          </motion.button>

          {/* Avatar — tap to go to profile */}
          <motion.button
            onClick={handleProfile}
            title="My Profile"
            whileTap={{ scale: 0.90 }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white"
            style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.indigoDark})`, boxShadow: "0 2px 12px rgba(91,94,244,0.42)" }}>
            {(user?.name || "U").charAt(0).toUpperCase()}
          </motion.button>
        </div>
      </header>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden flex flex-col" style={{ paddingBottom: 62 }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className={`flex-1 flex flex-col min-h-0 ${activeTab === "chat" ? "overflow-hidden p-4 pb-0" : "overflow-y-auto p-4"}`}>
            {activeTab === "home" && <DashboardHome onNavigate={setActiveTab} onSOS={() => setSosActive(true)} />}
            {activeTab === "chat" && <ChatPanel />}
            {activeTab === "emotion" && <EmotionMonitor />}
            {activeTab === "vault" && <UploadVault />}
            {activeTab === "recovery" && <RecoveryPlan />}
            {activeTab === "journal" && <JournalPanel />}
            {activeTab === "resources" && <ResourcesPanel />}
            {activeTab === "profile" && <ProfilePanel />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── BOTTOM NAV ──────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav"
        style={{ height: 62, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex items-center h-full">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <motion.button
                key={id}
                onClick={() => setActiveTab(id)}
                whileTap={{ scale: 0.90 }}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative">

                {/* Animated background pill */}
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
                  <div style={{ transform: "scale(0.86)", transformOrigin: "center" }}>
                    <Icon active={isActive} />
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

      <SOSOverlay active={sosActive} onClose={() => {
        setSosActive(false);
        dismissCrisis();
      }} />
    </div>
  );
}


