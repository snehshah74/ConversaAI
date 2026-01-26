# API Keys Setup Guide for ConversaAI Voice Platform

## Required API Keys

### 1. GROQ_API_KEY (Required - FREE)
**What it does:** Powers the LLM (Language Model) - replaces Google Gemini with a free, fast alternative

**Where to get it:**
1. Go to: https://console.groq.com/
2. Sign up for a free account (no credit card needed)
3. Navigate to "API Keys" section
4. Click "Create API Key"
5. Copy the key (starts with `gsk_...`)

**Free tier limits:**
- 30 requests per minute
- 14,400 requests per day
- More than enough for development/testing

**Add to `.env`:**
```
GROQ_API_KEY=gsk_your_key_here
```

---

### 2. DEEPGRAM_API_KEY (Required - FREE)
**What it does:** Converts speech to text (Speech-to-Text)

**Where to get it:**
1. Go to: https://deepgram.com/
2. Sign up for a free account
3. Go to "API Keys" in dashboard
4. Click "Create New API Key"
5. Copy the key (starts with `...`)

**Free tier limits:**
- 12,000 minutes per month
- Perfect for development

**Add to `.env`:**
```
DEEPGRAM_API_KEY=your_deepgram_key_here
```

---

### 3. GOOGLE_APPLICATION_CREDENTIALS (Required for TTS)
**What it does:** Powers Text-to-Speech (converts text to voice)

**Where to get it:**
1. Go to: https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable "Cloud Text-to-Speech API":
   - Go to "APIs & Services" > "Library"
   - Search "Cloud Text-to-Speech API"
   - Click "Enable"
4. Create Service Account:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in details and create
5. Create JSON Key:
   - Click on the service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose "JSON" format
   - Download the JSON file
6. Save the JSON file to your project (e.g., `backend/google-credentials.json`)

**Free tier limits:**
- 0-4 million characters per month free
- Then $4 per million characters

**Add to `.env`:**
```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/google-credentials.json
```

**Example:**
```
GOOGLE_APPLICATION_CREDENTIALS=/Users/sneh/voice-ai-agents/backend/google-credentials.json
```

---

## Optional Fallback Keys (Not Required)

### 4. GOOGLE_API_KEY (Optional - Fallback LLM)
**What it does:** Fallback LLM if Groq fails

**Where to get it:**
1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

**Add to `.env`:**
```
GOOGLE_API_KEY=your_google_api_key_here
```

---

### 5. OPENAI_API_KEY (Optional - Fallback LLM)
**What it does:** Fallback LLM if Groq and Gemini fail

**Where to get it:**
1. Go to: https://platform.openai.com/api-keys
2. Sign up/login
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)

**Note:** Requires paid account (not free)

**Add to `.env`:**
```
OPENAI_API_KEY=sk-your_openai_key_here
```

---

## Quick Setup Steps

1. **Create `.env` file** in `backend/` directory:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Add your keys** to `.env`:
   ```env
   # Required
   GROQ_API_KEY=gsk_your_groq_key
   DEEPGRAM_API_KEY=your_deepgram_key
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/google-credentials.json
   
   # Optional (fallbacks)
   GOOGLE_API_KEY=your_google_key
   OPENAI_API_KEY=sk-your_openai_key
   ```

3. **Install dependencies**:
   ```bash
   cd backend
   source venv/bin/activate
   pip install langchain-groq deepgram-sdk google-cloud-texttospeech
   ```

4. **Test the setup**:
   ```bash
   python -c "from services.llm_service import get_llm_service; print('✅ LLM service ready')"
   ```

---

## Cost Summary

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Groq** | ✅ FREE (30 req/min) | Not needed |
| **Deepgram** | ✅ FREE (12k min/month) | $0.0043/min after |
| **Google TTS** | ✅ FREE (4M chars/month) | $4 per 1M chars |
| **Google Gemini** | ✅ FREE (60 req/min) | Not needed |
| **OpenAI** | ❌ Paid only | $0.15 per 1M tokens |

**Total Monthly Cost: $0** (for development/testing)

---

## Troubleshooting

**If Groq fails:**
- Check API key is correct
- Verify you're within rate limits
- System will auto-fallback to Gemini/OpenAI

**If Deepgram fails:**
- Check API key is correct
- Verify audio format is supported
- Check monthly quota

**If Google TTS fails:**
- Verify JSON credentials file path is correct
- Check Cloud Text-to-Speech API is enabled
- Verify service account has proper permissions

---

## Security Notes

⚠️ **Never commit `.env` file to git!**
- Already in `.gitignore`
- Keep API keys secret
- Rotate keys if exposed

✅ **Best Practices:**
- Use different keys for development/production
- Set up environment variables on deployment platforms
- Monitor API usage regularly
