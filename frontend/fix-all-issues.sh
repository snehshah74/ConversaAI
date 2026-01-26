#!/bin/bash
# Comprehensive Fix Script for Next.js Permission Errors

set -e

echo "🔧 Fixing all Next.js and permission issues..."
echo ""

cd "$(dirname "$0")"

# 1. Stop any running processes
echo "📌 Step 1: Stopping running processes..."
pkill -f "next dev" 2>/dev/null || echo "   No Next.js processes found"

# 2. Clear caches
echo "📌 Step 2: Clearing caches..."
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
echo "   ✅ Caches cleared"

# 3. Fix .env.local permissions
echo "📌 Step 3: Fixing .env.local permissions..."
if [ -f .env.local ]; then
    chmod 644 .env.local 2>/dev/null || echo "   ⚠️  Could not modify .env.local (may need manual fix)"
else
    echo "   ℹ️  .env.local does not exist (this is OK)"
fi

# 4. Check node_modules
echo "📌 Step 4: Checking node_modules..."
if [ ! -d "node_modules" ] || [ ! -d "node_modules/next" ]; then
    echo "   ⚠️  node_modules appears incomplete or missing"
    echo "   📦 Reinstalling dependencies..."
    rm -rf node_modules package-lock.json 2>/dev/null || true
    npm install
else
    echo "   ✅ node_modules exists"
fi

# 5. Fix node_modules permissions (if possible)
echo "📌 Step 5: Fixing node_modules permissions..."
chmod -R u+rw node_modules 2>/dev/null || echo "   ⚠️  Some files couldn't be modified (may need sudo)"

# 6. Verify Next.js installation
echo "📌 Step 6: Verifying Next.js installation..."
if [ -f "node_modules/next/package.json" ]; then
    NEXT_VERSION=$(node -p "require('./node_modules/next/package.json').version")
    echo "   ✅ Next.js $NEXT_VERSION installed"
else
    echo "   ❌ Next.js not found - reinstalling..."
    npm install next@latest
fi

# 7. Type check
echo "📌 Step 7: Running TypeScript check..."
npx tsc --noEmit --skipLibCheck 2>&1 | head -20 || echo "   ⚠️  TypeScript check had issues (non-critical)"

echo ""
echo "✅ Fix script completed!"
echo ""
echo "🚀 Next steps:"
echo "   1. Run: npm run dev"
echo "   2. If errors persist, check:"
echo "      - Backend is running on port 8000"
echo "      - Environment variables are set"
echo "      - No other processes using port 3000"
echo ""
