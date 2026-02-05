#!/bin/bash
# Test script to verify localhost setup is working

set -e

echo "🧪 Testing Localhost Setup"
echo "=========================="
echo ""

BACKEND_DIR="backend"
FRONTEND_DIR="frontend"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Test 1: Check if backend venv exists
echo "1. Checking backend virtual environment..."
if [ -d "$BACKEND_DIR/venv" ]; then
    print_status 0 "Virtual environment exists"
else
    print_status 1 "Virtual environment not found"
    echo "   Run: cd backend && python3 -m venv venv"
    exit 1
fi

# Test 2: Check if .env file exists
echo ""
echo "2. Checking backend .env file..."
if [ -f "$BACKEND_DIR/.env" ]; then
    print_status 0 ".env file exists"
    # Check for required keys
    if grep -q "GROQ_API_KEY" "$BACKEND_DIR/.env"; then
        print_status 0 "GROQ_API_KEY is set"
    else
        print_status 1 "GROQ_API_KEY not found in .env"
    fi
else
    print_status 1 ".env file not found"
    echo "   Run: cd backend && cp ../env.example .env"
    exit 1
fi

# Test 3: Check if dependencies are installed
echo ""
echo "3. Checking backend dependencies..."
cd "$BACKEND_DIR"
source venv/bin/activate
if python3 -c "import httpx, fastapi, uvicorn" 2>/dev/null; then
    print_status 0 "Backend dependencies installed"
else
    print_status 1 "Backend dependencies missing"
    echo "   Run: source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi
cd ..

# Test 4: Initialize database
echo ""
echo "4. Initializing database..."
cd "$BACKEND_DIR"
source venv/bin/activate
if python3 -c "from models.database import init_db, create_sample_data; init_db(); create_sample_data()" 2>/dev/null; then
    print_status 0 "Database initialized"
else
    print_status 1 "Database initialization failed"
    exit 1
fi
cd ..

# Test 5: Test backend import
echo ""
echo "5. Testing backend imports..."
cd "$BACKEND_DIR"
source venv/bin/activate
if python3 -c "from services.llm_service import get_llm_service; from main import app; print('OK')" 2>/dev/null; then
    print_status 0 "Backend imports successfully"
else
    print_status 1 "Backend import failed"
    exit 1
fi
cd ..

# Test 6: Check frontend node_modules
echo ""
echo "6. Checking frontend dependencies..."
if [ -d "$FRONTEND_DIR/node_modules" ]; then
    print_status 0 "Frontend node_modules exists"
else
    print_status 1 "Frontend node_modules not found"
    echo "   Run: cd frontend && npm install"
    exit 1
fi

# Test 7: Check Next.js installation
echo ""
echo "7. Checking Next.js installation..."
if [ -f "$FRONTEND_DIR/node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js" ]; then
    print_status 0 "Next.js properly installed"
else
    print_status 1 "Next.js installation incomplete"
    echo "   Run: cd frontend && rm -rf node_modules package-lock.json && npm install"
    exit 1
fi

echo ""
echo "=========================="
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  uvicorn main:app --reload --port 8000"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"
echo ""
