"""
Agentic Core with LangGraph ReAct Pattern
Implements Reasoning + Acting for autonomous agent behavior
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional, TypedDict, Annotated, Literal
from datetime import datetime

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from pydantic import BaseModel, Field

from services.llm_service import get_llm_service
from tools.executor import ToolExecutor

logger = logging.getLogger(__name__)


class AgenticState(TypedDict):
    """Enhanced state for agentic agent with reasoning"""
    user_message: str
    conversation_history: Annotated[List[Any], add_messages]
    reasoning_steps: List[str]
    plan: List[str]
    tool_calls: List[Dict[str, Any]]
    tool_results: List[Dict[str, Any]]
    kb_context: Optional[str]
    response: str
    actions_taken: List[str]
    next_step: str
    entities: Dict[str, Any]
    confidence: float
    needs_clarification: bool
    clarification_question: Optional[str]


class ReasoningStep(BaseModel):
    """A single reasoning step"""
    step_type: Literal["think", "plan", "retrieve", "act", "observe", "reflect"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)


class AgenticCore:
    """
    Agentic Core implementing ReAct pattern:
    Reasoning → Planning → Retrieval → Acting → Observing → Reflecting
    """
    
    def __init__(self, agent_id: str, agent_config: Dict[str, Any]):
        self.agent_id = agent_id
        self.agent_config = agent_config
        self.llm_service = get_llm_service()
        self.tool_executor = ToolExecutor()
        self.max_iterations = 5  # Prevent infinite loops
        
        # Build the agentic workflow
        self.workflow = self._build_workflow()
    
    def _build_workflow(self) -> StateGraph:
        """Build LangGraph workflow with ReAct pattern"""
        workflow = StateGraph(AgenticState)
        
        # Add nodes
        workflow.add_node("reason", self._reason_node)
        workflow.add_node("plan", self._plan_node)
        workflow.add_node("retrieve_kb", self._retrieve_kb_node)
        workflow.add_node("execute_tools", self._execute_tools_node)
        workflow.add_node("reflect", self._reflect_node)
        workflow.add_node("respond", self._respond_node)
        
        # Define workflow edges
        workflow.set_entry_point("reason")
        
        # ReAct loop: reason → plan → retrieve → execute → reflect → respond or loop
        workflow.add_edge("reason", "plan")
        workflow.add_edge("plan", "retrieve_kb")
        workflow.add_edge("retrieve_kb", "execute_tools")
        workflow.add_edge("execute_tools", "reflect")
        
        # Conditional: reflect decides if we need more iterations or can respond
        workflow.add_conditional_edges(
            "reflect",
            self._should_continue,
            {
                "continue": "reason",  # Loop back for more reasoning
                "respond": "respond",   # Ready to respond
                "clarify": "respond"    # Need clarification
            }
        )
        
        workflow.add_edge("respond", END)
        
        return workflow.compile()
    
    def _reason_node(self, state: AgenticState) -> AgenticState:
        """Reasoning step: Analyze user input and context"""
        try:
            user_message = state.get("user_message", "")
            conversation_history = state.get("conversation_history", [])
            reasoning_steps = state.get("reasoning_steps", [])
            
            # Build reasoning prompt
            system_prompt = f"""You are an intelligent AI assistant for {self.agent_config.get('name', 'Voice AI Agent')}.
Your personality: {', '.join(self.agent_config.get('personality', []))}

Analyze the user's message and determine:
1. What is the user asking for?
2. What information do you need?
3. What actions might be required?
4. Do you need to ask clarifying questions?

Be concise and focused in your reasoning."""
            
            messages = [
                {"role": "system", "content": system_prompt}
            ]
            
            # Add conversation history
            for msg in conversation_history[-5:]:  # Last 5 messages for context
                if hasattr(msg, 'content'):
                    role = "user" if hasattr(msg, 'type') and msg.type == "human" else "assistant"
                    messages.append({"role": role, "content": msg.content})
            
            messages.append({"role": "user", "content": f"User says: {user_message}\n\nReason about this request:"})
            
            reasoning = self.llm_service.invoke(messages)
            
            reasoning_steps.append(f"Reasoning: {reasoning}")
            logger.info(f"Reasoning step: {reasoning[:100]}...")
            
            return {
                **state,
                "reasoning_steps": reasoning_steps
            }
        except Exception as e:
            logger.error(f"Error in reasoning step: {e}")
            return state
    
    def _plan_node(self, state: AgenticState) -> AgenticState:
        """Planning step: Create action plan"""
        try:
            user_message = state.get("user_message", "")
            reasoning_steps = state.get("reasoning_steps", [])
            plan = state.get("plan", [])
            
            # Get available tools
            available_tools = self.tool_executor.get_available_tools()
            tool_descriptions = []
            for tool_name in available_tools:
                tool_info = self.tool_executor.get_tool_info(tool_name)
                if tool_info:
                    tool_descriptions.append(f"- {tool_name}: {tool_info['description']}")
            
            system_prompt = f"""Based on your reasoning, create a step-by-step plan.
Available tools: {', '.join(available_tools)}

Format your plan as a JSON array of action steps. Each step should be a tool name or "respond" or "clarify".
Example: ["retrieve_kb", "schedule_appointment", "respond"]"""
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"User request: {user_message}\n\nReasoning: {reasoning_steps[-1] if reasoning_steps else 'None'}\n\nCreate a plan:"}
            ]
            
            plan_response = self.llm_service.invoke(messages)
            
            # Try to extract JSON plan, fallback to simple parsing
            try:
                # Look for JSON array in response
                import re
                json_match = re.search(r'\[.*?\]', plan_response, re.DOTALL)
                if json_match:
                    plan = json.loads(json_match.group())
                else:
                    # Fallback: extract tool names mentioned
                    plan = [tool for tool in available_tools if tool in plan_response.lower()]
                    if not plan:
                        plan = ["respond"]  # Default to responding
            except:
                plan = ["respond"]  # Default if parsing fails
            
            logger.info(f"Plan created: {plan}")
            
            return {
                **state,
                "plan": plan
            }
        except Exception as e:
            logger.error(f"Error in planning step: {e}")
            return {**state, "plan": ["respond"]}
    
    def _retrieve_kb_node(self, state: AgenticState) -> AgenticState:
        """Retrieval step: Search knowledge base first"""
        try:
            user_message = state.get("user_message", "")
            
            # Import knowledge base service
            try:
                from services.knowledge_base import KnowledgeBaseService
                kb_service = KnowledgeBaseService(self.agent_id)
                
                # Search knowledge base with lower threshold to get more results
                kb_results = kb_service.search(user_message, top_k=10, similarity_threshold=0.3)
                
                if kb_results and len(kb_results) > 0:
                    # Sort by similarity (highest first) and take top results
                    sorted_results = sorted(kb_results, key=lambda x: x.get('similarity', 0), reverse=True)
                    
                    # Filter out low-relevance results (similarity < 0.4) unless we have very few results
                    filtered_results = [r for r in sorted_results if r.get('similarity', 0) >= 0.4] if len(sorted_results) > 3 else sorted_results
                    
                    # Extract keywords from user query to check relevance
                    query_lower = user_message.lower()
                    query_keywords = set([w for w in query_lower.split() if len(w) > 3])
                    
                    # Further filter by keyword matching
                    highly_relevant = []
                    for result in filtered_results:
                        content_lower = (result.get('content', '') or '').lower()
                        # Check if any query keywords appear in content
                        keyword_matches = sum(1 for kw in query_keywords if kw in content_lower)
                        if keyword_matches > 0 or result.get('similarity', 0) >= 0.6:
                            highly_relevant.append(result)
                    
                    # Use highly relevant results, or fall back to filtered results
                    final_results = highly_relevant[:8] if highly_relevant else filtered_results[:5]
                    
                    if final_results:
                        # Found relevant KB entries - include full content
                        kb_context_parts = []
                        for i, result in enumerate(final_results, 1):
                            content = result.get('content', '')
                            source = result.get('source', 'Unknown')
                            similarity = result.get('similarity', 0)
                            kb_context_parts.append(
                                f"Knowledge Base Entry {i} (from {source}, relevance: {similarity:.2f}):\n{content}"
                            )
                        
                        kb_context = "\n\n=== RELEVANT KNOWLEDGE BASE INFORMATION (USE THIS AS PRIMARY SOURCE) ===\n" + "\n\n".join(kb_context_parts) + "\n=== END KNOWLEDGE BASE ===\n"
                        logger.info(f"✅ Found {len(final_results)} KB entries for agentic core")
                        top_scores = [f"{r.get('similarity', 0):.2f}" for r in final_results[:3]]
                        logger.info(f"📊 Top similarity scores: {top_scores}")
                    else:
                        logger.info("No highly relevant KB entries found, will use LLM")
                        kb_context = None
                    return {
                        **state,
                        "kb_context": kb_context,
                        "reasoning_steps": state.get("reasoning_steps", []) + [
                            f"Retrieved {len(kb_results)} relevant entries from knowledge base"
                        ]
                    }
                else:
                    logger.info("No relevant KB entries found, will use LLM")
                    return {
                        **state,
                        "kb_context": None
                    }
            except ImportError:
                # KB service not available yet, skip
                logger.info("Knowledge base service not available, skipping retrieval")
                return {**state, "kb_context": None}
            except Exception as kb_error:
                logger.warning(f"KB retrieval error: {kb_error}")
                return {**state, "kb_context": None}
        except Exception as e:
            logger.error(f"Error in KB retrieval: {e}")
            return {**state, "kb_context": None}
    
    def _execute_tools_node(self, state: AgenticState) -> AgenticState:
        """Execute planned tools"""
        try:
            plan = state.get("plan", [])
            entities = state.get("entities", {})
            tool_results = state.get("tool_results", [])
            actions_taken = state.get("actions_taken", [])
            
            # Filter out non-tool steps
            tool_calls = [step for step in plan if step in self.tool_executor.get_available_tools()]
            
            for tool_name in tool_calls:
                try:
                    # Extract parameters from entities or user message
                    user_message = state.get("user_message", "")
                    
                    # Simple parameter extraction (can be enhanced)
                    params = self._extract_tool_params(tool_name, user_message, entities)
                    
                    # Execute tool
                    result = self.tool_executor.execute_action(tool_name, params)
                    
                    tool_results.append({
                        "tool": tool_name,
                        "params": params,
                        "result": result.result if result.success else {"error": result.error},
                        "success": result.success
                    })
                    
                    if result.success:
                        actions_taken.append(tool_name)
                        logger.info(f"Tool {tool_name} executed successfully")
                    else:
                        logger.warning(f"Tool {tool_name} failed: {result.error}")
                        
                except Exception as e:
                    logger.error(f"Error executing tool {tool_name}: {e}")
                    tool_results.append({
                        "tool": tool_name,
                        "result": {"error": str(e)},
                        "success": False
                    })
            
            return {
                **state,
                "tool_results": tool_results,
                "actions_taken": actions_taken
            }
        except Exception as e:
            logger.error(f"Error in tool execution: {e}")
            return state
    
    def _extract_tool_params(self, tool_name: str, user_message: str, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Extract parameters for a tool from user message and entities"""
        params = {}
        
        # Get tool info to know what params are needed
        tool_info = self.tool_executor.get_tool_info(tool_name)
        if not tool_info:
            return params
        
        required_params = tool_info.get("required_params", [])
        optional_params = tool_info.get("optional_params", [])
        
        # Use entities first
        for param in required_params + optional_params:
            if param in entities:
                params[param] = entities[param]
        
        # Simple extraction from user message (can be enhanced with NER)
        user_lower = user_message.lower()
        
        # Common patterns
        if "email" in required_params and "email" not in params:
            import re
            email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', user_message)
            if email_match:
                params["email"] = email_match.group()
        
        if "datetime" in required_params and "datetime" not in params:
            # Try to extract date/time mentions
            if "tomorrow" in user_lower:
                from datetime import timedelta
                tomorrow = datetime.now() + timedelta(days=1)
                params["datetime"] = tomorrow.isoformat()
            elif "next week" in user_lower:
                from datetime import timedelta
                next_week = datetime.now() + timedelta(days=7)
                params["datetime"] = next_week.isoformat()
        
        return params
    
    def _reflect_node(self, state: AgenticState) -> AgenticState:
        """Reflection step: Evaluate if we have enough information to respond"""
        try:
            tool_results = state.get("tool_results", [])
            kb_context = state.get("kb_context")
            reasoning_steps = state.get("reasoning_steps", [])
            plan = state.get("plan", [])
            
            # Check if we have enough information
            has_kb_info = kb_context is not None and len(kb_context) > 0
            has_tool_results = len(tool_results) > 0
            all_tools_successful = all(r.get("success", False) for r in tool_results)
            
            # Determine if we need clarification
            needs_clarification = False
            clarification_question = None
            
            # Check if required tool params are missing
            if not all_tools_successful and len(tool_results) > 0:
                failed_tools = [r for r in tool_results if not r.get("success", False)]
                for failed in failed_tools:
                    if "error" in str(failed.get("result", {})).lower() and "required" in str(failed.get("result", {})).lower():
                        needs_clarification = True
                        clarification_question = f"I need more information to {failed['tool']}. Can you provide the missing details?"
                        break
            
            # Determine next step
            if needs_clarification:
                next_step = "clarify"
            elif has_kb_info or (has_tool_results and all_tools_successful):
                next_step = "respond"
            elif len(reasoning_steps) < self.max_iterations:
                next_step = "continue"
            else:
                next_step = "respond"  # Max iterations reached, respond with what we have
            
            reasoning_steps.append(f"Reflection: {next_step} - KB: {has_kb_info}, Tools: {has_tool_results}, All successful: {all_tools_successful}")
            
            return {
                **state,
                "reasoning_steps": reasoning_steps,
                "needs_clarification": needs_clarification,
                "clarification_question": clarification_question,
                "next_step": next_step
            }
        except Exception as e:
            logger.error(f"Error in reflection step: {e}")
            return {**state, "next_step": "respond"}
    
    def _respond_node(self, state: AgenticState) -> AgenticState:
        """Generate final response"""
        try:
            user_message = state.get("user_message", "")
            conversation_history = state.get("conversation_history", [])
            kb_context = state.get("kb_context")
            tool_results = state.get("tool_results", [])
            reasoning_steps = state.get("reasoning_steps", [])
            needs_clarification = state.get("needs_clarification", False)
            clarification_question = state.get("clarification_question")
            
            # Build response prompt
            system_prompt = f"""You are {self.agent_config.get('name', 'Voice AI Agent')}.
Personality: {', '.join(self.agent_config.get('personality', []))}
Industry: {self.agent_config.get('industry', 'General')}

Generate a natural, conversational response. Be helpful, professional, and concise.

**CRITICAL INSTRUCTIONS - READ CAREFULLY:**
- **ONLY answer questions that are DIRECTLY related to the knowledge base information provided below**
- **If the user asks about something NOT in the knowledge base, say "I don't have that information in my knowledge base"**
- **DO NOT use knowledge base information that is NOT relevant to the user's question**
- **If knowledge base information is provided but doesn't answer the user's question, ignore it and say you don't have that information**
- **DO NOT use general knowledge or make up information**
- **DO NOT invent discount codes, policies, prices, or details not in the knowledge base**
- **ONLY use knowledge base chunks that directly answer the user's question**
- **If knowledge base information conflicts with general knowledge, ALWAYS use knowledge base information**
- **NEVER hallucinate or invent information - only use what's in the knowledge base**

User's Question: "{user_message}"
"""
            
            messages = [
                {"role": "system", "content": system_prompt}
            ]
            
            # Add conversation history
            for msg in conversation_history[-3:]:
                if hasattr(msg, 'content'):
                    role = "user" if hasattr(msg, 'type') and msg.type == "human" else "assistant"
                    messages.append({"role": role, "content": msg.content})
            
            # Add context
            context_parts = []
            
            if kb_context:
                context_parts.append(f"Knowledge Base Context:\n{kb_context}")
            
            if tool_results:
                tool_summary = "\n".join([
                    f"- {r['tool']}: {json.dumps(r['result'], indent=2)}"
                    for r in tool_results if r.get("success", False)
                ])
                context_parts.append(f"Tool Results:\n{tool_summary}")
            
            if needs_clarification and clarification_question:
                response = clarification_question
            else:
                user_prompt = f"User: {user_message}"
                if context_parts:
                    user_prompt += f"\n\nContext:\n" + "\n\n".join(context_parts)
                user_prompt += "\n\nGenerate a helpful response:"
                
                messages.append({"role": "user", "content": user_prompt})
                
                response = self.llm_service.invoke(messages)
            
            logger.info(f"Generated response: {response[:100]}...")
            
            return {
                **state,
                "response": response,
                "confidence": 0.8 if (kb_context or tool_results) else 0.6
            }
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return {
                **state,
                "response": "I apologize, but I encountered an error. Could you please rephrase your question?",
                "confidence": 0.3
            }
    
    def _should_continue(self, state: AgenticState) -> str:
        """Determine if we should continue reasoning or respond"""
        next_step = state.get("next_step", "respond")
        return next_step
    
    def process_message(
        self,
        user_message: str,
        conversation_history: List[Any],
        entities: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process a user message through the agentic workflow
        
        Returns:
            Dict with response, actions_taken, reasoning_steps, etc.
        """
        try:
            # Initialize state
            initial_state: AgenticState = {
                "user_message": user_message,
                "conversation_history": conversation_history or [],
                "reasoning_steps": [],
                "plan": [],
                "tool_calls": [],
                "tool_results": [],
                "kb_context": None,
                "response": "",
                "actions_taken": [],
                "next_step": "reason",
                "entities": entities or {},
                "confidence": 0.0,
                "needs_clarification": False,
                "clarification_question": None
            }
            
            # Run workflow
            final_state = self.workflow.invoke(initial_state)
            
            return {
                "response": final_state.get("response", ""),
                "actions_taken": final_state.get("actions_taken", []),
                "reasoning_steps": final_state.get("reasoning_steps", []),
                "kb_context": final_state.get("kb_context"),
                "tool_results": final_state.get("tool_results", []),
                "confidence": final_state.get("confidence", 0.0),
                "needs_clarification": final_state.get("needs_clarification", False),
                "clarification_question": final_state.get("clarification_question")
            }
        except Exception as e:
            logger.error(f"Error in agentic processing: {e}")
            return {
                "response": "I apologize, but I encountered an error processing your request.",
                "actions_taken": [],
                "reasoning_steps": [f"Error: {str(e)}"],
                "confidence": 0.0
            }
