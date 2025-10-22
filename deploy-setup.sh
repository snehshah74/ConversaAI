#!/bin/bash

# 🎤 Conversa AI - Quick Deployment Setup Script
# This script helps you deploy your Voice AI platform

echo "🎤 CONVERSA AI - DEPLOYMENT SETUP"
echo "================================="
echo ""

# Check if we're in the right directory
if [ ! -f "backend/main.py" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Expected files: backend/main.py and frontend/package.json"
    exit 1
fi

echo "✅ Project structure verified"
echo ""

# Step 1: Supabase Setup
echo "📊 STEP 1: SUPABASE DATABASE SETUP"
echo "=================================="
echo ""
echo "1. Go to: https://supabase.com"
echo "2. Click 'Start your project' → 'New project'"
echo "3. Project name: conversa-ai-db"
echo "4. Choose region and generate password"
echo "5. Click 'Create new project'"
echo ""
echo "📋 After creating project:"
echo "   • Go to Settings → Database"
echo "   • Copy the connection string (URI)"
echo "   • It looks like: postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"
echo ""
read -p "Press Enter when you have your Supabase connection string..."

# Step 2: Railway Setup
echo ""
echo "🚂 STEP 2: RAILWAY BACKEND DEPLOYMENT"
echo "====================================="
echo ""
echo "1. Install Railway CLI:"
echo "   npm install -g @railway/cli"
echo ""
echo "2. Login to Railway:"
echo "   railway login"
echo ""
echo "3. Deploy backend:"
echo "   cd backend"
echo "   railway init"
echo "   railway up"
echo ""
echo "📋 Environment variables to add in Railway:"
echo "   DATABASE_URL=your_supabase_connection_string"
echo "   GOOGLE_API_KEY=your_google_api_key"
echo "   ENVIRONMENT=production"
echo ""
read -p "Press Enter when Railway deployment is complete..."

# Step 3: Vercel Setup
echo ""
echo "⚡ STEP 3: VERCEL FRONTEND DEPLOYMENT"
echo "===================================="
echo ""
echo "1. Install Vercel CLI:"
echo "   npm install -g vercel"
echo ""
echo "2. Deploy frontend:"
echo "   cd frontend"
echo "   vercel"
echo ""
echo "📋 Environment variables to add in Vercel:"
echo "   NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app"
echo ""
read -p "Press Enter when Vercel deployment is complete..."

# Step 4: Final Configuration
echo ""
echo "🔧 STEP 4: FINAL CONFIGURATION"
echo "============================="
echo ""
echo "1. Update CORS in Railway backend:"
echo "   Add your Vercel URL to allowed origins"
echo ""
echo "2. Test your deployment:"
echo "   • Frontend: https://your-app.vercel.app"
echo "   • Backend: https://your-app.railway.app/api/health"
echo "   • Database: Check Supabase dashboard"
echo ""

# Create environment file template
echo "📝 Creating environment file template..."
cat > .env.production << 'EOF'
# Production Environment Variables
# Copy these to your deployment platforms

# Database (Supabase)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres

# Google AI API
GOOGLE_API_KEY=your_google_api_key_here

# Environment
ENVIRONMENT=production

# Frontend API URL (Railway backend)
NEXT_PUBLIC_API_URL=https://your-app-name.railway.app
EOF

echo "✅ Created .env.production template"
echo ""

# Final summary
echo "🎉 DEPLOYMENT SETUP COMPLETE!"
echo "============================="
echo ""
echo "📋 Next Steps:"
echo "1. Set up Supabase database ✅"
echo "2. Deploy backend to Railway ✅"
echo "3. Deploy frontend to Vercel ✅"
echo "4. Configure environment variables ✅"
echo "5. Test your live application ✅"
echo ""
echo "🌐 Your Voice AI Platform will be live at:"
echo "   Frontend: https://your-app.vercel.app"
echo "   Backend: https://your-app.railway.app"
echo ""
echo "📚 For detailed instructions, see: DEPLOYMENT_COMPLETE.md"
echo ""
echo "🎤 Happy deploying! Your Voice AI platform is ready for the world!"
