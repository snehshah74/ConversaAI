# Localhost Development Guide

## ✅ Setup Complete!

Your application is now configured to work on localhost without requiring Supabase authentication. The dashboard and agents functionality will work immediately.

## 🚀 Quick Start

### 1. Start Backend (Terminal 1)

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Verify backend is running:**
- Open: http://localhost:8000
- Should see: `{"status":"healthy","service":"Voice AI Platform","version":"1.0.0"}`
- API Docs: http://localhost:8000/docs

### 2. Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

**Verify frontend is running:**
- Open: http://localhost:3000
- Dashboard should load without requiring login
- You can access: `/dashboard`, `/agents/create`, `/agents/[id]/edit`

## 🎯 What's Working

✅ **Backend API** - Running on port 8000
✅ **Frontend** - Running on port 3000  
✅ **Database** - SQLite initialized with sample data
✅ **Authentication** - Bypassed in development mode
✅ **Dashboard** - Accessible without login
✅ **Agents** - Full CRUD operations available

## 📋 Available Endpoints

### Backend API (http://localhost:8000)

- `GET /` - Health check
- `GET /api/health` - API health check
- `GET /api/agents` - List all agents
- `POST /api/agents` - Create new agent
- `GET /api/agents/{id}` - Get agent by ID
- `PUT /api/agents/{id}` - Update agent
- `DELETE /api/agents/{id}` - Delete agent
- `POST /api/chat` - Send message to agent
- `GET /docs` - Interactive API documentation

### Frontend Pages

- `/` - Homepage
- `/dashboard` - Agent dashboard (no login required in dev)
- `/agents/create` - Create new agent
- `/agents/[id]/edit` - Edit agent
- `/agents/[id]/deploy` - Deploy agent
- `/test/[agentId]` - Test agent chat
- `/deployments` - View deployments

## 🔧 Development Mode Features

### Authentication Bypass

In development mode (when Supabase credentials are not configured), the app automatically:
- Uses a mock user: "Development User" (dev@localhost)
- Allows access to all protected routes
- Shows a console message: "🔧 Development mode: Using mock authentication"

### To Enable Real Authentication

1. Set up Supabase (see `API_KEYS_SETUP.md`)
2. Create `.env.local` in `frontend/`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
3. Restart the frontend server

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://localhost:8000/

# Get all agents
curl http://localhost:8000/api/agents

# Create an agent
curl -X POST http://localhost:8000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "company": "Test Company",
    "industry": "Technology",
    "role": "Customer Support",
    "personality": "Friendly and helpful",
    "knowledge_base": "General knowledge",
    "greeting": "Hello! How can I help?"
  }'
```

### Test Frontend

1. Open http://localhost:3000/dashboard
2. You should see the dashboard with agents
3. Click "Create Voice AI Agent" to create a new agent
4. Click on any agent card to edit it

## 🐛 Troubleshooting

### Backend won't start

**Error:** `ModuleNotFoundError: No module named 'httpx'`

**Solution:**
```bash
cd backend
source venv/bin/activate  # IMPORTANT: Activate venv first!
pip install -r requirements.txt
```

### Frontend can't connect to backend

**Error:** `Cannot connect to backend API`

**Solution:**
1. Verify backend is running: `curl http://localhost:8000/`
2. Check CORS settings in `backend/main.py`
3. Ensure `NEXT_PUBLIC_API_URL` is not set (defaults to `http://localhost:8000`)

### Dashboard shows "Loading..." forever

**Solution:**
- Check browser console (F12) for errors
- Verify backend is running
- Check network tab for failed requests

### Database errors

**Solution:**
```bash
cd backend
source venv/bin/activate
python3 -c "from models.database import init_db; init_db()"
```

## 📝 Environment Variables

### Backend (`.env` in `backend/`)

Required:
```env
GROQ_API_KEY=gsk_...
DEEPGRAM_API_KEY=...
GOOGLE_APPLICATION_CREDENTIALS=/path/to/google-credentials.json
DATABASE_URL=sqlite:///./voice_ai.db
```

### Frontend (`.env.local` in `frontend/` - Optional)

Only needed if using Supabase:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 🎨 Features Available

- ✅ Create, read, update, delete agents
- ✅ Agent dashboard with search
- ✅ Agent testing interface
- ✅ Voice chat (requires API keys)
- ✅ Knowledge base uploads
- ✅ Agent deployment management

## 📚 Next Steps

1. **Create your first agent:**
   - Go to http://localhost:3000/agents/create
   - Fill in the form
   - Click "Create Agent"

2. **Test an agent:**
   - Go to http://localhost:3000/test/[agentId]
   - Type a message and see the response

3. **Explore the API:**
   - Visit http://localhost:8000/docs
   - Try the interactive API documentation

## 🆘 Need Help?

- Check `QUICK_START.md` for basic setup
- Check `API_KEYS_SETUP.md` for API key configuration
- Check `README.md` for full documentation
- Run `./test_localhost.sh` to verify setup
