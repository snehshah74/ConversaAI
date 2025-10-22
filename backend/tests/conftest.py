"""
Shared test fixtures and configuration for the Voice AI Platform tests.
"""

import pytest
import asyncio
import os
import tempfile
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from models.database import Base


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def test_db():
    """Create a temporary test database."""
    # Create temporary database file
    db_fd, db_path = tempfile.mkstemp(suffix='.db')
    
    # Create engine with temporary database
    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    yield engine
    
    # Cleanup
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture(scope="function")
def db_session(test_db):
    """Create a database session for testing."""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_db)
    session = SessionLocal()
    
    yield session
    
    session.close()


@pytest.fixture(autouse=True)
def setup_test_environment():
    """Set up test environment variables."""
    # Set test environment variables
    os.environ["ENVIRONMENT"] = "test"
    os.environ["GOOGLE_API_KEY"] = "test-api-key"
    
    yield
    
    # Cleanup environment variables
    if "ENVIRONMENT" in os.environ:
        del os.environ["ENVIRONMENT"]
    if "GOOGLE_API_KEY" in os.environ:
        del os.environ["GOOGLE_API_KEY"]


@pytest.fixture
def mock_agent_data():
    """Mock agent data for testing."""
    return {
        "name": "Test Agent",
        "company": "Test Company",
        "industry": "Technology",
        "role": "Customer Support",
        "personality": "friendly, helpful",
        "knowledge_base": "Test knowledge base",
        "greeting": "Hello! How can I help you?",
        "voice_settings": {"speed": 1.0, "pitch": 1.0},
        "available_tools": ["lookup_order", "send_email"],
        "is_active": True
    }


@pytest.fixture
def mock_conversation_data():
    """Mock conversation data for testing."""
    return {
        "agent_id": None,  # Will be set in tests
        "customer_name": "Test Customer",
        "customer_phone": "+1234567890",
        "status": "active"
    }


@pytest.fixture
def mock_chat_data():
    """Mock chat request data for testing."""
    return {
        "agent_id": None,  # Will be set in tests
        "message": "Hello, I need help",
        "conversation_id": None,  # Will be set in tests
        "customer_name": "Test Customer",
        "customer_phone": "+1234567890",
        "message_metadata": {"test": True}
    }


# Test markers
pytest_plugins = []




