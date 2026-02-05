# 🚀 Production Deployment Guide - Voice AI Agents Platform

Complete step-by-step guide to deploy your Voice AI platform for all users.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Architecture](#deployment-architecture)
3. [Step 1: Database Setup (Supabase)](#step-1-database-setup-supabase)
4. [Step 2: Backend Deployment](#step-2-backend-deployment)
5. [Step 3: Frontend Deployment](#step-3-frontend-deployment)
6. [Step 4: Environment Configuration](#step-4-environment-configuration)
7. [Step 5: Domain & SSL Setup](#step-5-domain--ssl-setup)
8. [Step 6: Testing & Verification](#step-6-testing--verification)
9. [Step 7: Monitoring & Scaling](#step-7-monitoring--scaling)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ **API Keys** (see `API_KEYS_SETUP.md`):
  - GROQ_API_KEY (required)
  - DEEPGRAM_API_KEY (required)
  - GOOGLE_APPLICATION_CREDENTIALS (required for TTS)
  - Optional: GOOGLE_API_KEY, OPENAI_API_KEY

- ✅ **Accounts**:
  - [Supabase](https://supabase.com) account (free tier available)
  - [Vercel](https://vercel.com) account (for frontend)
  - [Railway](https://railway.app) or [Render](https://render.com) account (for backend)
  - Domain name (optional, but recommended)

- ✅ **Code**:
  - All code committed to Git
  - Environment variables documented

---

## Deployment Architecture

```
┌─────────────────┐
│   Users         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Frontend       │
│  (Vercel)       │
│  nextjs app     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend API    │
│  (Railway/Render)│
│  FastAPI        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Database       │
│  (Supabase)     │
│  PostgreSQL     │
└─────────────────┘
```

---

## Step 1: Database Setup (Supabase)

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: `voice-ai-agents`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Plan**: Free tier is fine to start

### 1.2 Get Connection Details

1. Go to **Settings** → **Database**
2. Find **Connection string** → **URI**
3. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### 1.3 Initialize Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Run this SQL:

```sql
-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    personality TEXT NOT NULL,
    knowledge_base TEXT NOT NULL,
    greeting VARCHAR(1000) NOT NULL,
    voice_settings JSONB,
    available_tools JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agent_company ON agents(company);
CREATE INDEX IF NOT EXISTS idx_agent_industry ON agents(industry);
CREATE INDEX IF NOT EXISTS idx_agent_is_active ON agents(is_active);
CREATE INDEX IF NOT EXISTS idx_conversation_agent ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_message_conversation ON messages(conversation_id);
```

### 1.4 Get API Keys

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep secret!)

---

## Step 2: Backend Deployment

### Option A: Railway (Recommended)

1. **Sign up**: Go to [railway.app](https://railway.app)

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select your `voice-ai-agents` repository

3. **Add Service**:
   - Click "New" → "GitHub Repo"
   - Select your repo
   - Railway will auto-detect Python

4. **Configure Service**:
   - **Root Directory**: `backend`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Build Command**: `pip install -r requirements.txt`

5. **Set Environment Variables**:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   GROQ_API_KEY=gsk_...
   DEEPGRAM_API_KEY=...
   GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account",...}
   GOOGLE_API_KEY=... (optional)
   ENVIRONMENT=production
   PORT=8000
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

6. **Deploy**:
   - Railway will automatically deploy
   - Wait for build to complete
   - Copy the generated URL (e.g., `https://your-app.railway.app`)

### Option B: Render

1. **Sign up**: Go to [render.com](https://render.com)

2. **Create Web Service**:
   - Click "New" → "Web Service"
   - Connect GitHub repo
   - Select your repository

3. **Configure**:
   - **Name**: `voice-ai-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Set Environment Variables** (same as Railway)

5. **Deploy**: Click "Create Web Service"

---

## Step 3: Frontend Deployment

### Option A: Vercel (Recommended)

1. **Sign up**: Go to [vercel.com](https://vercel.com)

2. **Import Project**:
   - Click "Add New" → "Project"
   - Import from GitHub
   - Select your repository

3. **Configure Project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

4. **Set Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NODE_ENV=production
   ```

5. **Deploy**:
   - Click "Deploy"
   - Wait for build (2-3 minutes)
   - Get your URL: `https://your-app.vercel.app`

---

## Step 4: Environment Configuration

### Backend Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# API Keys (Required)
GROQ_API_KEY=gsk_...
DEEPGRAM_API_KEY=...
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account",...}

# Optional API Keys
GOOGLE_API_KEY=...
OPENAI_API_KEY=sk-...

# Environment
ENVIRONMENT=production
PORT=8000
LOG_LEVEL=INFO

# CORS
FRONTEND_URL=https://your-frontend.vercel.app
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-domain.com
```

### Frontend Environment Variables

```env
# Backend API
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Environment
NODE_ENV=production
```

---

## Step 5: Domain & SSL Setup

### 5.1 Add Custom Domain (Vercel)

1. Go to your Vercel project → **Settings** → **Domains**
2. Add your domain: `yourdomain.com`
3. Follow DNS instructions

### 5.2 Update Environment Variables

After adding domains, update:

**Backend**:
```
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Frontend**:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

SSL certificates are automatically provisioned.

---

## Step 6: Testing & Verification

### 6.1 Test Backend

```bash
# Health check
curl https://your-backend.railway.app/

# API docs
open https://your-backend.railway.app/docs
```

### 6.2 Test Frontend

1. Visit: `https://your-frontend.vercel.app`
2. Check:
   - ✅ Homepage loads
   - ✅ Can sign up/login
   - ✅ Dashboard loads
   - ✅ Can create agents

---

## Step 7: Monitoring & Scaling

### 7.1 Set Up Monitoring

**Vercel Analytics**:
- Go to project → **Analytics**
- Enable Web Analytics

### 7.2 Scaling Considerations

**Backend**:
- Railway: Auto-scales based on traffic
- Render: Upgrade plan for more resources

**Database**:
- Supabase free tier: 500MB storage
- Upgrade when needed: $25/month for 8GB

**Frontend**:
- Vercel: Auto-scales (free tier: 100GB bandwidth)

---

## Quick Deployment Checklist

- [ ] Supabase project created
- [ ] Database schema initialized
- [ ] Backend deployed (Railway/Render)
- [ ] Frontend deployed (Vercel)
- [ ] Environment variables configured
- [ ] Custom domain added (optional)
- [ ] SSL certificates active
- [ ] Health checks passing
- [ ] Test user can sign up
- [ ] Test agent can be created

---

## Cost Estimates

### Free Tier (Getting Started)
- **Supabase**: Free (500MB database)
- **Vercel**: Free (100GB bandwidth/month)
- **Railway**: $5/month (after free trial)
- **Total**: ~$5/month

### Production Tier (1000+ users)
- **Supabase**: $25/month (8GB database)
- **Vercel**: $20/month (Pro plan)
- **Railway**: $20/month (Starter plan)
- **Total**: ~$65/month

---

## 🎉 You're Live!

Your Voice AI platform is now deployed and accessible to all users!

**Platform URLs**:
- Frontend: `https://your-frontend.vercel.app`
- Backend API: `https://your-backend.railway.app`
- API Docs: `https://your-backend.railway.app/docs`
