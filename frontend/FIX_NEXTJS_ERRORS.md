# Fix Next.js Module Errors

## Problem
You're seeing two errors:
1. **Build Error**: `Module not found: Error: Can't resolve 'next-flight-client-entry-loader'`
2. **TypeScript Error**: `Cannot find module 'next/link'`

## Root Cause
Your Next.js installation is **corrupted or incomplete**. The `next-flight-client-entry-loader` file is missing from `node_modules/next/dist/build/webpack/loaders/`.

## Solution

### Option 1: Run the Fix Script (Recommended)

```bash
cd /Users/sneh/voice-ai-agents/frontend
./fix-nextjs-errors.sh
```

This script will:
- Stop running processes
- Remove corrupted `node_modules`
- Clean npm cache
- Reinstall all dependencies
- Verify Next.js installation
- Clear Next.js cache

### Option 2: Manual Fix

Run these commands in your **terminal** (not in Cursor):

```bash
cd /Users/sneh/voice-ai-agents/frontend

# 1. Stop Next.js
pkill -f "next dev"

# 2. Remove everything
rm -rf node_modules package-lock.json .next node_modules/.cache

# 3. Clean npm cache
npm cache clean --force

# 4. Reinstall
npm install

# 5. Verify Next.js is installed correctly
ls node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js

# 6. Start dev server
npm run dev
```

### Option 3: Force Reinstall Next.js

If Option 2 doesn't work:

```bash
cd /Users/sneh/voice-ai-agents/frontend
rm -rf node_modules package-lock.json
npm install next@15.5.4 --force
npm install
```

## After Fixing

1. **Restart TypeScript Server** in VS Code:
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
   - Type: `TypeScript: Restart TS Server`
   - Press Enter

2. **Restart VS Code** if errors persist

3. **Clear VS Code Cache**:
   ```bash
   rm -rf ~/Library/Application\ Support/Code/CachedData
   ```

## Why This Happened

This usually occurs when:
- npm install was interrupted
- File permissions were changed
- node_modules was corrupted
- Sandbox restrictions prevented proper installation

## Prevention

- Always run `npm install` in your **own terminal**, not in Cursor's sandbox
- Don't interrupt npm install processes
- Keep `node_modules` in `.gitignore` (already done)
