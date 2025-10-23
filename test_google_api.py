#!/usr/bin/env python3
"""
🎤 Voice AI Agents - Google API Test
Test script to verify Google Gemini API integration
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.append(str(backend_path))

def test_google_api():
    """Test Google Gemini API connection"""
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        
        # Set API key
        api_key = "AIzaSyAwmdLH5t56tH7oy5P_4BGgYNdwshlN-lU"
        
        # Initialize model
        model = ChatGoogleGenerativeAI(
            model="gemini-pro",
            temperature=0.7,
            google_api_key=api_key
        )
        
        # Test message
        test_message = "Hello! Can you help me create a voice AI agent?"
        
        print("🎤 Testing Google Gemini API...")
        print(f"📝 Test message: {test_message}")
        print("⏳ Generating response...")
        
        # Generate response
        response = model.invoke(test_message)
        
        print("✅ SUCCESS!")
        print(f"🤖 AI Response: {response.content}")
        print("")
        print("🎯 Your Google API key is working perfectly!")
        print("🚀 Ready to deploy Voice AI agents!")
        
        return True
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        print("🔧 Please check your Google API key and try again")
        return False

if __name__ == "__main__":
    print("🎤 VOICE AI AGENTS - API TEST")
    print("=============================")
    print("")
    
    success = test_google_api()
    
    if success:
        print("")
        print("🎉 NEXT STEPS:")
        print("1. Deploy backend to Railway with GOOGLE_API_KEY")
        print("2. Deploy frontend to Vercel")
        print("3. Set up Supabase database")
        print("4. Your Voice AI agents will be live!")
    else:
        print("")
        print("🔧 TROUBLESHOOTING:")
        print("1. Verify API key is correct")
        print("2. Check Google Cloud Console permissions")
        print("3. Ensure Gemini API is enabled")
