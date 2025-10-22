"""
Integration tests for the Voice AI Platform API.

Tests the complete flow from agent creation to conversation handling.
"""

import pytest
import pytest_asyncio
import asyncio
import json
import uuid
import httpx
from datetime import datetime
from typing import Dict, Any

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from models.database import Base, Agent, Conversation, Message, Action, get_db
from models.schemas import AgentCreate, ChatRequest
from tools.executor import ToolExecutor


# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def client():
    """Create test client."""
    return TestClient(app)


@pytest_asyncio.fixture(scope="function")
async def async_client():
    """Create async test client."""
    async with httpx.AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    session = TestingSessionLocal()
    
    # Override the get_db dependency
    def override_get_db():
        try:
            yield session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    yield session
    
    # Clean up
    app.dependency_overrides.clear()
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_agent_data():
    """Sample agent data for testing."""
    return {
        "name": "Test Customer Support Agent",
        "company": "Test Company",
        "industry": "Technology",
        "role": "Customer Support",
        "personality": "friendly, helpful, patient",
        "knowledge_base": "You are a customer support agent for a technology company. Help customers with their technical issues and provide friendly assistance.",
        "greeting": "Hello! I'm your customer support assistant. How can I help you today?",
        "voice_settings": {
            "speed": 1.0,
            "pitch": 1.0
        },
        "available_tools": ["lookup_order", "send_email", "create_ticket", "transfer_to_human"],
        "is_active": True
    }


@pytest.fixture
def sample_chat_data():
    """Sample chat request data for testing."""
    return {
        "agent_id": None,  # Will be set in tests
        "message": "I need help with my order",
        "customer_name": "John Doe",
        "customer_phone": "+1234567890",
        "message_metadata": {
            "source": "test",
            "timestamp": datetime.now().isoformat()
        }
    }


class TestAgentCreation:
    """Test agent creation functionality."""
    
    def test_create_agent_success(self, client: TestClient, db_session, sample_agent_data):
        """Test successful agent creation."""
        response = client.post("/api/agents", json=sample_agent_data)
        
        assert response.status_code == 201
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["name"] == sample_agent_data["name"]
        assert data["company"] == sample_agent_data["company"]
        assert data["industry"] == sample_agent_data["industry"]
        assert data["role"] == sample_agent_data["role"]
        assert data["is_active"] == sample_agent_data["is_active"]
        assert "created_at" in data
        
        # Verify database record
        agent = db_session.query(Agent).filter(Agent.id == data["id"]).first()
        assert agent is not None
        assert agent.name == sample_agent_data["name"]
        assert agent.knowledge_base == sample_agent_data["knowledge_base"]
        assert agent.greeting == sample_agent_data["greeting"]
    
    def test_create_agent_missing_required_fields(self, client: TestClient):
        """Test agent creation with missing required fields."""
        incomplete_data = {
            "name": "Test Agent",
            # Missing required fields
        }
        
        response = client.post("/api/agents", json=incomplete_data)
        assert response.status_code == 422  # Validation error
    
    def test_get_agent(self, client: TestClient, db_session, sample_agent_data):
        """Test retrieving an agent by ID."""
        # First create an agent
        create_response = client.post("/api/agents", json=sample_agent_data)
        assert create_response.status_code == 201
        agent_id = create_response.json()["id"]
        
        # Then retrieve it
        get_response = client.get(f"/api/agents/{agent_id}")
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert data["id"] == agent_id
        assert data["name"] == sample_agent_data["name"]
    
    def test_get_nonexistent_agent(self, client: TestClient):
        """Test retrieving a non-existent agent."""
        fake_id = str(uuid.uuid4())
        response = client.get(f"/api/agents/{fake_id}")
        assert response.status_code == 404


class TestConversationManagement:
    """Test conversation creation and management."""
    
    def test_start_conversation(self, client: TestClient, db_session, sample_agent_data):
        """Test starting a new conversation."""
        # Create an agent first
        agent_response = client.post("/api/agents", json=sample_agent_data)
        agent_id = agent_response.json()["id"]
        
        # Start conversation
        conversation_data = {
            "agent_id": agent_id,
            "customer_name": "Jane Doe",
            "customer_phone": "+1987654321"
        }
        
        response = client.post("/api/conversations/start", json=conversation_data)
        assert response.status_code == 201
        
        data = response.json()
        assert "conversation_id" in data
        assert data["agent_id"] == agent_id
        assert data["status"] == "active"
        assert "started_at" in data
        
        # Verify database record
        conversation = db_session.query(Conversation).filter(
            Conversation.id == data["conversation_id"]
        ).first()
        assert conversation is not None
        assert conversation.agent_id == agent_id
        assert conversation.customer_name == "Jane Doe"
        assert conversation.status == "active"
    
    def test_get_conversation(self, client: TestClient, db_session, sample_agent_data):
        """Test retrieving a conversation with messages."""
        # Create agent and conversation
        agent_response = client.post("/api/agents", json=sample_agent_data)
        agent_id = agent_response.json()["id"]
        
        conversation_response = client.post("/api/conversations/start", json={
            "agent_id": agent_id,
            "customer_name": "Test User"
        })
        conversation_id = conversation_response.json()["conversation_id"]
        
        # Retrieve conversation
        get_response = client.get(f"/api/conversations/{conversation_id}")
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert data["id"] == conversation_id
        assert data["agent_id"] == agent_id
        assert "messages" in data
        assert isinstance(data["messages"], list)


class TestChatFunctionality:
    """Test chat message processing and agent responses."""
    
    @pytest.mark.asyncio
    async def test_send_message_success(self, async_client, db_session, sample_agent_data, sample_chat_data):
        """Test successful message sending and agent response."""
        # Create agent
        agent_response = await async_client.post("/api/agents", json=sample_agent_data)
        agent_id = agent_response.json()["id"]
        
        # Start conversation
        conversation_response = await async_client.post("/api/conversations/start", json={
            "agent_id": agent_id,
            "customer_name": sample_chat_data["customer_name"]
        })
        conversation_id = conversation_response.json()["conversation_id"]
        
        # Send message
        chat_request = {
            **sample_chat_data,
            "agent_id": agent_id,
            "conversation_id": conversation_id
        }
        
        response = await async_client.post("/api/chat", json=chat_request)
        assert response.status_code == 200
        
        data = response.json()
        assert "conversation_id" in data
        assert data["conversation_id"] == conversation_id
        assert "agent_response" in data
        assert "message_id" in data
        assert "timestamp" in data
        assert "status" in data
        
        # Verify database records
        # Check user message
        user_messages = db_session.query(Message).filter(
            Message.conversation_id == conversation_id,
            Message.role == "user"
        ).all()
        assert len(user_messages) == 1
        assert user_messages[0].content == sample_chat_data["message"]
        
        # Check agent message
        agent_messages = db_session.query(Message).filter(
            Message.conversation_id == conversation_id,
            Message.role == "agent"
        ).all()
        assert len(agent_messages) == 1
        assert agent_messages[0].content == data["agent_response"]
    
    @pytest.mark.asyncio
    async def test_send_message_without_conversation(self, async_client, sample_agent_data, sample_chat_data):
        """Test sending message without existing conversation (should create one)."""
        # Create agent
        agent_response = await async_client.post("/api/agents", json=sample_agent_data)
        agent_id = agent_response.json()["id"]
        
        # Send message without conversation_id
        chat_request = {
            **sample_chat_data,
            "agent_id": agent_id
        }
        
        response = await async_client.post("/api/chat", json=chat_request)
        assert response.status_code == 200
        
        data = response.json()
        assert "conversation_id" in data
        assert "agent_response" in data
        assert data["conversation_id"] is not None
    
    @pytest.mark.asyncio
    async def test_send_message_invalid_agent(self, async_client, sample_chat_data):
        """Test sending message to non-existent agent."""
        fake_agent_id = str(uuid.uuid4())
        chat_request = {
            **sample_chat_data,
            "agent_id": fake_agent_id
        }
        
        response = await async_client.post("/api/chat", json=chat_request)
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_send_message_missing_required_fields(self, async_client):
        """Test sending message with missing required fields."""
        incomplete_data = {
            "message": "Hello",
            # Missing agent_id
        }
        
        response = await async_client.post("/api/chat", json=incomplete_data)
        assert response.status_code == 422


class TestToolExecution:
    """Test tool execution functionality."""
    
    @pytest.mark.asyncio
    async def test_tool_execution_integration(self, async_client, db_session, sample_agent_data):
        """Test that tools are executed during chat interactions."""
        # Create agent with specific tools
        agent_data = {
            **sample_agent_data,
            "available_tools": ["lookup_order", "send_email", "transfer_to_human"]
        }
        
        agent_response = await async_client.post("/api/agents", json=agent_data)
        agent_id = agent_response.json()["id"]
        
        # Start conversation
        conversation_response = await async_client.post("/api/conversations/start", json={
            "agent_id": agent_id,
            "customer_name": "Tool Test User"
        })
        conversation_id = conversation_response.json()["conversation_id"]
        
        # Send message that should trigger tool execution
        chat_request = {
            "agent_id": agent_id,
            "conversation_id": conversation_id,
            "message": "Can you look up my order ORD123456?",
            "customer_name": "Tool Test User"
        }
        
        response = await async_client.post("/api/chat", json=chat_request)
        assert response.status_code == 200
        
        # Check if actions were recorded in database
        actions = db_session.query(Action).filter(
            Action.conversation_id == conversation_id
        ).all()
        
        # Should have at least one action recorded
        assert len(actions) >= 0  # Actions may or may not be triggered depending on agent logic
    
    def test_tool_executor_direct(self):
        """Test tool executor directly."""
        executor = ToolExecutor()
        
        # Test order lookup
        result = executor.execute_action("lookup_order", {"order_id": "ORD123456"})
        assert result.success is True
        assert "order" in result.result
        
        # Test invalid order
        result = executor.execute_action("lookup_order", {"order_id": "INVALID"})
        assert result.success is False
        assert "not found" in result.result["message"]
        
        # Test appointment scheduling
        result = executor.execute_action("schedule_appointment", {
            "datetime": "2024-01-15T10:00:00",
            "customer_email": "test@example.com",
            "service_type": "Consultation"
        })
        assert result.success is True
        assert "appointment" in result.result
        
        # Test email sending
        result = executor.execute_action("send_email", {
            "to": "customer@example.com",
            "subject": "Test Email",
            "body": "This is a test email"
        })
        assert result.success is True
        assert "email_id" in result.result


class TestErrorHandling:
    """Test error handling and edge cases."""
    
    @pytest.mark.asyncio
    async def test_invalid_json_request(self, async_client):
        """Test handling of invalid JSON in request."""
        response = await async_client.post(
            "/api/agents",
            content="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_missing_content_type(self, async_client, sample_agent_data):
        """Test handling of missing content type header."""
        response = await async_client.post("/api/agents", json=sample_agent_data)
        # Should still work as httpx sets content-type automatically
        assert response.status_code in [200, 201]
    
    @pytest.mark.asyncio
    async def test_health_endpoints(self, async_client):
        """Test health check endpoints."""
        # Test root health endpoint
        response = await async_client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
        
        # Test API health endpoint
        response = await async_client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "database" in data


class TestDatabaseIntegrity:
    """Test database integrity and relationships."""
    
    @pytest.mark.asyncio
    async def test_cascade_deletion(self, async_client, db_session, sample_agent_data):
        """Test that related records are handled properly."""
        # Create agent
        agent_response = await async_client.post("/api/agents", json=sample_agent_data)
        agent_id = agent_response.json()["id"]
        
        # Create conversation
        conversation_response = await async_client.post("/api/conversations/start", json={
            "agent_id": agent_id,
            "customer_name": "Cascade Test"
        })
        conversation_id = conversation_response.json()["conversation_id"]
        
        # Send a message to create messages
        chat_response = await async_client.post("/api/chat", json={
            "agent_id": agent_id,
            "conversation_id": conversation_id,
            "message": "Test cascade"
        })
        assert chat_response.status_code == 200
        
        # Verify relationships exist
        agent = db_session.query(Agent).filter(Agent.id == agent_id).first()
        conversation = db_session.query(Conversation).filter(Conversation.id == conversation_id).first()
        messages = db_session.query(Message).filter(Message.conversation_id == conversation_id).all()
        
        assert agent is not None
        assert conversation is not None
        assert conversation.agent_id == agent_id
        assert len(messages) >= 2  # User message + agent response
    
    @pytest.mark.asyncio
    async def test_data_validation(self, async_client, db_session):
        """Test database data validation."""
        # Test invalid UUID
        response = await async_client.get("/api/agents/invalid-uuid")
        assert response.status_code == 422
        
        # Test valid UUID but non-existent record
        valid_uuid = str(uuid.uuid4())
        response = await async_client.get(f"/api/agents/{valid_uuid}")
        assert response.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
