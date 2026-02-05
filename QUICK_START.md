# Quick Start Guide - Troubleshooting

## ✅ Issue Found & Fixed

**Problem**: Backend wasn't working because Python code was run without activating the virtual environment.

**Solution**: Always activate the virtual environment before running Python commands.

---

## 🚀 How to Run the Application

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Activate virtual environment:**
   ```bash
   source venv/bin/activate
   ```
   You should see `(venv)` in your terminal prompt.

3. **Verify dependencies are installed:**
   ```bash
   pip list | grep httpx
   ```
   Should show `httpx` is installed.

4. **Start the backend server:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   
   Or use the start script:
   ```bash
   python start_server.py
   ```

5. **Verify backend is running:**
   - Open browser: http://localhost:8000
   - Should see: `{"status":"healthy","service":"Voice AI Platform","version":"1.0.0"}`
   - API docs: http://localhost:8000/docs

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

3. **Start the frontend:**
   ```bash
   npm run dev
   ```

4. **Verify frontend is running:**
   - Open browser: http://localhost:3000
   - Should see the application homepage

---

## 🔧 Common Issues & Solutions

### Issue 1: `ModuleNotFoundError: No module named 'httpx'`

**Cause**: Running Python without activating virtual environment.

**Solution**:
```bash
cd backend
source venv/bin/activate  # Activate venv first!
python -c "import httpx"  # Now this will work
```

### Issue 2: Backend won't start

**Checklist**:
- ✅ Virtual environment is activated (`(venv)` in prompt)
- ✅ `.env` file exists in `backend/` directory
- ✅ API keys are set in `.env`:
  - `GROQ_API_KEY=...`
  - `DEEPGRAM_API_KEY=...`
  - `GOOGLE_APPLICATION_CREDENTIALS=...`
- ✅ Database is initialized:
  ```bash
  cd backend
  source venv/bin/activate
  python -c "from models.database import init_db; init_db()"
  ```

### Issue 3: Frontend can't connect to backend

**Checklist**:
- ✅ Backend is running on `http://localhost:8000`
- ✅ Check browser console for CORS errors
- ✅ Verify `NEXT_PUBLIC_API_URL` in frontend (defaults to `http://localhost:8000`)

### Issue 4: Next.js build errors

**Solution**: Clear caches and reinstall:
```bash
cd frontend
rm -rf .next node_modules package-lock.json
npm cache clean --force
npm install
npm run dev
```

---

## 📋 Environment Variables

### Backend `.env` file (in `backend/` directory)

Required variables:
```env
GROQ_API_KEY=gsk_...
DEEPGRAM_API_KEY=...
GOOGLE_APPLICATION_CREDENTIALS=/path/to/google-credentials.json
DATABASE_URL=sqlite:///./voice_ai.db
```

### Frontend `.env.local` file (optional, in `frontend/` directory)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🧪 Testing

### Test Backend
```bash
cd backend
source venv/bin/activate
python run_tests.py
```

### Test Backend Health
```bash
curl http://localhost:8000/
# Should return: {"status":"healthy",...}
```

### Test API Endpoints
```bash
curl http://localhost:8000/api/agents
# Should return list of agents (may be empty)
```

---

## 📝 Quick Commands Reference

```bash
# Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Frontend (in separate terminal)
cd frontend
npm run dev

# Check if backend is running
curl http://localhost:8000/

# Check if frontend is running
curl http://localhost:3000/
```

---

## ⚠️ Important Notes

1. **Always activate venv** before running Python commands in backend
2. **Keep backend and frontend running** in separate terminal windows/tabs
3. **Backend must be running** before frontend can connect to it
4. **API keys are required** - see `API_KEYS_SETUP.md` for setup instructions

---

## 🆘 Still Having Issues?

1. Check backend logs for errors
2. Check frontend browser console (F12)
3. Verify all environment variables are set
4. Ensure both servers are running
5. Check firewall/network settings
