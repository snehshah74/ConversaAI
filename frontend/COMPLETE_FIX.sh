#!/bin/bash
# COMPLETE FIX - Run this in your terminal

set -e

echo "🔧 COMPLETE FIX for Phantom File Errors"
echo "========================================"
echo ""

cd "$(dirname "$0")"

# Step 1: Kill ALL node processes
echo "📌 Step 1: Killing all Node processes..."
pkill -9 node 2>/dev/null || true
pkill -9 next 2>/dev/null || true
sleep 3

# Step 2: Remove ALL caches and build artifacts
echo "📌 Step 2: Removing ALL caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .swc
rm -rf .turbo
rm -rf .cache
rm -rf out
rm -rf dist
echo "   ✅ All caches removed"

# Step 3: Check for phantom files
echo "📌 Step 3: Checking for phantom files..."
PHANTOM_FILES=(
  "src/components/WorkflowVisualization.js"
  "src/pages/CreateLaunch.js"
  "src/pages/LaunchDashboard.js"
  "src/pages/LaunchDetail.js"
)

FOUND_PHANTOM=false
for file in "${PHANTOM_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "   ⚠️  FOUND: $file - DELETING"
    rm -f "$file"
    FOUND_PHANTOM=true
  fi
done

if [ "$FOUND_PHANTOM" = false ]; then
  echo "   ✅ No phantom files found (correct)"
fi

# Step 4: Check for src/pages directory (old Next.js structure)
if [ -d "src/pages" ]; then
  echo "   ⚠️  Found src/pages directory - this might be causing issues"
  echo "   ℹ️  Next.js 13+ uses src/app, not src/pages"
fi

# Step 5: Clean npm cache
echo "📌 Step 4: Cleaning npm cache..."
npm cache clean --force 2>/dev/null || true
echo "   ✅ npm cache cleaned"

# Step 6: Verify package.json doesn't have Chakra UI
echo "📌 Step 5: Checking dependencies..."
if grep -q "@chakra-ui" package.json 2>/dev/null; then
  echo "   ⚠️  Chakra UI found - removing..."
  npm uninstall @chakra-ui/react @emotion/react @emotion/styled framer-motion 2>/dev/null || true
else
  echo "   ✅ Chakra UI not installed"
fi

# Step 7: Reinstall if node_modules looks corrupted
echo "📌 Step 6: Checking node_modules..."
if [ ! -d "node_modules/next" ]; then
  echo "   ⚠️  Next.js not found - reinstalling..."
  npm install
else
  echo "   ✅ node_modules looks OK"
fi

echo ""
echo "✅ Fix completed!"
echo ""
echo "🚀 NOW RUN:"
echo "   npm run dev"
echo ""
echo "If errors persist:"
echo "   1. Close VS Code completely"
echo "   2. Delete: ~/.vscode/extensions (if needed)"
echo "   3. Restart VS Code"
echo "   4. Run: npm run dev"
echo ""
