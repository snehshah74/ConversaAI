#!/bin/bash

# Voice AI Agents Platform - Quick Setup Script
# This script helps you set up the platform quickly

set -e  # Exit on any error

echo "🚀 Voice AI Agents Platform - Quick Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "backend/main.py" ] || [ ! -f "frontend/package.json" ]; then
    print_error "Please run this script from the root directory of the voice-ai-agents project"
    exit 1
fi

print_info "Starting setup process..."

# Step 1: Check prerequisites
echo ""
echo "📋 Checking Prerequisites..."
echo "============================"

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    print_status "Python $PYTHON_VERSION found"
else
    print_error "Python 3 is required but not installed"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js $NODE_VERSION found"
else
    print_error "Node.js is required but not installed"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status "npm $NPM_VERSION found"
else
    print_error "npm is required but not installed"
    exit 1
fi

# Step 2: Backend Setup
echo ""
echo "🔧 Setting up Backend..."
echo "========================"

cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_info "Creating Python virtual environment..."
    python3 -m venv venv
    print_status "Virtual environment created"
fi

# Activate virtual environment
print_info "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
print_info "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
print_status "Python dependencies installed"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    cp ../env.example .env
    print_warning "Please edit backend/.env file with your actual values:"
    print_warning "  - GOOGLE_API_KEY (get from https://makersuite.google.com/app/apikey)"
    print_warning "  - DATABASE_URL (get from your Supabase project)"
    echo ""
    print_info "Opening .env file for editing..."
    echo "Press Enter to continue after editing the file..."
    read
fi

# Initialize database
print_info "Initializing database..."
python -c "from models.database import init_db; init_db()" 2>/dev/null || {
    print_warning "Database initialization failed. This is normal if DATABASE_URL is not set yet."
    print_warning "Please set your DATABASE_URL in .env file and run:"
    print_warning "  python -c \"from models.database import init_db; init_db()\""
}

print_status "Backend setup completed"

# Step 3: Frontend Setup
echo ""
echo "🎨 Setting up Frontend..."
echo "========================="

cd ../frontend

# Install dependencies
print_info "Installing Node.js dependencies..."
npm install
print_status "Node.js dependencies installed"

print_status "Frontend setup completed"

# Step 4: Final Instructions
echo ""
echo "🎉 Setup Complete!"
echo "==================="
echo ""
print_info "Next steps:"
echo ""
echo "1. 🔑 Get your Google AI API key:"
echo "   Visit: https://makersuite.google.com/app/apikey"
echo "   Add it to: backend/.env"
echo ""
echo "2. 🗄️  Set up Supabase database:"
echo "   Visit: https://supabase.com"
echo "   Create a new project"
echo "   Get the connection string from Settings → Database"
echo "   Add it to: backend/.env as DATABASE_URL"
echo ""
echo "3. 🚀 Start the servers:"
echo ""
echo "   Backend (Terminal 1):"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "   Frontend (Terminal 2):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. 🌐 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
print_status "Setup completed successfully!"
echo ""
print_info "For detailed instructions, see: SETUP_GUIDE.md"
