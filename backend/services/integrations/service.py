"""
Integration Service Factory
Manages integration instances and provides unified interface
"""
import os
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from supabase import create_client, Client
from cryptography.fernet import Fernet
import json

logger = logging.getLogger(__name__)

class IntegrationService:
    """Service for managing integrations"""
    
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        # Encryption key for tokens (should be in environment)
        encryption_key = os.getenv('INTEGRATION_ENCRYPTION_KEY')
        if encryption_key:
            self.cipher = Fernet(encryption_key.encode())
        else:
            logger.warning("INTEGRATION_ENCRYPTION_KEY not set - tokens will not be encrypted")
            self.cipher = None
        
        if self.supabase_url and self.supabase_key:
            try:
                self.supabase: Optional[Client] = create_client(self.supabase_url, self.supabase_key)
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                self.supabase = None
        else:
            logger.warning("Supabase credentials not found")
            self.supabase = None
    
    def _encrypt_token(self, token: str) -> str:
        """Encrypt a token before storing"""
        if not token:
            return ""
        if self.cipher:
            return self.cipher.encrypt(token.encode()).decode()
        return token
    
    def _decrypt_token(self, encrypted_token: str) -> str:
        """Decrypt a token after retrieving"""
        if not encrypted_token:
            return ""
        if self.cipher:
            try:
                return self.cipher.decrypt(encrypted_token.encode()).decode()
            except Exception as e:
                logger.error(f"Failed to decrypt token: {e}")
                return ""
        return encrypted_token
    
    def get_integration(self, agent_id: str, integration_type: str) -> Optional[Dict[str, Any]]:
        """Get integration configuration for an agent"""
        try:
            if self.supabase:
                result = self.supabase.table("integrations")\
                    .select("*")\
                    .eq("agent_id", agent_id)\
                    .eq("integration_type", integration_type)\
                    .eq("status", "connected")\
                    .single()\
                    .execute()
                
                if result.data:
                    integration = result.data.copy()
                    # Decrypt tokens
                    if integration.get("access_token"):
                        integration["access_token"] = self._decrypt_token(integration["access_token"])
                    if integration.get("refresh_token"):
                        integration["refresh_token"] = self._decrypt_token(integration["refresh_token"])
                    return integration
            
            return None
        except Exception as e:
            logger.error(f"Error getting integration: {e}")
            return None
    
    def save_integration(
        self,
        agent_id: str,
        integration_type: str,
        access_token: str,
        refresh_token: Optional[str] = None,
        token_expires_at: Optional[datetime] = None,
        config: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """Save integration connection"""
        try:
            # Encrypt tokens
            encrypted_access = self._encrypt_token(access_token)
            encrypted_refresh = self._encrypt_token(refresh_token) if refresh_token else None
            
            integration_data = {
                "agent_id": agent_id,
                "integration_type": integration_type,
                "status": "connected",
                "access_token": encrypted_access,
                "refresh_token": encrypted_refresh,
                "token_expires_at": token_expires_at.isoformat() if token_expires_at else None,
                "config": json.dumps(config or {}),
                "connected_at": datetime.now().isoformat()
            }
            
            if self.supabase:
                # Check if integration already exists
                existing = self.supabase.table("integrations")\
                    .select("id")\
                    .eq("agent_id", agent_id)\
                    .eq("integration_type", integration_type)\
                    .execute()
                
                if existing.data:
                    # Update existing
                    result = self.supabase.table("integrations")\
                        .update(integration_data)\
                        .eq("id", existing.data[0]["id"])\
                        .execute()
                    return existing.data[0]["id"]
                else:
                    # Create new
                    result = self.supabase.table("integrations")\
                        .insert(integration_data)\
                        .execute()
                    if result.data:
                        return result.data[0]["id"]
            
            return None
        except Exception as e:
            logger.error(f"Error saving integration: {e}")
            return None
    
    def disconnect_integration(self, integration_id: str) -> bool:
        """Disconnect an integration"""
        try:
            if self.supabase:
                self.supabase.table("integrations")\
                    .update({
                        "status": "disconnected",
                        "access_token": None,
                        "refresh_token": None,
                        "updated_at": datetime.now().isoformat()
                    })\
                    .eq("id", integration_id)\
                    .execute()
                return True
            return False
        except Exception as e:
            logger.error(f"Error disconnecting integration: {e}")
            return False
    
    def list_integrations(self, agent_id: str) -> List[Dict[str, Any]]:
        """List all integrations for an agent"""
        try:
            if self.supabase:
                result = self.supabase.table("integrations")\
                    .select("*")\
                    .eq("agent_id", agent_id)\
                    .order("created_at", desc=True)\
                    .execute()
                
                if result.data:
                    # Don't decrypt tokens in list view for security
                    return result.data
            return []
        except Exception as e:
            logger.error(f"Error listing integrations: {e}")
            return []
    
    def get_available_integrations(self) -> List[Dict[str, Any]]:
        """Get list of available integrations from metadata"""
        try:
            if self.supabase:
                result = self.supabase.table("integration_metadata")\
                    .select("*")\
                    .eq("is_available", True)\
                    .order("is_popular", desc=True)\
                    .order("name")\
                    .execute()
                
                if result.data and len(result.data) > 0:
                    return result.data
            
            # Fallback: Return hardcoded integrations if database is not set up
            logger.warning("integration_metadata table not found or empty, using fallback data")
            return self._get_fallback_integrations()
        except Exception as e:
            logger.error(f"Error getting available integrations: {e}")
            # Return fallback on error
            return self._get_fallback_integrations()
    
    def _get_fallback_integrations(self) -> List[Dict[str, Any]]:
        """Fallback integrations if database is not set up"""
        return [
            {
                "id": "shopify",
                "integration_type": "shopify",
                "name": "Shopify",
                "description": "Sync orders, products, and customer data from your Shopify store",
                "category": "ecommerce",
                "setup_time_minutes": 5,
                "is_popular": True,
                "is_available": True,
                "scopes": ["read_orders", "read_products", "read_customers"]
            },
            {
                "id": "salesforce",
                "integration_type": "salesforce",
                "name": "Salesforce",
                "description": "Access leads, contacts, and opportunities from Salesforce CRM",
                "category": "crm",
                "setup_time_minutes": 10,
                "is_popular": True,
                "is_available": True,
                "scopes": ["api", "refresh_token"]
            },
            {
                "id": "google_calendar",
                "integration_type": "google_calendar",
                "name": "Google Calendar",
                "description": "Create events and check availability in Google Calendar",
                "category": "calendar",
                "setup_time_minutes": 3,
                "is_popular": True,
                "is_available": True,
                "scopes": ["https://www.googleapis.com/auth/calendar"]
            },
            {
                "id": "zendesk",
                "integration_type": "zendesk",
                "name": "Zendesk",
                "description": "Manage support tickets and customer data from Zendesk",
                "category": "support",
                "setup_time_minutes": 5,
                "is_popular": True,
                "is_available": True,
                "scopes": ["read", "write"]
            },
            {
                "id": "stripe",
                "integration_type": "stripe",
                "name": "Stripe",
                "description": "Process payments and manage subscriptions via Stripe",
                "category": "payment",
                "setup_time_minutes": 5,
                "is_popular": True,
                "is_available": True,
                "scopes": ["read_write"]
            },
            {
                "id": "twilio",
                "integration_type": "twilio",
                "name": "Twilio",
                "description": "Send SMS and make phone calls via Twilio",
                "category": "communication",
                "setup_time_minutes": 5,
                "is_popular": False,
                "is_available": True,
                "scopes": []
            },
            {
                "id": "sendgrid",
                "integration_type": "sendgrid",
                "name": "SendGrid",
                "description": "Send transactional emails via SendGrid",
                "category": "communication",
                "setup_time_minutes": 5,
                "is_popular": False,
                "is_available": True,
                "scopes": []
            },
            {
                "id": "slack",
                "integration_type": "slack",
                "name": "Slack",
                "description": "Send messages and notifications to Slack channels",
                "category": "communication",
                "setup_time_minutes": 5,
                "is_popular": True,
                "is_available": True,
                "scopes": ["chat:write", "channels:read"]
            },
            {
                "id": "hubspot",
                "integration_type": "hubspot",
                "name": "HubSpot",
                "description": "Access contacts, deals, and companies from HubSpot CRM",
                "category": "crm",
                "setup_time_minutes": 8,
                "is_popular": False,
                "is_available": True,
                "scopes": ["contacts", "deals"]
            },
            {
                "id": "calendly",
                "integration_type": "calendly",
                "name": "Calendly",
                "description": "Check availability and create events in Calendly",
                "category": "calendar",
                "setup_time_minutes": 5,
                "is_popular": False,
                "is_available": False,
                "scopes": []
            },
            {
                "id": "intercom",
                "integration_type": "intercom",
                "name": "Intercom",
                "description": "Manage conversations and customers in Intercom",
                "category": "support",
                "setup_time_minutes": 5,
                "is_popular": False,
                "is_available": True,
                "scopes": ["read", "write"]
            }
        ]
    
    def update_sync_status(self, integration_id: str, status: Dict[str, Any]) -> bool:
        """Update sync status for an integration"""
        try:
            if self.supabase:
                self.supabase.table("integrations")\
                    .update({
                        "last_sync_at": datetime.now().isoformat(),
                        "sync_status": json.dumps(status),
                        "updated_at": datetime.now().isoformat()
                    })\
                    .eq("id", integration_id)\
                    .execute()
                return True
            return False
        except Exception as e:
            logger.error(f"Error updating sync status: {e}")
            return False
