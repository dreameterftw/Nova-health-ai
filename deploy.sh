#!/bin/bash

# NOVA V0 Deployment Script
# This script builds and deploys the V0 app to Vercel

echo "🚀 NOVA V0 Deployment Script"
echo "=============================="
echo ""

# Check if we're in the v0 directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the v0 directory."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm i -g vercel
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building for production..."
npm run build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed! Please fix errors and try again."
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "🚀 Deploying to Vercel..."
echo ""

# Deploy to production
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📋 Post-Deployment Checklist:"
    echo "  1. Test authentication flows"
    echo "  2. Verify PWA install button"
    echo "  3. Test chat with NOVA"
    echo "  4. Test emotion detection"
    echo "  5. Check mobile responsiveness"
    echo ""
    echo "🎉 Your app is live!"
else
    echo ""
    echo "❌ Deployment failed! Check the error messages above."
    exit 1
fi
