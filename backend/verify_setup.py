#!/usr/bin/env python3
"""
Verification script to check if the Voice AI Platform backend is properly configured.

Run this script to verify:
- Environment variables are set
- Database is accessible
- API endpoints are working
- Google Gemini API key is valid
"""

import os
import sys
from pathlib import Path

def check_environment():
    """Check if environment variables are properly set."""
    print("🔍 Checking environment variables...")
    
    required_vars = ["GOOGLE_API_KEY"]
    optional_vars = ["DATABASE_URL", "ENVIRONMENT"]
    
    missing = []
    for var in required_vars:
        if not os.getenv(var):
            missing.append(var)
            print(f"  ❌ {var} is not set")
        else:
            # Mask the API key for security
            value = os.getenv(var)
            masked = f"{value[:8]}...{value[-4:]}" if len(value) > 12 else "***"
            print(f"  ✅ {var} = {masked}")
    
    for var in optional_vars:
        value = os.getenv(var, "Not set (using default)")
        print(f"  ℹ️  {var} = {value}")
    
    if missing:
        print(f"\n❌ Missing required environment variables: {', '.join(missing)}")
        print("💡 Tip: Create a .env file in the backend directory with your configuration")
        return False
    
    print("✅ Environment variables OK\n")
    return True


def check_database():
    """Check if database is accessible."""
    print("🔍 Checking database connection...")
    
    try:
        from models.database import engine, Base, SessionLocal
        from sqlalchemy import text
        
        # Try to connect
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("  ✅ Database connection successful")
        
        # Check if tables exist
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        expected_tables = ["agents", "conversations", "messages", "actions"]
        missing_tables = [t for t in expected_tables if t not in tables]
        
        if missing_tables:
            print(f"  ⚠️  Some tables are missing: {', '.join(missing_tables)}")
            print("  💡 Tip: Run 'python -c \"from models.database import init_db; init_db()\"'")
            return False
        else:
            print(f"  ✅ All required tables exist: {', '.join(tables)}")
        
        # Check for sample data
        db = SessionLocal()
        try:
            from models.database import Agent
            agent_count = db.query(Agent).count()
            print(f"  ℹ️  Found {agent_count} agent(s) in database")
        finally:
            db.close()
        
        print("✅ Database OK\n")
        return True
        
    except Exception as e:
        print(f"  ❌ Database error: {e}")
        print("  💡 Tip: Check your DATABASE_URL in .env file")
        return False


def check_google_api():
    """Check if Google Gemini API key is valid."""
    print("🔍 Checking Google Gemini API...")
    
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.3,
            max_output_tokens=50,
            convert_system_message_to_human=True
        )
        
        # Try a simple test
        response = llm.invoke("Say 'OK' if you can hear me.")
        print("  ✅ Google Gemini API key is valid")
        print(f"  ℹ️  Test response: {response.content[:50]}...")
        print("✅ Google Gemini API OK\n")
        return True
        
    except Exception as e:
        print(f"  ❌ Google Gemini API error: {e}")
        print("  💡 Tip: Check your GOOGLE_API_KEY in .env file")
        print("  💡 Get an API key at: https://makersuite.google.com/app/apikey")
        return False


def check_dependencies():
    """Check if all required dependencies are installed."""
    print("🔍 Checking dependencies...")
    
    required_packages = [
        "fastapi",
        "uvicorn",
        "sqlalchemy",
        "pydantic",
        "langchain",
        "langchain_google_genai",
        "langgraph",
        "python-dotenv"
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"  ✅ {package}")
        except ImportError:
            missing.append(package)
            print(f"  ❌ {package} is not installed")
    
    if missing:
        print(f"\n❌ Missing packages: {', '.join(missing)}")
        print("💡 Tip: Run 'pip install -r requirements.txt'")
        return False
    
    print("✅ All dependencies installed\n")
    return True


def check_api_server():
    """Check if the API server can start."""
    print("🔍 Checking API server...")
    
    try:
        from main import app
        print("  ✅ FastAPI app loads successfully")
        print("  ℹ️  API documentation will be available at: http://localhost:8000/docs")
        print("  ℹ️  Start server with: uvicorn main:app --reload")
        print("✅ API server OK\n")
        return True
    except Exception as e:
        print(f"  ❌ API server error: {e}")
        return False


def main():
    """Run all verification checks."""
    print("=" * 60)
    print("🎙️  Voice AI Platform - Setup Verification")
    print("=" * 60)
    print()
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    checks = [
        ("Dependencies", check_dependencies),
        ("Environment", check_environment),
        ("Database", check_database),
        ("Google Gemini API", check_google_api),
        ("API Server", check_api_server),
    ]
    
    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"❌ {name} check failed with error: {e}\n")
            results.append((name, False))
    
    # Summary
    print("=" * 60)
    print("📊 Verification Summary")
    print("=" * 60)
    
    all_passed = True
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} - {name}")
        if not result:
            all_passed = False
    
    print("=" * 60)
    
    if all_passed:
        print("\n🎉 All checks passed! Your Voice AI Platform is ready to use.")
        print("\n📝 Next steps:")
        print("  1. Start the backend: uvicorn main:app --reload")
        print("  2. Open API docs: http://localhost:8000/docs")
        print("  3. Start the frontend: cd ../frontend && npm run dev")
        print("  4. Open dashboard: http://localhost:3000")
        return 0
    else:
        print("\n⚠️  Some checks failed. Please fix the issues above and run this script again.")
        print("\n💡 Common solutions:")
        print("  - Missing .env file: cp ../env.example .env")
        print("  - Missing packages: pip install -r requirements.txt")
        print("  - Database not initialized: python -c 'from models.database import init_db; init_db()'")
        return 1


if __name__ == "__main__":
    sys.exit(main())

