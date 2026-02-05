# Chrome Voice Output Setup

Voice output in Chrome uses **backend TTS** (not browser speechSynthesis). Follow these steps:

---

## Quick Checklist

### 1. Backend `.env` file

Create or edit `backend/.env`:

```bash
cd backend
cp ../env.example .env   # if .env doesn't exist
```

### 2. Install TTS dependency (free fallback)

```bash
cd backend
source venv/bin/activate
pip install gtts
```

This enables **gTTS** (free, no credentials) as a fallback when Google Cloud isn't configured.

### 3. Optional: Google Cloud TTS (better quality)

For higher quality voice, set up Google Cloud:

1. Get credentials: [API_KEYS_SETUP.md](./API_KEYS_SETUP.md#3-google_application_credentials-required-for-tts)
2. Add to `backend/.env`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/google-credentials.json
   ```

If not set, the app uses **gTTS** (free, works out of the box).

### 4. Start backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

### 5. Start frontend

```bash
cd frontend
npm run dev
```

### 6. Test in Chrome

1. Open http://localhost:3000
2. Go to test page for an agent (e.g. `/test/[agentId]`)
3. Click **Start call** (green phone)
4. You should hear the greeting
5. Speak and you should hear the response

---

## Verify Backend TTS

Test the TTS endpoint directly:

```bash
# Get an agent ID from the dashboard or API
AGENT_ID="your-agent-uuid-here"

curl -X POST http://localhost:8000/api/voice/synthesize-audio \
  -H "Content-Type: application/json" \
  -d "{\"agent_id\": \"$AGENT_ID\", \"text\": \"Hello, this is a test\"}" \
  --output test.mp3

# Play the file (macOS)
afplay test.mp3
```

If you get MP3 audio, TTS is working.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 503 "TTS service not available" | Run `pip install gtts` in backend |
| 404 "Agent not found" | Use a valid agent ID from your database |
| No sound in browser | Check system volume, tab not muted |
| CORS errors | Ensure backend runs on port 8000, frontend on 3000 |

---

## Summary

- **Chrome** → Backend TTS (gTTS or Google Cloud)
- **Safari** → Browser speechSynthesis (works without backend TTS)
- **gTTS** → Free, no credentials, works immediately
- **Google Cloud** → Better quality, requires setup
