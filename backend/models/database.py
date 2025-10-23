from sqlalchemy import (
    create_engine, Column, String, Text, DateTime, Boolean, Integer, 
    ForeignKey, Index, JSON, String as SQLString
)
from sqlalchemy.orm import relationship, sessionmaker, declarative_base
from sqlalchemy.sql import func
from sqlalchemy.types import TypeDecorator, CHAR
import uuid
import os
from dotenv import load_dotenv

load_dotenv()


# UUID type that works with both SQLite and PostgreSQL
class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(36), storing as stringified hex values.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            from sqlalchemy.dialects.postgresql import UUID
            return dialect.type_descriptor(UUID())
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if isinstance(value, uuid.UUID):
                return str(value)
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(value)


# Database URL - prioritize Supabase PostgreSQL, fallback to SQLite for development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./voice_ai.db")

# Override for test environment
if os.getenv("ENVIRONMENT") == "test":
    DATABASE_URL = "sqlite:///./test.db"

# Configure engine based on database type
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=os.getenv("ENVIRONMENT") != "test"
    )
else:
    # PostgreSQL or other databases
    engine = create_engine(DATABASE_URL, echo=os.getenv("ENVIRONMENT") != "test")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Agent(Base):
    """Agent model representing AI voice agents"""
    __tablename__ = "agents"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    industry = Column(String(100), nullable=False)
    role = Column(String(100), nullable=False)
    personality = Column(String(500), nullable=False)
    knowledge_base = Column(Text, nullable=False)
    greeting = Column(String(1000), nullable=False)
    voice_settings = Column(JSON, nullable=True)
    available_tools = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    conversations = relationship("Conversation", back_populates="agent")
    
    # Indexes
    __table_args__ = (
        Index('idx_agent_company', 'company'),
        Index('idx_agent_industry', 'industry'),
        Index('idx_agent_is_active', 'is_active'),
        Index('idx_agent_created_at', 'created_at'),
    )


class Conversation(Base):
    """Conversation model representing customer interactions"""
    __tablename__ = "conversations"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    agent_id = Column(GUID, ForeignKey("agents.id"), nullable=False)
    customer_phone = Column(String(20), nullable=True)
    customer_name = Column(String(255), nullable=True)
    status = Column(String(20), nullable=False, default="active")  # active, completed, failed
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    sentiment = Column(String(50), nullable=True)  # positive, negative, neutral
    
    # Relationships
    agent = relationship("Agent", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")
    actions = relationship("Action", back_populates="conversation")
    
    # Indexes
    __table_args__ = (
        Index('idx_conversation_agent_id', 'agent_id'),
        Index('idx_conversation_status', 'status'),
        Index('idx_conversation_customer_phone', 'customer_phone'),
        Index('idx_conversation_started_at', 'started_at'),
        Index('idx_conversation_sentiment', 'sentiment'),
    )


class Message(Base):
    """Message model representing individual messages in conversations"""
    __tablename__ = "messages"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    conversation_id = Column(GUID, ForeignKey("conversations.id"), nullable=False)
    role = Column(String(10), nullable=False)  # user or agent
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    message_metadata = Column(JSON, nullable=True)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    
    # Indexes
    __table_args__ = (
        Index('idx_message_conversation_id', 'conversation_id'),
        Index('idx_message_role', 'role'),
        Index('idx_message_timestamp', 'timestamp'),
    )


class Action(Base):
    """Action model representing actions taken during conversations"""
    __tablename__ = "actions"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    conversation_id = Column(GUID, ForeignKey("conversations.id"), nullable=False)
    action_type = Column(String(100), nullable=False)  # call_transfer, data_collection, etc.
    parameters = Column(JSON, nullable=False)
    result = Column(JSON, nullable=True)
    status = Column(String(20), nullable=False, default="pending")  # pending, completed, failed
    executed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    conversation = relationship("Conversation", back_populates="actions")
    
    # Indexes
    __table_args__ = (
        Index('idx_action_conversation_id', 'conversation_id'),
        Index('idx_action_type', 'action_type'),
        Index('idx_action_status', 'status'),
        Index('idx_action_executed_at', 'executed_at'),
    )


# Database initialization functions
def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)


def create_sample_data():
    """Create sample data for testing"""
    db = SessionLocal()
    try:
        # Check if agents already exist
        if db.query(Agent).count() == 0:
            sample_agent = Agent(
                name="Customer Support Assistant",
                company="TechCorp",
                industry="Technology",
                role="Customer Support",
                personality="Friendly, helpful, and professional",
                knowledge_base="Technical support for software products, troubleshooting, account management",
                greeting="Hello! I'm your customer support assistant. How can I help you today?",
                voice_settings={
                    "voice": "en-US-Standard-A",
                    "speed": 1.0,
                    "pitch": 0.0,
                    "volume": 1.0
                }
            )
            db.add(sample_agent)
            db.commit()
            print("Sample agent created successfully!")
    except Exception as e:
        print(f"Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    # Initialize database when running this file directly
    init_db()
    create_sample_data()
    print("Database initialized successfully!")
