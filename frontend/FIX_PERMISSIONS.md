# Fix Next.js Permission Errors

The errors you're seeing are due to file permission restrictions. Here's how to fix them:

## Quick Fix (Run these commands in your terminal):

```bash
cd /Users/sneh/voice-ai-agents/frontend

# 1. Stop any running Next.js processes
pkill -f "next dev"

# 2. Clear the build cache
rm -rf .next

# 3. Fix .env.local permissions (if it exists)
chmod 644 .env.local 2>/dev/null || true

# 4. If node_modules has permission issues, reinstall:
rm -rf node_modules package-lock.json
npm install

# 5. Start the dev server
npm run dev
```

## Alternative: Use Environment Variables Directly

If `.env.local` continues to cause issues, you can set environment variables directly:

```bash
export NEXT_PUBLIC_API_URL=http://localhost:8000
export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

npm run dev
```

## If Errors Persist

The permission errors are likely due to:
1. **Sandbox restrictions** - Some files may be protected
2. **Corrupted node_modules** - Reinstall dependencies
3. **File system issues** - Check disk space and permissions

**Solution**: Run the commands above in your **own terminal** (not in Cursor's sandbox) to ensure full file system access.
