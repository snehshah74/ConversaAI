"""
Example custom tools to demonstrate extensibility
"""

from typing import Dict, Any
from .executor import BaseTool


class CheckInventoryTool(BaseTool):
    """Custom tool for checking product inventory"""
    
    def __init__(self):
        super().__init__(
            name="check_inventory",
            description="Check product inventory levels"
        )
        self.required_params = ["product_id"]
        self.optional_params = ["location"]
    
    def validate_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Validate inventory check parameters"""
        if "product_id" not in params:
            raise ValueError("product_id is required")
        
        product_id = str(params["product_id"]).strip()
        if not product_id:
            raise ValueError("product_id cannot be empty")
        
        result = {"product_id": product_id}
        
        if "location" in params:
            result["location"] = str(params["location"]).strip()
        
        return result
    
    def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute inventory check (mock implementation)"""
        # Mock inventory data
        mock_inventory = {
            "PROD001": {"name": "Widget A", "stock": 150, "location": "Warehouse 1"},
            "PROD002": {"name": "Widget B", "stock": 0, "location": "Warehouse 2"},
            "PROD003": {"name": "Widget C", "stock": 75, "location": "Warehouse 1"}
        }
        
        product_id = params["product_id"]
        
        if product_id in mock_inventory:
            item = mock_inventory[product_id]
            return {
                "success": True,
                "product": item,
                "in_stock": item["stock"] > 0,
                "message": f"Product {product_id} has {item['stock']} units in stock"
            }
        else:
            return {
                "success": False,
                "product": None,
                "in_stock": False,
                "message": f"Product {product_id} not found"
            }


class UpdateCustomerProfileTool(BaseTool):
    """Custom tool for updating customer profiles"""
    
    def __init__(self):
        super().__init__(
            name="update_customer_profile",
            description="Update customer profile information"
        )
        self.required_params = ["customer_id", "field", "value"]
        self.optional_params = ["notes"]
    
    def validate_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Validate profile update parameters"""
        required_fields = ["customer_id", "field", "value"]
        for field in required_fields:
            if field not in params:
                raise ValueError(f"{field} is required")
        
        customer_id = str(params["customer_id"]).strip()
        if not customer_id:
            raise ValueError("customer_id cannot be empty")
        
        field = str(params["field"]).strip()
        allowed_fields = ["name", "email", "phone", "address", "preferences"]
        if field not in allowed_fields:
            raise ValueError(f"field must be one of: {', '.join(allowed_fields)}")
        
        value = str(params["value"]).strip()
        if not value:
            raise ValueError("value cannot be empty")
        
        result = {
            "customer_id": customer_id,
            "field": field,
            "value": value
        }
        
        if "notes" in params:
            result["notes"] = str(params["notes"]).strip()
        
        return result
    
    def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute profile update (mock implementation)"""
        update_id = f"UPD-{params['customer_id'][:8].upper()}"
        
        return {
            "success": True,
            "update_id": update_id,
            "customer_id": params["customer_id"],
            "field": params["field"],
            "old_value": "Previous Value",  # Mock old value
            "new_value": params["value"],
            "updated_at": "2025-10-04T22:55:00Z",
            "message": f"Customer profile updated successfully"
        }


# Example of how to register custom tools
def register_custom_tools(executor):
    """Register custom tools with the executor"""
    custom_tools = [
        CheckInventoryTool(),
        UpdateCustomerProfileTool()
    ]
    
    for tool in custom_tools:
        executor.register_tool(tool)
    
    return len(custom_tools)


# Example usage
if __name__ == "__main__":
    from .executor import ToolExecutor
    
    # Create executor and register custom tools
    executor = ToolExecutor()
    custom_count = register_custom_tools(executor)
    
    print(f"Registered {custom_count} custom tools")
    print("All available tools:", executor.get_available_tools())
    
    # Test custom tools
    print("\nTesting inventory check:")
    result = executor.execute_action("check_inventory", {"product_id": "PROD001"})
    print(f"Success: {result.success}")
    print(f"Result: {result.result}")
    
    print("\nTesting profile update:")
    result = executor.execute_action("update_customer_profile", {
        "customer_id": "CUST123",
        "field": "email", 
        "value": "newemail@example.com",
        "notes": "Customer requested email change"
    })
    print(f"Success: {result.success}")
    print(f"Result: {result.result}")
