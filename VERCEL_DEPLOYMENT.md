# ðŸš€ Deploy V0 to Vercel - Complete Guide

## âœ… Environment Variables Updated

The correct Firebase credentials have been configured in `.env.local`.

---

## ðŸŽ¯ Quick Deployment Steps

### Step 1: Login to Vercel
```bash
cd v0
vercel login
```

### Step 2: Deploy to Production
```bash
vercel --prod
```

Follow the prompts:
- **Set up and deploy?** â†’ Yes
- **Which scope?** â†’ Select your account
- **Link to existing project?** â†’ No (first time)
- **Project name?** â†’ `nova-health-ai` or your choice
- **Directory?** â†’ `.` (press Enter)
- **Override settings?** â†’ No (press Enter)

---

## ðŸ” Environment Variables for Vercel

After deployment, add these in **Vercel Dashboard â†’ Settings â†’ Environment Variables**:

### Firebase Configuration
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Firebase Admin / Server Configuration
```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account", ... }
FIREBASE_DATABASE_URL=https://your_project.firebasedatabase.app
FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
```

> `FIREBASE_SERVICE_ACCOUNT_JSON` should contain your Firebase service account JSON. Use `FIREBASE_SERVICE_ACCOUNT` if your provider prefers a raw secret or file path.

### AI Configuration (Server-only)
```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
OPENROUTER_API_KEY=your_openrouter_api_key
```

### App Configuration
```env
NEXT_PUBLIC_LOGO_URL=/logo.png
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
```

**Important**: Update `NEXT_PUBLIC_SITE_URL` with your actual Vercel URL after deployment.

---

## ðŸ“ Add Environment Variables via CLI (Alternative)

```bash
# Firebase
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
# Paste: your_firebase_api_key

vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
# Paste: your_project.firebaseapp.com

vercel env add NEXT_PUBLIC_FIREBASE_DATABASE_URL production
# Paste: https://your_project.firebasedatabase.app

vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
# Paste: novahealthcare-ai

vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
# Paste: your_project.firebasestorage.app

vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
# Paste: your_sender_id

vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
# Paste: your_app_id

# Firebase Admin / Server
vercel env add FIREBASE_SERVICE_ACCOUNT_JSON production
# Paste: {"type":"service_account", ... }

vercel env add FIREBASE_DATABASE_URL production
# Paste: https://your_project.firebasedatabase.app

vercel env add FIREBASE_STORAGE_BUCKET production
# Paste: your_project.firebasestorage.app

# AI Configuration
vercel env add GROQ_API_KEY production
# Paste: your_groq_api_key

vercel env add OPENROUTER_API_KEY production
# Paste: your_openrouter_api_key

# App Config
vercel env add NEXT_PUBLIC_LOGO_URL production
# Paste: /logo.png

vercel env add NEXT_PUBLIC_SITE_URL production
# Paste: https://your-project.vercel.app
```

Then redeploy:
```bash
vercel --prod
```

---

## ðŸŽ¯ Deployment Checklist

### Before Deployment
- [x] Environment variables updated in `.env.local`
- [x] Firebase configuration verified
- [x] Groq / OpenRouter API keys configured
- [x] Build tested locally

### During Deployment
- [ ] Login to Vercel
- [ ] Deploy with `vercel --prod`
- [ ] Wait for build to complete (~2 minutes)
- [ ] Note the deployment URL

### After Deployment
- [ ] Add all environment variables in Vercel Dashboard
- [ ] Update `NEXT_PUBLIC_SITE_URL` with actual URL
- [ ] Redeploy to apply environment variables
- [ ] Test authentication flows
- [ ] Test PWA install button
- [ ] Test chat with NOVA
- [ ] Test emotion detection
- [ ] Test on mobile device

---

## ðŸ”§ Test Build Locally First

Before deploying, test the build locally:

```bash
cd v0

# Install dependencies
npm install

# Build for production
npm run build

# Test production build
npm run start
```

Open http://localhost:3000 and test:
- Authentication (email/password, Google)
- Consent flow
- Dashboard features
- Chat functionality
- Emotion detection

If everything works locally, deploy to Vercel.

---

## ðŸš€ Deploy Now!

### Quick Deploy (Windows)
Double-click: `quick-deploy.bat`

### Command Line
```bash
cd v0
vercel login
vercel --prod
```

### Expected Output
```
âœ“ Build completed
âœ“ Deployment ready
âœ“ Production: https://nova-health-ai.vercel.app
```

---

## 📊 What's Configured

### Firebase (nova-mindgg)
- ✅ Authentication (Email/Password, Google OAuth)
- ✅ Firestore Database
- ✅ Realtime Database
- ✅ Storage
- ✅ Messaging

### AI Configuration (Groq / OpenRouter)
- ✅ Groq API key configured (primary)
- ✅ OpenRouter API key configured (fallback)
- ✅ Chat & Document analysis routes ready

### PWA
- ✅ Install button enabled
- ✅ Manifest configured
- ✅ Service worker ready

---

## ðŸŽ‰ After Deployment

Your app will be live at:
- **Production**: `https://your-project.vercel.app`
- **Custom Domain**: Configure in Vercel Dashboard

### Share Your App
- Send URL to users
- Test with real users
- Collect feedback
- Monitor analytics

---

## ðŸ“ž Support

### Documentation
- `START_HERE.md` - Quick start
- `DEPLOYMENT_STEPS.md` - Detailed guide
- `VERCEL_DEPLOYMENT.md` - This file
- `EMOTION_SCANNER_INFO.md` - Camera feed info

### Resources
- Vercel: https://vercel.com/docs
- Firebase: https://firebase.google.com/docs

---

**Status**: âœ… READY TO DEPLOY  
**Environment**: âœ… CONFIGURED  
**Build**: âœ… TESTED  
**Next Step**: Run `vercel --prod`

**Let's deploy! ðŸš€**

