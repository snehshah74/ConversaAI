"""
API endpoint to verify that API keys are set and valid.
Call GET /api/verify-keys to check your Render environment variables.
"""

import os
import logging
from fastapi import APIRouter
import httpx

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["verify"])


@router.get("/verify-keys")
async def verify_keys():
    """
    Verify API keys are set and valid.
    Returns status for each key - use this to debug Render env vars.
    """
    results = {}

    # 1. DATABASE_URL + agents table check
    db_url = os.getenv("DATABASE_URL", "")
    if db_url:
        try:
            from models.database import engine, SessionLocal, Agent
            from sqlalchemy import text
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            results["DATABASE_URL"] = {"status": "ok", "message": "Connected"}
            # Also test agents table query (what /api/agents does)
            try:
                db = SessionLocal()
                count = db.query(Agent).count()
                db.close()
                results["AGENTS_TABLE"] = {"status": "ok", "message": f"OK ({count} agents)"}
            except Exception as e:
                results["AGENTS_TABLE"] = {"status": "error", "message": str(e)}
        except Exception as e:
            results["DATABASE_URL"] = {"status": "error", "message": str(e)}
    else:
        results["DATABASE_URL"] = {"status": "missing", "message": "Not set"}

    # 2. GROQ_API_KEY (LLM - primary)
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    if groq_key:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
                    json={"model": "llama-3.3-70b-versatile", "messages": [{"role": "user", "content": "Say OK"}], "max_tokens": 5},
                )
            if r.status_code == 200:
                results["GROQ_API_KEY"] = {"status": "ok", "message": "Valid"}
            else:
                results["GROQ_API_KEY"] = {"status": "error", "message": f"API returned {r.status_code}"}
        except Exception as e:
            results["GROQ_API_KEY"] = {"status": "error", "message": str(e)}
    else:
        results["GROQ_API_KEY"] = {"status": "missing", "message": "Not set (required for chat)"}

    # 3. DEEPGRAM_API_KEY (Speech-to-Text)
    dg_key = os.getenv("DEEPGRAM_API_KEY", "").strip()
    if dg_key:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get(
                    "https://api.deepgram.com/v1/projects",
                    headers={"Authorization": f"Token {dg_key}"},
                )
            if r.status_code == 200:
                results["DEEPGRAM_API_KEY"] = {"status": "ok", "message": "Valid"}
            else:
                results["DEEPGRAM_API_KEY"] = {"status": "error", "message": f"API returned {r.status_code}"}
        except Exception as e:
            results["DEEPGRAM_API_KEY"] = {"status": "error", "message": str(e)}
    else:
        results["DEEPGRAM_API_KEY"] = {"status": "missing", "message": "Not set (required for voice)"}

    # 4. GOOGLE_API_KEY (LLM fallback, TTS)
    google_key = os.getenv("GOOGLE_API_KEY", "").strip()
    if google_key:
        results["GOOGLE_API_KEY"] = {"status": "set", "message": "Present (not validated)"}
    else:
        results["GOOGLE_API_KEY"] = {"status": "missing", "message": "Optional fallback for LLM/TTS"}

    # 5. OPENAI_API_KEY (embeddings for knowledge base)
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    if openai_key:
        results["OPENAI_API_KEY"] = {"status": "set", "message": "Present (not validated)"}
    else:
        results["OPENAI_API_KEY"] = {"status": "missing", "message": "Optional for document embeddings"}

    return {"keys": results}
