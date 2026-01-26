#!/bin/bash
# Fix Next.js permission errors

echo "🔧 Fixing Next.js permission errors..."

# Stop any running Next.js processes
echo "Stopping Next.js processes..."
pkill -f "next dev" 2>/dev/null || true

# Remove .next cache
echo "Clearing .next cache..."
rm -rf .next

# Fix node_modules permissions (if possible)
echo "Fixing node_modules permissions..."
chmod -R u+rw node_modules 2>/dev/null || echo "⚠️  Some files couldn't be modified (this is OK)"

# Reinstall dependencies if needed
echo "Checking node_modules..."
if [ ! -d "node_modules/next" ]; then
    echo "⚠️  node_modules appears corrupted. Run: npm install"
else
    echo "✅ node_modules looks OK"
fi

echo ""
echo "✅ Done! Try running: npm run dev"
echo ""
echo "If errors persist, run these commands manually:"
echo "  1. rm -rf node_modules package-lock.json"
echo "  2. npm install"
echo "  3. npm run dev"
