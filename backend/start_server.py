#!/usr/bin/env python3
"""
Startup script for backend with proper logging configuration
Suppresses browser extension 404 logs
"""
import uvicorn
import logging
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Configure logging filter BEFORE importing main
class AccessLogFilter(logging.Filter):
    def filter(self, record):
        msg = str(record.getMessage()) if hasattr(record, 'getMessage') else str(record.msg)
        if '/api/launches' in msg or 'favicon.ico' in msg or 'robots.txt' in msg:
            return False
        return True

# Apply filter to uvicorn loggers
uvicorn_access_logger = logging.getLogger("uvicorn.access")
uvicorn_access_logger.addFilter(AccessLogFilter())

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
