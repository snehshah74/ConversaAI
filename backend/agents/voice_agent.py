"""
Voice AI Agent using LangGraph with Google Gemini
Production-ready agentic system for voice interactions
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional, TypedDict, Annotated
from datetime import datetime
import re

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AgentState(TypedDict):
    """State for the Voice Agent graph"""
    user_message: str
    intent: str
    planned_actions: List[str]
    tool_results: List[Dict[str, Any]]
    response: str
    conversation_history: Annotated[List[Any], add_messages]
    entities: Dict[str, Any]
    actions_taken: List[str]
    next_step: str


class VoiceAgentResponse(BaseModel):
    """Structured response from the voice agent"""
    text: str = Field(..., description="Response text for voice output")
    actions_taken: List[str] = Field(default_factory=list, description="Actions performed")
    next_step: str = Field(..., description="Suggested next step")
    entities: Dict[str, Any] = Field(default_factory=dict, description="Extracted entities")
    confidence: float = Field(default=0.0, description="Confidence score")


# Available Tools for the Agent
@tool
def lookup_order(order_number: str) -> Dict[str, Any]:
    """Look up order information by order number"""
    try:
        # Simulate order lookup - replace with actual API call
        logger.info(f"Looking up order: {order_number}")
        return {
            "order_number": order_number,
            "status": "shipped",
            "estimated_delivery": "2024-01-15",
            "items": ["Product A", "Product B"],
            "total": "$99.99"
        }
    except Exception as e:
        logger.error(f"Error looking up order {order_number}: {e}")
        return {"error": f"Could not find order {order_number}"}


@tool
def schedule_appointment(customer_name: str, date: str, time: str, service: str) -> Dict[str, Any]:
    """Schedule an appointment for a customer"""
    try:
        logger.info(f"Scheduling appointment for {customer_name} on {date} at {time} for {service}")
        # Simulate appointment scheduling
        return {
            "appointment_id": f"APT-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "customer_name": customer_name,
            "date": date,
            "time": time,
            "service": service,
            "status": "confirmed"
        }
    except Exception as e:
        logger.error(f"Error scheduling appointment: {e}")
        return {"error": "Could not schedule appointment"}


@tool
def send_email(recipient: str, subject: str, body: str) -> Dict[str, Any]:
    """Send an email to a customer"""
    try:
        logger.info(f"Sending email to {recipient} with subject: {subject}")
        # Simulate email sending
        return {
            "message_id": f"MSG-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "recipient": recipient,
            "subject": subject,
            "status": "sent"
        }
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return {"error": "Could not send email"}


@tool
def create_ticket(customer_name: str, issue_description: str, priority: str = "medium") -> Dict[str, Any]:
    """Create a support ticket for a customer issue"""
    try:
        logger.info(f"Creating ticket for {customer_name}: {issue_description}")
        # Simulate ticket creation
        return {
            "ticket_id": f"TKT-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "customer_name": customer_name,
            "issue": issue_description,
            "priority": priority,
            "status": "open",
            "assigned_to": "Support Team"
        }
    except Exception as e:
        logger.error(f"Error creating ticket: {e}")
        return {"error": "Could not create ticket"}


@tool
def transfer_to_human(reason: str) -> Dict[str, Any]:
    """Transfer the conversation to a human agent"""
    try:
        logger.info(f"Transferring to human agent. Reason: {reason}")
        return {
            "transfer_id": f"TRF-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "reason": reason,
            "status": "transferring",
            "estimated_wait": "2-3 minutes"
        }
    except Exception as e:
        logger.error(f"Error transferring to human: {e}")
        return {"error": "Could not initiate transfer"}


class VoiceAgent:
    """Production-ready Voice AI Agent using LangGraph"""
    
    def __init__(self, agent_config: Dict[str, Any]):
        """Initialize the Voice Agent with configuration"""
        self.config = agent_config
        self.llm = self._initialize_llm()
        self.tools = [lookup_order, schedule_appointment, send_email, create_ticket, transfer_to_human]
        self.tool_node = ToolNode(self.tools)
        self.graph = self._build_graph()
        
        logger.info(f"VoiceAgent initialized with config: {agent_config.get('name', 'Unknown')}")
    
    def _initialize_llm(self) -> ChatGoogleGenerativeAI:
        """Initialize Google Gemini LLM"""
        try:
            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                raise ValueError("GOOGLE_API_KEY environment variable is required")
            
            return ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                google_api_key=api_key,
                temperature=0.3,  # Lower temperature for more consistent responses
                max_output_tokens=150,  # Keep responses short for voice
                convert_system_message_to_human=True
            )
        except Exception as e:
            logger.error(f"Failed to initialize Gemini LLM: {e}")
            raise
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow"""
        try:
            workflow = StateGraph(AgentState)
            
            # Add nodes
            workflow.add_node("understand_intent", self._understand_intent)
            workflow.add_node("plan_actions", self._plan_actions)
            workflow.add_node("execute_tools", self.tool_node)
            workflow.add_node("generate_response", self._generate_response)
            
            # Define the flow
            workflow.set_entry_point("understand_intent")
            workflow.add_edge("understand_intent", "plan_actions")
            workflow.add_edge("plan_actions", "execute_tools")
            workflow.add_edge("execute_tools", "generate_response")
            workflow.add_edge("generate_response", END)
            
            return workflow.compile()
        except Exception as e:
            logger.error(f"Failed to build graph: {e}")
            raise
    
    def _understand_intent(self, state: AgentState) -> AgentState:
        """Understand user intent and extract entities"""
        try:
            user_message = state["user_message"]
            
            # Extract entities using regex patterns
            entities = self._extract_entities(user_message)
            
            # Create system prompt for intent understanding
            system_prompt = f"""
            You are a voice AI assistant for {self.config.get('company', 'our company')}.
            Your role is {self.config.get('role', 'customer support')}.
            Your personality: {self.config.get('personality', 'helpful and professional')}.
            
            Analyze the user's message and determine their intent.
            Respond with ONLY a single word intent from these options:
            - order_inquiry: Questions about orders, shipping, delivery
            - appointment: Scheduling, booking, rescheduling
            - support: Technical issues, problems, complaints
            - information: General questions, product info
            - transfer: Request to speak with human
            
            Keep it concise for voice interaction.
            """
            
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_message)
            ]
            
            response = self.llm.invoke(messages)
            intent = response.content.strip().lower()
            
            logger.info(f"Intent identified: {intent}")
            
            return {
                **state,
                "intent": intent,
                "entities": entities
            }
            
        except Exception as e:
            logger.error(f"Error in understand_intent: {e}")
            return {
                **state,
                "intent": "support",
                "entities": {}
            }
    
    def _plan_actions(self, state: AgentState) -> AgentState:
        """Plan actions based on intent"""
        try:
            intent = state["intent"]
            entities = state["entities"]
            user_message = state["user_message"]
            
            # Define action plans based on intent
            action_plans = {
                "order_inquiry": ["lookup_order"] if entities.get("order_number") else [],
                "appointment": ["schedule_appointment"] if any(key in entities for key in ["date", "time", "service"]) else [],
                "support": ["create_ticket"],
                "information": [],
                "transfer": ["transfer_to_human"]
            }
            
            planned_actions = action_plans.get(intent, [])
            
            # If no specific actions, try to determine from context
            if not planned_actions and intent == "order_inquiry":
                if "order" in user_message.lower():
                    planned_actions = ["lookup_order"]
            
            # Convert to tool format for LangGraph
            tool_calls = []
            for action in planned_actions:
                tool_calls.append({
                    "name": action,
                    "args": entities if entities else {}
                })
            
            logger.info(f"Planned actions: {planned_actions}")
            
            return {
                **state,
                "planned_actions": planned_actions,
                "messages": [{"role": "user", "content": f"Execute tools: {tool_calls}"}]
            }
            
        except Exception as e:
            logger.error(f"Error in plan_actions: {e}")
            return {
                **state,
                "planned_actions": [],
                "messages": []
            }
    
    def _generate_response(self, state: AgentState) -> AgentState:
        """Generate the final voice response"""
        try:
            user_message = state["user_message"]
            intent = state["intent"]
            tool_results = state.get("tool_results", [])
            planned_actions = state.get("planned_actions", [])
            entities = state.get("entities", {})
            
            # Build context for response generation
            context = f"""
            User message: {user_message}
            Intent: {intent}
            Actions planned: {planned_actions}
            Tool results: {tool_results}
            Entities: {entities}
            
            Agent context:
            - Company: {self.config.get('company', 'our company')}
            - Role: {self.config.get('role', 'customer support')}
            - Knowledge: {self.config.get('knowledge_base', 'general customer service')}
            - Greeting style: {self.config.get('greeting', 'Hello! How can I help you?')}
            """
            
            system_prompt = f"""
            You are a voice AI assistant. Generate a SHORT response (1-3 sentences) for voice output.
            
            Guidelines:
            - Keep responses conversational and natural for voice
            - Maximum 3 sentences
            - Be helpful and friendly
            - If tools were used, mention the key results
            - Suggest clear next steps
            - Use the agent's personality and knowledge
            
            Context: {context}
            
            Generate only the response text, nothing else.
            """
            
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_message)
            ]
            
            response = self.llm.invoke(messages)
            response_text = response.content.strip()
            
            # Determine actions taken and next step
            actions_taken = [action for action in planned_actions if action in [result.get("tool_name", "") for result in tool_results]]
            next_step = self._determine_next_step(intent, actions_taken, tool_results)
            
            logger.info(f"Generated response: {response_text[:100]}...")
            
            return {
                **state,
                "response": response_text,
                "actions_taken": actions_taken,
                "next_step": next_step
            }
            
        except Exception as e:
            logger.error(f"Error in generate_response: {e}")
            return {
                **state,
                "response": "I apologize, but I'm having trouble processing your request. Let me transfer you to a human agent.",
                "actions_taken": [],
                "next_step": "transfer_to_human"
            }
    
    def _extract_entities(self, text: str) -> Dict[str, Any]:
        """Extract entities from user input"""
        entities = {}
        
        # Order number pattern
        order_pattern = r'\b[A-Z0-9]{6,12}\b'
        order_matches = re.findall(order_pattern, text.upper())
        if order_matches:
            entities["order_number"] = order_matches[0]
        
        # Date patterns
        date_patterns = [
            r'\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?\b',
            r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',
            r'\b\d{4}-\d{2}-\d{2}\b'
        ]
        
        for pattern in date_patterns:
            matches = re.findall(pattern, text.lower())
            if matches:
                entities["date"] = matches[0]
                break
        
        # Time patterns
        time_pattern = r'\b\d{1,2}:\d{2}\s*(?:am|pm)?\b'
        time_matches = re.findall(time_pattern, text.lower())
        if time_matches:
            entities["time"] = time_matches[0]
        
        # Email pattern
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_matches = re.findall(email_pattern, text)
        if email_matches:
            entities["email"] = email_matches[0]
        
        # Phone pattern
        phone_pattern = r'\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b'
        phone_matches = re.findall(phone_pattern, text)
        if phone_matches:
            entities["phone"] = f"{phone_matches[0][0]}-{phone_matches[0][1]}-{phone_matches[0][2]}"
        
        # Name pattern (simple - first word that's capitalized)
        name_pattern = r'\b[A-Z][a-z]+\b'
        name_matches = re.findall(name_pattern, text)
        if name_matches and len(name_matches[0]) > 2:
            entities["name"] = name_matches[0]
        
        return entities
    
    def _determine_next_step(self, intent: str, actions_taken: List[str], tool_results: List[Dict]) -> str:
        """Determine the next step based on current state"""
        if "transfer_to_human" in actions_taken:
            return "waiting_for_human_agent"
        elif "schedule_appointment" in actions_taken:
            return "confirm_appointment_details"
        elif "lookup_order" in actions_taken:
            return "provide_order_updates"
        elif "create_ticket" in actions_taken:
            return "monitor_ticket_status"
        elif intent == "information":
            return "provide_additional_info"
        else:
            return "await_user_input"
    
    def process_message(self, user_message: str, conversation_history: List[Any] = None) -> VoiceAgentResponse:
        """Process a user message and return structured response"""
        try:
            if conversation_history is None:
                conversation_history = []
            
            # Prepare initial state
            initial_state = AgentState(
                user_message=user_message,
                intent="",
                planned_actions=[],
                tool_results=[],
                response="",
                conversation_history=conversation_history,
                entities={},
                actions_taken=[],
                next_step=""
            )
            
            # Run the graph
            result = self.graph.invoke(initial_state)
            
            # Extract tool results from the state
            tool_results = result.get("tool_results", [])
            if not tool_results and result.get("planned_actions"):
                # Handle tool results from ToolNode
                for action in result.get("planned_actions", []):
                    if action in [tool.name for tool in self.tools]:
                        tool_results.append({
                            "tool_name": action,
                            "result": "executed"
                        })
            
            # Create structured response
            response = VoiceAgentResponse(
                text=result.get("response", "I'm sorry, I didn't understand that."),
                actions_taken=result.get("actions_taken", []),
                next_step=result.get("next_step", "await_user_input"),
                entities=result.get("entities", {}),
                confidence=0.8  # Default confidence
            )
            
            logger.info(f"Processed message successfully. Response length: {len(response.text)}")
            return response
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return VoiceAgentResponse(
                text="I apologize, but I'm experiencing technical difficulties. Let me transfer you to a human agent.",
                actions_taken=["transfer_to_human"],
                next_step="waiting_for_human_agent",
                entities={},
                confidence=0.0
            )


# Factory function to create voice agents
def create_voice_agent(agent_config: Dict[str, Any]) -> VoiceAgent:
    """Factory function to create a voice agent with proper error handling"""
    try:
        return VoiceAgent(agent_config)
    except Exception as e:
        logger.error(f"Failed to create voice agent: {e}")
        raise ValueError(f"Could not create voice agent: {e}")


# Example usage and testing
if __name__ == "__main__":
    # Test configuration
    test_config = {
        "name": "Customer Support Assistant",
        "company": "TechCorp",
        "role": "Customer Support",
        "personality": "Friendly, helpful, and professional",
        "knowledge_base": "Technical support for software products, troubleshooting, account management",
        "greeting": "Hello! I'm your customer support assistant. How can I help you today?"
    }
    
    try:
        agent = create_voice_agent(test_config)
        
        # Test message
        test_message = "Hi, I need to check the status of my order ORD-123456"
        response = agent.process_message(test_message)
        
        print("Test Response:")
        print(f"Text: {response.text}")
        print(f"Actions: {response.actions_taken}")
        print(f"Next Step: {response.next_step}")
        print(f"Entities: {response.entities}")
        
    except Exception as e:
        print(f"Test failed: {e}")
