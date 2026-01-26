#!/bin/bash
# Backend Restart Script

cd "$(dirname "$0")/backend"

echo "🛑 Stopping backend server..."
# Kill any running uvicorn/python processes
pkill -f "uvicorn.*main:app" 2>/dev/null || true
pkill -f "python.*main.py" 2>/dev/null || true
pkill -f "python.*start_server.py" 2>/dev/null || true
sleep 2

echo "🚀 Starting backend server..."

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Start the server
if [ -f "start_server.py" ]; then
    python start_server.py
else
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
fi
