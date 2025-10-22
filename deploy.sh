#!/bin/bash

###############################################################################
# Voice AI Agents Platform - Production Deployment Script
###############################################################################

set -e

echo "🚀 Voice AI Agents Platform - Production Deployment"
echo "===================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running from project root
if [ ! -f "docker-compose.yml" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check for required environment variables
if [ ! -f "backend/.env" ]; then
    print_warning "backend/.env not found. Creating from template..."
    if [ -f "env.example" ]; then
        cp env.example backend/.env
        print_warning "Please edit backend/.env with your configuration"
        exit 1
    else
        print_error "env.example not found"
        exit 1
    fi
fi

# Load environment variables
export $(grep -v '^#' backend/.env | xargs)

# Check for Google API key
if [ -z "$GOOGLE_API_KEY" ] || [ "$GOOGLE_API_KEY" == "your_google_api_key_here" ]; then
    print_error "GOOGLE_API_KEY not set in backend/.env"
    print_warning "Get your API key from: https://makersuite.google.com/app/apikey"
    exit 1
fi

print_success "Environment variables loaded"

# Check Docker installation
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_success "Docker and Docker Compose found"

# Menu
echo ""
echo "Select deployment option:"
echo "1) Build and run with Docker Compose (Production-like)"
echo "2) Build Docker images only"
echo "3) Deploy to Docker registry"
echo "4) Run development mode"
echo "5) Stop all containers"
echo "6) View logs"
echo ""
read -p "Enter choice [1-6]: " choice

case $choice in
    1)
        print_warning "Building and starting containers..."
        docker-compose down
        docker-compose up --build -d
        
        echo ""
        print_success "Containers started successfully!"
        echo ""
        echo "📍 Access points:"
        echo "   Frontend: http://localhost:3000"
        echo "   Backend API: http://localhost:8000"
        echo "   API Docs: http://localhost:8000/docs"
        echo ""
        echo "📊 View logs: docker-compose logs -f"
        echo "🛑 Stop: docker-compose down"
        ;;
    
    2)
        print_warning "Building Docker images..."
        docker-compose build
        print_success "Images built successfully!"
        docker images | grep voice-ai
        ;;
    
    3)
        read -p "Enter Docker registry URL (e.g., your-registry.com): " registry
        
        print_warning "Building images..."
        docker-compose build
        
        print_warning "Tagging images..."
        docker tag voice-ai-backend:latest ${registry}/voice-ai-backend:latest
        docker tag voice-ai-frontend:latest ${registry}/voice-ai-frontend:latest
        
        print_warning "Pushing to registry..."
        docker push ${registry}/voice-ai-backend:latest
        docker push ${registry}/voice-ai-frontend:latest
        
        print_success "Images pushed to registry!"
        ;;
    
    4)
        print_warning "Starting development mode..."
        
        # Start backend
        cd backend
        if [ ! -d "venv" ]; then
            print_warning "Creating virtual environment..."
            python3 -m venv venv
        fi
        
        source venv/bin/activate
        pip install -r requirements.txt --quiet
        
        print_success "Starting backend on port 8000..."
        uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
        BACKEND_PID=$!
        
        cd ../frontend
        print_success "Starting frontend on port 3000..."
        npm install --silent
        npm run dev &
        FRONTEND_PID=$!
        
        echo ""
        print_success "Development servers started!"
        echo ""
        echo "📍 Access points:"
        echo "   Frontend: http://localhost:3000"
        echo "   Backend API: http://localhost:8000"
        echo "   API Docs: http://localhost:8000/docs"
        echo ""
        echo "Press Ctrl+C to stop servers..."
        
        # Trap Ctrl+C
        trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
        wait
        ;;
    
    5)
        print_warning "Stopping all containers..."
        docker-compose down
        print_success "All containers stopped"
        ;;
    
    6)
        docker-compose logs -f
        ;;
    
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

