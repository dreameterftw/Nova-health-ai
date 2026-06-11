# ðŸš€ START HERE - Deploy NOVA V0 to Vercel

## ðŸŽ¯ Quick Start (Choose One)

### Option 1: Windows Users (Easiest)
**Double-click this file:**
```
quick-deploy.bat
```
That's it! The script will handle everything.

---

### Option 2: Command Line (All Platforms)
**Open terminal in v0 folder and run:**
```bash
vercel login
vercel --prod
```
Follow the prompts. Done in 2 minutes!

---

### Option 3: Vercel Dashboard (No CLI)
1. Push code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Set root directory to `v0`
5. Click Deploy

---

## âš ï¸ IMPORTANT: Add Environment Variables

After deployment, you MUST add these in Vercel Dashboard:

**Go to**: Vercel Dashboard â†’ Your Project â†’ Settings â†’ Environment Variables

**Add these**:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin / Server-only
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account", ... }
FIREBASE_DATABASE_URL=https://your_project.firebasedatabase.app
FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app

# AI Configuration (Groq — primary)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# AI Configuration (OpenRouter — fallback)
OPENROUTER_API_KEY=your_openrouter_api_key

NEXT_PUBLIC_LOGO_URL=/logo.png
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
```

Then **Redeploy** to apply changes.

---

## âœ… After Deployment

Test these features:
1. âœ… Authentication (email/password, Google)
2. âœ… PWA Install button (in header)
3. âœ… Chat with NOVA
4. âœ… Emotion detection
5. âœ… Mobile responsiveness

---

## ðŸ“š Need More Help?

- **Quick Guide**: `DEPLOY_NOW.md`
- **Detailed Steps**: `DEPLOYMENT_STEPS.md`
- **PWA Info**: `PWA_INSTALL_FEATURE.md`
- **Full Status**: `COMPLETE_STATUS_REPORT.md`

---

## ðŸŽ‰ That's It!

Your app will be live in ~2 minutes!

**Choose your deployment method above and go! ðŸš€**

