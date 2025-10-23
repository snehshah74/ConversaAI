"""
Unit tests for individual components of the Voice AI Platform.

Tests individual functions, classes, and modules in isolation.
"""

import pytest
import uuid
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock

from models.database import Agent, Conversation, Message, Action
from models.schemas import AgentCreate, ChatRequest, AgentResponse
from tools.executor import ToolExecutor, BaseTool, ActionResult
from tools.custom_tools import CheckInventoryTool, UpdateCustomerProfileTool


class TestToolExecutor:
    """Test the tool executor functionality."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.executor = ToolExecutor()
    
    def test_tool_registration(self):
        """Test that tools are properly registered."""
        available_tools = self.executor.get_available_tools()
        
        expected_tools = [
            "lookup_order",
            "schedule_appointment", 
            "send_email",
            "create_ticket",
            "transfer_to_human"
        ]
        
        for tool in expected_tools:
            assert tool in available_tools
    
    def test_lookup_order_success(self):
        """Test successful order lookup."""
        result = self.executor.execute_action("lookup_order", {"order_id": "ORD123456"})
        
        assert result.success is True
        assert "order" in result.result
        assert result.result["order"]["order_id"] == "ORD123456"
        assert result.result["order"]["status"] == "shipped"
    
    def test_lookup_order_invalid_id(self):
        """Test order lookup with invalid ID."""
        result = self.executor.execute_action("lookup_order", {"order_id": "INVALID"})
        
        assert result.success is False
        assert "not found" in result.result["message"]
    
    def test_lookup_order_missing_parameter(self):
        """Test order lookup with missing required parameter."""
        result = self.executor.execute_action("lookup_order", {})
        
        assert result.success is False
        assert "required" in result.error.lower()
    
    def test_schedule_appointment_success(self):
        """Test successful appointment scheduling."""
        params = {
            "datetime": "2024-01-15T10:00:00",
            "customer_email": "test@example.com",
            "service_type": "Consultation"
        }
        
        result = self.executor.execute_action("schedule_appointment", params)
        
        assert result.success is True
        assert "appointment" in result.result
        assert result.result["appointment"]["customer_email"] == "test@example.com"
        assert result.result["appointment"]["service_type"] == "Consultation"
    
    def test_schedule_appointment_invalid_email(self):
        """Test appointment scheduling with invalid email."""
        params = {
            "datetime": "2024-01-15T10:00:00",
            "customer_email": "invalid-email"
        }
        
        result = self.executor.execute_action("schedule_appointment", params)
        
        assert result.success is False
        assert "email" in result.error.lower()
    
    def test_send_email_success(self):
        """Test successful email sending."""
        params = {
            "to": "customer@example.com",
            "subject": "Test Email",
            "body": "This is a test email"
        }
        
        result = self.executor.execute_action("send_email", params)
        
        assert result.success is True
        assert "email_id" in result.result
        assert result.result["to"] == "customer@example.com"
    
    def test_create_ticket_success(self):
        """Test successful ticket creation."""
        params = {
            "title": "Test Issue",
            "description": "This is a test issue",
            "priority": "medium",
            "category": "Technical"
        }
        
        result = self.executor.execute_action("create_ticket", params)
        
        assert result.success is True
        assert "ticket" in result.result
        assert result.result["ticket"]["title"] == "Test Issue"
        assert result.result["ticket"]["priority"] == "medium"
    
    def test_transfer_to_human_success(self):
        """Test successful human transfer."""
        params = {
            "reason": "Complex technical issue",
            "urgency": "high"
        }
        
        result = self.executor.execute_action("transfer_to_human", params)
        
        assert result.success is True
        assert "transfer" in result.result
        assert result.result["transfer"]["reason"] == "Complex technical issue"
        assert result.result["transfer"]["urgency"] == "high"
    
    def test_unknown_tool(self):
        """Test execution of unknown tool."""
        result = self.executor.execute_action("unknown_tool", {})
        
        assert result.success is False
        assert "Unknown action type" in result.error


class TestCustomTools:
    """Test custom tools functionality."""
    
    def test_check_inventory_tool(self):
        """Test the inventory check tool."""
        tool = CheckInventoryTool()
        
        # Test successful inventory check
        result = tool.execute({"product_id": "PROD001"})
        assert result["success"] is True
        assert "product" in result
        assert result["product"]["name"] == "Widget A"
        
        # Test invalid product ID
        result = tool.execute({"product_id": "INVALID"})
        assert result["success"] is False
        
        # Test validation
        error = tool.validate_params({"product_id": "invalid"})
        assert error is not None
        assert "start with 'PROD'" in error
    
    def test_update_customer_profile_tool(self):
        """Test the customer profile update tool."""
        tool = UpdateCustomerProfileTool()
        
        # Test successful update
        result = tool.execute({
            "customer_id": "CUST001",
            "name": "John Doe",
            "email": "john@example.com"
        })
        assert result["success"] is True
        assert result["customer_id"] == "CUST001"
        assert "name" in result["updated_fields"]
        
        # Test validation
        error = tool.validate_params({"customer_id": "invalid"})
        assert error is not None
        assert "start with 'CUST'" in error


class TestActionResult:
    """Test the ActionResult class."""
    
    def test_success_result(self):
        """Test successful action result."""
        result_data = {"order_id": "123", "status": "shipped"}
        result = ActionResult(success=True, result=result_data)
        
        assert result.success is True
        assert result.result == result_data
        assert result.error is None
        
        result_dict = result.to_dict()
        assert result_dict["success"] is True
        assert result_dict["result"] == result_data
        assert "error" not in result_dict
    
    def test_error_result(self):
        """Test error action result."""
        error_msg = "Order not found"
        result = ActionResult(success=False, error=error_msg)
        
        assert result.success is False
        assert result.error == error_msg
        assert result.result is None
        
        result_dict = result.to_dict()
        assert result_dict["success"] is False
        assert result_dict["error"] == error_msg
        assert "result" not in result_dict


class TestBaseTool:
    """Test the base tool functionality."""
    
    def test_tool_initialization(self):
        """Test tool initialization."""
        tool = BaseTool(
            name="test_tool",
            description="A test tool",
            required_params=["param1", "param2"],
            optional_params=["param3"]
        )
        
        assert tool.name == "test_tool"
        assert tool.description == "A test tool"
        assert tool.required_params == ["param1", "param2"]
        assert tool.optional_params == ["param3"]
    
    def test_parameter_validation(self):
        """Test parameter validation."""
        tool = BaseTool(
            name="test_tool",
            description="A test tool",
            required_params=["param1"]
        )
        
        # Test valid parameters
        error = tool.validate_params({"param1": "value1"})
        assert error is None
        
        # Test missing required parameter
        error = tool.validate_params({})
        assert error is not None
        assert "param1 is required" in error
        
        # Test empty required parameter
        error = tool.validate_params({"param1": ""})
        assert error is not None
        assert "param1 is required" in error
    
    def test_execute_not_implemented(self):
        """Test that execute raises NotImplementedError."""
        tool = BaseTool(name="test_tool", description="A test tool")
        
        with pytest.raises(NotImplementedError):
            tool.execute({})


class TestSchemas:
    """Test Pydantic schemas."""
    
    def test_agent_create_schema(self):
        """Test AgentCreate schema validation."""
        valid_data = {
            "name": "Test Agent",
            "company": "Test Company",
            "industry": "Technology",
            "role": "Customer Support",
            "personality": "friendly",
            "knowledge_base": "Test knowledge",
            "greeting": "Hello!",
            "is_active": True
        }
        
        agent = AgentCreate(**valid_data)
        assert agent.name == "Test Agent"
        assert agent.company == "Test Company"
        assert agent.is_active is True
    
    def test_agent_create_validation(self):
        """Test AgentCreate validation errors."""
        # Test missing required fields
        with pytest.raises(ValueError):
            AgentCreate(name="Test")  # Missing required fields
    
    def test_chat_request_schema(self):
        """Test ChatRequest schema validation."""
        valid_data = {
            "agent_id": str(uuid.uuid4()),
            "message": "Hello, I need help",
            "conversation_id": str(uuid.uuid4()),
            "customer_name": "John Doe",
            "customer_phone": "+1234567890",
            "message_metadata": {"test": True}
        }
        
        chat_request = ChatRequest(**valid_data)
        assert chat_request.message == "Hello, I need help"
        assert chat_request.customer_name == "John Doe"
        assert chat_request.message_metadata["test"] is True
    
    def test_chat_request_validation(self):
        """Test ChatRequest validation errors."""
        # Test empty message
        with pytest.raises(ValueError):
            ChatRequest(
                agent_id=str(uuid.uuid4()),
                message=""  # Empty message should fail
            )


class TestDatabaseModels:
    """Test database models."""
    
    def test_agent_model(self):
        """Test Agent model creation."""
        agent = Agent(
            name="Test Agent",
            company="Test Company",
            industry="Technology",
            role="Customer Support",
            personality="friendly",
            knowledge_base="Test knowledge",
            greeting="Hello!",
            is_active=True
        )
        
        assert agent.name == "Test Agent"
        assert agent.company == "Test Company"
        assert agent.is_active is True
        assert agent.created_at is not None
    
    def test_conversation_model(self):
        """Test Conversation model creation."""
        conversation = Conversation(
            agent_id=str(uuid.uuid4()),
            customer_name="John Doe",
            customer_phone="+1234567890",
            status="active"
        )
        
        assert conversation.customer_name == "John Doe"
        assert conversation.status == "active"
        assert conversation.started_at is not None
    
    def test_message_model(self):
        """Test Message model creation."""
        message = Message(
            conversation_id=str(uuid.uuid4()),
            role="user",
            content="Hello, I need help",
            message_metadata={"test": True}
        )
        
        assert message.role == "user"
        assert message.content == "Hello, I need help"
        assert message.message_metadata["test"] is True
        assert message.timestamp is not None
    
    def test_action_model(self):
        """Test Action model creation."""
        action = Action(
            conversation_id=str(uuid.uuid4()),
            action_type="lookup_order",
            parameters={"order_id": "123"},
            result={"status": "found"},
            status="completed"
        )
        
        assert action.action_type == "lookup_order"
        assert action.parameters["order_id"] == "123"
        assert action.result["status"] == "found"
        assert action.status == "completed"
        assert action.executed_at is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])




