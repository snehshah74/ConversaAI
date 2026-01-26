# Fix WorkflowVisualization Error

## Problem
You're seeing an error about `WorkflowVisualization.js` trying to import `keyframes` from `@chakra-ui/react`, but:
- This file **doesn't exist** in your codebase
- Chakra UI **isn't installed** in your project
- This is a **stale webpack cache** issue

## Quick Fix

Run this in your terminal:

```bash
cd /Users/sneh/voice-ai-agents/frontend
./fix-workflow-error.sh
```

Or manually:

```bash
cd /Users/sneh/voice-ai-agents/frontend

# Stop dev server
pkill -f "next dev"

# Clear ALL caches
rm -rf .next node_modules/.cache .swc .turbo

# Restart dev server
npm run dev
```

## What Happened

This error is from a **stale webpack cache**. The file `WorkflowVisualization.js` was likely from:
- A previous project
- A cached build
- An old dependency

Since the file doesn't exist in your actual codebase, clearing the cache will fix it.

## Verification

After running the fix, verify:
1. ✅ No `WorkflowVisualization.js` file exists in `src/components/`
2. ✅ No `@chakra-ui` in `package.json`
3. ✅ Dev server starts without errors

The error should disappear after clearing caches and restarting.
