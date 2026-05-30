# NOVA — AI Health Intelligence
## Complete Codebase Reference

> Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · Recharts  
> Private AI health companion — emotion-aware, medical-grade, always available.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [package.json](#2-packagejson)
3. [next.config.mjs](#3-nextconfigmjs)
4. [tsconfig.json](#4-tsconfigjson)
5. [lib/utils.ts](#5-libutilsts)
6. [app/globals.css](#6-appglobalscss)
7. [app/layout.tsx](#7-applayouttsx)
8. [app/page.tsx](#8-apppagetsx)
9. [app/auth/page.tsx](#9-appauthpagetsx)
10. [app/consent/page.tsx](#10-appconsentpagetsx)
11. [app/dashboard/page.tsx](#11-appdashboardpagetsx)
12. [contexts/AuthContext.tsx](#12-contextsauthcontexttsx)
13. [contexts/EmotionContext.tsx](#13-contextsemotioncontexttsx)
14. [contexts/ChatContext.tsx](#14-contextschatcontexttsx)
15. [components/landing/LandingPage.tsx](#15-componentslandinglandingpagetsx)
16. [components/auth/AuthPage.tsx](#16-componentsauthauthpagetsx)
17. [components/dashboard/DashboardShell.tsx](#17-componentsdashboarddashboardshelltsx)
18. [components/dashboard/DashboardHome.tsx](#18-componentsdashboarddashboardhometsx)
19. [components/dashboard/ChatPanel.tsx](#19-componentsdashboardchatpaneltsx)
20. [components/dashboard/EmotionMonitor.tsx](#20-componentsdashboardemotionmonitortsx)
21. [components/dashboard/UploadVault.tsx](#21-componentsdashboarduploadvaulttsx)
22. [components/dashboard/SOSOverlay.tsx](#22-componentsdashboardsosoverlaytsx)

---

## 1. Project Structure

```
nova/
├── app/
│   ├── auth/
│   │   └── page.tsx            # Auth route — wraps AuthPage in AuthProvider
│   ├── consent/
│   │   └── page.tsx            # Consent route — ConsentScreen in AuthProvider
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard route — all providers + DashboardShell
│   ├── global-error.tsx
│   ├── globals.css             # Tailwind v4 + NOVA design system
│   ├── layout.tsx              # Root layout — Inter + Outfit fonts, metadata
│   └── page.tsx                # Home — renders LandingPage
├── components/
│   ├── auth/
│   │   └── AuthPage.tsx        # Login, Register, Consent screens
│   ├── dashboard/
│   │   ├── ChatPanel.tsx       # NOVA chat interface
│   │   ├── DashboardHome.tsx   # Home tab — greeting, check-in, mood chart
│   │   ├── DashboardShell.tsx  # App shell — header, bottom nav, tab router
│   │   ├── EmotionMonitor.tsx  # Emotion scan + radar/bars visualisation
│   │   ├── SOSOverlay.tsx      # Full-screen SOS modal
│   │   └── UploadVault.tsx     # Medical document upload + AI analysis
│   └── landing/
│       └── LandingPage.tsx     # Marketing landing page
├── contexts/
│   ├── AuthContext.tsx         # User profile + auth state
│   ├── ChatContext.tsx         # Messages, crisis detection, NOVA responses
│   └── EmotionContext.tsx      # Emotion state + capture simulation
├── lib/
│   └── utils.ts                # cn() helper (clsx + tailwind-merge)
├── next.config.mjs
├── package.json
└── tsconfig.json
```

---

## 2. package.json

```json
{
  "name": "my-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint ."
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.1",
    "@radix-ui/react-accordion": "1.2.12",
    "@radix-ui/react-alert-dialog": "1.1.15",
    "@radix-ui/react-aspect-ratio": "1.1.8",
    "@radix-ui/react-avatar": "1.1.11",
    "@radix-ui/react-checkbox": "1.3.3",
    "@radix-ui/react-collapsible": "1.1.12",
    "@radix-ui/react-context-menu": "2.2.16",
    "@radix-ui/react-dialog": "1.1.15",
    "@radix-ui/react-dropdown-menu": "2.1.16",
    "@radix-ui/react-hover-card": "1.1.15",
    "@radix-ui/react-label": "2.1.8",
    "@radix-ui/react-menubar": "1.1.16",
    "@radix-ui/react-navigation-menu": "1.2.14",
    "@radix-ui/react-popover": "1.1.15",
    "@radix-ui/react-progress": "1.1.8",
    "@radix-ui/react-radio-group": "1.3.8",
    "@radix-ui/react-scroll-area": "1.2.10",
    "@radix-ui/react-select": "2.2.6",
    "@radix-ui/react-separator": "1.1.8",
    "@radix-ui/react-slider": "1.3.6",
    "@radix-ui/react-slot": "1.2.4",
    "@radix-ui/react-switch": "1.2.6",
    "@radix-ui/react-tabs": "1.1.13",
    "@radix-ui/react-toast": "1.2.15",
    "@radix-ui/react-toggle": "1.1.10",
    "@radix-ui/react-toggle-group": "1.1.11",
    "@radix-ui/react-tooltip": "1.2.8",
    "@vercel/analytics": "1.6.1",
    "autoprefixer": "^10.4.20",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "1.1.1",
    "date-fns": "4.1.0",
    "embla-carousel-react": "8.6.0",
    "@react-three/drei": "^9.121.4",
    "@react-three/fiber": "^8.18.0",
    "@types/three": "^0.176.0",
    "framer-motion": "^12.38.0",
    "three": "^0.176.0",
    "input-otp": "1.4.2",
    "lucide-react": "^0.564.0",
    "next": "16.2.0",
    "next-themes": "^0.4.6",
    "react": "19.2.4",
    "react-day-picker": "9.13.2",
    "react-dom": "19.2.4",
    "react-hook-form": "^7.54.1",
    "react-markdown": "^10.1.0",
    "react-resizable-panels": "^2.1.7",
    "recharts": "2.15.0",
    "sonner": "^1.7.1",
    "tailwind-merge": "^3.3.1",
    "vaul": "^1.1.2",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.2.0",
    "@types/node": "^22",
    "@types/react": "19.2.14",
    "@types/react-dom": "19.2.3",
    "postcss": "^8.5",
    "tailwindcss": "^4.2.0",
    "tw-animate-css": "1.3.3",
    "typescript": "5.7.3"
  }
}
```

---

## 3. next.config.mjs

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
```

---

## 4. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 5. lib/utils.ts

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## 6. app/globals.css

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background:           #F8F9FC;
  --color-foreground:           #0F172A;
  --color-card:                 #FFFFFF;
  --color-card-foreground:      #0F172A;
  --color-popover:              #FFFFFF;
  --color-popover-foreground:   #0F172A;
  --color-primary:              #5B5EF4;
  --color-primary-foreground:   #FFFFFF;
  --color-secondary:            #F1F3F8;
  --color-secondary-foreground: #0F172A;
  --color-muted:                #F1F3F8;
  --color-muted-foreground:     #64748B;
  --color-accent:               #EEF2FF;
  --color-accent-foreground:    #4338CA;
  --color-destructive:          #E11D48;
  --color-border:               #E2E8F0;
  --color-input:                #F1F3F8;
  --color-ring:                 rgba(91,94,244,0.40);
  --radius:                     0.75rem;
  --font-sans:  'Inter', system-ui, sans-serif;
  --font-display: 'Outfit', sans-serif;
}

/* ── Base ─────────────────────────────────────────────────────────────── */
@layer base {
  * { @apply border-border outline-ring/50; }
  html { scroll-behavior: smooth; }
  body {
    @apply bg-background text-foreground antialiased;
    font-family: 'Inter', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Force legible text on all inputs regardless of parent bg */
  input, textarea, select {
    color: #0F172A !important;
    caret-color: #4338CA;
  }
  input::placeholder, textarea::placeholder {
    color: #94A3B8 !important;
    opacity: 1;
  }
}

/* ── Custom scrollbar ──────────────────────────────────────────────────── */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(91,94,244,0.40); border-radius: 99px; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

/* ── Buttons ───────────────────────────────────────────────────────────── */
.btn-primary {
  background: linear-gradient(135deg, #5B5EF4 0%, #4338CA 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 999px;
  box-shadow: 0 4px 16px rgba(91,94,244,0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 22px rgba(91,94,244,0.50);
}
.btn-ghost {
  background: rgba(15,23,42,0.06);
  color: #334155;
  border: 1.5px solid #DDE3EF;
  border-radius: 999px;
  transition: background 0.15s ease;
}
.btn-ghost:hover { background: rgba(15,23,42,0.10); }
.press-feedback:active { transform: scale(0.96); }

/* ── Input base ────────────────────────────────────────────────────────── */
.nova-input {
  background: #F8F9FC;
  border: 1.5px solid #DDE3EF;
  color: #0F172A !important;
  caret-color: #4338CA;
  border-radius: 0.875rem;
  padding: 0.75rem 1rem 0.75rem 2.625rem;
  font-size: 0.9375rem;
  width: 100%;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

/* ── Glass nav (bottom navigation) ────────────────────────────────────── */
.glass-nav {
  background: rgba(255,255,255,0.97);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: 1px solid #E2E8F0;
  box-shadow: 0 -4px 24px rgba(15,23,42,0.08);
}

/* ── Gradient text helpers ─────────────────────────────────────────────── */
.text-gradient-indigo {
  background: linear-gradient(135deg, #4338CA 0%, #5B5EF4 40%, #D97706 80%, #F59E0B 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── Orb decorations ───────────────────────────────────────────────────── */
.orb-indigo {
  background: radial-gradient(circle, rgba(91,94,244,0.22) 0%, transparent 65%);
  filter: blur(48px);
  border-radius: 50%;
}
.orb-gold {
  background: radial-gradient(circle, rgba(217,119,6,0.18) 0%, transparent 65%);
  filter: blur(48px);
  border-radius: 50%;
}

/* ── Animations ────────────────────────────────────────────────────────── */
@keyframes float-pulse {
  0%,100% { transform: translateY(0); box-shadow: 0 4px 16px rgba(91,94,244,0.35); }
  50%      { transform: translateY(-6px); box-shadow: 0 10px 32px rgba(91,94,244,0.55); }
}
.float-pulse { animation: float-pulse 2.8s ease-in-out infinite; }

@keyframes sos-ring {
  0%   { transform: scale(1);   opacity: 0.7; }
  100% { transform: scale(1.9); opacity: 0; }
}
.sos-pulse::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(244,63,94,0.45);
  animation: sos-ring 1.5s ease-out infinite;
}

@keyframes scan-sweep {
  0%   { top: 0%;   opacity: 1; }
  95%  { top: 100%; opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
.scan-line {
  position: absolute;
  left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(91,94,244,0.80), transparent);
  animation: scan-sweep 2s linear infinite;
}

@keyframes breathe {
  0%,100% { transform: scale(1); }
  50%      { transform: scale(1.12); }
}
.breathe { animation: breathe 3.5s ease-in-out infinite; }

@keyframes nora-idle {
  0%,100% { transform: translateY(0); filter: brightness(1); }
  50%      { transform: translateY(-3px); filter: brightness(1.15); }
}
.nora-idle { animation: nora-idle 4s ease-in-out infinite; }

@keyframes glow-pulse {
  0%,100% { opacity: 0.6; }
  50%      { opacity: 1; }
}
.glow-pulse { animation: glow-pulse 4s ease-in-out infinite; }

@keyframes fade-in-down {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-in-down { animation: fade-in-down 0.4s ease both; }

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
.shimmer {
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite;
}

/* ── Typography utilities ──────────────────────────────────────────────── */
.display-xl {
  font-family: var(--font-outfit, 'Outfit', sans-serif);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.02;
}
.display-lg {
  font-family: var(--font-outfit, 'Outfit', sans-serif);
  font-weight: 900;
  letter-spacing: -0.025em;
  line-height: 1.08;
}
.display-md {
  font-family: var(--font-outfit, 'Outfit', sans-serif);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
}
.label-xs {
  font-size: 0.6875rem;
  font-weight: 800;
  letter-spacing: 0.10em;
  text-transform: uppercase;
}
```

---

## 7. app/layout.tsx

```tsx
import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300','400','500','600','700'],
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['400','500','600','700','800','900'],
})

export const metadata: Metadata = {
  title: 'NOVA — AI Health Intelligence',
  description: 'Emotion-aware conversations, medical report analysis, and personalised recovery plans. Your private AI health companion.',
  keywords: ['health AI', 'mental wellness', 'medical AI', 'emotion monitoring', 'recovery assistant', 'NOVA'],
  openGraph: {
    title: 'NOVA — AI Health Intelligence',
    description: 'Your private AI health companion — emotion-aware, medical-grade, always available.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#F8F9FC',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${outfit.variable} bg-[#F8F9FC]`}
    >
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
```

---

## 8. app/page.tsx

```tsx
"use client";

import { LandingPage } from "@/components/landing/LandingPage";

export default function Home() {
  return <LandingPage />;
}
```

---

## 9. app/auth/page.tsx

```tsx
"use client";

import { AuthPage } from "@/components/auth/AuthPage";
import { AuthProvider } from "@/contexts/AuthContext";

export default function AuthRoute() {
  return (
    <AuthProvider>
      <AuthPage />
    </AuthProvider>
  );
}
```

---

## 10. app/consent/page.tsx

```tsx
"use client";

import { ConsentScreen } from "@/components/auth/AuthPage";
import { AuthProvider } from "@/contexts/AuthContext";

export default function ConsentRoute() {
  return (
    <AuthProvider>
      <ConsentScreen />
    </AuthProvider>
  );
}
```

---

## 11. app/dashboard/page.tsx

```tsx
"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AuthProvider } from "@/contexts/AuthContext";
import { EmotionProvider } from "@/contexts/EmotionContext";
import { ChatProvider } from "@/contexts/ChatContext";

export default function DashboardRoute() {
  return (
    <AuthProvider>
      <EmotionProvider>
        <ChatProvider>
          <DashboardShell />
        </ChatProvider>
      </EmotionProvider>
    </AuthProvider>
  );
}
```

---

## 12. contexts/AuthContext.tsx

```tsx
"use client";

import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isAuthenticated: boolean;
  consent?: {
    healthDataProcessing: boolean;
    emotionAnalysis: boolean;
    aiInteraction: boolean;
    timestamp?: Date;
    version?: string;
  };
  familyCircle?: { name: string; phone: string; relation: string }[];
}

interface AuthContextType {
  user: UserProfile | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateConsent: (consent: UserProfile["consent"]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setAuthLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    if (!email || !password) throw new Error("Please enter your email and password.");
    setUser({
      id: "user-1",
      name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      isAuthenticated: true,
    });
    setAuthLoading(false);
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string) => {
    setAuthLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setUser({ id: "user-1", name, email, isAuthenticated: true });
    setAuthLoading(false);
  }, []);

  const logout = useCallback(() => { setUser(null); }, []);

  const updateConsent = useCallback(async (consent: UserProfile["consent"]) => {
    await new Promise((r) => setTimeout(r, 400));
    setUser((prev) => prev ? { ...prev, consent } : prev);
  }, []);

  return (
    <AuthContext.Provider value={{ user, authLoading, login, register, logout, updateConsent }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

---

## 13. contexts/EmotionContext.tsx

```tsx
"use client";

import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type EmotionState = {
  stress:    number;   // 0–1
  sadness:   number;   // 0–1
  fatigue:   number;   // 0–1
  joy:       number;   // 0–1
  dominant:  string;   // "stressed" | "positive" | "fatigued" | "calm"
  capturedAt?: Date;
  isCritical?: boolean;
};

interface EmotionContextType {
  emotion:       EmotionState | null;
  history:       EmotionState[];
  isCapturing:   boolean;
  captureEmotion: () => Promise<void>;
  clearEmotion:   () => void;
  getLatestEmotion: () => EmotionState | null;
}

const EmotionContext = createContext<EmotionContextType | null>(null);

const SAMPLE_EMOTIONS: Omit<EmotionState, "capturedAt" | "isCritical">[] = [
  { stress: 0.65, sadness: 0.30, fatigue: 0.45, joy: 0.20, dominant: "stressed" },
  { stress: 0.20, sadness: 0.15, fatigue: 0.30, joy: 0.75, dominant: "positive" },
  { stress: 0.40, sadness: 0.55, fatigue: 0.60, joy: 0.10, dominant: "fatigued" },
  { stress: 0.30, sadness: 0.20, fatigue: 0.20, joy: 0.60, dominant: "calm"     },
];

export function EmotionProvider({ children }: { children: ReactNode }) {
  const [emotion,     setEmotion]     = useState<EmotionState | null>(null);
  const [history,     setHistory]     = useState<EmotionState[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  const captureEmotion = useCallback(async () => {
    setIsCapturing(true);
    await new Promise((r) => setTimeout(r, 2200));
    const result  = SAMPLE_EMOTIONS[Math.floor(Math.random() * SAMPLE_EMOTIONS.length)];
    const newState: EmotionState = {
      ...result,
      capturedAt: new Date(),
      isCritical: result.stress > 0.8 || result.sadness > 0.8,
    };
    setEmotion(newState);
    setHistory((prev) => [...prev.slice(-9), newState]);
    setIsCapturing(false);
  }, []);

  const clearEmotion    = useCallback(() => setEmotion(null), []);
  const getLatestEmotion = useCallback(() => emotion, [emotion]);

  return (
    <EmotionContext.Provider value={{ emotion, history, isCapturing, captureEmotion, clearEmotion, getLatestEmotion }}>
      {children}
    </EmotionContext.Provider>
  );
}

export function useEmotion() {
  const ctx = useContext(EmotionContext);
  if (!ctx) throw new Error("useEmotion must be used within EmotionProvider");
  return ctx;
}
```

---

## 14. contexts/ChatContext.tsx

```tsx
"use client";

import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type MessageRole = "user" | "assistant";

export type Message = {
  id:        string;
  role:      MessageRole;
  content:   string;
  timestamp: Date;
  emotion?:  string;
  feedback?: 1 | -1;
};

export type CrisisSeverity = "low" | "moderate" | "high" | "critical";

export interface CrisisAlert {
  id:             string;
  messageContent: string;
  keywords:       string[];
  severity:       CrisisSeverity;
  timestamp:      Date;
  acknowledged:   boolean;
}

interface ChatContextType {
  messages:       Message[];
  isTyping:       boolean;
  crisisAlert:    CrisisAlert | null;
  sendMessage:    (content: string, emotion?: string) => Promise<void>;
  clearChat:      () => void;
  submitFeedback: (messageId: string, feedback: 1 | -1) => void;
  dismissCrisis:  () => void;
  uploadDocument: (file: File, metadata?: Record<string, string>) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

// ── Crisis keyword matching ──────────────────────────────────────────────────
const CRISIS_KEYWORDS: Record<CrisisSeverity, string[]> = {
  critical: ["suicide", "kill myself", "end my life", "want to die", "take my life"],
  high:     ["self harm", "hurt myself", "hopeless", "no reason to live", "better off dead"],
  moderate: ["depressed", "worthless", "nobody cares", "give up", "feel like a burden"],
  low:      ["feeling down", "really sad", "struggling a lot", "completely overwhelmed"],
};

function detectCrisis(text: string): { severity: CrisisSeverity; keywords: string[] } | null {
  const lower = text.toLowerCase();
  for (const [level, words] of Object.entries(CRISIS_KEYWORDS)) {
    const found = words.filter((w) => lower.includes(w));
    if (found.length > 0) return { severity: level as CrisisSeverity, keywords: found };
  }
  return null;
}

// ── NORA response bank ───────────────────────────────────────────────────────
const NORA_RESPONSES: Record<string, string[]> = {
  stressed: [
    "I can sense you're carrying a lot right now. Let's take a moment — can you tell me what's been weighing on you most today?",
    "Stress can feel overwhelming, but you don't have to face it alone. What's the main source of tension right now?",
  ],
  fatigued: [
    "Fatigue affects both body and mind deeply. Have you been able to get adequate rest? Let's explore some recovery strategies that fit your schedule.",
    "I notice signs of tiredness. Rest and recovery are foundational to health. Would you like to discuss sleep hygiene or gentle movement exercises?",
  ],
  positive: [
    "It's wonderful to see you in good spirits! Are there wellness goals you'd like to work toward today?",
    "Your emotional state looks great right now. This is a perfect time to reinforce healthy habits. What would you like to focus on?",
  ],
  calm: [
    "You seem centered and balanced today. How can NOVA support your wellness journey in this moment?",
    "A calm mind is a powerful foundation. Would you like to review your health insights or explore a new wellness practice?",
  ],
  default: [
    "Thank you for sharing that with me. I'm here to support your wellbeing every step of the way. Can you tell me more about how you've been feeling?",
    "I hear you. Your health and wellbeing matter deeply. Let's explore what might help you feel better today — physically, mentally, or emotionally.",
    "NOVA is here for you. Whether it's physical recovery, emotional support, or medical guidance, I'll do my best to assist. What feels most important right now?",
  ],
};

const DISCLAIMER = "\n\n*Please note: This is not medical advice. Always consult a qualified healthcare professional for medical decisions. If you're in crisis, please reach out to a mental health helpline immediately.*";

function getNORAResponse(userMsg: string, emotion?: string, crisisDetected?: boolean): string {
  if (crisisDetected) {
    return `I'm deeply concerned about your safety right now. You are not alone, and your life has immense value.\n\n**Please reach out for immediate support:**\n- **988 Suicide & Crisis Lifeline:** Call or text 988 (US)\n- **Crisis Text Line:** Text HOME to 741741\n- **AASRA (India):** 9152987821\n- **Emergency Services:** 112 / 911\n\nI'm here with you. Can you tell me more about what you're going through right now?\n\n*This is not a substitute for professional mental health care. Please contact a crisis professional.*`;
  }
  const lower = userMsg.toLowerCase();
  if (lower.includes("pain") || lower.includes("injury") || lower.includes("hurt")) {
    return `I understand you're experiencing pain or injury. Here are some immediate considerations:\n\n**RICE Method for acute injuries:**\n- **Rest** — Stop the activity causing pain\n- **Ice** — Apply ice for 15-20 minutes every 2-3 hours\n- **Compression** — Use a bandage to reduce swelling\n- **Elevation** — Raise the injured area above heart level\n\nIf the pain is severe, sudden, or accompanied by other symptoms, please seek immediate medical attention.${DISCLAIMER}`;
  }
  if (lower.includes("sleep") || lower.includes("insomnia") || lower.includes("tired")) {
    return `Sleep is foundational to recovery and mental health. Let me share evidence-based strategies:\n\n**Sleep Hygiene Protocol:**\n- Maintain consistent sleep/wake times\n- Avoid screens 1 hour before bed\n- Keep your room cool (65-68°F / 18-20°C)\n- Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s\n- Avoid caffeine after 2 PM\n\nWould you like a personalised sleep optimisation plan?${DISCLAIMER}`;
  }
  if (lower.includes("exercise") || lower.includes("workout") || lower.includes("physical")) {
    return `Physical movement is medicine for both body and mind. Let's build a recovery-focused routine:\n\n**Beginner Recovery Protocol:**\n1. Morning: 5-min gentle stretching\n2. Midday: 10-min walking\n3. Evening: Breathing exercises + light yoga\n\n**Progression:** Add 5 minutes each week as your body adapts.\n\nAlways listen to your body and stop if you experience sharp pain.${DISCLAIMER}`;
  }
  const pool = emotion && NORA_RESPONSES[emotion] ? NORA_RESPONSES[emotion] : NORA_RESPONSES.default;
  return pool[Math.floor(Math.random() * pool.length)];
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hello, I'm NOVA — your Neuro-Objective Recovery Assistant. I'm here to provide emotional support, health guidance, and personalised wellness insights. How are you feeling today?\n\n*Remember: I provide informational support, not medical advice. For emergencies, please contact your healthcare provider or call emergency services.*",
  timestamp: new Date(),
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages,    setMessages]    = useState<Message[]>([WELCOME]);
  const [isTyping,    setIsTyping]    = useState(false);
  const [crisisAlert, setCrisisAlert] = useState<CrisisAlert | null>(null);

  const sendMessage = useCallback(async (content: string, emotion?: string) => {
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
      emotion,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const crisis = detectCrisis(content);
    if (crisis) {
      setCrisisAlert({
        id: Date.now().toString(),
        messageContent: content,
        keywords: crisis.keywords,
        severity: crisis.severity,
        timestamp: new Date(),
        acknowledged: false,
      });
    }

    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    const noraMsg: Message = {
      id: `nora-${Date.now()}`,
      role: "assistant",
      content: getNORAResponse(content, emotion, !!crisis),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, noraMsg]);
    setIsTyping(false);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([{
      ...WELCOME,
      id: `welcome-${Date.now()}`,
      content: "Chat cleared. I'm here whenever you need me. How can I support your wellness journey today?",
      timestamp: new Date(),
    }]);
    setCrisisAlert(null);
  }, []);

  const submitFeedback = useCallback((messageId: string, feedback: 1 | -1) => {
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, feedback } : m));
  }, []);

  const dismissCrisis = useCallback(() => {
    setCrisisAlert((prev) => prev ? { ...prev, acknowledged: true } : null);
  }, []);

  const uploadDocument = useCallback(async (file: File, _metadata?: Record<string, string>) => {
    await new Promise((r) => setTimeout(r, 800));
    setMessages((prev) => [
      ...prev,
      {
        id: `doc-${Date.now()}`,
        role: "assistant",
        content: `I've received your document: **${file.name}**. I'll reference it to provide more contextually relevant support. Feel free to ask me any questions about it.`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  return (
    <ChatContext.Provider value={{ messages, isTyping, crisisAlert, sendMessage, clearChat, submitFeedback, dismissCrisis, uploadDocument }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
```

---

## 15. components/landing/LandingPage.tsx

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ArrowRight, Shield, MessageCircle, Upload, Heart, Zap, Menu, X, Check, Star } from "lucide-react";
import Link from "next/link";

const LOGO = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-removebg-preview%20%281%29-Y1mq7ehhT6Wm1NTxr8qoI4RlgHGNCN.png";

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:        "#F8F9FC",
  surface:   "#FFFFFF",
  surface2:  "#F1F3F8",
  surface3:  "#E8ECF4",
  border:    "#E2E8F0",
  borderMid: "#C6CEDF",
  indigo:    "#5B5EF4",
  indigoDark:"#4338CA",
  gold:      "#D97706",
  teal:      "#0D9488",
  rose:      "#E11D48",
  text:      "#0F172A",
  textMid:   "#334155",
  textSoft:  "#64748B",
};

// Violet→gold gradient applied as text clip on all display accents
const VG_GRAD = "linear-gradient(135deg, #4338CA 0%, #5B5EF4 40%, #D97706 80%, #F59E0B 100%)";

// ── Helper components ──────────────────────────────────────────────────────────

// Scroll-triggered fade up
function FadeUp({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref   = useRef(null);
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

// ── PhoneMockup ────────────────────────────────────────────────────────────────
// Three auto-rotating screens: NORA chat | Emotion Scan | Medical Vault
// Silver phone shell with side buttons, dynamic island, status bar
// Tab pills switch screens and pause auto-rotation

// ── Feature grid (6 cards, bento layout) ──────────────────────────────────────
const FEATURES = [
  { tag: "AI Chat",        title: "NORA — Your AI Companion",   accent: "#4338CA", tagBg: "#EEF2FF", tagBorder: "#C7D2FE", wide: true  },
  { tag: "Clinical OCR",   title: "Medical Vault",               accent: "#92400E", tagBg: "#FFFBEB", tagBorder: "#FDE68A", wide: false },
  { tag: "Privacy-first",  title: "Emotion Scan",                accent: "#0D9488", tagBg: "#F0FDFA", tagBorder: "#99F6E4", wide: false },
  { tag: "Visual AI",      title: "Injury Triage",               accent: "#9F1239", tagBg: "#FFF1F2", tagBorder: "#FECDD3", wide: false },
  { tag: "Real-time",      title: "Medication Tracker",          accent: "#6D28D9", tagBg: "#F5F3FF", tagBorder: "#DDD6FE", wide: false },
  { tag: "Safety net",     title: "Smart SOS",                   accent: "#166534", tagBg: "#F0FDF4", tagBorder: "#BBF7D0", wide: true  },
];

// ── Stats ──────────────────────────────────────────────────────────────────────
const STATS = [
  { value: "50,000+", label: "Active Users",   sub: "Across 32 countries"     },
  { value: "4.9 / 5", label: "Average rating", sub: "From 12k+ reviews"       },
  { value: "100%",    label: "Private",         sub: "Zero cloud uploads, ever"},
  { value: "32",      label: "Countries",       sub: "Global health companion" },
];

// ── Page sections (top → bottom) ──────────────────────────────────────────────
// 1. Navbar  — fixed, white/97 + blur, logo, nav links, Get Started CTA
// 2. Hero    — EEF2FF→F8F9FC→FFFBEB gradient bg, GradText on "actually",
//              PhoneMockup centred, two StatBadge floats, SOS badge, scroll arrow
// 3. Stats   — 4 numbers with VG_GRAD text clip, border-right dividers
// 4. Features — 6-card bento grid using FadeUp stagger
// 5. How it works — 3 numbered cards with watermark digit
// 6. Privacy — teal shield icon, VG_GRAD on "yours."
// 7. CTA     — EEF2FF→FFFBEB gradient, VG_GRAD on headline
// 8. Footer  — white, logo, links, disclaimer, copyright

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ... (full implementation: ~761 lines)
  // See repository for complete render output
}
```

---

## 16. components/auth/AuthPage.tsx

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, Check, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

const C = {
  bg:          "#F8F9FC",
  surface:     "#FFFFFF",
  surface2:    "#F1F3F8",
  border:      "#DDE3EF",
  borderFocus: "rgba(91,94,244,0.70)",
  indigo:      "#5B5EF4",
  indigoDark:  "#4338CA",
  indigoLight: "#4338CA",
  text:        "#0F172A",
  textMid:     "#334155",
  textSoft:    "#64748B",
};

type AuthView = "login" | "register" | "consent";

// ── Field ──────────────────────────────────────────────────────────────────────
// Labeled input with left icon, focus state (indigo border + ring),
// password toggle (eye icon), explicit color: #0F172A to prevent white text
function Field({ label, type, value, onChange, placeholder, icon, showToggle }: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder: string; icon: React.ReactNode; showToggle?: boolean;
}) {
  const [show,    setShow]    = useState(false);
  const [focused, setFocused] = useState(false);
  const inputType = showToggle ? (show ? "text" : "password") : type;

  return (
    <div>
      <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: C.textSoft }}>
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
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
          className="nova-input pl-10"
          style={{
            background: focused ? "#FFFFFF" : "#F1F5F9",
            borderColor: focused ? C.borderFocus : C.border,
            boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
            color: "#0F172A",
          }}
        />
        {showToggle && (
          <button type="button" onClick={() => setShow(!show)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2"
            style={{ color: C.textSoft }}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── LoginForm ─────────────────────────────────────────────────────────────────
// Email + password → login() → redirect /dashboard
function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { login, authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    }
  };
  // ... render
}

// ── RegisterForm ──────────────────────────────────────────────────────────────
// Name + email + password → register() → redirect /consent
function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { register, authLoading } = useAuth();
  const router = useRouter();
  // ... same pattern as LoginForm
}

// ── ConsentScreen ─────────────────────────────────────────────────────────────
// 4 consent items with animated checkboxes:
//   - Health Data Processing  (indigo)
//   - Emotion Analysis        (teal)
//   - AI Interaction          (green)
//   - Medical Disclaimer      (amber)
// Checked: #EEF2FF bg, #C7D2FE border
// Unchecked: #F1F3F8 bg, #DDE3EF border
// Submit disabled until all 4 checked → updateConsent() → router.push("/dashboard")
export function ConsentScreen() {
  // ... (full implementation)
}

// ── AuthDecorPanel (left decorative column on desktop) ────────────────────────
// surface2 bg, indigo + gold orbs, NOVA logo, 4 feature bullets
function AuthDecorPanel() {
  // ...
}

// ── AuthPage (main export) ────────────────────────────────────────────────────
// Desktop: two-column — left AuthDecorPanel + right form panel
// Mobile:  single column with compact logo header
export function AuthPage() {
  const [view, setView] = useState<AuthView>("login");
  // AnimatePresence switches between LoginForm and RegisterForm
}
```

---

## 17. components/dashboard/DashboardShell.tsx

```tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ChatPanel }      from "@/components/dashboard/ChatPanel";
import { EmotionMonitor } from "@/components/dashboard/EmotionMonitor";
import { UploadVault }    from "@/components/dashboard/UploadVault";
import { DashboardHome }  from "@/components/dashboard/DashboardHome";
import { SOSOverlay }     from "@/components/dashboard/SOSOverlay";

const C = {
  bg:           "#F8F9FC",
  surface:      "#FFFFFF",
  surface2:     "#F1F3F8",
  border:       "#E2E8F0",
  indigo:       "#5B5EF4",
  indigoDark:   "#4338CA",
  rose:         "#F43F5E",
  text:         "#0F172A",
  textSoft:     "#64748B",
  navIcon:      "#94A3B8",
  navIconActive:"#5B5EF4",
};

type ActiveTab = "home" | "chat" | "emotion" | "vault" | "recovery" | "profile" | "resources";

// ── Bottom nav items ───────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "home",      label: "Home",  Icon: HomeIcon      },
  { id: "chat",      label: "NORA",  Icon: ChatIcon      },
  { id: "emotion",   label: "Scan",  Icon: EyeIcon       },
  { id: "resources", label: "Learn", Icon: ResourcesIcon },
  { id: "vault",     label: "Vault", Icon: VaultIcon     },
  { id: "profile",   label: "Me",    Icon: ProfileIcon   },
];

// ── SVG icons — stroke colour toggles navIcon ↔ navIconActive ────────────────
// HomeIcon, ChatIcon, EyeIcon, VaultIcon, RecoveryIcon, ProfileIcon, ResourcesIcon

// ── Shell layout ──────────────────────────────────────────────────────────────
export function DashboardShell() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [sosActive, setSosActive] = useState(false);

  // Fixed header (56px):
  //   Left  — flower logo in #EEF2FF pill + animated tab title (framer AnimatePresence)
  //   Right — SOS button (.sos-pulse rose) + indigo avatar (tap to logout)

  // Main content — flex-1 overflow-auto pb-[70px]
  //   AnimatePresence: opacity 0→1, y 16→0 enter / y 0→-10 exit (240ms)
  //   Renders: DashboardHome | ChatPanel | EmotionMonitor | UploadVault
  //            | RecoveryPlan | ResourcesPanel | ProfilePanel

  // Fixed bottom nav (62px) — .glass-nav
  //   layoutId="nav-active-pill" spring animation (stiffness 500, damping 36)
  //   Active pill: 40×38px #EEF2FF rounded-xl
}

// ── ResourcesPanel ────────────────────────────────────────────────────────────
// Search input (color: C.text enforced), category filter pills, disclaimer banner
// 4 categories × 4 resources each:
//   Mental Health    (indigo) — AASRA, iCall, NIMHANS, Vandrevala
//   Medical Reference (teal) — Mayo Clinic, NHS, Medline Plus, WHO
//   Physical Recovery (green) — Physiopedia, RICE, ACE, Spine-Health
//   Medication & Nutrition (amber) — Drugs.com, RxList, Healthline, Labcorp

const RESOURCE_CATEGORIES = [
  {
    title: "Mental Health", color: "#5B5EF4", bg: "#EEF2FF", border: "#C7D2FE",
    resources: [
      { name: "AASRA Crisis Helpline",    desc: "24/7 suicide prevention support — India",         url: "https://www.aasra.info",                                            badge: "Helpline"  },
      { name: "iCall (TISS)",             desc: "Psychosocial helpline by Tata Institute",          url: "https://icallhelpline.org",                                         badge: "Helpline"  },
      { name: "NIMHANS",                  desc: "National Institute of Mental Health & Neurosciences", url: "https://nimhans.ac.in",                                         badge: "Institute" },
      { name: "Vandrevala Foundation",    desc: "24/7 mental health crisis line in India",          url: "https://www.vandrevalafoundation.com",                              badge: "Helpline"  },
    ],
  },
  {
    title: "Medical Reference", color: "#0D9488", bg: "#F0FDFA", border: "#99F6E4",
    resources: [
      { name: "Mayo Clinic",              desc: "Trusted medical diagnosis and treatment guides",   url: "https://www.mayoclinic.org",                                        badge: "Medical"   },
      { name: "NHS Health A–Z",           desc: "Conditions, symptoms and treatments (UK)",         url: "https://www.nhs.uk/conditions",                                     badge: "Medical"   },
      { name: "Medline Plus",             desc: "US National Library of Medicine health info",      url: "https://medlineplus.gov",                                           badge: "Medical"   },
      { name: "WHO Health Topics",        desc: "World Health Organization guidance",               url: "https://www.who.int/health-topics",                                 badge: "Global"    },
    ],
  },
  {
    title: "Physical Recovery", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0",
    resources: [
      { name: "Physiopedia",              desc: "Evidence-based physiotherapy techniques",          url: "https://www.physio-pedia.com",                                      badge: "Exercise"  },
      { name: "Healthline — RICE Method", desc: "Injury first-aid: Rest, Ice, Compression, Elevation", url: "https://www.healthline.com/health/rice-method",                badge: "First Aid" },
      { name: "ACE Exercise Library",     desc: "Certified low-impact and rehab exercises",         url: "https://www.acefitness.org/resources/everyone/exercise-library",    badge: "Exercise"  },
      { name: "Spine-Health",             desc: "Stretches and recovery for back and neck injuries",url: "https://www.spine-health.com",                                      badge: "Rehab"     },
    ],
  },
  {
    title: "Medication & Nutrition", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A",
    resources: [
      { name: "Drugs.com",                desc: "Medication interactions, dosages and side-effects", url: "https://www.drugs.com",                                           badge: "Meds"      },
      { name: "RxList",                   desc: "Prescription drug reference database",              url: "https://www.rxlist.com",                                           badge: "Meds"      },
      { name: "Healthline Nutrition",     desc: "Evidence-based nutrition and supplement guides",    url: "https://www.healthline.com/nutrition",                             badge: "Nutrition" },
      { name: "Labcorp Test Directory",   desc: "Understand your blood test results and markers",    url: "https://www.labcorp.com/tests",                                    badge: "Lab"       },
    ],
  },
];

// ── ProfilePanel ──────────────────────────────────────────────────────────────
// User avatar (indigo gradient), name/email display
// Family circle section — add button (indigo when active, #EEF2FF when inactive)
// Account settings (notifications, privacy, about NOVA)
// Sign out button (rose-50 bg)
```

---

## 18. components/dashboard/DashboardHome.tsx

```tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth }    from "@/contexts/AuthContext";
import { useEmotion } from "@/contexts/EmotionContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
         ResponsiveContainer, ReferenceLine } from "recharts";

// ── Time-based hero gradients ─────────────────────────────────────────────────
// Late Night (0–5h):  #312E81 → #4C1D95
// Morning   (6–11h): #1D4ED8 → #4338CA
// Afternoon (12–16h):#2563EB → #4F46E5
// Evening   (17–19h):#4338CA → #6D28D9
// Night     (20–23h):#312E81 → #4C1D95

// ── Mood scale ────────────────────────────────────────────────────────────────
const MOODS = [
  { score: 1,  emoji: "😞", label: "Very Low",  color: "#BE123C", bg: "#FFF1F2" },
  { score: 2,  emoji: "😟", label: "Low",        color: "#C2410C", bg: "#FFF7ED" },
  { score: 3,  emoji: "😕", label: "Low",        color: "#C2410C", bg: "#FFF7ED" },
  { score: 4,  emoji: "😐", label: "Meh",        color: "#B45309", bg: "#FFFBEB" },
  { score: 5,  emoji: "🙂", label: "Okay",       color: "#92400E", bg: "#FFFBEB" },
  { score: 6,  emoji: "😊", label: "Okay",       color: "#166534", bg: "#F0FDF4" },
  { score: 7,  emoji: "😄", label: "Good",       color: "#166534", bg: "#F0FDF4" },
  { score: 8,  emoji: "😁", label: "Good",       color: "#065F46", bg: "#ECFDF5" },
  { score: 9,  emoji: "🤩", label: "Great",      color: "#1E40AF", bg: "#EFF6FF" },
  { score: 10, emoji: "🌟", label: "Excellent",  color: "#3730A3", bg: "#EEF2FF" },
];

// ── 7-day seed data ───────────────────────────────────────────────────────────
const SEED_DAYS = [
  { day: "Mon", score: 6 },
  { day: "Tue", score: 5 },
  { day: "Wed", score: 7 },
  { day: "Thu", score: null },
  { day: "Fri", score: 8 },
  { day: "Sat", score: 6 },
];

// ── MoodTrendGraph ────────────────────────────────────────────────────────────
// recharts AreaChart (height 160px)
// Gradient: indigo 22% → 2% opacity
// Dashed ReferenceLine at 7-day average (stroke #C7D2FE)
// Coloured dots per day using MOODS[score].color
// connectNulls={false} — gaps shown for unlogged days
// Day-dot legend row below chart (emoji + "Today" highlight)
// Trend chip: green "↑ +N" or rose "↓ -N" comparing last two logged days

// ── DashboardHome ─────────────────────────────────────────────────────────────
export function DashboardHome({
  onNavigate,
  onSOS,
}: {
  onNavigate: (tab: "home" | "chat" | "emotion" | "vault" | "recovery" | "profile" | "resources") => void;
  onSOS: () => void;
}) {
  // Hero card — time-based gradient, frosted avatar, date, NORA active chip
  // 3 stat chips: MOOD, STREAK, SCANS
  // Emergency (rose frosted) + Talk to NORA (white) buttons

  // Daily Check-In — 10 emoji mood buttons (1–10)
  // Selected → colour-matched confirmation banner
  // Submit button → disabled (#E8ECF4) until mood selected, then btn-primary

  // MoodTrendGraph

  // Quick action 2×2 grid:
  //   Chat with NORA (indigo) | Emotion Scan (teal)
  //   Upload Report  (amber)  | Recovery Plan (green)

  // NORA Tip — 5 tips rotating every 12s with AnimatePresence crossfade
  const TIPS = [
    "Consistency beats intensity. A 10-minute daily walk improves mood more reliably than sporadic intense sessions.",
    "Hydration is the easiest quick win — even mild dehydration (1-2%) measurably impairs focus and mood.",
    "The 4-7-8 breath technique activates your parasympathetic system within 60 seconds. Inhale 4, hold 7, exhale 8.",
    "Sleep before midnight has a higher restorative density. Two hours before midnight equals roughly four after.",
    "Social connection is as protective against mortality as quitting smoking. Reach out to someone today.",
  ];
}
```

---

## 19. components/dashboard/ChatPanel.tsx

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2, ThumbsUp, ThumbsDown, X, Phone, Sparkles } from "lucide-react";
import { useChat, type Message } from "@/contexts/ChatContext";
import { useEmotion }            from "@/contexts/EmotionContext";
import ReactMarkdown             from "react-markdown";

const C = {
  bg:          "#F8F9FC",
  surface:     "#FFFFFF",
  surface2:    "#F1F3F8",
  border:      "#E2E8F0",
  indigo:      "#5B5EF4",
  indigoDark:  "#4338CA",
  indigoLight: "#4338CA",
  rose:        "#E11D48",
  text:        "#0F172A",
  textMid:     "#334155",
  textSoft:    "#64748B",
};

const NOVA_LOGO = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-removebg-preview%20%281%29-Y1mq7ehhT6Wm1NTxr8qoI4RlgHGNCN.png";

const SUGGESTIONS = [
  { text: "I feel stressed today",  icon: "🌊" },
  { text: "Help me breathe",        icon: "💨" },
  { text: "Pain management tips",   icon: "🩹" },
  { text: "Improve my sleep",       icon: "🌙" },
  { text: "Track my mood",          icon: "📊" },
];

// ── MessageBubble ─────────────────────────────────────────────────────────────
// NORA:  bg #F1F3F8, border #E2E8F0, color #334155, NORA flower avatar
// User:  bg linear-gradient(135deg, #5B5EF4, #4338CA), color white, "You" avatar
// Crisis: bg #FFF1F2, border #FECDD3, color #9F1239, Phone icon header
// ReactMarkdown renders NORA's markdown responses
// ThumbsUp/Down feedback below each NORA message
function MessageBubble({ msg, onFeedback }: { msg: Message; onFeedback?: (id: string, v: 1 | -1) => void }) {
  // ...
}

// ── TypingIndicator ───────────────────────────────────────────────────────────
// NORA avatar with .nora-idle animation + 3 indigo dots
// Dots animate: y 0→-6→0, opacity 0.35→1→0.35, scale 1→1.15→1 (stagger 0.18s)
function TypingIndicator() {
  // ...
}

// ── CrisisBanner ─────────────────────────────────────────────────────────────
// bg #FFF1F2, border #FECDD3, dismissible
// Shows: 988 | Text HOME to 741741 | 911
function CrisisBanner({ onDismiss }: { onDismiss: () => void }) {
  // ...
}

// ── EmptyState ────────────────────────────────────────────────────────────────
// Flower logo in #EEF2FF card, radial indigo glow, y-bobbing animation
// "Hello, I'm NORA" heading, 5 suggestion chips
function EmptyState({ onSuggest }: { onSuggest: (text: string) => void }) {
  // ...
}

// ── ChatPanel (main export) ───────────────────────────────────────────────────
export function ChatPanel() {
  const { messages, isTyping, sendMessage, clearChat, crisisAlert, dismissCrisis, submitFeedback } = useChat();
  const { emotion } = useEmotion();
  const [input, setInput]           = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Layout: fixed height calc(100vh - 130px), flex-col
  //   NORA header card (online dot, emotion chip, clear button)
  //   CrisisBanner (AnimatePresence)
  //   Messages area (flex-1 overflow-y-auto scrollbar-hide)
  //   Suggestion chips (when messages.length <= 3)
  //   Input bar — ambient glow when focused:
  //     radial-gradient rgba(91,94,244,0.18) behind, blur(12px)
  //     border transitions to rgba(91,94,244,0.50), ring rgba(91,94,244,0.10)
  //     textarea: color #0F172A, caretColor #4338CA
  //     Send button: 36×36px indigo gradient when input.trim() exists
}
```

---

## 20. components/dashboard/EmotionMonitor.tsx

```tsx
"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useEmotion } from "@/contexts/EmotionContext";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar,
         ResponsiveContainer, Tooltip } from "recharts";

// ── Emotion config ────────────────────────────────────────────────────────────
const EMOTION_CONFIG = {
  stressed: { color: "#9F1239", bg: "#FFF1F2", border: "#FECDD3", label: "Stressed", emoji: "😮‍💨",
    advice: "NORA detects elevated stress markers. Try 4-7-8 breathing: inhale 4 counts, hold 7, exhale 8. Gentle movement and journaling can also lower cortisol." },
  fatigued: { color: "#92400E", bg: "#FFFBEB", border: "#FDE68A", label: "Fatigued", emoji: "😴",
    advice: "Signs of fatigue detected. Prioritise hydration and a 20-minute rest. Avoid screens before sleep and try a light walk to re-energise." },
  positive: { color: "#166534", bg: "#F0FDF4", border: "#BBF7D0", label: "Positive", emoji: "🌟",
    advice: "Excellent emotional state. This is a great time for goal-setting, light exercise, or social connection to reinforce your momentum." },
  calm:     { color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE", label: "Calm",     emoji: "🧘",
    advice: "A calm, balanced state supports optimal decision-making and healing. Consider a mindfulness session or a wellness goal review." },
};

// ── BreathingRing ─────────────────────────────────────────────────────────────
// Outer ring: #EEF2FF bg, 2px solid #A5B4FC, 0 0 32px rgba(91,94,244,0.12)
// Inner circle: #C7D2FE bg, 1.5px solid #818CF8
// Both animate scale 1→1.22→1 / 1→1.15→1 at 4s ease-in-out (stagger 0.5s)
function BreathingRing() { /* ... */ }

// ── EmotionMonitor (main export) ──────────────────────────────────────────────
export function EmotionMonitor() {
  const { emotion, isCapturing, captureEmotion, clearEmotion } = useEmotion();
  const [activeInsightTab, setActiveInsightTab] = useState<"radar" | "bars">("bars");

  // Indigo gradient hero header (4338CA → 5B5EF4 → 7C3AED)
  // 2-column grid on md+: left=viewfinder+controls, right=results

  // Viewfinder (height 280px, bg #F1F3F8):
  //   Scanning: 3 concentric animated rings, rotating eye SVG, scan-line animation
  //   Result:   emoji in semantic colour card, confidence bar (track #E2E8F0)
  //   Idle:     BreathingRing, corner bracket SVGs

  // Controls: large indigo scan button (60×60, pulsing ring when idle)
  //           Reset button (#F1F3F8, RefreshCw icon) appears after scan

  // Results panel (appears after scan):
  //   "Breakdown" / "Radar" tab toggle (active = indigo bg)
  //   Bars: 5 metrics — Joy(green), Stress(rose), Fatigue(gold), Sadness(purple), Calm(teal)
  //         Track: #F1F5F9
  //   Radar: recharts RadarChart, PolarGrid stroke #E2E8F0, fill at 18% opacity
  //   NORA insight card: semantic bg/border, flower logo, advice text

  // Privacy bar: "Face scan runs entirely on your device. No images transmitted."
  //   bg #EEF2FF, border #C7D2FE, indigo shield icon
}
```

---

## 21. components/dashboard/UploadVault.tsx

```tsx
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, CheckCircle, Loader } from "lucide-react";

// ── Mock analysis results (3 types) ─────────────────────────────────────────
const MOCK_ANALYSES = [
  {
    type: "Blood Report",
    riskLevel: "medium",
    findings: [
      "Haemoglobin: 13.2 g/dL (slightly below normal range)",
      "White Blood Cell Count: 8,200/μL (normal)",
      "Platelets: 245,000/μL (normal)",
      "Glucose: 102 mg/dL (borderline elevated)",
    ],
    recommendations: [
      "Increase iron-rich foods: spinach, legumes, lean red meat",
      "Monitor fasting glucose — consider follow-up in 3 months",
      "Stay hydrated (2–3 litres of water daily)",
      "Consult your physician about the haemoglobin levels",
    ],
  },
  {
    type: "Injury Scan",
    riskLevel: "low",
    findings: [
      "Mild soft tissue inflammation in the joint region",
      "No visible bone fractures detected",
      "Localised swelling pattern consistent with sprain",
      "No signs of chronic degeneration",
    ],
    firstAid: [
      "Rest — stop activities that cause pain",
      "Ice — apply for 15–20 min every 2–3 hours",
      "Compression — wrap with an elastic bandage",
      "Elevation — raise above heart level when resting",
    ],
    recommendations: [
      "Continue RICE protocol for 48–72 hours",
      "Gentle range-of-motion exercises after acute phase",
      "Seek medical attention if pain worsens or persists beyond 5 days",
      "Avoid high-impact activities until fully recovered",
    ],
  },
  {
    type: "X-Ray Analysis",
    riskLevel: "low",
    findings: [
      "Bone density appears normal for age group",
      "No acute fractures detected in visible field",
      "Slight joint space narrowing — early degenerative change",
      "Soft tissue shadow normal",
    ],
    recommendations: [
      "Calcium and Vitamin D supplementation may be beneficial",
      "Low-impact exercise (swimming, cycling) to maintain joint health",
      "Follow up with an orthopaedic specialist for joint narrowing",
      "Maintain healthy BMI to reduce joint load",
    ],
  },
];

// Risk badge colours:
// low    → #F0FDF4 bg / #166534 text / #BBF7D0 border
// medium → #FFFBEB bg / #92400E text / #FDE68A border
// high   → #FFF1F2 bg / #9F1239 text / #FECDD3 border

// ── Upload flow ───────────────────────────────────────────────────────────────
// processFile(name):
//   1. Status "uploading" → progress bar animates to 60% (1.2s)
//   2. Status "analyzing" → progress bar animates to 90% (2.0s)
//   3. Status "complete"  → random MOCK_ANALYSIS result assigned

// ── UI structure ──────────────────────────────────────────────────────────────
// Drop zone: dashed border, animates indigo on drag, scale 1.01
//   Upload icon: bg #EEF2FF, border #C7D2FE, color #4338CA
//   Format chips: #F1F5F9 bg, #64748B text
// "Try with Sample Report" button: #EEF2FF bg, #4338CA text
// File list: click complete file → shows in results panel (right column)
// Results panel:
//   "AI Analysis" heading: color C.text (#0F172A)
//   "Key Findings" heading: color C.text
//   RICE section: #FFF1F2 bg, #FECDD3 border, #9F1239 headings
//   "NORA Recommendations" heading: color C.text
//   Disclaimer: #FFFBEB bg, #FDE68A border, #92400E text
// Empty state: Upload icon in #EEF2FF/#C7D2FE, "No report selected" in C.text

export function UploadVault() {
  const [files,        setFiles]        = useState<UploadedFile[]>([]);
  const [isDragging,   setIsDragging]   = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  // ...full implementation
}
```

---

## 22. components/dashboard/SOSOverlay.tsx

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, MessageCircle, X, Heart, CheckCircle, AlertTriangle } from "lucide-react";

// ── Hotlines ──────────────────────────────────────────────────────────────────
const HOTLINES = [
  { name: "Suicide & Crisis Lifeline", number: "988",               desc: "Call or text, 24/7, free & confidential",   category: "crisis"    },
  { name: "Crisis Text Line",          number: "Text HOME → 741741", desc: "Text-based crisis support, available 24/7", category: "crisis"    },
  { name: "Emergency Services",        number: "911",               desc: "Immediate physical danger — call first",    category: "emergency" },
  { name: "SAMHSA National Helpline",  number: "1-800-662-4357",    desc: "Mental health & substance use support",     category: "support"   },
];

// Category colours:
// crisis    → rose   (#E11D48 / #FFF1F2 / #FECDD3)
// emergency → orange (rgba(249,115,22,…))
// support   → indigo (rgba(91,94,244,…))

// ── Overlay ───────────────────────────────────────────────────────────────────
export function SOSOverlay({ active, onClose, userName }: {
  active: boolean; onClose: () => void; userName: string;
}) {
  const [alertSent, setAlertSent] = useState(false);
  const [sending,   setSending]   = useState(false);

  // Backdrop: rgba(3,5,12,0.90) + blur(14px)
  // Viewport pulse ring: inset box-shadow rgba(244,63,94,0.42) at 1.8s ease-in-out
  // Modal: white card, max-w-md, rounded-3xl, rose border rgba(244,63,94,0.22)

  // Header:
  //   Linear gradient: rgba(244,63,94,0.28)→rgba(244,63,94,0.06)
  //   3 pulsing concentric rings (stagger 0.5s, scale 1→1.4+→1)
  //   AlertTriangle icon in rgba(244,63,94,0.20) circle
  //   "Emergency SOS" — Outfit Black

  // Before sending:
  //   4 hotline cards (semantic bg/border per category)
  //   "Send SOS Alert" → rose gradient button
  //   "I'm Safe" → rgba(34,197,94,0.12) / #166534 text

  // After sending (alertSent=true):
  //   CheckCircle in #F0FDF4 / #BBF7D0 ring, spring scale animation
  //   "Alert Sent" heading
  //   SMS preview in green-50
  //   Breathing tip in amber-50
  //   "Return to NOVA" → btn-primary (indigo gradient)
  //   Footer: "NOVA SOS is a support tool — always call 911 for immediate life-threatening emergencies."

  // Close (×) button: rgba(255,255,255,0.09) bg, shown only before alertSent
}
```

---

## Colour Reference

| Token | Hex | Usage |
|---|---|---|
| Page canvas | `#F8F9FC` | App background |
| Surface | `#FFFFFF` | Cards, panels, modals |
| Surface 2 | `#F1F3F8` | Input bg, secondary surfaces |
| Surface 3 | `#E8ECF4` | Tags, chips |
| Border | `#E2E8F0` | Default borders |
| Border focus | `rgba(91,94,244,0.70)` | Input focus border |
| Text 100 | `#0F172A` | Headings, primary text |
| Text 200 | `#334155` | Body text |
| Text Soft | `#64748B` | Labels, captions |
| Text Muted | `#94A3B8` | Placeholders, nav icons |
| **Indigo** | `#5B5EF4` | Primary brand, buttons, active nav |
| Indigo Dark | `#4338CA` | Hover, gradient start |
| Indigo 50 | `#EEF2FF` | Chip bg, icon containers |
| Indigo 200 | `#C7D2FE` | Chip borders |
| **Gold** | `#D97706` | Medical, warnings, gradient end |
| Gold Light | `#F59E0B` | Gradient highlight |
| Amber 50 | `#FFFBEB` | Disclaimer / warning bg |
| Amber 200 | `#FDE68A` | Warning border |
| **Teal** | `#0D9488` | Privacy, calm emotion |
| Teal 50 | `#F0FDFA` | Teal chip bg |
| Teal 200 | `#99F6E4` | Teal chip border |
| **Rose** | `#E11D48` | SOS, danger, stress |
| Rose (button) | `#F43F5E` | SOS button / overlay |
| Rose 50 | `#FFF1F2` | Error / crisis bg |
| Rose 200 | `#FECDD3` | Error border |
| Green | `#16A34A` | Positive, normal, safe |
| Green 50 | `#F0FDF4` | Success bg |
| Green 200 | `#BBF7D0` | Success border |
| Purple | `#6D28D9` | Medication, Radar radar fill |
| Purple 50 | `#F5F3FF` | Purple chip bg |
| Purple 200 | `#DDD6FE` | Purple chip border |

### Signature Gradient

Applied to all display accent text (hero headline, stat numbers, CTA):

```css
background: linear-gradient(135deg, #4338CA 0%, #5B5EF4 40%, #D97706 80%, #F59E0B 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
```

---

## Animation Reference

| Class | Effect | Duration |
|---|---|---|
| `.float-pulse` | Button float + glow | 2.8s ease-in-out |
| `.sos-pulse::after` | Ring ripple outward | 1.5s ease-out |
| `.scan-line` | Sweep top → bottom | 2s linear |
| `.breathe` | Scale 1 → 1.12 | 3.5s ease-in-out |
| `.nora-idle` | Float –3px + brightness | 4s ease-in-out |
| `.glow-pulse` | Opacity 0.6 → 1 | 4s ease-in-out |
| `.fade-in-down` | y –8 → 0 on mount | 0.4s ease |
| `.shimmer` | Skeleton loading | 1.6s linear |
| Framer `whileHover` | y –2 to –3px lift + shadow | spring 300/22 |
| Framer `whileTap` | scale 0.90–0.96 | 120ms |
| Framer `AnimatePresence` | Tab exit y 0 → –10 | 240ms |

---

## Input Contrast Fix

All inputs enforce `color: #0F172A` to prevent white-on-white text in any context:

```css
/* globals.css — @layer base */
input, textarea, select {
  color: #0F172A !important;
  caret-color: #4338CA;
}
input::placeholder, textarea::placeholder {
  color: #94A3B8 !important;
  opacity: 1;
}
```

Additionally, every `<input>` that uses a dynamic background also sets `color: "#0F172A"` inline as a redundant safeguard:

```tsx
<input
  style={{
    background: focused ? "#FFFFFF" : "#F1F5F9",
    borderColor: focused ? "rgba(91,94,244,0.70)" : "#DDE3EF",
    boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
    color: "#0F172A",  // explicit safeguard
  }}
/>
```

---

*NOVA — Private by design. Built with Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · Recharts*
