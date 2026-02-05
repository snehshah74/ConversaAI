# 🚀 Quick Deployment Guide

Fast deployment checklist for production.

## 1. Database (5 minutes)

1. Create Supabase project: [supabase.com](https://supabase.com)
2. Copy connection string from Settings → Database
3. Run SQL schema in SQL Editor (see main deployment guide)

## 2. Backend (10 minutes)

### Railway (Easiest)

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your repo
4. Set environment variables:
   ```
   DATABASE_URL=postgresql://...
   GROQ_API_KEY=gsk_...
   DEEPGRAM_API_KEY=...
   GOOGLE_APPLICATION_CREDENTIALS={...}
   ENVIRONMENT=production
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
5. Deploy!

## 3. Frontend (5 minutes)

### Vercel (Easiest)

1. Go to [vercel.com](https://vercel.com)
2. Import from GitHub
3. Root directory: `frontend`
4. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
5. Deploy!

## 4. Test (2 minutes)

- ✅ Visit frontend URL
- ✅ Sign up
- ✅ Create agent
- ✅ Test chat

## Done! 🎉

Your platform is live. See `DEPLOYMENT_GUIDE.md` for detailed instructions.
