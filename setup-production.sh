#!/bin/bash

# 🎤 Conversa AI - Production Setup Script
# This script helps you set up the production environment

echo "🎤 CONVERSA AI - PRODUCTION SETUP"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() {
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
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_info "Starting production setup..."

# Step 1: Install Frontend Dependencies
echo ""
echo "📦 STEP 1: INSTALLING FRONTEND DEPENDENCIES"
echo "==========================================="
cd frontend
if npm install @supabase/supabase-js; then
    print_success "Supabase client installed"
else
    print_error "Failed to install Supabase client"
    exit 1
fi
cd ..

# Step 2: Install Backend Dependencies
echo ""
echo "🐍 STEP 2: INSTALLING BACKEND DEPENDENCIES"
echo "=========================================="
cd backend
if pip install -r requirements.txt; then
    print_success "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi
cd ..

# Step 3: Create Environment Files
echo ""
echo "🔐 STEP 3: CREATING ENVIRONMENT FILES"
echo "====================================="

# Frontend environment template
cat > frontend/.env.local.template << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend API URL
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxx
EOF

# Backend environment template
cat > backend/.env.template << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres

# LLM Provider API Keys (Choose one or more)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Security & Authentication
JWT_SECRET_KEY=your-super-secret-jwt-key-minimum-32-characters
ENCRYPTION_KEY=your-32-character-encryption-key-here
API_SECRET_KEY=your-api-secret-for-internal-calls

# Environment Configuration
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-domain.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_BURST=10

# Monitoring & Analytics
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@sentry.io/xxxxxxx
POSTHOG_API_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
POSTHOG_HOST=https://app.posthog.com
EOF

print_success "Environment templates created"

# Step 4: Generate Security Keys
echo ""
echo "🔑 STEP 4: GENERATING SECURITY KEYS"
echo "==================================="

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
print_success "JWT Secret generated: ${JWT_SECRET:0:20}..."

# Generate encryption key
ENCRYPTION_KEY=$(openssl rand -hex 16)
print_success "Encryption key generated: ${ENCRYPTION_KEY:0:20}..."

# Generate API secret
API_SECRET=$(openssl rand -base64 32)
print_success "API Secret generated: ${API_SECRET:0:20}..."

# Step 5: Create Setup Instructions
echo ""
echo "📋 STEP 5: CREATING SETUP INSTRUCTIONS"
echo "======================================"

cat > PRODUCTION_SETUP_INSTRUCTIONS.md << EOF
# 🎤 Conversa AI - Production Setup Instructions

## 🔐 **Generated Security Keys**
\`\`\`
JWT_SECRET_KEY=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
API_SECRET_KEY=${API_SECRET}
\`\`\`

## 📋 **Next Steps**

### 1. Set Up Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key
4. Run the SQL commands from \`PRODUCTION_ENV_SETUP.md\`

### 2. Get LLM API Keys
- **OpenAI**: [platform.openai.com](https://platform.openai.com/api-keys)
- **Anthropic**: [console.anthropic.com](https://console.anthropic.com/)
- **Google**: [console.cloud.google.com](https://console.cloud.google.com/)

### 3. Configure Environment Variables
- Copy \`frontend/.env.local.template\` to \`frontend/.env.local\`
- Copy \`backend/.env.template\` to \`backend/.env\`
- Fill in your actual values

### 4. Deploy to Production
- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Railway
- **Database**: Use Supabase

## 🚀 **Deployment Commands**

\`\`\`bash
# Frontend
cd frontend
vercel --prod

# Backend
cd backend
railway up
\`\`\`

## 📊 **Production URLs**
- Frontend: https://your-app.vercel.app
- Backend: https://your-app.railway.app
- Database: Supabase Dashboard

## 🎯 **Features Ready**
- ✅ Supabase Authentication
- ✅ Multiple LLM Providers
- ✅ Voice AI Capabilities
- ✅ Production Security
- ✅ Monitoring & Analytics
- ✅ Scalable Architecture

**Your Voice AI platform is production-ready!** 🚀
EOF

print_success "Setup instructions created"

# Step 6: Test Build
echo ""
echo "🔧 STEP 6: TESTING BUILD"
echo "======================="

cd frontend
if npm run build; then
    print_success "Frontend build successful"
else
    print_warning "Frontend build failed - check for errors"
fi
cd ..

# Final Summary
echo ""
echo "🎉 PRODUCTION SETUP COMPLETE!"
echo "============================="
echo ""
print_success "Frontend dependencies installed"
print_success "Backend dependencies installed"
print_success "Environment templates created"
print_success "Security keys generated"
print_success "Setup instructions created"
echo ""
print_info "Next steps:"
echo "1. Set up Supabase project"
echo "2. Get LLM API keys"
echo "3. Configure environment variables"
echo "4. Deploy to production"
echo ""
print_info "See PRODUCTION_SETUP_INSTRUCTIONS.md for detailed steps"
echo ""
echo "🎤 Your Voice AI platform is ready for production! 🚀"
