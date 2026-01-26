"""
Training Router - Endpoints for training agents from conversations
"""

import logging
from typing import Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from models.database import get_db, Agent
from models.schemas import ErrorResponse
from services.conversation_learning import ConversationLearningService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/training", tags=["training"])


@router.post(
    "/agents/{agent_id}/train",
    status_code=status.HTTP_200_OK,
    summary="Train agent from past conversations",
    description="Extract patterns from past conversations and update agent knowledge base"
)
async def train_agent(
    agent_id: UUID,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Train an agent using past conversation data.
    
    This endpoint:
    1. Analyzes successful past conversations
    2. Extracts patterns and common questions
    3. Updates the agent's knowledge base
    4. Returns training insights
    """
    try:
        # Verify agent exists
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent with ID {agent_id} not found"
            )
        
        # Initialize learning service
        learning_service = ConversationLearningService(db)
        
        # Train the agent
        result = learning_service.train_agent_from_conversations(str(agent_id))
        
        if not result.get('success'):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get('error', 'Training failed')
            )
        
        logger.info(f"Agent {agent_id} trained successfully")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error training agent {agent_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while training agent"
        )


@router.get(
    "/agents/{agent_id}/insights",
    status_code=status.HTTP_200_OK,
    summary="Get training insights for agent",
    description="Get insights and metrics from past conversations"
)
async def get_agent_insights(
    agent_id: UUID,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get insights and metrics from past conversations for an agent.
    """
    try:
        # Verify agent exists
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent with ID {agent_id} not found"
            )
        
        # Initialize learning service
        learning_service = ConversationLearningService(db)
        
        # Get insights
        insights = learning_service.generate_learning_insights(str(agent_id))
        patterns = learning_service.extract_successful_patterns(str(agent_id), limit=50)
        
        return {
            'insights': insights,
            'patterns': patterns
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting insights for agent {agent_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while getting insights"
        )


@router.get(
    "/agents/{agent_id}/similar",
    status_code=status.HTTP_200_OK,
    summary="Find similar past conversations",
    description="Find similar past conversations for a given user message"
)
async def find_similar_conversations(
    agent_id: UUID,
    user_message: str,
    limit: int = 5,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Find similar past conversations for a user message.
    Useful for providing context to the agent.
    """
    try:
        # Verify agent exists
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent with ID {agent_id} not found"
            )
        
        # Initialize learning service
        learning_service = ConversationLearningService(db)
        
        # Find similar conversations
        similar = learning_service.get_similar_past_conversations(
            str(agent_id), 
            user_message, 
            limit=limit
        )
        
        return {
            'similar_conversations': similar,
            'count': len(similar)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding similar conversations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while finding similar conversations"
        )
