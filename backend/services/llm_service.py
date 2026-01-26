"""
LLM Abstraction Layer
Supports multiple LLM providers with fallback mechanism
Uses direct API calls to avoid dependency conflicts
"""

import os
import logging
import httpx
from typing import List, Optional, Any, Dict
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class LLMService(ABC):
    """Abstract base class for LLM services"""
    
    @abstractmethod
    def invoke(self, messages: List[Dict[str, str]]) -> str:
        """Invoke the LLM with messages and return text response"""
        pass


class GroqLLM(LLMService):
    """Groq LLM implementation using direct API calls - Free, fast, high quality"""
    
    def __init__(self, model: str = "llama-3.3-70b-versatile", temperature: float = 0.7, max_tokens: int = 500):
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens  # Increased default for better responses
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        logger.info(f"Groq LLM initialized with model: {model}, max_tokens: {max_tokens}")
    
    def invoke(self, messages: List[Dict[str, str]]) -> str:
        """Invoke Groq LLM using direct HTTP API call"""
        try:
            # Convert messages to OpenAI format if needed
            formatted_messages = []
            for msg in messages:
                if isinstance(msg, dict):
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    formatted_messages.append({"role": role, "content": content})
                else:
                    # Handle LangChain message objects
                    if hasattr(msg, 'type'):
                        role_map = {"human": "user", "ai": "assistant", "system": "system"}
                        role = role_map.get(msg.type, "user")
                    elif hasattr(msg, 'role'):
                        role = msg.role
                    else:
                        role = "user"
                    content = msg.content if hasattr(msg, 'content') else str(msg)
                    formatted_messages.append({"role": role, "content": content})
            
            logger.info(f"Sending {len(formatted_messages)} messages to Groq API")
            
            import time
            start_time = time.time()
            
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": formatted_messages,
                        "temperature": self.temperature,
                        "max_tokens": self.max_tokens,
                        "stream": False
                    }
                )
                
                elapsed = time.time() - start_time
                
                if response.status_code != 200:
                    logger.error(f"Groq API error: {response.status_code} - {response.text}")
                    raise Exception(f"Groq API error: {response.status_code}")
                
                data = response.json()
                result = data["choices"][0]["message"]["content"]
                logger.info(f"✅ Groq response received in {elapsed:.2f}s: {result[:50]}...")
                return result
                
        except Exception as e:
            logger.error(f"Groq LLM invocation error: {e}")
            raise


class GeminiLLM(LLMService):
    """Google Gemini LLM implementation using LangChain (fallback)"""
    
    def __init__(self, model: str = "gemini-2.0-flash", temperature: float = 0.7, max_tokens: int = 300):
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            
            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key or api_key == "your_google_api_key_here":
                raise ValueError("GOOGLE_API_KEY not configured")
            
            self.llm = ChatGoogleGenerativeAI(
                model=model,
                google_api_key=api_key,
                temperature=temperature,
                max_output_tokens=max_tokens,
                convert_system_message_to_human=True
            )
            self.model = model
            logger.info(f"Gemini LLM initialized with model: {model}")
        except ImportError:
            raise ImportError("langchain-google-genai not installed")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini LLM: {e}")
            raise
    
    def invoke(self, messages: List[Dict[str, str]]) -> str:
        """Invoke Gemini LLM"""
        try:
            from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
            
            # Convert dict messages to LangChain messages
            langchain_messages = []
            for msg in messages:
                if isinstance(msg, dict):
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    if role == "system":
                        langchain_messages.append(SystemMessage(content=content))
                    elif role == "assistant":
                        langchain_messages.append(AIMessage(content=content))
                    else:
                        langchain_messages.append(HumanMessage(content=content))
                else:
                    langchain_messages.append(msg)
            
            response = self.llm.invoke(langchain_messages)
            return response.content
        except Exception as e:
            logger.error(f"Gemini LLM invocation error: {e}")
            raise


class OpenAILLM(LLMService):
    """OpenAI LLM implementation using direct API calls (fallback)"""
    
    def __init__(self, model: str = "gpt-4o-mini", temperature: float = 0.7, max_tokens: int = 300):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key or self.api_key == "your_openai_api_key_here":
            raise ValueError("OPENAI_API_KEY not configured")
        
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.api_url = "https://api.openai.com/v1/chat/completions"
        logger.info(f"OpenAI LLM initialized with model: {model}")
    
    def invoke(self, messages: List[Dict[str, str]]) -> str:
        """Invoke OpenAI LLM using direct HTTP API call"""
        try:
            formatted_messages = []
            for msg in messages:
                if isinstance(msg, dict):
                    formatted_messages.append(msg)
                else:
                    if hasattr(msg, 'type'):
                        role_map = {"human": "user", "ai": "assistant", "system": "system"}
                        role = role_map.get(msg.type, "user")
                    else:
                        role = "user"
                    content = msg.content if hasattr(msg, 'content') else str(msg)
                    formatted_messages.append({"role": role, "content": content})
            
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": formatted_messages,
                        "temperature": self.temperature,
                        "max_tokens": self.max_tokens
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
                    raise Exception(f"OpenAI API error: {response.status_code}")
                
                data = response.json()
                return data["choices"][0]["message"]["content"]
                
        except Exception as e:
            logger.error(f"OpenAI LLM invocation error: {e}")
            raise


def get_llm_service(
    provider: str = "groq",
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 500
) -> LLMService:
    """
    Factory function to get LLM service with fallback
    
    Priority: Groq -> Gemini -> OpenAI
    """
    providers = {
        "groq": {
            "class": GroqLLM,
            "default_model": "llama-3.3-70b-versatile",
            "fallback": ["gemini", "openai"]
        },
        "gemini": {
            "class": GeminiLLM,
            "default_model": "gemini-2.0-flash",
            "fallback": ["openai"]
        },
        "openai": {
            "class": OpenAILLM,
            "default_model": "gpt-4o-mini",
            "fallback": []
        }
    }
    
    # Determine provider from env or use default
    preferred_provider = os.getenv("LLM_PROVIDER", provider).lower()
    
    # Try preferred provider first
    if preferred_provider in providers:
        try:
            provider_config = providers[preferred_provider]
            model_name = model or provider_config["default_model"]
            return provider_config["class"](model=model_name, temperature=temperature, max_tokens=max_tokens)
        except Exception as e:
            logger.warning(f"Failed to initialize {preferred_provider}: {e}")
            # Try fallback providers
            for fallback in provider_config.get("fallback", []):
                try:
                    fallback_config = providers[fallback]
                    model_name = model or fallback_config["default_model"]
                    logger.info(f"Falling back to {fallback}")
                    return fallback_config["class"](model=model_name, temperature=temperature, max_tokens=max_tokens)
                except Exception as fallback_error:
                    logger.warning(f"Fallback {fallback} also failed: {fallback_error}")
                    continue
    
    # If all fail, raise error
    raise RuntimeError(
        "No LLM provider available. Please set GROQ_API_KEY, GOOGLE_API_KEY, or OPENAI_API_KEY"
    )
