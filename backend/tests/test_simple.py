"""
Simple integration tests for the Voice AI Platform API.

Basic tests to verify the API endpoints work correctly.
"""

import pytest
import uuid
from datetime import datetime
from typing import Dict, Any

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from models.database import Base, Agent, Conversation, Message, Action
from tools.executor import ToolExecutor


# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_simple.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    session = TestingSessionLocal()
    
    yield session
    
    # Clean up
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


class TestBasicEndpoints:
    """Test basic API endpoints."""
    
    def test_health_check(self, client: TestClient):
        """Test health check endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Voice AI Platform"
    
    def test_api_health(self, client: TestClient):
        """Test API health endpoint."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "database" in data


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
    
    def test_get_agents_list(self, client: TestClient, db_session, sample_agent_data):
        """Test retrieving all agents."""
        # Create a few agents
        agent_data_1 = sample_agent_data.copy()
        agent_data_1["name"] = "Agent 1"
        agent_data_2 = sample_agent_data.copy()
        agent_data_2["name"] = "Agent 2"
        
        client.post("/api/agents", json=agent_data_1)
        client.post("/api/agents", json=agent_data_2)
        
        # Get all agents
        response = client.get("/api/agents")
        assert response.status_code == 200
        
        agents = response.json()
        assert len(agents) >= 2
        
        agent_names = [agent["name"] for agent in agents]
        assert "Agent 1" in agent_names
        assert "Agent 2" in agent_names


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


class TestToolExecution:
    """Test tool execution functionality."""
    
    def test_tool_executor_direct(self):
        """Test tool executor directly."""
        executor = ToolExecutor()
        
        # Test order lookup
        result = executor.execute_action("lookup_order", {"order_id": "ORD123456"})
        assert result.success is True
        assert "order" in result.result
        
        # Test invalid order
        result = executor.execute_action("lookup_order", {"order_id": "INVALID"})
        assert result.success is True  # Tool execution succeeds
        assert result.result["success"] is False  # But order lookup fails
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
        assert "email" in result.result
        assert result.result["email"]["message_id"] is not None
    
    def test_unknown_tool(self):
        """Test execution of unknown tool."""
        executor = ToolExecutor()
        result = executor.execute_action("unknown_tool", {})
        
        assert result.success is False
        assert "Unknown action type" in result.error


class TestErrorHandling:
    """Test error handling and edge cases."""
    
    def test_invalid_json_request(self, client: TestClient):
        """Test handling of invalid JSON in request."""
        response = client.post(
            "/api/agents",
            content="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422
    
    def test_nonexistent_endpoint(self, client: TestClient):
        """Test accessing non-existent endpoint."""
        response = client.get("/api/nonexistent")
        assert response.status_code == 404
    
    def test_invalid_uuid(self, client: TestClient):
        """Test accessing agent with invalid UUID."""
        response = client.get("/api/agents/invalid-uuid")
        assert response.status_code == 422


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
