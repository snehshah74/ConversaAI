from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os
import logging

from routers.chat import router as chat_router
from routers.agents import router as agents_router
from models.schemas import ErrorResponse
from sqlalchemy.exc import SQLAlchemyError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(
    title="Voice AI Platform API",
    version="1.0.0",
    description="Voice AI Agent Platform for Customer Experience"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://conversa-ai-platform.vercel.app",
        "https://*.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router)
app.include_router(agents_router)

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
