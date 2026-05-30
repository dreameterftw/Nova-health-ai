# NOVA - AI Health Intelligence Platform

> Your private AI health companion — emotion-aware, medical-grade, always available.

[![Production Ready](https://img.shields.io/badge/Production-Ready-success)](./PRODUCTION_READINESS_AUDIT.md)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.0-black)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.12.0-orange)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue)](https://www.typescriptlang.org/)

---

## 🌟 Features

### 🧠 **NORA - AI Companion**
- Private, empathetic chat powered by Ollama (Llama 3.2)
- Reads your medical reports and tracks medications
- Adjusts tone based on your emotional state
- Available 24/7 for wellness support

### 📸 **Emotional Shutter**
- One-button emotion detection using face-api.js
- All processing happens locally on your device
- No images uploaded - complete privacy
- Adapts AI responses to your emotional state

### 🏥 **Vision Vault**
- Upload blood tests, prescriptions, or injury photos
- OCR extraction of clinical markers
- Flags anomalies and provides context
- Grounds conversations in your real data

### 🚨 **Smart SOS**
- Real-time crisis detection in conversations
- Instant alerts to Family Circle contacts
- Direct access to crisis hotlines
- Multi-level severity assessment

### 💊 **Medicine Tracker**
- Real-time medication schedule tracking
- Gentle reminders during conversations
- No intrusive notification alarms
- Integrated with AI chat context

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Firebase project set up
- Ollama running (local or tunnel)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd v0

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Fill in your credentials in .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
v0/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── chat/         # Chat API endpoint
│   ├── auth/             # Authentication pages
│   ├── consent/          # Consent flow
│   ├── dashboard/        # Main dashboard
│   ├── error.tsx         # Error boundary
│   ├── loading.tsx       # Loading state
│   ├── not-found.tsx     # 404 page
│   ├── sitemap.ts        # SEO sitemap
│   ├── manifest.ts       # PWA manifest
│   └── layout.tsx        # Root layout
├── components/            # React components
│   ├── auth/             # Auth components
│   ├── dashboard/        # Dashboard components
│   ├── landing/          # Landing page
│   └── ui/               # Reusable UI components
├── contexts/              # React contexts
│   ├── AuthContext.tsx   # Authentication state
│   ├── ChatContext.tsx   # Chat state
│   └── EmotionContext.tsx # Emotion state
├── lib/                   # Utilities
│   ├── firebase.ts       # Firebase config
│   └── constants.ts      # App constants
├── public/                # Static assets
│   ├── logo.png          # App logo
│   └── robots.txt        # SEO robots
├── .env.local            # Environment variables (not in git)
├── .env.example          # Environment template
├── next.config.mjs       # Next.js configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript config
```

---

## 🔧 Configuration

### Environment Variables

Create `.env.local` with:

```env
# Firebase (Required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin / Server-only
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account", ... }

# Ollama (Required)
OLLAMA_HOST=http://localhost:11434

# App Config
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_LOGO_URL=/logo.png
```

> Use `FIREBASE_SERVICE_ACCOUNT_JSON` for Vercel server-side access to Firebase Admin features. Keep this secret private and do not expose it in client bundles.

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password and Google)
3. Create a Firestore database
4. Deploy security rules from `firestore.rules`
5. Copy your config to `.env.local`

### Ollama Setup

```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Pull Llama 3.2 model
ollama pull llama3.2

# Run Ollama server
ollama serve
```

For remote access, use [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/).

---

## 🏗️ Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Code Quality

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for Next.js
- **Prettier**: Code formatting (recommended)
- **Husky**: Git hooks (optional)

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your Git repository to Vercel for automatic deployments.

### Environment Variables in Vercel

1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.local`
3. Ensure `FIREBASE_SERVICE_ACCOUNT_JSON` is set as a secret for your production deployment
4. Set values for Production, Preview, and Development

### Post-Deployment

1. Test authentication flow
2. Verify Firebase connection
3. Check Ollama endpoint
4. Test on mobile devices
5. Monitor error rates

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 📊 Production Readiness

### Status: ✅ READY

- **Security**: 95/100 ⭐⭐⭐⭐⭐
- **Performance**: 85/100 ⭐⭐⭐⭐
- **Code Quality**: 95/100 ⭐⭐⭐⭐⭐
- **Error Handling**: 90/100 ⭐⭐⭐⭐⭐

See [PRODUCTION_READINESS_AUDIT.md](./PRODUCTION_READINESS_AUDIT.md) for full report.

---

## 🔐 Security

### Implemented
- ✅ Real Firebase authentication
- ✅ Firestore security rules
- ✅ Environment variables for secrets
- ✅ Security headers configured
- ✅ XSS protection
- ✅ CORS configuration
- ✅ Input validation
- ✅ Error boundaries

### Best Practices
- Never commit `.env.local`
- Rotate API keys regularly
- Monitor Firebase usage
- Enable App Check in production
- Use different projects for dev/prod

---

## 🐛 Troubleshooting

### Common Issues

**Build fails**:
```bash
rm -rf .next node_modules
npm install
npm run build
```

**Firebase connection error**:
- Check environment variables
- Verify Firebase project is active
- Check security rules

**Ollama not connecting**:
- Verify Ollama is running: `ollama list`
- Check `OLLAMA_HOST` URL
- Test endpoint: `curl $OLLAMA_HOST/api/tags`

**Authentication not working**:
- Enable Email/Password in Firebase Console
- Configure Google OAuth (if using)
- Clear browser cache

---

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [Production Audit](./PRODUCTION_READINESS_AUDIT.md) - Security & quality audit
- [Auth Fixes](./AUTHENTICATION_FIXES_COMPLETE.md) - Authentication implementation

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary and confidential.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Firebase](https://firebase.google.com/) - Backend services
- [Ollama](https://ollama.ai/) - Local AI inference
- [face-api.js](https://github.com/justadudewhohacks/face-api.js/) - Emotion detection
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Lucide Icons](https://lucide.dev/) - Icons

---

## 📞 Support

For issues or questions:
1. Check [Troubleshooting](#-troubleshooting) section
2. Review documentation files
3. Open an issue on GitHub
4. Contact the development team

---

**Built with ❤️ for mental health and wellness**

🌟 Star this repo if you find it helpful!
