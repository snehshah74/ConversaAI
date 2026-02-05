"""
FastAPI Router for Agent Management Endpoints
Handles CRUD operations for voice AI agents
"""

import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from models.database import get_db, Agent
from models.schemas import AgentCreate, AgentResponse, AgentUpdate, ErrorResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api", tags=["agents"])


async def get_user_id(x_user_id: Optional[str] = Header(None, alias="X-User-Id")) -> Optional[str]:
    """Extract user ID from request header for data isolation."""
    return x_user_id


@router.post(
    "/agents",
    response_model=AgentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new agent",
    description="Create a new voice AI agent with the specified configuration"
)
async def create_agent(
    agent_data: AgentCreate,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_user_id)
) -> AgentResponse:
    """
    Create a new voice AI agent.
    
    This endpoint creates a new agent with the provided configuration including:
    - Basic information (name, company, industry, role)
    - Personality traits and knowledge base
    - Voice settings and greeting message
    - Available tools and active status
    """
    try:
        logger.info(f"Creating new agent: {agent_data.name}")
        
        # Create new agent
        agent = Agent(
            user_id=user_id,
            name=agent_data.name,
            company=agent_data.company,
            industry=agent_data.industry,
            role=agent_data.role,
            personality=agent_data.personality,
            knowledge_base=agent_data.knowledge_base,
            greeting=agent_data.greeting,
            voice_settings=agent_data.voice_settings,
            available_tools=agent_data.available_tools,
            is_active=agent_data.is_active if agent_data.is_active is not None else True
        )
        
        db.add(agent)
        db.commit()
        db.refresh(agent)
        
        logger.info(f"Successfully created agent {agent.id} with name '{agent.name}'")
        
        return AgentResponse.model_validate(agent)
        
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating agent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while creating agent"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating agent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while creating agent"
        )


@router.get(
    "/agents",
    response_model=List[AgentResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all agents",
    description="Retrieve a list of all voice AI agents"
)
async def get_agents(
    active_only: Optional[bool] = None,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_user_id)
) -> List[AgentResponse]:
    """
    Get all agents with optional filtering.
    When X-User-Id header is provided, only returns agents belonging to that user.
    
    Args:
        active_only: If True, only return active agents. If None, return all agents.
    """
    try:
        query = db.query(Agent)
        
        # Data isolation: when user is authenticated, only return their agents
        if user_id:
            query = query.filter(Agent.user_id == user_id)
        
        if active_only is not None:
            query = query.filter(Agent.is_active == active_only)
        
        agents = query.order_by(Agent.created_at.desc()).all()
        
        logger.info(f"Retrieved {len(agents)} agents")
        
        return [AgentResponse.model_validate(agent) for agent in agents]
        
    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving agents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while retrieving agents"
        )
    except Exception as e:
        logger.error(f"Unexpected error retrieving agents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while retrieving agents"
        )


def _check_agent_ownership(agent: Agent, user_id: Optional[str]) -> None:
    """Raise 404 if agent does not belong to user (when user_id is provided)."""
    if user_id and agent.user_id is not None and agent.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )


@router.get(
    "/agents/{agent_id}",
    response_model=AgentResponse,
    status_code=status.HTTP_200_OK,
    summary="Get agent by ID",
    description="Retrieve a specific agent by its ID"
)
async def get_agent(
    agent_id: UUID,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_user_id)
) -> AgentResponse:
    """
    Get a specific agent by ID.
    
    Args:
        agent_id: The UUID of the agent to retrieve
    """
    try:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent with ID {agent_id} not found"
            )
        
        _check_agent_ownership(agent, user_id)
        
        logger.info(f"Retrieved agent {agent_id} with name '{agent.name}'")
        
        return AgentResponse.model_validate(agent)
        
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving agent {agent_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while retrieving agent"
        )
    except Exception as e:
        logger.error(f"Unexpected error retrieving agent {agent_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while retrieving agent"
        )


@router.put(
    "/agents/{agent_id}",
    response_model=AgentResponse,
    status_code=status.HTTP_200_OK,
    summary="Update agent",
    description="Update an existing agent's configuration"
)
async def update_agent(
    agent_id: UUID,
    agent_data: AgentUpdate,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_user_id)
) -> AgentResponse:
    """
    Update an existing agent's configuration.
    
    Args:
        agent_id: The UUID of the agent to update
        agent_data: The updated agent configuration
    """
    try:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent with ID {agent_id} not found"
            )
        
        _check_agent_ownership(agent, user_id)
        
        # Update fields if provided
        update_data = agent_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(agent, field, value)
        
        db.commit()
        db.refresh(agent)
        
        logger.info(f"Successfully updated agent {agent_id}")
        
        return AgentResponse.model_validate(agent)
        
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating agent {agent_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while updating agent"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating agent {agent_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while updating agent"
        )


@router.delete(
    "/agents/{agent_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete agent",
    description="Delete an agent and all associated data"
)
async def delete_agent(
    agent_id: UUID,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_user_id)
):
    """
    Delete an agent and all associated data.
    
    Args:
        agent_id: The UUID of the agent to delete
    """
    try:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent with ID {agent_id} not found"
            )
        
        _check_agent_ownership(agent, user_id)
        
        db.delete(agent)
        db.commit()
        
        logger.info(f"Successfully deleted agent {agent_id}")
        
        return None
        
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting agent {agent_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while deleting agent"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting agent {agent_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while deleting agent"
        )


@router.patch(
    "/agents/{agent_id}/activate",
    response_model=AgentResponse,
    status_code=status.HTTP_200_OK,
    summary="Activate agent",
    description="Activate an agent"
)
async def activate_agent(
    agent_id: UUID,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_user_id)
) -> AgentResponse:
    """Activate an agent."""
    try:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent with ID {agent_id} not found"
            )
        
        _check_agent_ownership(agent, user_id)
        
        agent.is_active = True
        db.commit()
        db.refresh(agent)
        
        logger.info(f"Successfully activated agent {agent_id}")
        
        return AgentResponse.model_validate(agent)
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error activating agent {agent_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while activating agent"
        )


@router.patch(
    "/agents/{agent_id}/deactivate",
    response_model=AgentResponse,
    status_code=status.HTTP_200_OK,
    summary="Deactivate agent",
    description="Deactivate an agent"
)
async def deactivate_agent(
    agent_id: UUID,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_user_id)
) -> AgentResponse:
    """Deactivate an agent."""
    try:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent with ID {agent_id} not found"
            )
        
        _check_agent_ownership(agent, user_id)
        
        agent.is_active = False
        db.commit()
        db.refresh(agent)
        
        logger.info(f"Successfully deactivated agent {agent_id}")
        
        return AgentResponse.model_validate(agent)
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deactivating agent {agent_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while deactivating agent"
        )




