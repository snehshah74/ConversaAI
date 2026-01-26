#!/bin/bash
# FIX PHANTOM FILES - Run this in your terminal

echo "🔧 Fixing Phantom File Errors"
echo "=============================="
echo ""

cd /Users/sneh/voice-ai-agents/frontend

# Step 1: Kill ALL Next.js processes
echo "📌 Step 1: Stopping Next.js..."
pkill -9 node
pkill -9 next
sleep 3

# Step 2: Remove ALL caches
echo "📌 Step 2: Removing caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .swc
rm -rf .turbo
rm -rf .cache
echo "✅ Caches cleared"

# Step 3: Verify phantom files don't exist
echo "📌 Step 3: Checking for phantom files..."
if [ -f "src/components/WorkflowVisualization.js" ]; then
  echo "⚠️  Found WorkflowVisualization.js - DELETING"
  rm -f src/components/WorkflowVisualization.js
fi
if [ -f "src/pages/CreateLaunch.js" ]; then
  echo "⚠️  Found CreateLaunch.js - DELETING"
  rm -f src/pages/CreateLaunch.js
fi
if [ -f "src/pages/LaunchDashboard.js" ]; then
  echo "⚠️  Found LaunchDashboard.js - DELETING"
  rm -f src/pages/LaunchDashboard.js
fi
if [ -f "src/pages/LaunchDetail.js" ]; then
  echo "⚠️  Found LaunchDetail.js - DELETING"
  rm -f src/pages/LaunchDetail.js
fi
echo "✅ No phantom files found"

# Step 4: Clean npm cache
echo "📌 Step 4: Cleaning npm cache..."
npm cache clean --force 2>/dev/null || true

echo ""
echo "✅ Fix completed!"
echo ""
echo "🚀 NOW RUN:"
echo "   cd /Users/sneh/voice-ai-agents/frontend"
echo "   npm run dev"
echo ""
