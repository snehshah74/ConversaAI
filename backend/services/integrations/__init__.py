"""
Base Integration Class
All integrations should inherit from this base class
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class BaseIntegration(ABC):
    """Base class for all integrations"""
    
    def __init__(self, integration_id: str, config: Dict[str, Any]):
        self.integration_id = integration_id
        self.config = config
        self.access_token = config.get('access_token')
        self.refresh_token = config.get('refresh_token')
        self.token_expires_at = config.get('token_expires_at')
    
    @abstractmethod
    def connect(self, credentials: Dict[str, Any]) -> bool:
        """Connect to the integration service"""
        pass
    
    @abstractmethod
    def disconnect(self) -> bool:
        """Disconnect from the integration service"""
        pass
    
    @abstractmethod
    def test_connection(self) -> Dict[str, Any]:
        """Test the connection and return status"""
        pass
    
    @abstractmethod
    def sync_data(self) -> Dict[str, Any]:
        """Sync data from the integration"""
        pass
    
    @abstractmethod
    def execute_action(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a specific action (e.g., get_order, create_event)"""
        pass
    
    def is_token_expired(self) -> bool:
        """Check if the access token is expired"""
        if not self.token_expires_at:
            return False
        from datetime import datetime
        return datetime.now() >= self.token_expires_at
    
    def refresh_access_token(self) -> bool:
        """Refresh the access token using refresh_token"""
        # Should be implemented by subclasses that support refresh tokens
        return False
