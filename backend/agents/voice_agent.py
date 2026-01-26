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

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field
from services.llm_service import get_llm_service
from services.orders_service import get_orders_service

# Optional agentic core import
try:
    from agents.agentic_core import AgenticCore
    AGENTIC_CORE_AVAILABLE = True
except ImportError:
    AGENTIC_CORE_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log agentic core availability after logger is defined
if not AGENTIC_CORE_AVAILABLE:
    logger.warning("Agentic core not available. Install dependencies: pip install sentence-transformers torch")


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
        # Use real orders service (queries Supabase)
        orders_service = get_orders_service()
        result = orders_service.lookup_order(order_number)
        
        if result.get("success"):
            order = result
            logger.info(f"Found order: {order_number}")
            return {
                "order_number": order.get("order_number"),
                "status": order.get("status"),
                "estimated_delivery": order.get("estimated_delivery"),
                "items": [item.get("name", item) if isinstance(item, dict) else item for item in order.get("items", [])],
                "total": f"${order.get('total', 0):.2f}",
                "tracking_number": order.get("tracking_number"),
                "customer_name": order.get("customer_name")
            }
        else:
            logger.warning(f"Order not found: {order_number}")
            return {"error": result.get("error", f"Could not find order {order_number}")}
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
    
    def __init__(self, agent_config: Dict[str, Any], use_agentic_mode: bool = False):
        """Initialize the Voice Agent with configuration
        
        Args:
            agent_config: Agent configuration dictionary
            use_agentic_mode: If True, use advanced agentic core with RAG (default: False for backward compatibility)
        """
        self.config = agent_config
        self.use_agentic_mode = use_agentic_mode and AGENTIC_CORE_AVAILABLE
        self.llm = self._initialize_llm()
        self.tools = [lookup_order, schedule_appointment, send_email, create_ticket, transfer_to_human]
        
        # Initialize agentic core if enabled
        self.agentic_core = None
        if self.use_agentic_mode:
            try:
                agent_id = agent_config.get("id", "default")
                self.agentic_core = AgenticCore(agent_id, agent_config)
                logger.info("Agentic core initialized with RAG support")
            except Exception as e:
                logger.warning(f"Failed to initialize agentic core: {e}. Falling back to standard mode.")
                self.use_agentic_mode = False
        
        # Build standard graph (used if agentic mode is disabled)
        if not self.use_agentic_mode:
            self.graph = self._build_graph()
        
        logger.info(f"VoiceAgent initialized: {agent_config.get('name', 'Unknown')} (Agentic: {self.use_agentic_mode})")
    
    def _initialize_llm(self):
        """Initialize LLM using abstraction layer (Groq -> Gemini -> OpenAI)"""
        try:
            # Use LLM abstraction layer with automatic fallback
            return get_llm_service(
                provider="groq",  # Default to Groq (free, fast)
                temperature=0.3,
                max_tokens=150
            )
        except Exception as e:
            logger.error(f"Failed to initialize LLM: {e}")
            raise
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow"""
        try:
            workflow = StateGraph(AgentState)
            
            # Add nodes
            workflow.add_node("understand_intent", self._understand_intent)
            workflow.add_node("plan_actions", self._plan_actions)
            workflow.add_node("execute_tools", self._execute_tools_manual)
            workflow.add_node("generate_response", self._generate_response)
            
            # Define the flow with conditional edges
            workflow.set_entry_point("understand_intent")
            workflow.add_edge("understand_intent", "plan_actions")
            
            # Conditional: skip tools if no actions planned
            workflow.add_conditional_edges(
                "plan_actions",
                self._should_execute_tools,
                {
                    "execute": "execute_tools",
                    "skip": "generate_response"
                }
            )
            
            workflow.add_edge("execute_tools", "generate_response")
            workflow.add_edge("generate_response", END)
            
            return workflow.compile()
        except Exception as e:
            logger.error(f"Failed to build graph: {e}")
            raise
    
    def _should_execute_tools(self, state: AgentState) -> str:
        """Determine if tools should be executed"""
        planned_actions = state.get("planned_actions", [])
        return "execute" if planned_actions else "skip"
    
    def _execute_tools_manual(self, state: AgentState) -> AgentState:
        """Manually execute tools and collect results"""
        try:
            planned_actions = state.get("planned_actions", [])
            entities = state.get("entities", {})
            tool_results = []
            actions_taken = []
            
            for action_name in planned_actions:
                try:
                    # Find the tool
                    tool_func = next((t for t in self.tools if t.name == action_name), None)
                    if not tool_func:
                        logger.warning(f"Tool {action_name} not found")
                        continue
                    
                    # Prepare arguments based on tool signature
                    import inspect
                    sig = inspect.signature(tool_func.func)
                    tool_args = {}
                    
                    for param_name in sig.parameters:
                        if param_name in entities:
                            tool_args[param_name] = entities[param_name]
                        elif param_name == "reason" and "transfer" in action_name:
                            tool_args[param_name] = "User requested"
                        elif param_name == "customer_name" and "name" in entities:
                            tool_args[param_name] = entities["name"]
                        elif param_name == "issue_description":
                            tool_args[param_name] = state.get("user_message", "")
                    
                    # Execute tool
                    result = tool_func.invoke(tool_args)
                    tool_results.append({
                        "tool_name": action_name,
                        "result": result
                    })
                    actions_taken.append(action_name)
                    logger.info(f"Executed tool {action_name}: {result}")
                    
                except Exception as e:
                    logger.error(f"Error executing tool {action_name}: {e}")
                    tool_results.append({
                        "tool_name": action_name,
                        "result": {"error": str(e)}
                    })
            
            return {
                **state,
                "tool_results": tool_results,
                "actions_taken": actions_taken
            }
        except Exception as e:
            logger.error(f"Error in execute_tools_manual: {e}")
            return {
                **state,
                "tool_results": [],
                "actions_taken": []
            }
    
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
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ]
            
            response = self.llm.invoke(messages)
            intent = response.strip().lower()
            
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
                "planned_actions": planned_actions
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
            
            # Search knowledge base for relevant context
            kb_context = ""
            kb_sources_used = []
            kb_results_found = False
            
            # Check if knowledge_context was already provided from chat endpoint
            if "knowledge_context" in self.config and self.config["knowledge_context"]:
                kb_context = self.config["knowledge_context"]
                kb_results_found = True
                logger.info("✅ Using knowledge context provided from chat endpoint")
            else:
                # Fallback: Search knowledge base ourselves
                try:
                    from services.knowledge_base import KnowledgeBaseService
                    agent_id = str(self.config.get("id", "default"))
                    logger.info(f"🔍 Starting KB search for agent_id: {agent_id} (type: {type(agent_id)})")
                    logger.info(f"🔍 User query: '{user_message}'")
                    
                    kb_service = KnowledgeBaseService(agent_id)
                    
                    # First, let's verify knowledge exists for this agent
                    all_kb = kb_service.get_all_knowledge(limit=10)
                    logger.info(f"📚 Total KB items for agent {agent_id}: {len(all_kb)}")
                    if all_kb:
                        logger.info(f"📚 KB sources: {[kb.get('source', 'Unknown')[:50] for kb in all_kb[:5]]}")
                    else:
                        logger.error(f"❌ NO KNOWLEDGE BASE ITEMS FOUND FOR AGENT {agent_id}")
                        logger.error(f"❌ This means documents were uploaded with a different agent_id or not uploaded at all")
                        logger.error(f"❌ Check: 1) Agent ID when uploading, 2) Database agent_id format, 3) Upload was successful")
                    
                    # Search with very low threshold to get more results - be more inclusive
                    kb_results = kb_service.search(user_message, top_k=15, similarity_threshold=0.2)
                    
                    logger.info(f"🔍 KB Search: Query='{user_message[:50]}', Found {len(kb_results) if kb_results else 0} results")
                    
                    if kb_results and len(kb_results) > 0:
                        # Log all results for debugging
                        top_scores_preview = [(r.get('source', 'Unknown')[:30], round(r.get('similarity', 0), 3)) for r in kb_results[:5]]
                        logger.info(f"📚 All KB results (similarity scores): {top_scores_preview}")
                        
                        # Sort by similarity (highest first)
                        sorted_results = sorted(kb_results, key=lambda x: x.get('similarity', 0), reverse=True)
                        
                        # Extract keywords from user query for better matching
                        query_lower = user_message.lower()
                        query_keywords = set([w for w in query_lower.split() if len(w) > 2])  # Lower threshold to 2 chars
                        logger.info(f"🔍 Query keywords: {query_keywords}")
                        
                        # Prioritize results that contain query keywords OR have high similarity
                        relevant_results = []
                        for result in sorted_results:
                            content_lower = (result.get('content', '') or '').lower()
                            similarity = result.get('similarity', 0)
                            
                            # Check keyword matches
                            keyword_matches = sum(1 for kw in query_keywords if kw in content_lower)
                            
                            # Include if: high similarity OR keyword matches OR contains important words from query
                            # VERY LENIENT: Include if similarity >= 0.2 OR any keyword match
                            if similarity >= 0.2 or keyword_matches >= 1:
                                relevant_results.append(result)
                                logger.debug(f"✅ Included result: similarity={similarity:.3f}, keyword_matches={keyword_matches}, source={result.get('source', 'Unknown')[:30]}")
                        
                        # If we still have no results, use top 5 by similarity anyway
                        if not relevant_results and sorted_results:
                            logger.warning("⚠️ No keyword matches found, using top results by similarity")
                            relevant_results = sorted_results[:5]
                        
                        # Use top 10 most relevant results, OR use ALL results if we have very few
                        if relevant_results:
                            final_results = relevant_results[:10] if len(relevant_results) > 10 else relevant_results
                        elif sorted_results:
                            # If no relevant results but we have ANY results, use them anyway
                            logger.warning("⚠️ Using ALL available results (low similarity but better than nothing)")
                            final_results = sorted_results[:10] if len(sorted_results) > 10 else sorted_results
                        else:
                            final_results = []
                        
                        if final_results:
                            kb_results_found = True
                            # Build comprehensive knowledge context
                            kb_context_parts = []
                            for i, result in enumerate(final_results, 1):
                                content = result.get('content', '')
                                source = result.get('source', 'Unknown')
                                similarity = result.get('similarity', 0)
                                
                                # Include full content - don't truncate
                                kb_context_parts.append(
                                    f"[Knowledge Source {i} from {source} (relevance: {similarity:.2f})]:\n{content}\n"
                                )
                                kb_sources_used.append(source)
                            
                            kb_context = "\n\n=== KNOWLEDGE BASE INFORMATION (USE THIS TO ANSWER THE USER'S QUESTION) ===\n" + "\n".join(kb_context_parts) + "\n=== END KNOWLEDGE BASE ===\n\n"
                            logger.info(f"✅ Using {len(final_results)} KB entries (sources: {set(kb_sources_used)})")
                            top_3_scores = [round(r.get('similarity', 0), 3) for r in final_results[:3]]
                            logger.info(f"📊 Top 3 similarity scores: {top_3_scores}")
                        else:
                            logger.warning(f"⚠️ KB search returned results but none passed relevance filter")
                    else:
                        logger.warning(f"⚠️ No KB results found for query: '{user_message[:50]}'")
                        logger.warning(f"⚠️ Agent ID used: {agent_id}, Total KB items: {len(all_kb)}")
                except Exception as kb_error:
                    logger.error(f"❌ KB search failed: {kb_error}", exc_info=True)
                    kb_context = ""
            
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
            {kb_context}
            """
            
            # Build system prompt based on whether KB results were found
            if kb_results_found:
                kb_instructions = """
            ⚠️ KNOWLEDGE BASE INFORMATION IS PROVIDED BELOW ⚠️
            - YOU MUST USE the knowledge base information to answer the user's question
            - The knowledge base contains the EXACT information the user needs
            - Answer based ONLY on the knowledge base information provided
            - If the knowledge base has relevant information, USE IT - do NOT say "I don't have that information"
            - Extract and present the relevant information from the knowledge base in a natural, conversational way
            - Only say "I don't have that information" if the knowledge base truly doesn't contain anything related to the question
            """
                response_guidance = "USE the knowledge base information provided below to answer the question. Extract the relevant details and present them clearly."
            else:
                kb_instructions = """
            ⚠️ NO KNOWLEDGE BASE INFORMATION AVAILABLE ⚠️
            - If the user asks about something specific, say "I don't have that information in my knowledge base"
            - Use your general knowledge only for very basic questions
            """
                response_guidance = "If you don't have specific information, say so"
            
            system_prompt = f"""
            You are a voice AI assistant for {self.config.get('company', 'our company')}.
            Your role: {self.config.get('role', 'customer support')}
            Personality: {self.config.get('personality', 'helpful and professional')}
            
            **CRITICAL INSTRUCTIONS FOR KNOWLEDGE BASE USAGE:**
            {kb_instructions}
            
            User's Question: "{user_message}"
            
            Response Guidelines:
            - Keep responses SHORT (1-3 sentences) for voice output
            - Be conversational and natural
            - Be helpful and friendly
            - {response_guidance}
            - If tools were executed, mention key results briefly
            
            Context: {context}
            
            Generate ONLY the response text, nothing else.
            """
            
            # Build message list with system prompt, history, and current message
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history if available
            conversation_history = state.get("conversation_history", [])
            if conversation_history:
                # Convert history to dict format
                for msg in conversation_history:
                    if isinstance(msg, dict):
                        if msg.get("role") != "system":
                            messages.append(msg)
                    elif hasattr(msg, 'type'):
                        role_map = {"human": "user", "ai": "assistant", "system": "system"}
                        role = role_map.get(msg.type, "user")
                        if role != "system":
                            messages.append({"role": role, "content": msg.content})
                    elif hasattr(msg, 'role') and hasattr(msg, 'content'):
                        if msg.role != "system":
                            messages.append({"role": msg.role, "content": msg.content})
            
            # Add current user message
            messages.append({"role": "user", "content": user_message})
            
            # Invoke LLM and handle response
            try:
                llm_response = self.llm.invoke(messages)
                
                # Handle different response types
                if isinstance(llm_response, str):
                    response_text = llm_response.strip()
                elif hasattr(llm_response, 'content'):
                    response_text = str(llm_response.content).strip()
                elif isinstance(llm_response, dict):
                    response_text = llm_response.get('content', str(llm_response)).strip()
                else:
                    response_text = str(llm_response).strip()
                
                # Ensure we have a valid response
                if not response_text or len(response_text) < 1:
                    logger.warning("LLM returned empty response, using fallback")
                    response_text = "I apologize, but I'm having trouble understanding. Could you please rephrase your question?"
                    
            except Exception as llm_error:
                logger.error(f"LLM invocation failed: {llm_error}", exc_info=True)
                response_text = "I apologize, but I'm experiencing technical difficulties. Please try again."
            
            # Determine actions taken and next step
            actions_taken = state.get("actions_taken", [])
            if not actions_taken:
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
            error_msg = str(e)
            logger.error(f"Error in generate_response: {e}")
            
            # Check if it's a quota/rate limit error - log it but don't retry
            if "429" in error_msg or "quota" in error_msg.lower() or "rate limit" in error_msg.lower():
                logger.error("LLM quota/rate limit exceeded")
            
            # Return fallback message if all else fails
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
            
            # Use agentic core if enabled
            if self.use_agentic_mode and self.agentic_core:
                logger.info("Using agentic core with RAG")
                result = self.agentic_core.process_message(user_message, conversation_history)
                
                return VoiceAgentResponse(
                    text=result.get("response", ""),
                    actions_taken=result.get("actions_taken", []),
                    next_step=result.get("next_step", "await_user_input"),
                    entities=result.get("entities", {}),
                    confidence=result.get("confidence", 0.7)
                )
            
            # Standard mode (backward compatible)
            # Convert conversation history to LangChain messages
            from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
            history_messages = []
            for msg in conversation_history:
                role = msg.get("role", "user") if isinstance(msg, dict) else (msg.type if hasattr(msg, 'type') else "user")
                content = msg.get("content", "") if isinstance(msg, dict) else (msg.content if hasattr(msg, 'content') else str(msg))
                
                if role == "user" or (hasattr(msg, 'type') and msg.type == "human"):
                    history_messages.append(HumanMessage(content=content))
                elif role in ["assistant", "agent", "ai"] or (hasattr(msg, 'type') and msg.type == "ai"):
                    history_messages.append(AIMessage(content=content))
                elif role == "system":
                    history_messages.append(SystemMessage(content=content))
            
            # Prepare initial state with converted history
            initial_state = AgentState(
                user_message=user_message,
                intent="",
                planned_actions=[],
                tool_results=[],
                response="",
                conversation_history=history_messages,  # Use LangChain messages
                entities={},
                actions_taken=[],
                next_step=""
            )
            
            # Run the graph with error handling
            try:
                result = self.graph.invoke(initial_state)
                
                # Validate result
                if not result or not isinstance(result, dict):
                    logger.error(f"Graph returned invalid result: {type(result)}")
                    raise ValueError("Graph returned invalid result")
                
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
                
                # Get response text and validate it
                response_text = result.get("response", "")
                if not response_text or not isinstance(response_text, str) or len(response_text.strip()) < 1:
                    logger.warning(f"Invalid response from graph: '{response_text}'")
                    response_text = "I apologize, but I'm having trouble processing your request. Could you please rephrase?"
                
                # Create structured response
                response = VoiceAgentResponse(
                    text=response_text.strip(),
                    actions_taken=result.get("actions_taken", []),
                    next_step=result.get("next_step", "await_user_input"),
                    entities=result.get("entities", {}),
                    confidence=0.8  # Default confidence
                )
                
                logger.info(f"✅ Processed message successfully. Response: {response_text[:100]}...")
                return response
                
            except Exception as graph_error:
                logger.error(f"❌ Graph execution failed: {graph_error}", exc_info=True)
                # Return a safe fallback response
                return VoiceAgentResponse(
                    text="I apologize, but I'm experiencing technical difficulties. Please try again or contact support.",
                    actions_taken=[],
                    next_step="await_user_input",
                    entities={},
                    confidence=0.0
                )
            
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
