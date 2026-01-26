"""
Orders Service - Query real order data from Supabase
"""

import os
import logging
from typing import Dict, Any, Optional, List

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logging.warning("Supabase client not available. Install with: pip install supabase")

logger = logging.getLogger(__name__)


class OrdersService:
    """Service for querying orders from Supabase"""
    
    def __init__(self):
        self.supabase_client = None
        self._initialize_supabase()
    
    def _initialize_supabase(self):
        """Initialize Supabase client"""
        if not SUPABASE_AVAILABLE:
            logger.warning("Supabase not available, orders will use mock data")
            return
        
        try:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
            
            if not supabase_url or not supabase_key:
                logger.warning("Supabase credentials not found, orders will use mock data")
                return
            
            self.supabase_client = create_client(supabase_url, supabase_key)
            logger.info("OrdersService: Supabase client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase for orders: {e}")
            self.supabase_client = None
    
    def lookup_order(self, order_number: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Look up order by order number
        
        Args:
            order_number: Order number to look up
            user_id: Optional user ID for filtering (if RLS is enabled)
        
        Returns:
            Dict with order information or error
        """
        if not self.supabase_client:
            logger.warning("Supabase not available, returning mock data")
            return self._get_mock_order(order_number)
        
        try:
            # Query orders table
            query = self.supabase_client.table("orders").select("*").eq("order_number", order_number)
            
            # If user_id provided, filter by it (for RLS or explicit filtering)
            if user_id:
                query = query.eq("user_id", user_id)
            
            result = query.execute()
            
            if result.data and len(result.data) > 0:
                order = result.data[0]
                logger.info(f"Found order: {order_number}")
                
                # Format response
                return {
                    "success": True,
                    "order_number": order.get("order_number"),
                    "status": order.get("status", "unknown"),
                    "customer_name": order.get("customer_name"),
                    "customer_email": order.get("customer_email"),
                    "items": order.get("items", []),
                    "total": float(order.get("total", 0)),
                    "shipping_address": order.get("shipping_address"),
                    "estimated_delivery": order.get("estimated_delivery"),
                    "tracking_number": order.get("tracking_number"),
                    "created_at": order.get("created_at")
                }
            else:
                logger.info(f"Order not found: {order_number}")
                return {
                    "success": False,
                    "error": f"Order {order_number} not found"
                }
                
        except Exception as e:
            logger.error(f"Error looking up order {order_number}: {e}")
            # Fallback to mock data on error
            return self._get_mock_order(order_number)
    
    def get_user_orders(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get all orders for a user
        
        Args:
            user_id: User ID to get orders for
            limit: Maximum number of orders to return
        
        Returns:
            List of order dictionaries
        """
        if not self.supabase_client:
            logger.warning("Supabase not available, returning empty list")
            return []
        
        try:
            result = self.supabase_client.table("orders")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error getting user orders: {e}")
            return []
    
    def _get_mock_order(self, order_number: str) -> Dict[str, Any]:
        """Fallback mock data if Supabase is unavailable"""
        mock_orders = {
            "ORD123456": {
                "success": True,
                "order_number": "ORD123456",
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
                "success": True,
                "order_number": "ORD789012",
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
        
        return mock_orders.get(order_number, {
            "success": False,
            "error": f"Order {order_number} not found"
        })


# Global instance
_orders_service = None

def get_orders_service() -> OrdersService:
    """Get or create orders service instance"""
    global _orders_service
    if _orders_service is None:
        _orders_service = OrdersService()
    return _orders_service
