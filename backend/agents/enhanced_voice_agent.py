import os
import json
import asyncio
from typing import Dict, Any, List, Optional
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
import google.generativeai as genai
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate

class VoiceAgent:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.llm_provider = config.get('llm_provider', 'openai')
        self.model_name = config.get('model_name', 'gpt-4o')
        self.temperature = config.get('temperature', 0.7)
        self.max_tokens = config.get('max_tokens', 1000)
        self.conversation_history = []
        self.setup_llm()
    
    def setup_llm(self):
        """Initialize LLM based on provider"""
        try:
            if self.llm_provider == 'openai':
                self.llm = ChatOpenAI(
                    model=self.model_name,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                    api_key=os.getenv('OPENAI_API_KEY')
                )
            elif self.llm_provider == 'anthropic':
                self.llm = ChatAnthropic(
                    model=self.model_name,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                    api_key=os.getenv('ANTHROPIC_API_KEY')
                )
            elif self.llm_provider == 'google':
                self.llm = ChatGoogleGenerativeAI(
                    model=self.model_name,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                    google_api_key=os.getenv('GOOGLE_API_KEY', 'AIzaSyAwmdLH5t56tH7oy5P_4BGgYNdwshlN-lU')
                )
            else:
                raise ValueError(f"Unsupported LLM provider: {self.llm_provider}")
                
        except Exception as e:
            print(f"Error setting up LLM: {e}")
            # Fallback to OpenAI
            self.llm = ChatOpenAI(
                model="gpt-4o-mini",
                temperature=0.7,
                api_key=os.getenv('OPENAI_API_KEY')
            )
    
    async def generate_response(self, message: str, context: Dict[str, Any] = None) -> str:
        """Generate AI response using configured LLM"""
        try:
            # Build conversation context
            messages = self.build_conversation_context(message, context or {})
            
            # Generate response
            response = await self.llm.ainvoke(messages)
            
            # Add to conversation history
            self.conversation_history.append({
                'role': 'user',
                'content': message,
                'timestamp': self._get_timestamp()
            })
            self.conversation_history.append({
                'role': 'assistant',
                'content': response.content,
                'timestamp': self._get_timestamp()
            })
            
            # Keep only last 10 messages to manage context length
            if len(self.conversation_history) > 10:
                self.conversation_history = self.conversation_history[-10:]
            
            return response.content
            
        except Exception as e:
            error_msg = f"I apologize, but I'm experiencing technical difficulties. Please try again."
            print(f"LLM Error: {e}")
            return error_msg
    
    def build_conversation_context(self, message: str, context: Dict[str, Any]) -> List:
        """Build context-aware conversation for the LLM"""
        messages = []
        
        # System message with agent personality
        system_prompt = self.build_system_prompt(context)
        messages.append(SystemMessage(content=system_prompt))
        
        # Add recent conversation history
        for msg in self.conversation_history[-6:]:  # Last 6 messages
            if msg['role'] == 'user':
                messages.append(HumanMessage(content=msg['content']))
            else:
                messages.append(AIMessage(content=msg['content']))
        
        # Add current user message
        messages.append(HumanMessage(content=message))
        
        return messages
    
    def build_system_prompt(self, context: Dict[str, Any]) -> str:
        """Build system prompt with agent configuration"""
        agent_config = self.config
        
        prompt = f"""You are {agent_config.get('name', 'AI Assistant')}, a {agent_config.get('role', 'helpful assistant')} at {agent_config.get('company', 'our company')}.

PERSONALITY & BEHAVIOR:
- Personality: {agent_config.get('personality', 'Professional and helpful')}
- Communication Style: {agent_config.get('communication_style', 'Friendly and professional')}
- Expertise: {agent_config.get('knowledge_base', 'General knowledge')}
- Industry: {agent_config.get('industry', 'Technology')}

VOICE AI CAPABILITIES:
- You are a voice AI agent, so respond as if speaking naturally
- Keep responses conversational and easy to understand when spoken aloud
- Use natural pauses and flow in your language
- Avoid complex formatting that doesn't work well with text-to-speech

CONTEXT INFORMATION:
- User Info: {context.get('user_info', {})}
- Session Data: {context.get('session_data', {})}
- Available Tools: {agent_config.get('available_tools', [])}

INSTRUCTIONS:
1. Respond naturally and conversationally as if speaking
2. Stay in character as {agent_config.get('name')}
3. Use your knowledge base to provide accurate information
4. Be helpful, professional, and engaging
5. Keep responses concise but informative (under 200 words)
6. Use natural language that sounds good when spoken aloud
7. If you don't know something, say so honestly

Remember: You are having a voice conversation, so speak naturally!"""
        
        return prompt
    
    def get_conversation_summary(self) -> Dict[str, Any]:
        """Get summary of current conversation"""
        return {
            'message_count': len(self.conversation_history),
            'agent_name': self.config.get('name', 'AI Assistant'),
            'llm_provider': self.llm_provider,
            'model_name': self.model_name,
            'last_message_time': self.conversation_history[-1]['timestamp'] if self.conversation_history else None
        }
    
    def reset_conversation(self):
        """Reset conversation history"""
        self.conversation_history = []
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def update_config(self, new_config: Dict[str, Any]):
        """Update agent configuration"""
        self.config.update(new_config)
        # Reinitialize LLM if provider changed
        if new_config.get('llm_provider') != self.llm_provider:
            self.llm_provider = new_config.get('llm_provider', self.llm_provider)
            self.setup_llm()

# Factory function to create voice agents
def create_voice_agent(config: Dict[str, Any]) -> VoiceAgent:
    """Create a new voice agent instance"""
    return VoiceAgent(config)

# Example configurations for different use cases
EXAMPLE_CONFIGS = {
    'customer_support': {
        'name': 'Sarah',
        'role': 'Customer Support Specialist',
        'company': 'TechCorp',
        'industry': 'Technology',
        'personality': 'Patient, empathetic, and solution-focused',
        'knowledge_base': 'Product support, troubleshooting, billing inquiries',
        'llm_provider': 'openai',
        'model_name': 'gpt-4o',
        'temperature': 0.3,
        'available_tools': ['ticket_creation', 'knowledge_base_search', 'escalation']
    },
    'sales_assistant': {
        'name': 'Alex',
        'role': 'Sales Consultant',
        'company': 'SalesPro',
        'industry': 'Sales',
        'personality': 'Enthusiastic, persuasive, and knowledgeable',
        'knowledge_base': 'Product features, pricing, competitive analysis',
        'llm_provider': 'anthropic',
        'model_name': 'claude-3-5-sonnet-20241022',
        'temperature': 0.7,
        'available_tools': ['quote_generation', 'demo_scheduling', 'proposal_creation']
    },
    'technical_expert': {
        'name': 'Dr. Chen',
        'role': 'Technical Expert',
        'company': 'InnovateLab',
        'industry': 'Research & Development',
        'personality': 'Analytical, precise, and educational',
        'knowledge_base': 'Advanced technical concepts, research methodologies',
        'llm_provider': 'google',
        'model_name': 'gemini-pro',
        'temperature': 0.2,
        'available_tools': ['code_analysis', 'documentation_search', 'experiment_design']
    }
}
