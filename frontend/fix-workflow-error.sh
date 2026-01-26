#!/bin/bash
# Quick Fix for WorkflowVisualization Error
# This error is from a stale cache - the file doesn't exist

set -e

echo "🔧 Fixing WorkflowVisualization cache error..."
echo ""

cd "$(dirname "$0")"

# Stop dev server
echo "📌 Step 1: Stopping dev server..."
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Clear ALL caches
echo "📌 Step 2: Clearing all caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .swc
rm -rf .turbo
echo "   ✅ All caches cleared"

# Verify no WorkflowVisualization file exists (it shouldn't)
echo "📌 Step 3: Verifying no stale files..."
if [ -f "src/components/WorkflowVisualization.js" ]; then
    echo "   ⚠️  Found WorkflowVisualization.js - removing it"
    rm -f src/components/WorkflowVisualization.js
else
    echo "   ✅ No WorkflowVisualization.js found (correct)"
fi

# Check if Chakra UI is installed (it shouldn't be)
echo "📌 Step 4: Checking dependencies..."
if grep -q "@chakra-ui" package.json; then
    echo "   ⚠️  Chakra UI found in package.json - removing it"
    npm uninstall @chakra-ui/react @emotion/react @emotion/styled framer-motion 2>/dev/null || true
else
    echo "   ✅ Chakra UI not installed (correct)"
fi

echo ""
echo "✅ Fix completed!"
echo ""
echo "🚀 Now run: npm run dev"
echo "   The error should be gone after restarting the dev server"
echo ""
