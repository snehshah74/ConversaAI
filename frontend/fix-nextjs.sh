#!/bin/bash
# Quick fix for Next.js webpack errors

cd /Users/sneh/voice-ai-agents/frontend

echo "🔧 Fixing Next.js Webpack Errors"
echo "=================================="
echo ""

# Step 1: Kill Next.js processes
echo "📌 Stopping Next.js..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
sleep 2

# Step 2: Remove ALL caches
echo "📌 Removing caches..."
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .swc 2>/dev/null || true
rm -rf .turbo 2>/dev/null || true
rm -rf .cache 2>/dev/null || true
echo "✅ Caches cleared"

# Step 3: Clean npm cache
echo "📌 Cleaning npm cache..."
npm cache clean --force 2>/dev/null || true

echo ""
echo "✅ Fix completed!"
echo ""
echo "🚀 NOW RUN:"
echo "   cd /Users/sneh/voice-ai-agents/frontend"
echo "   npm run dev"
echo ""
