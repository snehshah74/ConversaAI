#!/bin/bash
# Complete Fix for Next.js Module Errors
# Run this script in your terminal (outside Cursor's sandbox)

set -e

echo "🔧 Fixing Next.js Module Errors..."
echo ""

cd "$(dirname "$0")"

# Step 1: Stop all processes
echo "📌 Step 1: Stopping processes..."
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Step 2: Remove corrupted installation
echo "📌 Step 2: Removing corrupted node_modules..."
rm -rf node_modules package-lock.json .next node_modules/.cache 2>/dev/null || true
echo "   ✅ Removed"

# Step 3: Clean npm cache
echo "📌 Step 3: Cleaning npm cache..."
npm cache clean --force 2>/dev/null || true
echo "   ✅ Cache cleaned"

# Step 4: Reinstall dependencies
echo "📌 Step 4: Reinstalling dependencies (this may take a few minutes)..."
npm install

# Step 5: Verify Next.js installation
echo "📌 Step 5: Verifying Next.js installation..."
if [ -f "node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js" ]; then
    echo "   ✅ Next.js loader found"
else
    echo "   ⚠️  Loader still missing - trying alternative installation..."
    npm install next@15.5.4 --force
fi

# Step 6: Verify TypeScript can find Next.js types
echo "📌 Step 6: Verifying TypeScript configuration..."
if [ -d "node_modules/next" ]; then
    echo "   ✅ Next.js installed"
    NEXT_VERSION=$(node -p "require('./node_modules/next/package.json').version" 2>/dev/null || echo "unknown")
    echo "   ✅ Version: $NEXT_VERSION"
else
    echo "   ❌ Next.js not found!"
    exit 1
fi

# Step 7: Clear Next.js cache
echo "📌 Step 7: Clearing Next.js cache..."
rm -rf .next 2>/dev/null || true
echo "   ✅ Cache cleared"

echo ""
echo "✅ Fix completed!"
echo ""
echo "🚀 Next steps:"
echo "   1. Restart your TypeScript server in VS Code (Cmd+Shift+P > 'TypeScript: Restart TS Server')"
echo "   2. Run: npm run dev"
echo "   3. The errors should be resolved"
echo ""
