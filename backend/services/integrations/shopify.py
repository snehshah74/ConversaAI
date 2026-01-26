"""
Shopify Integration
Handles Shopify OAuth and API operations
"""
import httpx
import logging
from typing import Dict, Any
from services.integrations import BaseIntegration

logger = logging.getLogger(__name__)

class ShopifyIntegration(BaseIntegration):
    """Shopify integration for e-commerce operations"""
    
    def __init__(self, integration_id: str, config: Dict[str, Any]):
        super().__init__(integration_id, config)
        self.shop_domain = config.get('shop_domain') or config.get('config', {}).get('shop_domain')
        self.api_version = '2024-01'
    
    def connect(self, credentials: Dict[str, Any]) -> bool:
        """Connect to Shopify using OAuth credentials"""
        try:
            self.access_token = credentials.get('access_token')
            self.shop_domain = credentials.get('shop_domain')
            return self.test_connection().get('success', False)
        except Exception as e:
            logger.error(f"Shopify connection error: {e}")
            return False
    
    def disconnect(self) -> bool:
        """Disconnect from Shopify"""
        self.access_token = None
        self.shop_domain = None
        return True
    
    def test_connection(self) -> Dict[str, Any]:
        """Test Shopify connection"""
        try:
            if not self.access_token or not self.shop_domain:
                return {"success": False, "error": "Missing credentials"}
            
            url = f"https://{self.shop_domain}/admin/api/{self.api_version}/shop.json"
            headers = {
                "X-Shopify-Access-Token": self.access_token
            }
            
            with httpx.Client() as client:
                response = client.get(url, headers=headers, timeout=10)
                if response.status_code == 200:
                    return {"success": True, "shop": response.json().get("shop")}
                else:
                    return {"success": False, "error": f"HTTP {response.status_code}"}
        except Exception as e:
            logger.error(f"Shopify test connection error: {e}")
            return {"success": False, "error": str(e)}
    
    def sync_data(self) -> Dict[str, Any]:
        """Sync orders, products, and customers from Shopify"""
        try:
            results = {
                "orders": [],
                "products": [],
                "customers": []
            }
            
            # Sync orders
            orders = self.execute_action("get_orders", {"limit": 50})
            if orders.get("success"):
                results["orders"] = orders.get("data", [])
            
            # Sync products
            products = self.execute_action("get_products", {"limit": 50})
            if products.get("success"):
                results["products"] = products.get("data", [])
            
            return {"success": True, "data": results}
        except Exception as e:
            logger.error(f"Shopify sync error: {e}")
            return {"success": False, "error": str(e)}
    
    def execute_action(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Shopify API actions"""
        try:
            if not self.access_token or not self.shop_domain:
                return {"success": False, "error": "Not connected"}
            
            base_url = f"https://{self.shop_domain}/admin/api/{self.api_version}"
            headers = {
                "X-Shopify-Access-Token": self.access_token,
                "Content-Type": "application/json"
            }
            
            if action == "get_order":
                order_id = params.get("order_id") or params.get("order_number")
                url = f"{base_url}/orders/{order_id}.json"
                
                with httpx.Client() as client:
                    response = client.get(url, headers=headers, timeout=10)
                    if response.status_code == 200:
                        return {"success": True, "data": response.json().get("order")}
                    else:
                        return {"success": False, "error": f"HTTP {response.status_code}"}
            
            elif action == "get_orders":
                limit = params.get("limit", 50)
                url = f"{base_url}/orders.json?limit={limit}"
                
                with httpx.Client() as client:
                    response = client.get(url, headers=headers, timeout=10)
                    if response.status_code == 200:
                        return {"success": True, "data": response.json().get("orders", [])}
                    else:
                        return {"success": False, "error": f"HTTP {response.status_code}"}
            
            elif action == "get_products":
                limit = params.get("limit", 50)
                url = f"{base_url}/products.json?limit={limit}"
                
                with httpx.Client() as client:
                    response = client.get(url, headers=headers, timeout=10)
                    if response.status_code == 200:
                        return {"success": True, "data": response.json().get("products", [])}
                    else:
                        return {"success": False, "error": f"HTTP {response.status_code}"}
            
            elif action == "get_customer":
                customer_id = params.get("customer_id")
                url = f"{base_url}/customers/{customer_id}.json"
                
                with httpx.Client() as client:
                    response = client.get(url, headers=headers, timeout=10)
                    if response.status_code == 200:
                        return {"success": True, "data": response.json().get("customer")}
                    else:
                        return {"success": False, "error": f"HTTP {response.status_code}"}
            
            else:
                return {"success": False, "error": f"Unknown action: {action}"}
                
        except Exception as e:
            logger.error(f"Shopify action error: {e}")
            return {"success": False, "error": str(e)}
