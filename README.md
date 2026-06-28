# 🪐 NOVA: Emotion-Aware Clinical Health Companion

> **NOVA** is a production-ready, medical-grade personal health intelligence platform and companion. By combining localized edge emotion detection, automated laboratory diagnostics comparison, time-aware chat context grounding, and proactive mental-health safety triggers, NOVA bridges the gap between patient self-reports and professional clinical assessment.

[![Next.js 16 (Turbopack)](https://img.shields.io/badge/Next.js-16.2.0%20(Turbopack)-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![Firebase Suite](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore%20%7C%20Storage-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind & Vanilla CSS](https://img.shields.io/badge/Styling-Tailwind%20%26%20CSS-teal?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

---

## 🌟 Key Platform Pillars

### 1. 🧠 Emotionally-Aware Chat & Multi-Lingual Interface (`ChatPanel`)
* **Real-time Local Processing**: Integrates local face expression analysis (`face-api.js`) via the user's camera feed to adjust conversation style dynamically. 
* **Voice-First Input & Speech Synthesis**: Direct speech-to-text input with live transcript previews, paired with natural, high-performance text-to-speech output.
* **Contextual Suggestions**: Automatically generates time-of-day and state-aware suggestions (e.g. mindfulness help in the morning, wind-down exercises at night) which pre-fill the input area.
* **Localization**: Full support for English, Hindi (हिन्दी), Marathi (मराठी), Bengali (বাংলা), Tamil (தமிழ்), and Telugu (తెలుగు).

### 2. 📋 Comprehensive Medical Vault & Longitudinal Comparison (`UploadVault`)
* **Diagnostics Parser**: Parses PDF, image, and text reports using LLM-backed diagnostics extraction, identifying markers, values, units, and ranges.
* **Smart Compare**: Recognizes similar historical laboratory tests (e.g., Blood Panel, Lipid Panel) and generates a side-by-side longitudinal marker variation table.
* **Clinician-Ready Dashboard**: Highlights stable, changed, and monitored markers with clear directional arrows (`up`, `down`, `flat`) alongside a clean summary.
* **Context Synchronization**: Automatically updates whether a medical file has been discussed in chat, hiding notification badges once reviewed.

### 3. ⏱️ Unified Medication Management (`MedicineTracker`)
* **Today / History / Management Subviews**: Users can log daily doses, record skips with reasons (e.g. side effects), and create schedules specifying dosages, frequencies, and target time periods (morning, evening, etc.).
* **Dynamic Adherence Calculations**: Tracks weekly adherence ratios and injects gentle prompt-level suggestions if adherence falls below critical thresholds.

### 4. 🚨 Smart SOS & Active Safety Triggers (`SOSOverlay`)
* **Countdown Interruption**: 4-second delay before alert transmission allows users to abort accidental triggers.
* **Silent Coordinate Appending**: Accesses browser geolocation to automatically construct and append precise Google Maps locations in panic messages.
* **Proactive Contact Guards**: Alerts users immediately if their emergency Family Circle contacts are empty.
* **Clinical Breathing Assistant**: A full interactive 4-7-8 breathing circle to help calm users down in high-panic moments.

### 5. 📉 HealthPulse & Early Warning Engine (`HealthPulse`)
* **Frequency-Sorted Tags**: Symptoms are ordered dynamically based on the user's logging history.
* **"Fine" Check-in Bypass**: Allows users to skip granular symptom tagging and record overall wellness quickly.
* **Recharts Trend Bands**: Renders high/low historical wellness score zones on graphs.
* **Double-layered Grace Period**: Multi-day streak tracking with a once-per-week grace period option.
* **Dynamic Early Warning System (EWS)**: Background scripts monitor multi-day check-in gaps, low-wellness clusters, and high-risk distress signals to update EWS levels (`yellow`, `orange`, `red`).

---

## 📁 System Architecture

```
v0/
├── app/
│   ├── api/
│   │   ├── chat/                  # Streamed, authenticated NDJSON LLM interface
│   │   ├── cron/                  # Cron triggers (adherence & daily status)
│   │   ├── daily-briefing/        # Dynamic daily observations & personalized actions
│   │   ├── early-warning/         # Analyzes logs and sentiment to flag distress levels
│   │   ├── health-graph/          # Graph profile updating & milestone tracking
│   │   ├── health-pulse/          # LLM clinical summary briefing generator
│   │   └── vault/                 # File validation, Storage upload, and comparison
│   ├── dashboard/                 # Main Single-Page Application frame
│   └── onboarding/                # Clinical questionnaire flow
├── components/
│   ├── dashboard/                 # Feature panels (ChatPanel, SOSOverlay, etc.)
│   ├── onboarding/                # Step-by-step onboarding cards
│   └── ui/                        # Premium animations & reusable design primitives
├── contexts/
│   ├── AuthContext.tsx            # Session states & Firestore profile listeners
│   ├── ChatContext.tsx            # Live sync, feedback, & memory compilation
│   └── EmotionContext.tsx         # Edge emotion states
├── lib/
│   ├── earlyWarning.ts            # Clinical warning logic
│   ├── healthGraph.ts             # HealthGraph profile & prompt context builders
│   ├── healthMemory.ts            # Graph database memory compilation
│   └── intelligence.ts            # PDF text parsing & LLM document analysis
```

---

## 🚀 Environment Configuration

Create a `.env.local` file in the root of the project with the following properties:

```env
# ─── FIREBASE APP CONFIG (CLIENT-SIDE) ───
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-app.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456

# ─── FIREBASE ADMIN KEY (SERVER-SIDE ONLY) ───
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# ─── PRIMARY INTEL PROVIDER (GROQ CLOUD) ───
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

# ─── SECONDARY FALLBACK PROVIDER (OPENROUTER) ───
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct

# ─── TUNABLE SYSTEM LIMITS ───
NOVA_BRIEFING_AI_TIMEOUT_MS=8000
NOVA_BRIEFING_FORCE_COOLDOWN_MINS=15
NOVA_EARLY_WARNING_STALE_MINS=60
NOVA_VAULT_MAX_FILE_BYTES=20971520
NOVA_VAULT_SIGNED_URL_TTL_DAYS=7
NOVA_LLM_TEMPERATURE=0.7
NOVA_LLM_TOP_P=0.88
NOVA_LLM_MAX_TOKENS=768
NOVA_LLM_TIMEOUT_MS=28000
NOVA_MAX_MESSAGES_IN=40
NOVA_MAX_BODY_BYTES=65536
```

---

## 🏗️ Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Dev Server**:
   ```bash
   npm run dev
   ```

3. **Verify Build**:
   ```bash
   npm run build
   ```

---

## ⚡ Deployment to Vercel

```bash
# Install Vercel globally (if not already installed)
npm install -g vercel

# Run Deployment
vercel --prod
```

Configure all values from `.env.local` within your Vercel Dashboard under **Project Settings ➔ Environment Variables**.

---

**Built with ❤️ for private, Clinical Health Intelligence.**
