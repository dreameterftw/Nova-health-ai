# 🚀 Deploy V0 to Firebase Hosting (Alternative to Vercel)

## Overview

Since you're using Firebase for authentication and database, you can also deploy to Firebase Hosting instead of Vercel.

---

## 🔧 Prerequisites

1. Firebase CLI installed
2. Firebase project: `novahealthcare-ai`
3. Environment variables configured

---

## 📝 Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

---

## 🔐 Step 2: Login to Firebase

```bash
firebase login
```

This will open your browser to authenticate.

---

## ⚙️ Step 3: Initialize Firebase Hosting

```bash
cd v0
firebase init hosting
```

Answer the prompts:
- **Select project**: Use existing project → `novahealthcare-ai`
- **Public directory**: `.next` (or `out` if using static export)
- **Configure as single-page app**: Yes
- **Set up automatic builds**: No (we'll build manually)
- **Overwrite index.html**: No

---

## 🏗️ Step 4: Configure for Next.js

### Option A: Static Export (Recommended for Firebase)

1. Update `next.config.mjs`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

export default nextConfig
```

2. Update `firebase.json`:
```json
{
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Option B: Server-Side Rendering (Requires Cloud Functions)

If you need SSR, you'll need Firebase Cloud Functions (paid plan).

---

## 🔨 Step 5: Build for Production

```bash
npm run build
```

This creates the `out` directory with static files.

---

## 🚀 Step 6: Deploy to Firebase

```bash
firebase deploy --only hosting
```

---

## 🌐 Step 7: Your App is Live!

Firebase will provide a URL like:
```
https://novahealthcare-ai.web.app
```

Or your custom domain if configured.

---

## 🔄 Update Environment Variables

After deployment, update:

```env
NEXT_PUBLIC_SITE_URL=https://novahealthcare-ai.web.app
```

Then rebuild and redeploy:
```bash
npm run build
firebase deploy --only hosting
```

---

## 🎯 Comparison: Firebase vs Vercel

### Firebase Hosting
**Pros**:
- ✅ Same ecosystem as Firebase Auth/Firestore
- ✅ Free tier generous (10GB storage, 360MB/day transfer)
- ✅ Global CDN
- ✅ Custom domains free
- ✅ SSL certificates automatic

**Cons**:
- ❌ Static export only (no SSR without Cloud Functions)
- ❌ No automatic deployments from Git
- ❌ No preview deployments
- ❌ Manual deployment process

### Vercel (Recommended)
**Pros**:
- ✅ Full Next.js support (SSR, API routes, etc.)
- ✅ Automatic Git deployments
- ✅ Preview deployments for PRs
- ✅ Built-in analytics
- ✅ Edge functions
- ✅ Zero configuration

**Cons**:
- ❌ Free tier limits (100GB bandwidth/month)
- ❌ Separate from Firebase ecosystem

---

## 💡 Recommendation

**Use Vercel** for this project because:
1. Full Next.js features (API routes, SSR)
2. Automatic deployments
3. Better developer experience
4. Preview deployments
5. Built-in analytics

Firebase Hosting is better for:
- Static sites
- Projects already heavily using Firebase
- Need for Firebase-specific features

---

## 🚀 Quick Deploy to Vercel (Recommended)

```bash
cd v0
vercel login
vercel --prod
```

See `VERCEL_DEPLOYMENT.md` for complete guide.

---

**Recommendation**: Deploy to Vercel for best experience! 🎯

