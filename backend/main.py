from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from dotenv import load_dotenv
import os
import logging
from pathlib import Path

# Configure logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure uvicorn access logger to filter out browser extension requests
class AccessLogFilter(logging.Filter):
    def filter(self, record):
        # Suppress logs for browser extension paths
        # Uvicorn logs format: "127.0.0.1:63658 - \"GET /api/launches/42 HTTP/1.1\" 404 Not Found"
        try:
            # Check the log message itself
            if hasattr(record, 'getMessage'):
                msg = record.getMessage()
            else:
                msg = str(record.msg) % record.args if hasattr(record, 'args') and record.args else str(record.msg)
            
            # Check if message contains browser extension paths
            if '/api/launches' in msg or 'favicon.ico' in msg or 'robots.txt' in msg:
                return False
            
            # Also check record attributes directly
            if hasattr(record, 'path'):
                path = str(record.path)
                if path.startswith('/api/launches') or path in ['/favicon.ico', '/robots.txt']:
                    return False
        except Exception:
            # If filtering fails, allow the log through
            pass
        return True

# Apply filter to uvicorn access logger BEFORE any requests
uvicorn_access_logger = logging.getLogger("uvicorn.access")
uvicorn_access_logger.addFilter(AccessLogFilter())

# Also suppress for uvicorn logger itself
uvicorn_logger = logging.getLogger("uvicorn")
uvicorn_logger.addFilter(AccessLogFilter())

# Middleware to suppress logging for browser extension requests
class SuppressBrowserExtensionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        # Skip logging for known browser extension paths
        if request.url.path.startswith("/api/launches") or \
           request.url.path in ["/favicon.ico", "/robots.txt"]:
            response = await call_next(request)
            # Don't log these requests - they're just browser extensions
            return response
        
        response = await call_next(request)
        return response

# Load .env from the backend directory explicitly
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)
logger.info(f"Loaded .env from: {env_path}")
logger.info(f"GROQ_API_KEY set: {'Yes' if os.getenv('GROQ_API_KEY') else 'No'}")
logger.info(f"LLM_PROVIDER: {os.getenv('LLM_PROVIDER', 'not set')}")

from routers.chat import router as chat_router
from routers.agents import router as agents_router
from routers.voice import router as voice_router
from routers.websocket import router as websocket_router
from routers.training import router as training_router
from routers.knowledge import router as knowledge_router
from routers.deployments import router as deployments_router
from routers.widget import router as widget_router
from routers.verify_keys import router as verify_keys_router
from models.schemas import ErrorResponse
from sqlalchemy.exc import SQLAlchemyError

app = FastAPI(
    title="Voice AI Platform API",
    version="1.0.0",
    description="Voice AI Agent Platform for Customer Experience"
)

# Add middleware to suppress browser extension request logging
app.add_middleware(SuppressBrowserExtensionMiddleware)

# CORS: allow all origins (set FRONTEND_URL in production to restrict)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router)  # REST API - unchanged
app.include_router(agents_router)  # REST API - unchanged
app.include_router(voice_router)  # REST API - unchanged
app.include_router(websocket_router)  # NEW: WebSocket for voice streaming
app.include_router(training_router)  # NEW: Training endpoints for learning from conversations
app.include_router(knowledge_router)  # NEW: Knowledge base endpoints for document uploads
app.include_router(deployments_router)  # NEW: Deployment management endpoints
app.include_router(widget_router)  # NEW: Web widget endpoints
app.include_router(verify_keys_router)  # API key verification

@app.on_event("startup")
async def startup_event():
    """Ensure logging filter and database are ready on startup"""
    # Re-apply filter in case uvicorn resets loggers
    uvicorn_access_logger = logging.getLogger("uvicorn.access")
    uvicorn_access_logger.filters = []
    uvicorn_access_logger.addFilter(AccessLogFilter())
    logger.info("Logging filter applied - browser extension requests will be suppressed")
    # Ensure database tables exist and enrich agents with policy content if needed
    try:
        from models.database import init_db, create_sample_data, enrich_agent_knowledge
        init_db()
        create_sample_data()
        enrich_agent_knowledge()
        logger.info("Database tables verified")
    except Exception as e:
        logger.warning("Database init on startup: %s", e)

@app.get("/")
async def health_check():
    return {
        "status": "healthy",
        "service": "Voice AI Platform",
        "version": "1.0.0"
    }

@app.get("/api/health")
async def api_health():
    return {"status": "ok", "database": "connected"}

@app.get("/api/routes")
async def list_routes():
    """List all registered routes for debugging"""
    routes = []
    for route in app.routes:
        if hasattr(route, "path") and hasattr(route, "methods"):
            routes.append({
                "path": route.path,
                "methods": list(route.methods) if route.methods else []
            })
    return {"routes": routes, "total": len(routes)}

# Handle browser extension/dev tool requests silently
@app.api_route("/api/launches/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def handle_launches(request: Request, path: str):
    """Silently handle browser extension requests"""
    return JSONResponse(
        status_code=404,
        content={"error": "Not found", "message": "This endpoint does not exist"}
    )

@app.api_route("/favicon.ico", methods=["GET"])
async def favicon():
    """Handle favicon requests"""
    return JSONResponse(status_code=404, content={})

@app.api_route("/robots.txt", methods=["GET"])
async def robots():
    """Handle robots.txt requests"""
    return JSONResponse(status_code=404, content={})


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with proper error responses"""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.detail,
            status_code=exc.status_code
        ).model_dump()
    )


@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database exceptions"""
    logger.error(f"Database error: {exc}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Database error occurred",
            detail=str(exc),
            status_code=500
        ).model_dump()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unexpected error: {exc}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="An unexpected error occurred",
            detail="Please try again later",
            status_code=500
        ).model_dump()
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)
