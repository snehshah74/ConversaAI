from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID


# Agent Schemas
class AgentCreate(BaseModel):
    """Schema for creating a new agent"""
    name: str = Field(..., min_length=1, max_length=255, description="Agent name")
    company: str = Field(..., min_length=1, max_length=255, description="Company name")
    industry: str = Field(..., min_length=1, max_length=100, description="Industry type")
    role: str = Field(..., min_length=1, max_length=100, description="Agent role")
    personality: str = Field(..., min_length=1, max_length=500, description="Agent personality")
    knowledge_base: str = Field(..., min_length=1, description="Knowledge base content")
    greeting: str = Field(..., min_length=1, max_length=1000, description="Greeting message")
    voice_settings: Optional[Dict[str, Any]] = Field(None, description="Voice configuration settings")
    available_tools: Optional[List[str]] = Field(None, description="List of available tools for the agent")
    is_active: bool = Field(True, description="Whether agent is active")

    model_config = ConfigDict(from_attributes=True)


class AgentResponse(BaseModel):
    """Schema for agent response data"""
    id: UUID
    name: str
    company: str
    industry: str
    role: str
    personality: str
    knowledge_base: str
    greeting: str
    voice_settings: Optional[Dict[str, Any]]
    available_tools: Optional[List[str]]
    created_at: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class AgentUpdate(BaseModel):
    """Schema for updating an existing agent"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    company: Optional[str] = Field(None, min_length=1, max_length=255)
    industry: Optional[str] = Field(None, min_length=1, max_length=100)
    role: Optional[str] = Field(None, min_length=1, max_length=100)
    personality: Optional[str] = Field(None, min_length=1, max_length=500)
    knowledge_base: Optional[str] = Field(None, min_length=1)
    greeting: Optional[str] = Field(None, min_length=1, max_length=1000)
    voice_settings: Optional[Dict[str, Any]] = None
    available_tools: Optional[List[str]] = None
    is_active: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)


# Chat Schemas
class ChatRequest(BaseModel):
    """Schema for chat request"""
    agent_id: UUID = Field(..., description="ID of the agent to chat with")
    message: str = Field(..., min_length=1, description="User message")
    conversation_id: Optional[UUID] = Field(None, description="Existing conversation ID (for continuing)")
    customer_phone: Optional[str] = Field(None, max_length=20, description="Customer phone number")
    customer_name: Optional[str] = Field(None, max_length=255, description="Customer name")
    message_metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

    model_config = ConfigDict(from_attributes=True)


class ChatResponse(BaseModel):
    """Schema for chat response"""
    conversation_id: UUID
    agent_response: str
    message_id: UUID
    timestamp: datetime
    status: str = Field(..., description="Response status")
    message_metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


# Message Schema
class MessageSchema(BaseModel):
    """Schema for message data"""
    id: UUID
    conversation_id: UUID
    role: str = Field(..., description="Message role: user or agent")
    content: str
    timestamp: datetime
    message_metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class MessageCreate(BaseModel):
    """Schema for creating a new message"""
    conversation_id: UUID
    role: str = Field(..., pattern="^(user|agent)$", description="Message role")
    content: str = Field(..., min_length=1, description="Message content")
    message_metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


# Conversation Schema
class ConversationSchema(BaseModel):
    """Schema for conversation data"""
    id: UUID
    agent_id: UUID
    customer_phone: Optional[str]
    customer_name: Optional[str]
    status: str = Field(..., description="Conversation status")
    started_at: datetime
    ended_at: Optional[datetime]
    duration_seconds: Optional[int]
    sentiment: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class ConversationCreate(BaseModel):
    """Schema for creating a new conversation"""
    agent_id: UUID = Field(..., description="ID of the agent")
    customer_phone: Optional[str] = Field(None, max_length=20)
    customer_name: Optional[str] = Field(None, max_length=255)
    status: str = Field("active", description="Initial conversation status")

    model_config = ConfigDict(from_attributes=True)


class ConversationUpdate(BaseModel):
    """Schema for updating a conversation"""
    customer_phone: Optional[str] = Field(None, max_length=20)
    customer_name: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = Field(None, description="Conversation status")
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    sentiment: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Action Schema
class ActionSchema(BaseModel):
    """Schema for action data"""
    id: UUID
    conversation_id: UUID
    action_type: str = Field(..., description="Type of action performed")
    parameters: Dict[str, Any] = Field(..., description="Action parameters")
    result: Optional[Dict[str, Any]] = None
    status: str = Field(..., description="Action status")
    executed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActionCreate(BaseModel):
    """Schema for creating a new action"""
    conversation_id: UUID = Field(..., description="ID of the conversation")
    action_type: str = Field(..., min_length=1, max_length=100, description="Type of action")
    parameters: Dict[str, Any] = Field(..., description="Action parameters")
    result: Optional[Dict[str, Any]] = None
    status: str = Field("pending", description="Initial action status")

    model_config = ConfigDict(from_attributes=True)


class ActionUpdate(BaseModel):
    """Schema for updating an action"""
    result: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Extended schemas with relationships
class ConversationWithMessages(BaseModel):
    """Conversation schema with included messages"""
    id: UUID
    agent_id: UUID
    customer_phone: Optional[str]
    customer_name: Optional[str]
    status: str
    started_at: datetime
    ended_at: Optional[datetime]
    duration_seconds: Optional[int]
    sentiment: Optional[str]
    messages: List[MessageSchema] = []

    model_config = ConfigDict(from_attributes=True)


class ConversationWithDetails(BaseModel):
    """Conversation schema with messages and actions"""
    id: UUID
    agent_id: UUID
    customer_phone: Optional[str]
    customer_name: Optional[str]
    status: str
    started_at: datetime
    ended_at: Optional[datetime]
    duration_seconds: Optional[int]
    sentiment: Optional[str]
    messages: List[MessageSchema] = []
    actions: List[ActionSchema] = []
    agent: Optional[AgentResponse] = None

    model_config = ConfigDict(from_attributes=True)


# Error and Status Schemas
class ErrorResponse(BaseModel):
    """Schema for error responses"""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    status_code: int = Field(..., description="HTTP status code")

    model_config = ConfigDict(from_attributes=True)


class StatusResponse(BaseModel):
    """Schema for status responses"""
    status: str = Field(..., description="Status message")
    message: Optional[str] = Field(None, description="Additional status information")

    model_config = ConfigDict(from_attributes=True)


# Pagination Schema
class PaginatedResponse(BaseModel):
    """Schema for paginated responses"""
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int

    model_config = ConfigDict(from_attributes=True)
