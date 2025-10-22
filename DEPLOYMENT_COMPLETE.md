# 🎤 Conversa AI - Complete Deployment Guide

## 🎯 **Deployment Overview**
Deploy your Voice AI platform with:
- **Frontend**: Vercel (Next.js)
- **Backend**: Railway (FastAPI)
- **Database**: Supabase (PostgreSQL)

---

## 📊 **Step 1: Set Up Supabase Database**

### **1.1 Create Supabase Project**
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" → "New project"
3. Choose your organization
4. **Project details:**
   - **Name**: `conversa-ai-db`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project"

### **1.2 Get Database Connection String**
1. Go to **Settings** → **Database**
2. Scroll down to "Connection string"
3. Copy the **URI** connection string
4. It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres`

### **1.3 Set Up Database Tables**
Your backend will automatically create tables, but you can also run this SQL in Supabase SQL Editor:

```sql
-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    industry VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    personality TEXT NOT NULL,
    knowledge_base TEXT NOT NULL,
    greeting TEXT NOT NULL,
    voice_settings JSONB,
    available_tools TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    user_id VARCHAR(255),
    messages JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_company ON agents(company);
CREATE INDEX IF NOT EXISTS idx_agents_industry ON agents(industry);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
```

---

## 🚂 **Step 2: Deploy Backend to Railway**

### **2.1 Prepare Backend for Railway**
1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Create Railway Project:**
   ```bash
   cd /Users/sneh/voice-ai-agents/backend
   railway init
   ```

### **2.2 Set Environment Variables in Railway**
1. Go to your Railway project dashboard
2. Click on your backend service
3. Go to **Variables** tab
4. Add these environment variables:

```env
# Database
DATABASE_URL=postgresql://postgres:[YOUR-SUPABASE-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres

# Google AI (for voice AI features)
GOOGLE_API_KEY=your_google_api_key_here

# Environment
ENVIRONMENT=production

# Railway will auto-set PORT
```

### **2.3 Deploy Backend**
```bash
cd /Users/sneh/voice-ai-agents/backend
railway up
```

**Your backend will be deployed to:** `https://your-app-name.railway.app`

---

## ⚡ **Step 3: Deploy Frontend to Vercel**

### **3.1 Prepare Frontend for Vercel**
1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

### **3.2 Deploy Frontend**
```bash
cd /Users/sneh/voice-ai-agents/frontend
vercel
```

**Follow the prompts:**
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name:** → `conversa-ai-frontend`
- **Directory:** → `./frontend`
- **Override settings?** → No

### **3.3 Set Environment Variables in Vercel**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your `conversa-ai-frontend` project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```env
# Backend API URL (from Railway)
NEXT_PUBLIC_API_URL=https://your-app-name.railway.app

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

### **3.4 Redeploy with Environment Variables**
```bash
cd /Users/sneh/voice-ai-agents/frontend
vercel --prod
```

**Your frontend will be deployed to:** `https://conversa-ai-frontend.vercel.app`

---

## 🔧 **Step 4: Configure CORS and Final Setup**

### **4.1 Update Backend CORS Settings**
In your Railway deployment, make sure CORS allows your Vercel domain:

```python
# This is already configured in your backend/main.py
origins = [
    "http://localhost:3000",
    "https://conversa-ai-frontend.vercel.app",  # Add your Vercel URL
    "https://*.vercel.app"  # Allow all Vercel preview deployments
]
```

### **4.2 Test Your Deployment**
1. **Frontend**: Visit your Vercel URL
2. **Backend Health**: Visit `https://your-app-name.railway.app/api/health`
3. **Database**: Check Supabase dashboard for data

---

## 🎯 **Step 5: Production Checklist**

### **✅ Security**
- [ ] Strong Supabase database password
- [ ] Google API key secured
- [ ] CORS properly configured
- [ ] Environment variables not exposed

### **✅ Performance**
- [ ] Database indexes created
- [ ] Frontend optimized build
- [ ] CDN enabled (Vercel handles this)

### **✅ Monitoring**
- [ ] Railway logs monitoring
- [ ] Vercel analytics enabled
- [ ] Supabase usage monitoring

---

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Database Connection Failed**
   - Check Supabase connection string
   - Verify password is correct
   - Check if IP is whitelisted

2. **CORS Errors**
   - Update CORS origins in backend
   - Redeploy backend after changes

3. **Environment Variables Not Working**
   - Redeploy after adding variables
   - Check variable names match exactly

4. **Build Failures**
   - Check Railway/Vercel logs
   - Verify all dependencies in requirements.txt/package.json

---

## 📱 **Your Live URLs**

After deployment, you'll have:

- **🌐 Frontend**: `https://conversa-ai-frontend.vercel.app`
- **🔧 Backend API**: `https://your-app-name.railway.app`
- **📊 Database**: Supabase Dashboard
- **📈 Analytics**: Vercel Analytics

---

## 🎤 **Next Steps**

1. **Custom Domain**: Add custom domain in Vercel
2. **SSL**: Automatically handled by Vercel/Railway
3. **Monitoring**: Set up error tracking (Sentry)
4. **Scaling**: Railway auto-scales, Supabase handles DB scaling

**Your Voice AI platform is now live and production-ready!** 🚀
