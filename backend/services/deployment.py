"""
Deployment Service
Handles creation and management of agent deployments across multiple channels
"""
import os
import secrets
import hashlib
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from supabase import create_client, Client
import json

logger = logging.getLogger(__name__)

class DeploymentService:
    """Service for managing agent deployments"""
    
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        self.api_base_url = os.getenv('API_BASE_URL', 'https://api.conversaai.com')
        
        if self.supabase_url and self.supabase_key:
            try:
                self.supabase: Optional[Client] = create_client(self.supabase_url, self.supabase_key)
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                self.supabase = None
        else:
            logger.warning("Supabase credentials not found - deployment service will use fallback")
            self.supabase = None
    
    def _generate_api_key(self) -> str:
        """Generate a secure API key"""
        return secrets.token_urlsafe(32)
    
    def _generate_api_secret(self) -> str:
        """Generate a secure API secret"""
        return secrets.token_urlsafe(48)
    
    def create_web_deployment(
        self,
        agent_id: str,
        name: str,
        widget_settings: Optional[Dict[str, Any]] = None,
        allowed_domains: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Create a web widget deployment"""
        try:
            default_settings = {
                "position": "bottom-right",
                "theme": "dark",
                "greeting": "Hi! How can I help you today?",
                "avatar": None,
                "colors": {
                    "primary": "#6366f1",
                    "background": "#1e293b",
                    "text": "#ffffff"
                }
            }
            
            settings = {**default_settings, **(widget_settings or {})}
            
            deployment_data = {
                "agent_id": agent_id,
                "deployment_type": "web",
                "name": name,
                "status": "active",
                "widget_settings": json.dumps(settings),
                "allowed_domains": allowed_domains or []
            }
            
            if self.supabase:
                result = self.supabase.table("deployments").insert(deployment_data).execute()
                if result.data:
                    deployment = result.data[0]
                    # Generate embed code
                    embed_code = self.generate_embed_code(deployment["id"], settings)
                    return {
                        "success": True,
                        "deployment": deployment,
                        "embed_code": embed_code
                    }
            
            # Fallback: return mock data
            deployment_id = secrets.token_urlsafe(16)
            return {
                "success": True,
                "deployment": {
                    "id": deployment_id,
                    "agent_id": agent_id,
                    "deployment_type": "web",
                    "name": name,
                    "status": "active",
                    "widget_settings": settings
                },
                "embed_code": self.generate_embed_code(deployment_id, settings)
            }
            
        except Exception as e:
            logger.error(f"Error creating web deployment: {e}")
            return {"success": False, "error": str(e)}
    
    def create_phone_deployment(
        self,
        agent_id: str,
        name: str,
        area_code: Optional[str] = None,
        phone_settings: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a phone deployment (requires Twilio integration)"""
        try:
            default_settings = {
                "recording": False,
                "voicemail": True,
                "transfer_number": None,
                "area_code": area_code or "415"
            }
            
            settings = {**default_settings, **(phone_settings or {})}
            
            # TODO: Integrate with Twilio to provision phone number
            # For now, generate a mock phone number
            phone_number = f"+1{area_code or '415'}555{secrets.randbelow(10000):04d}"
            
            deployment_data = {
                "agent_id": agent_id,
                "deployment_type": "phone",
                "name": name,
                "status": "active",
                "phone_number": phone_number,
                "phone_settings": json.dumps(settings)
            }
            
            if self.supabase:
                result = self.supabase.table("deployments").insert(deployment_data).execute()
                if result.data:
                    return {
                        "success": True,
                        "deployment": result.data[0],
                        "phone_number": phone_number
                    }
            
            # Fallback
            deployment_id = secrets.token_urlsafe(16)
            return {
                "success": True,
                "deployment": {
                    "id": deployment_id,
                    "agent_id": agent_id,
                    "deployment_type": "phone",
                    "name": name,
                    "phone_number": phone_number,
                    "phone_settings": settings
                },
                "phone_number": phone_number
            }
            
        except Exception as e:
            logger.error(f"Error creating phone deployment: {e}")
            return {"success": False, "error": str(e)}
    
    def create_api_deployment(
        self,
        agent_id: str,
        name: str,
        webhook_url: Optional[str] = None,
        rate_limit: int = 60
    ) -> Dict[str, Any]:
        """Create an API deployment with credentials"""
        try:
            api_key = self._generate_api_key()
            api_secret = self._generate_api_secret()
            
            deployment_data = {
                "agent_id": agent_id,
                "deployment_type": "api",
                "name": name,
                "status": "active",
                "api_key": api_key,
                "api_secret": api_secret,
                "webhook_url": webhook_url,
                "rate_limit_per_minute": rate_limit
            }
            
            if self.supabase:
                result = self.supabase.table("deployments").insert(deployment_data).execute()
                if result.data:
                    deployment = result.data[0]
                    return {
                        "success": True,
                        "deployment": deployment,
                        "api_key": api_key,
                        "api_secret": api_secret  # Only shown once!
                    }
            
            # Fallback
            deployment_id = secrets.token_urlsafe(16)
            return {
                "success": True,
                "deployment": {
                    "id": deployment_id,
                    "agent_id": agent_id,
                    "deployment_type": "api",
                    "name": name,
                    "api_key": api_key,
                    "rate_limit_per_minute": rate_limit
                },
                "api_key": api_key,
                "api_secret": api_secret
            }
            
        except Exception as e:
            logger.error(f"Error creating API deployment: {e}")
            return {"success": False, "error": str(e)}
    
    def generate_embed_code(self, deployment_id: str, widget_settings: Dict[str, Any]) -> str:
        """Generate HTML embed code for web widget"""
        widget_url = f"{self.api_base_url}/widget.js"
        
        config_json = json.dumps(widget_settings, ensure_ascii=False)
        
        embed_code = f"""<!-- Conversa AI Widget -->
<script>
  (function() {{
    window.ConversaAI = {{
      deploymentId: '{deployment_id}',
      config: {config_json}
    }};
    var s = document.createElement('script');
    s.src = '{widget_url}?id={deployment_id}';
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }})();
</script>"""
        
        return embed_code
    
    def track_usage(self, deployment_id: str) -> bool:
        """Track a conversation for usage analytics"""
        try:
            if self.supabase:
                # Increment counters
                result = self.supabase.rpc('increment_deployment_usage', {
                    'deployment_id': deployment_id
                }).execute()
                
                # If RPC doesn't exist, do manual update
                if not result:
                    deployment = self.supabase.table("deployments")\
                        .select("total_conversations, monthly_conversations")\
                        .eq("id", deployment_id)\
                        .single()\
                        .execute()
                    
                    if deployment.data:
                        self.supabase.table("deployments")\
                            .update({
                                "total_conversations": (deployment.data.get("total_conversations", 0) or 0) + 1,
                                "monthly_conversations": (deployment.data.get("monthly_conversations", 0) or 0) + 1,
                                "last_conversation_at": datetime.now().isoformat()
                            })\
                            .eq("id", deployment_id)\
                            .execute()
                
                return True
            return False
        except Exception as e:
            logger.error(f"Error tracking usage: {e}")
            return False
    
    def get_deployment_stats(self, deployment_id: str) -> Dict[str, Any]:
        """Get usage statistics for a deployment"""
        try:
            if self.supabase:
                result = self.supabase.table("deployments")\
                    .select("*")\
                    .eq("id", deployment_id)\
                    .single()\
                    .execute()
                
                if result.data:
                    deployment = result.data
                    return {
                        "success": True,
                        "stats": {
                            "total_conversations": deployment.get("total_conversations", 0),
                            "monthly_conversations": deployment.get("monthly_conversations", 0),
                            "last_conversation_at": deployment.get("last_conversation_at"),
                            "status": deployment.get("status"),
                            "created_at": deployment.get("created_at")
                        }
                    }
            
            return {"success": False, "error": "Deployment not found"}
        except Exception as e:
            logger.error(f"Error getting deployment stats: {e}")
            return {"success": False, "error": str(e)}
    
    def list_deployments(self, agent_id: str) -> List[Dict[str, Any]]:
        """List all deployments for an agent"""
        try:
            if self.supabase:
                result = self.supabase.table("deployments")\
                    .select("*")\
                    .eq("agent_id", agent_id)\
                    .eq("status", "active")\
                    .order("created_at", desc=True)\
                    .execute()
                
                if result.data:
                    return result.data
            
            return []
        except Exception as e:
            logger.error(f"Error listing deployments: {e}")
            return []
    
    def update_deployment(
        self,
        deployment_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update deployment settings"""
        try:
            # Convert dict to JSON for JSONB fields
            if "widget_settings" in updates and isinstance(updates["widget_settings"], dict):
                updates["widget_settings"] = json.dumps(updates["widget_settings"])
            if "phone_settings" in updates and isinstance(updates["phone_settings"], dict):
                updates["phone_settings"] = json.dumps(updates["phone_settings"])
            
            updates["updated_at"] = datetime.now().isoformat()
            
            if self.supabase:
                result = self.supabase.table("deployments")\
                    .update(updates)\
                    .eq("id", deployment_id)\
                    .execute()
                
                if result.data:
                    return {"success": True, "deployment": result.data[0]}
            
            return {"success": False, "error": "Deployment not found"}
        except Exception as e:
            logger.error(f"Error updating deployment: {e}")
            return {"success": False, "error": str(e)}
    
    def delete_deployment(self, deployment_id: str) -> bool:
        """Soft delete a deployment (set status to 'deleted')"""
        try:
            if self.supabase:
                self.supabase.table("deployments")\
                    .update({"status": "deleted", "updated_at": datetime.now().isoformat()})\
                    .eq("id", deployment_id)\
                    .execute()
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting deployment: {e}")
            return False
    
    def validate_domain(self, deployment_id: str, origin: str) -> bool:
        """Validate if a domain is allowed for web widget deployment"""
        try:
            if self.supabase:
                result = self.supabase.table("deployments")\
                    .select("allowed_domains")\
                    .eq("id", deployment_id)\
                    .single()\
                    .execute()
                
                if result.data:
                    allowed_domains = result.data.get("allowed_domains", [])
                    if not allowed_domains:  # Empty list means all domains allowed
                        return True
                    
                    # Check if origin matches any allowed domain
                    for domain in allowed_domains:
                        if domain in origin or origin in domain:
                            return True
                    
                    return False
            
            return True  # Default to allowing if no restrictions
        except Exception as e:
            logger.error(f"Error validating domain: {e}")
            return False
