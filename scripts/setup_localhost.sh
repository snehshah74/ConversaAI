#!/bin/bash
# Startup script to ensure everything is ready and start the application

set -e

echo "🚀 Voice AI Agents - Localhost Startup"
echo "========================================"
echo ""

BACKEND_DIR="backend"
FRONTEND_DIR="frontend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Step 1: Initialize database
print_info "Step 1: Initializing database..."
cd "$BACKEND_DIR"
source venv/bin/activate
python3 -c "from models.database import init_db, create_sample_data; init_db(); create_sample_data()" 2>/dev/null || {
    print_warning "Database initialization had issues, but continuing..."
}
cd ..
print_success "Database ready"

# Step 2: Verify backend dependencies
print_info "Step 2: Verifying backend dependencies..."
cd "$BACKEND_DIR"
source venv/bin/activate
if python3 -c "import httpx, fastapi, uvicorn" 2>/dev/null; then
    print_success "Backend dependencies OK"
else
    print_warning "Some dependencies missing, but continuing..."
fi
cd ..

# Step 3: Verify frontend dependencies
print_info "Step 3: Verifying frontend dependencies..."
if [ -d "$FRONTEND_DIR/node_modules" ]; then
    print_success "Frontend dependencies OK"
else
    print_warning "Frontend node_modules not found. Run: cd frontend && npm install"
fi

echo ""
echo "========================================"
print_success "Setup complete!"
echo ""
echo "To start the application, run these commands in separate terminals:"
echo ""
echo -e "${BLUE}Terminal 1 (Backend):${NC}"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  uvicorn main:app --reload --port 8000"
echo ""
echo -e "${BLUE}Terminal 2 (Frontend):${NC}"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open:"
echo "  🌐 Frontend: http://localhost:3000"
echo "  🔌 Backend API: http://localhost:8000"
echo "  📚 API Docs: http://localhost:8000/docs"
echo ""
print_info "Note: Authentication is bypassed in development mode for localhost testing"
