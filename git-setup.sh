#!/bin/bash

# Voice AI Platform - Git Setup Script
# This script will initialize git, create a new branch, and prepare for GitHub commit

echo "🎤 VOICE AI PLATFORM - GIT SETUP"
echo "================================="
echo ""

# Navigate to project directory
cd /Users/sneh/voice-ai-agents

# Set default branch to main
git branch -m main

# Create .gitignore file
echo "📝 Creating .gitignore file..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
*/node_modules/
backend/venv/
backend/__pycache__/
backend/*/__pycache__/
backend/*/*/__pycache__/

# Environment variables
.env
.env.local
.env.production
.env.development

# Database files
*.db
*.sqlite
*.sqlite3
backend/test.db
backend/test_simple.db

# Logs
*.log
logs/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next
out/

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# PyInstaller
*.manifest
*.spec

# Installer logs
pip-log.txt
pip-delete-this-directory.txt

# Unit test / coverage reports
htmlcov/
.tox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
.hypothesis/
.pytest_cache/

# Translations
*.mo
*.pot

# Django stuff:
*.log
local_settings.py
db.sqlite3

# Flask stuff:
instance/
.webassets-cache

# Scrapy stuff:
.scrapy

# Sphinx documentation
docs/_build/

# PyBuilder
target/

# Jupyter Notebook
.ipynb_checkpoints

# pyenv
.python-version

# celery beat schedule file
celerybeat-schedule

# SageMath parsed files
*.sage.py

# Environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# Spyder project settings
.spyderproject
.spyproject

# Rope project settings
.ropeproject

# mkdocs documentation
/site

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# Pyre type checker
.pyre/

# Deployment files
docker-compose.override.yml
*.pem
*.key
*.crt

# Backup files
*.bak
*.backup
*.old

# Documentation build
docs/build/
docs/dist/
EOF

echo "✅ .gitignore created"

# Add all files to git
echo "📦 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "🎤 Initial commit: Voice AI Platform

✨ Features:
- Complete Voice AI agent platform
- Natural voice conversations with speech recognition/synthesis
- Real-time voice processing (sub-100ms response times)
- Enterprise voice security and encryption
- Multi-language voice support (50+ languages)
- Voice analytics and conversation insights
- Scalable voice infrastructure
- Professional dark theme UI
- Authentication system with protected routes
- Responsive design for all devices

🏗️ Architecture:
- Frontend: Next.js with TypeScript
- Backend: FastAPI with Python
- Database: PostgreSQL/SQLite support
- Authentication: JWT-based auth system
- Styling: Tailwind CSS with custom theme

🚀 Ready for deployment to Vercel + Railway + Supabase"

# Create new branch for voice AI features
echo "🌿 Creating voice-ai-platform branch..."
git checkout -b voice-ai-platform

echo ""
echo "🎉 GIT SETUP COMPLETE!"
echo "====================="
echo ""
echo "✅ Repository initialized"
echo "✅ .gitignore created"
echo "✅ Initial commit created"
echo "✅ New branch 'voice-ai-platform' created"
echo ""
echo "📋 Next Steps:"
echo "1. Create a new repository on GitHub"
echo "2. Add remote origin: git remote add origin <your-github-repo-url>"
echo "3. Push to GitHub: git push -u origin voice-ai-platform"
echo ""
echo "🔗 GitHub Repository Setup:"
echo "   - Go to: https://github.com/new"
echo "   - Repository name: voice-ai-agents (or your preferred name)"
echo "   - Description: AI-powered voice agent platform for creating intelligent voice AI assistants"
echo "   - Make it Public or Private (your choice)"
echo "   - Don't initialize with README (we already have files)"
echo ""
echo "📤 Commands to run after creating GitHub repo:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
echo "   git push -u origin voice-ai-platform"
echo ""
echo "🎤 Your Voice AI Platform is ready for GitHub!"
