"""
Tool Executor for Voice AI Agent Actions
Extensible system for executing agent actions with validation and logging
"""

import logging
import json
from typing import Dict, Any, Optional, Callable, List
from datetime import datetime, timedelta
from dataclasses import dataclass
from abc import ABC, abstractmethod
import uuid
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class ActionResult:
    """Result of a tool execution"""
    success: bool
    result: Dict[str, Any]
    error: Optional[str] = None
    execution_time_ms: Optional[float] = None


@dataclass
class ToolDefinition:
    """Definition of a tool"""
    name: str
    description: str
    required_params: List[str]
    optional_params: List[str]
    function: Callable


class BaseTool(ABC):
    """Base class for all tools"""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.required_params = []
        self.optional_params = []
    
    @abstractmethod
    def validate_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean parameters"""
        pass
    
    @abstractmethod
    def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the tool with validated parameters"""
        pass
    
    def run(self, params: Dict[str, Any]) -> ActionResult:
        """Run the tool with validation and error handling"""
        start_time = datetime.now()
        
        try:
            # Validate parameters
            validated_params = self.validate_params(params)
            
            # Execute the tool
            result = self.execute(validated_params)
            
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            
            logger.info(f"Tool '{self.name}' executed successfully in {execution_time:.2f}ms")
            
            return ActionResult(
                success=True,
                result=result,
                execution_time_ms=execution_time
            )
            
        except ValueError as e:
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            logger.error(f"Tool '{self.name}' validation error: {e}")
            return ActionResult(
                success=False,
                result={},
                error=f"Validation error: {e}",
                execution_time_ms=execution_time
            )
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            logger.error(f"Tool '{self.name}' execution error: {e}")
            return ActionResult(
                success=False,
                result={},
                error=f"Execution error: {e}",
                execution_time_ms=execution_time
            )


class LookupOrderTool(BaseTool):
    """Tool for looking up order information"""
    
    def __init__(self):
        super().__init__(
            name="lookup_order",
            description="Look up order information by order ID"
        )
        self.required_params = ["order_id"]
        self.optional_params = []
    
    def validate_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Validate order lookup parameters"""
        if "order_id" not in params:
            raise ValueError("order_id is required")
        
        order_id = str(params["order_id"]).strip()
        if not order_id:
            raise ValueError("order_id cannot be empty")
        
        # Validate order ID format (alphanumeric, 6-12 characters)
        if not re.match(r'^[A-Z0-9]{6,12}$', order_id.upper()):
            raise ValueError("order_id must be 6-12 alphanumeric characters")
        
        return {"order_id": order_id.upper()}
    
    def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute order lookup (mock implementation)"""
        order_id = params["order_id"]
        
        # Mock order data - replace with actual API call
        mock_orders = {
            "ORD123456": {
                "order_id": "ORD123456",
                "status": "shipped",
                "customer_name": "John Doe",
                "items": [
                    {"name": "Product A", "quantity": 2, "price": 29.99},
                    {"name": "Product B", "quantity": 1, "price": 49.99}
                ],
                "total": 109.97,
                "shipping_address": "123 Main St, City, State 12345",
                "estimated_delivery": "2024-01-15",
                "tracking_number": "1Z999AA1234567890"
            },
            "ORD789012": {
                "order_id": "ORD789012",
                "status": "processing",
                "customer_name": "Jane Smith",
                "items": [
                    {"name": "Product C", "quantity": 1, "price": 79.99}
                ],
                "total": 79.99,
                "shipping_address": "456 Oak Ave, City, State 67890",
                "estimated_delivery": "2024-01-20",
                "tracking_number": None
            }
        }
        
        if order_id in mock_orders:
            return {
                "success": True,
                "order": mock_orders[order_id],
                "message": f"Order {order_id} found"
            }
        else:
            return {
                "success": False,
                "order": None,
                "message": f"Order {order_id} not found"
            }


class ScheduleAppointmentTool(BaseTool):
    """Tool for scheduling appointments"""
    
    def __init__(self):
        super().__init__(
            name="schedule_appointment",
            description="Schedule an appointment for a customer"
        )
        self.required_params = ["datetime", "customer_email"]
        self.optional_params = ["service_type", "notes", "duration_minutes"]
    
    def validate_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Validate appointment scheduling parameters"""
        if "datetime" not in params:
            raise ValueError("datetime is required")
        if "customer_email" not in params:
            raise ValueError("customer_email is required")
        
        # Validate email format
        email = params["customer_email"].strip().lower()
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            raise ValueError("Invalid email format")
        
        # Validate datetime format (basic check)
        datetime_str = params["datetime"].strip()
        try:
            # Try to parse various datetime formats
            datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
        except ValueError:
            raise ValueError("Invalid datetime format. Use ISO format (YYYY-MM-DDTHH:MM:SS)")
        
        result = {
            "datetime": datetime_str,
            "customer_email": email
        }
        
        # Optional parameters
        if "service_type" in params:
            result["service_type"] = str(params["service_type"]).strip()
        if "notes" in params:
            result["notes"] = str(params["notes"]).strip()
        if "duration_minutes" in params:
            duration = int(params["duration_minutes"])
            if duration < 15 or duration > 480:  # 15 minutes to 8 hours
                raise ValueError("duration_minutes must be between 15 and 480")
            result["duration_minutes"] = duration
        
        return result
    
    def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute appointment scheduling (mock implementation)"""
        appointment_id = f"APT-{uuid.uuid4().hex[:8].upper()}"
        
        # Mock appointment creation
        appointment = {
            "appointment_id": appointment_id,
            "datetime": params["datetime"],
            "customer_email": params["customer_email"],
            "service_type": params.get("service_type", "General Consultation"),
            "notes": params.get("notes", ""),
            "duration_minutes": params.get("duration_minutes", 60),
            "status": "confirmed",
            "created_at": datetime.now().isoformat(),
            "confirmation_code": f"CONF-{uuid.uuid4().hex[:6].upper()}"
        }
        
        return {
            "success": True,
            "appointment": appointment,
            "message": f"Appointment {appointment_id} scheduled successfully"
        }


class SendEmailTool(BaseTool):
    """Tool for sending emails"""
    
    def __init__(self):
        super().__init__(
            name="send_email",
            description="Send an email to a customer"
        )
        self.required_params = ["to", "subject", "body"]
        self.optional_params = ["cc", "bcc", "priority"]
    
    def validate_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Validate email sending parameters"""
        if "to" not in params:
            raise ValueError("to (recipient email) is required")
        if "subject" not in params:
            raise ValueError("subject is required")
        if "body" not in params:
            raise ValueError("body is required")
        
        # Validate recipient email
        to_email = params["to"].strip().lower()
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', to_email):
            raise ValueError("Invalid recipient email format")
        
        # Validate subject length
        subject = params["subject"].strip()
        if len(subject) < 1 or len(subject) > 200:
            raise ValueError("Subject must be between 1 and 200 characters")
        
        # Validate body length
        body = params["body"].strip()
        if len(body) < 1 or len(body) > 10000:
            raise ValueError("Body must be between 1 and 10,000 characters")
        
        result = {
            "to": to_email,
            "subject": subject,
            "body": body
        }
        
        # Optional parameters
        if "cc" in params and params["cc"]:
            cc_emails = [email.strip().lower() for email in str(params["cc"]).split(",")]
            for email in cc_emails:
                if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
                    raise ValueError(f"Invalid CC email format: {email}")
            result["cc"] = cc_emails
        
        if "bcc" in params and params["bcc"]:
            bcc_emails = [email.strip().lower() for email in str(params["bcc"]).split(",")]
            for email in bcc_emails:
                if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
                    raise ValueError(f"Invalid BCC email format: {email}")
            result["bcc"] = bcc_emails
        
        if "priority" in params:
            priority = str(params["priority"]).lower()
            if priority not in ["low", "normal", "high", "urgent"]:
                raise ValueError("Priority must be: low, normal, high, or urgent")
            result["priority"] = priority
        
        return result
    
    def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute email sending (mock implementation)"""
        message_id = f"MSG-{uuid.uuid4().hex[:8].upper()}"
        
        # Mock email sending
        email = {
            "message_id": message_id,
            "to": params["to"],
            "subject": params["subject"],
            "body": params["body"],
            "cc": params.get("cc", []),
            "bcc": params.get("bcc", []),
            "priority": params.get("priority", "normal"),
            "status": "sent",
            "sent_at": datetime.now().isoformat(),
            "delivery_status": "delivered"
        }
        
        return {
            "success": True,
            "email": email,
            "message": f"Email {message_id} sent successfully"
        }


class CreateTicketTool(BaseTool):
    """Tool for creating support tickets"""
    
    def __init__(self):
        super().__init__(
            name="create_ticket",
            description="Create a support ticket for customer issues"
        )
        self.required_params = ["title", "description"]
        self.optional_params = ["priority", "category", "customer_email", "assigned_to"]
    
    def validate_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Validate ticket creation parameters"""
        if "title" not in params:
            raise ValueError("title is required")
        if "description" not in params:
            raise ValueError("description is required")
        
        # Validate title length
        title = params["title"].strip()
        if len(title) < 5 or len(title) > 200:
            raise ValueError("Title must be between 5 and 200 characters")
        
        # Validate description length
        description = params["description"].strip()
        if len(description) < 10 or len(description) > 5000:
            raise ValueError("Description must be between 10 and 5,000 characters")
        
        result = {
            "title": title,
            "description": description
        }
        
        # Optional parameters
        if "priority" in params:
            priority = str(params["priority"]).lower()
            if priority not in ["low", "medium", "high", "urgent"]:
                raise ValueError("Priority must be: low, medium, high, or urgent")
            result["priority"] = priority
        
        if "category" in params:
            result["category"] = str(params["category"]).strip()
        
        if "customer_email" in params:
            email = params["customer_email"].strip().lower()
            if email and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
                raise ValueError("Invalid customer email format")
            result["customer_email"] = email
        
        if "assigned_to" in params:
            result["assigned_to"] = str(params["assigned_to"]).strip()
        
        return result
    
    def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute ticket creation (mock implementation)"""
        ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
        
        # Mock ticket creation
        ticket = {
            "ticket_id": ticket_id,
            "title": params["title"],
            "description": params["description"],
            "priority": params.get("priority", "medium"),
            "category": params.get("category", "General"),
            "customer_email": params.get("customer_email", ""),
            "assigned_to": params.get("assigned_to", "Support Team"),
            "status": "open",
            "created_at": datetime.now().isoformat(),
            "estimated_resolution": (datetime.now() + timedelta(hours=24)).isoformat()
        }
        
        return {
            "success": True,
            "ticket": ticket,
            "message": f"Ticket {ticket_id} created successfully"
        }


class TransferToHumanTool(BaseTool):
    """Tool for transferring to human agent"""
    
    def __init__(self):
        super().__init__(
            name="transfer_to_human",
            description="Transfer the conversation to a human agent"
        )
        self.required_params = ["reason"]
        self.optional_params = ["urgency", "customer_info"]
    
    def validate_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Validate transfer parameters"""
        if "reason" not in params:
            raise ValueError("reason is required")
        
        reason = params["reason"].strip()
        if len(reason) < 5 or len(reason) > 500:
            raise ValueError("Reason must be between 5 and 500 characters")
        
        result = {"reason": reason}
        
        # Optional parameters
        if "urgency" in params:
            urgency = str(params["urgency"]).lower()
            if urgency not in ["low", "medium", "high", "critical"]:
                raise ValueError("Urgency must be: low, medium, high, or critical")
            result["urgency"] = urgency
        
        if "customer_info" in params:
            result["customer_info"] = str(params["customer_info"]).strip()
        
        return result
    
    def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute transfer to human (mock implementation)"""
        transfer_id = f"TRF-{uuid.uuid4().hex[:8].upper()}"
        
        # Mock transfer creation
        transfer = {
            "transfer_id": transfer_id,
            "reason": params["reason"],
            "urgency": params.get("urgency", "medium"),
            "customer_info": params.get("customer_info", ""),
            "status": "initiated",
            "created_at": datetime.now().isoformat(),
            "estimated_wait_time": "2-5 minutes",
            "assigned_agent": "Available Agent",
            "queue_position": 1
        }
        
        return {
            "success": True,
            "transfer": transfer,
            "message": f"Transfer {transfer_id} initiated successfully"
        }


class ToolExecutor:
    """Main tool executor for managing and executing all tools"""
    
    def __init__(self):
        self.tools: Dict[str, BaseTool] = {}
        self._register_default_tools()
    
    def _register_default_tools(self):
        """Register all default tools"""
        default_tools = [
            LookupOrderTool(),
            ScheduleAppointmentTool(),
            SendEmailTool(),
            CreateTicketTool(),
            TransferToHumanTool()
        ]
        
        for tool in default_tools:
            self.register_tool(tool)
    
    def register_tool(self, tool: BaseTool):
        """Register a new tool"""
        self.tools[tool.name] = tool
        logger.info(f"Registered tool: {tool.name}")
    
    def get_available_tools(self) -> List[str]:
        """Get list of available tool names"""
        return list(self.tools.keys())
    
    def get_tool_info(self, tool_name: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific tool"""
        if tool_name not in self.tools:
            return None
        
        tool = self.tools[tool_name]
        return {
            "name": tool.name,
            "description": tool.description,
            "required_params": tool.required_params,
            "optional_params": tool.optional_params
        }
    
    def execute_action(self, action_type: str, parameters: Dict[str, Any]) -> ActionResult:
        """Execute an action with the specified tool"""
        logger.info(f"Executing action: {action_type} with parameters: {parameters}")
        
        if action_type not in self.tools:
            error_msg = f"Unknown action type: {action_type}. Available tools: {self.get_available_tools()}"
            logger.error(error_msg)
            return ActionResult(
                success=False,
                result={},
                error=error_msg
            )
        
        tool = self.tools[action_type]
        return tool.run(parameters)


# Convenience functions for backward compatibility
def execute_action(action_type: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Execute an action and return simplified result"""
    executor = ToolExecutor()
    result = executor.execute_action(action_type, parameters)
    
    return {
        "success": result.success,
        "result": result.result,
        "error": result.error,
        "execution_time_ms": result.execution_time_ms
    }


def lookup_order(order_id: str) -> Dict[str, Any]:
    """Look up order information"""
    return execute_action("lookup_order", {"order_id": order_id})


def schedule_appointment(datetime: str, customer_email: str, **kwargs) -> Dict[str, Any]:
    """Schedule an appointment"""
    params = {"datetime": datetime, "customer_email": customer_email}
    params.update(kwargs)
    return execute_action("schedule_appointment", params)


def send_email(to: str, subject: str, body: str, **kwargs) -> Dict[str, Any]:
    """Send an email"""
    params = {"to": to, "subject": subject, "body": body}
    params.update(kwargs)
    return execute_action("send_email", params)


def create_ticket(title: str, description: str, **kwargs) -> Dict[str, Any]:
    """Create a support ticket"""
    params = {"title": title, "description": description}
    params.update(kwargs)
    return execute_action("create_ticket", params)


def transfer_to_human(reason: str, **kwargs) -> Dict[str, Any]:
    """Transfer to human agent"""
    params = {"reason": reason}
    params.update(kwargs)
    return execute_action("transfer_to_human", params)


# Example usage and testing
if __name__ == "__main__":
    # Test the tool executor
    executor = ToolExecutor()
    
    print("Available tools:", executor.get_available_tools())
    
    # Test order lookup
    print("\nTesting order lookup:")
    result = executor.execute_action("lookup_order", {"order_id": "ORD123456"})
    print(f"Success: {result.success}")
    print(f"Result: {json.dumps(result.result, indent=2)}")
    
    # Test appointment scheduling
    print("\nTesting appointment scheduling:")
    result = executor.execute_action("schedule_appointment", {
        "datetime": "2024-01-15T10:00:00",
        "customer_email": "customer@example.com",
        "service_type": "Consultation"
    })
    print(f"Success: {result.success}")
    print(f"Result: {json.dumps(result.result, indent=2)}")
    
    # Test email sending
    print("\nTesting email sending:")
    result = executor.execute_action("send_email", {
        "to": "customer@example.com",
        "subject": "Your Order Update",
        "body": "Your order has been shipped!"
    })
    print(f"Success: {result.success}")
    print(f"Result: {json.dumps(result.result, indent=2)}")
    
    # Test ticket creation
    print("\nTesting ticket creation:")
    result = executor.execute_action("create_ticket", {
        "title": "Login Issue",
        "description": "Customer cannot log into their account",
        "priority": "high",
        "customer_email": "customer@example.com"
    })
    print(f"Success: {result.success}")
    print(f"Result: {json.dumps(result.result, indent=2)}")
    
    # Test human transfer
    print("\nTesting human transfer:")
    result = executor.execute_action("transfer_to_human", {
        "reason": "Customer needs assistance with billing dispute",
        "urgency": "high"
    })
    print(f"Success: {result.success}")
    print(f"Result: {json.dumps(result.result, indent=2)}")
