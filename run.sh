#!/bin/bash
# Start backend and frontend for local development

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "Starting Voice AI Agents..."
echo ""

# Start backend in background
echo "Starting backend on http://localhost:8000"
cd "$ROOT/backend"
if [ -d "venv" ]; then
  source venv/bin/activate
  uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
else
  echo "Error: backend/venv not found. Run: cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi
BACKEND_PID=$!
cd "$ROOT"

# Wait for backend to be ready
sleep 3

# Start frontend (uses workaround if parent dir has package-lock.json causing 404s)
echo "Starting frontend on http://localhost:3000"
cd "$ROOT/frontend"
./start-with-fix.sh &
FRONTEND_PID=$!
cd "$ROOT"

echo ""
echo "Backend:  http://localhost:8000 (PID $BACKEND_PID)"
echo "Frontend: http://localhost:3000 (PID $FRONTEND_PID)"
echo ""
echo "Open http://localhost:3000/dashboard in your browser."
echo "Press Ctrl+C to stop both servers."
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
