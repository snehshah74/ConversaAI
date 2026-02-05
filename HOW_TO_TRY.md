# How to Try the Voice AI App

## One-time setup

### 1. Backend

```bash
cd backend

# Create virtual environment (if you don't have one)
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install gtts

# Create .env from example
cp ../env.example .env

# Edit .env and add at least:
#   GROQ_API_KEY=gsk_...
#   DEEPGRAM_API_KEY=...
#   DATABASE_URL=sqlite:///./voice_ai.db
```

### 2. Frontend

```bash
cd frontend
npm install
```

---

## Run the app

**Option A – One command (from project root):**

```bash
./run.sh
```

Then open: **http://localhost:3000**

---

**Option B – Two terminals**

**Terminal 1 – Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```
Wait until you see "Uvicorn running on http://0.0.0.0:8000"

**Terminal 2 – Frontend:**
```bash
cd frontend
npm run dev
```
Wait until you see "Ready on http://localhost:3000"

Then open: **http://localhost:3000**

---

## Try voice

1. Open **http://localhost:3000**
2. Go to **Dashboard** (or **http://localhost:3000/dashboard**)
3. Click an agent card, or go to **Test** for an agent
4. Or go directly to **http://localhost:3000/test/YOUR_AGENT_ID**
5. Click the green **phone** button to start the call
6. Allow microphone when the browser asks
7. Speak or type; you should see and hear the agent reply

**Chrome:** Voice uses backend TTS (needs `gtts` installed).  
**Safari:** Voice uses the browser’s built-in speech.

---

## Quick checks

- Backend OK: http://localhost:8000 → `{"status":"healthy",...}`
- API docs: http://localhost:8000/docs
- Frontend OK: http://localhost:3000 → app homepage
- List agents: http://localhost:8000/api/agents

---

## No agent yet?

1. Go to **http://localhost:3000/agents/create**
2. Create an agent (name, company, greeting, etc.)
3. Then go to **Dashboard** → click the agent → **Test** (or open `/test/[that agent id]`)
