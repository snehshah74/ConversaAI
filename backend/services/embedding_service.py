"""
Embedding Service - RAG-ready embeddings without heavy dependencies
Supports: OpenAI API (lightweight), sentence-transformers (optional fallback)
Output: 384 dimensions (compatible with Supabase pgvector)
"""

import os
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

# Target dimension for Supabase knowledge_base.embedding vector(384)
EMBEDDING_DIM = 384

# Try sentence-transformers (optional - adds ~500MB)
try:
    from sentence_transformers import SentenceTransformer  # type: ignore
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False

# httpx for API calls (already in requirements)
try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False


_sentence_model_cache = None


def _get_openai_embedding(text: str) -> Optional[List[float]]:
    """Create embedding via OpenAI API - lightweight, no torch."""
    if not HTTPX_AVAILABLE:
        return None
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key or api_key == "your_openai_api_key_here":
        return None
    try:
        # text-embedding-3-small defaults to 384 dims - matches Supabase schema
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(
                "https://api.openai.com/v1/embeddings",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"model": "text-embedding-3-small", "input": text[:8000]}
            )
            if resp.status_code != 200:
                logger.warning(f"OpenAI embedding API error: {resp.status_code}")
                return None
            data = resp.json()
            emb = data["data"][0]["embedding"]
            # Ensure 384 dims (API may return different)
            if len(emb) != EMBEDDING_DIM:
                # Truncate or pad to 384
                emb = (emb + [0.0] * EMBEDDING_DIM)[:EMBEDDING_DIM]
            return emb
    except Exception as e:
        logger.warning(f"OpenAI embedding failed: {e}")
        return None


def _get_sentence_transformer_embedding(text: str) -> Optional[List[float]]:
    """Create embedding via sentence-transformers (local model)."""
    global _sentence_model_cache
    if not SENTENCE_TRANSFORMERS_AVAILABLE:
        return None
    try:
        if _sentence_model_cache is None:
            model_name = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
            logger.info(f"Loading embedding model: {model_name}")
            _sentence_model_cache = SentenceTransformer(model_name)
        emb = _sentence_model_cache.encode(text, convert_to_numpy=True).tolist()
        if len(emb) != EMBEDDING_DIM:
            emb = (emb + [0.0] * EMBEDDING_DIM)[:EMBEDDING_DIM]
        return emb
    except Exception as e:
        logger.warning(f"Sentence-transformer embedding failed: {e}")
        return None


def create_embedding(text: str) -> List[float]:
    """
    Create 384-dim embedding for text.
    Priority: OpenAI API (if OPENAI_API_KEY) -> sentence-transformers (if installed).
    """
    if not text or not text.strip():
        return []
    # Try OpenAI first (lightweight)
    emb = _get_openai_embedding(text)
    if emb:
        return emb
    # Fallback to sentence-transformers
    emb = _get_sentence_transformer_embedding(text)
    if emb:
        return emb
    return []


def is_embedding_available() -> bool:
    """Check if any embedding provider is available."""
    key = os.getenv("OPENAI_API_KEY", "").strip()
    if key and key not in ("", "your_openai_api_key_here"):
        return True
    return SENTENCE_TRANSFORMERS_AVAILABLE
