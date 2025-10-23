"""
FastAPI Router for Chat Endpoints
Handles voice AI agent conversations with database integration
"""

import logging
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from models.database import get_db, Agent, Conversation, Message, Action
from models.schemas import (
    ChatRequest, ChatResponse, ConversationSchema, ConversationCreate,
    ConversationWithMessages, MessageSchema, ActionSchema, ErrorResponse
)
from agents.voice_agent import create_voice_agent, VoiceAgentResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api", tags=["chat"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Process chat message with voice AI agent",
    description="Send a message to a voice AI agent and get a response with actions"
)
async def chat_with_agent(
    chat_request: ChatRequest,
    db: Session = Depends(get_db)
) -> ChatResponse:
    """
    Process a chat message through the voice AI agent system.
    
    This endpoint:
    1. Loads the agent configuration from database
    2. Initializes the VoiceAgent with LangGraph
    3. Processes the message through the agent workflow
    4. Saves the conversation and messages to database
    5. Executes any planned actions
    6. Returns the structured response
    """
    try:
        logger.info(f"Processing chat request for agent {chat_request.agent_id}")
        
        # Load agent from database
        agent_db = db.query(Agent).filter(
            Agent.id == chat_request.agent_id,
            Agent.is_active == True
        ).first()
        
        if not agent_db:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent with ID {chat_request.agent_id} not found or inactive"
            )
        
        # Get or create conversation
        conversation = await _get_or_create_conversation(
            db, chat_request.conversation_id, chat_request.agent_id,
            chat_request.customer_name, chat_request.customer_phone
        )
        
        # Save user message to database
        user_message = await _save_message(
            db, conversation.id, "user", chat_request.message,
            chat_request.message_metadata
        )
        
        # Initialize VoiceAgent with agent configuration
        agent_config = {
            "name": agent_db.name,
            "company": agent_db.company,
            "role": agent_db.role,
            "personality": agent_db.personality,
            "knowledge_base": agent_db.knowledge_base,
            "greeting": agent_db.greeting,
            "voice_settings": agent_db.voice_settings
        }
        
        voice_agent = create_voice_agent(agent_config)
        
        # Get conversation history for context
        conversation_history = await _get_conversation_history(db, conversation.id)
        
        # Process message through VoiceAgent
        logger.info("Processing message through VoiceAgent...")
        agent_response = voice_agent.process_message(
            chat_request.message, 
            conversation_history
        )
        
        # Save agent response message
        agent_message = await _save_message(
            db, conversation.id, "agent", agent_response.text,
            {"entities": agent_response.entities, "confidence": agent_response.confidence}
        )
        
        # Execute planned actions and save to database
        actions_taken = await _execute_and_save_actions(
            db, conversation.id, agent_response.actions_taken,
            agent_response.entities, agent_response.text
        )
        
        # Update conversation status and metadata
        await _update_conversation_status(db, conversation, agent_response)
        
        # Commit all database changes
        db.commit()
        
        logger.info(f"Chat processed successfully for conversation {conversation.id}")
        
        return ChatResponse(
            conversation_id=conversation.id,
            agent_response=agent_response.text,
            message_id=agent_message.id,
            timestamp=agent_message.timestamp,
            status="success",
            message_metadata={
                "actions_taken": agent_response.actions_taken,
                "next_step": agent_response.next_step,
                "entities": agent_response.entities,
                "confidence": agent_response.confidence
            }
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error processing chat request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while processing chat request"
        )


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationWithMessages,
    status_code=status.HTTP_200_OK,
    summary="Get conversation with messages",
    description="Retrieve a full conversation including all messages and actions"
)
async def get_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db)
) -> ConversationWithMessages:
    """
    Retrieve a complete conversation with all messages and actions.
    """
    try:
        # Get conversation
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id
        ).first()
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation with ID {conversation_id} not found"
            )
        
        # Get all messages for the conversation
        messages = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.timestamp).all()
        
        # Convert to message schemas
        message_schemas = [
            MessageSchema(
                id=msg.id,
                conversation_id=msg.conversation_id,
                role=msg.role,
                content=msg.content,
                timestamp=msg.timestamp,
                message_metadata=msg.message_metadata
            )
            for msg in messages
        ]
        
        return ConversationWithMessages(
            id=conversation.id,
            agent_id=conversation.agent_id,
            customer_phone=conversation.customer_phone,
            customer_name=conversation.customer_name,
            status=conversation.status,
            started_at=conversation.started_at,
            ended_at=conversation.ended_at,
            duration_seconds=conversation.duration_seconds,
            sentiment=conversation.sentiment,
            messages=message_schemas
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving conversation {conversation_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while retrieving conversation"
        )


@router.post(
    "/conversations/start",
    response_model=Dict[str, Any],
    status_code=status.HTTP_201_CREATED,
    summary="Start new conversation",
    description="Create a new conversation and return the conversation ID"
)
async def start_conversation(
    conversation_data: ConversationCreate,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Start a new conversation with an agent.
    """
    try:
        # Verify agent exists and is active
        agent = db.query(Agent).filter(
            Agent.id == conversation_data.agent_id,
            Agent.is_active == True
        ).first()
        
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent with ID {conversation_data.agent_id} not found or inactive"
            )
        
        # Create new conversation
        conversation = Conversation(
            id=uuid4(),
            agent_id=conversation_data.agent_id,
            customer_phone=conversation_data.customer_phone,
            customer_name=conversation_data.customer_name,
            status=conversation_data.status,
            started_at=datetime.utcnow()
        )
        
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        
        logger.info(f"Started new conversation {conversation.id} with agent {conversation_data.agent_id}")
        
        return {
            "conversation_id": conversation.id,
            "agent_id": conversation.agent_id,
            "status": conversation.status,
            "started_at": conversation.started_at,
            "message": "Conversation started successfully"
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error starting conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while starting conversation"
        )


# Helper functions

async def _get_or_create_conversation(
    db: Session, 
    conversation_id: Optional[UUID],
    agent_id: UUID,
    customer_name: Optional[str],
    customer_phone: Optional[str]
) -> Conversation:
    """Get existing conversation or create a new one"""
    if conversation_id:
        # Get existing conversation
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id
        ).first()
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation with ID {conversation_id} not found"
            )
        
        return conversation
    else:
        # Create new conversation
        conversation = Conversation(
            id=uuid4(),
            agent_id=agent_id,
            customer_name=customer_name,
            customer_phone=customer_phone,
            status="active",
            started_at=datetime.utcnow()
        )
        
        db.add(conversation)
        db.flush()  # Get the ID without committing
        
        return conversation


async def _save_message(
    db: Session,
    conversation_id: UUID,
    role: str,
    content: str,
    metadata: Optional[Dict[str, Any]] = None
) -> Message:
    """Save a message to the database"""
    message = Message(
        id=uuid4(),
        conversation_id=conversation_id,
        role=role,
        content=content,
        message_metadata=metadata,
        timestamp=datetime.utcnow()
    )
    
    db.add(message)
    db.flush()  # Get the ID without committing
    
    return message


async def _get_conversation_history(db: Session, conversation_id: UUID) -> List[Dict[str, Any]]:
    """Get conversation history for agent context"""
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.timestamp).limit(10).all()  # Last 10 messages for context
    
    return [
        {
            "role": msg.role,
            "content": msg.content,
            "timestamp": msg.timestamp.isoformat()
        }
        for msg in messages
    ]


async def _execute_and_save_actions(
    db: Session,
    conversation_id: UUID,
    actions_taken: List[str],
    entities: Dict[str, Any],
    response_text: str
) -> List[ActionSchema]:
    """Execute actions and save to database"""
    actions = []
    
    for action_type in actions_taken:
        try:
            # Create action record
            action = Action(
                id=uuid4(),
                conversation_id=conversation_id,
                action_type=action_type,
                parameters=entities,
                result={"response": response_text, "status": "completed"},
                status="completed",
                executed_at=datetime.utcnow()
            )
            
            db.add(action)
            db.flush()
            
            actions.append(ActionSchema(
                id=action.id,
                conversation_id=action.conversation_id,
                action_type=action.action_type,
                parameters=action.parameters,
                result=action.result,
                status=action.status,
                executed_at=action.executed_at
            ))
            
        except Exception as e:
            logger.error(f"Error executing action {action_type}: {e}")
            # Still save the action but mark as failed
            action = Action(
                id=uuid4(),
                conversation_id=conversation_id,
                action_type=action_type,
                parameters=entities,
                result={"error": str(e)},
                status="failed",
                executed_at=datetime.utcnow()
            )
            
            db.add(action)
            db.flush()
    
    return actions


async def _update_conversation_status(
    db: Session,
    conversation: Conversation,
    agent_response: VoiceAgentResponse
) -> None:
    """Update conversation status based on agent response"""
    # Update conversation based on next step
    if agent_response.next_step == "waiting_for_human_agent":
        conversation.status = "transferred"
    elif agent_response.next_step == "completed":
        conversation.status = "completed"
        conversation.ended_at = datetime.utcnow()
        if conversation.started_at:
            duration = (conversation.ended_at - conversation.started_at).total_seconds()
            conversation.duration_seconds = int(duration)
    
    # Update sentiment if available (simplified logic)
    if "thank" in agent_response.text.lower() or "helpful" in agent_response.text.lower():
        conversation.sentiment = "positive"
    elif "sorry" in agent_response.text.lower() or "problem" in agent_response.text.lower():
        conversation.sentiment = "negative"
    else:
        conversation.sentiment = "neutral"


# Note: Exception handlers are moved to main.py since APIRouter doesn't support them
