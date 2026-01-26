"""
Google Calendar Integration
Handles Google Calendar OAuth and API operations
"""
import httpx
import logging
from typing import Dict, Any
from services.integrations import BaseIntegration

logger = logging.getLogger(__name__)

class GoogleCalendarIntegration(BaseIntegration):
    """Google Calendar integration for calendar operations"""
    
    def connect(self, credentials: Dict[str, Any]) -> bool:
        """Connect to Google Calendar using OAuth credentials"""
        try:
            self.access_token = credentials.get('access_token')
            self.refresh_token = credentials.get('refresh_token')
            return self.test_connection().get('success', False)
        except Exception as e:
            logger.error(f"Google Calendar connection error: {e}")
            return False
    
    def disconnect(self) -> bool:
        """Disconnect from Google Calendar"""
        self.access_token = None
        self.refresh_token = None
        return True
    
    def test_connection(self) -> Dict[str, Any]:
        """Test Google Calendar connection"""
        try:
            if not self.access_token:
                return {"success": False, "error": "Missing access token"}
            
            url = "https://www.googleapis.com/calendar/v3/users/me/calendarList"
            headers = {
                "Authorization": f"Bearer {self.access_token}"
            }
            
            with httpx.Client() as client:
                response = client.get(url, headers=headers, timeout=10)
                if response.status_code == 200:
                    return {"success": True, "calendars": response.json().get("items", [])}
                elif response.status_code == 401:
                    # Token expired, try refresh
                    if self.refresh_access_token():
                        return self.test_connection()
                    return {"success": False, "error": "Token expired and refresh failed"}
                else:
                    return {"success": False, "error": f"HTTP {response.status_code}"}
        except Exception as e:
            logger.error(f"Google Calendar test connection error: {e}")
            return {"success": False, "error": str(e)}
    
    def refresh_access_token(self) -> bool:
        """Refresh Google Calendar access token"""
        try:
            if not self.refresh_token:
                return False
            
            import os
            client_id = os.getenv('GOOGLE_CLIENT_ID')
            client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
            
            if not client_id or not client_secret:
                logger.error("Google OAuth credentials not configured")
                return False
            
            url = "https://oauth2.googleapis.com/token"
            data = {
                "client_id": client_id,
                "client_secret": client_secret,
                "refresh_token": self.refresh_token,
                "grant_type": "refresh_token"
            }
            
            with httpx.Client() as client:
                response = client.post(url, data=data, timeout=10)
                if response.status_code == 200:
                    token_data = response.json()
                    self.access_token = token_data.get("access_token")
                    return True
                else:
                    logger.error(f"Token refresh failed: {response.status_code}")
                    return False
        except Exception as e:
            logger.error(f"Google Calendar token refresh error: {e}")
            return False
    
    def sync_data(self) -> Dict[str, Any]:
        """Sync calendar events"""
        try:
            events = self.execute_action("list_events", {"maxResults": 50})
            return events
        except Exception as e:
            logger.error(f"Google Calendar sync error: {e}")
            return {"success": False, "error": str(e)}
    
    def execute_action(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Google Calendar API actions"""
        try:
            if not self.access_token:
                return {"success": False, "error": "Not connected"}
            
            base_url = "https://www.googleapis.com/calendar/v3"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            if action == "create_event":
                calendar_id = params.get("calendar_id", "primary")
                url = f"{base_url}/calendars/{calendar_id}/events"
                
                event_data = {
                    "summary": params.get("summary"),
                    "description": params.get("description", ""),
                    "start": {
                        "dateTime": params.get("start_time"),
                        "timeZone": params.get("timezone", "UTC")
                    },
                    "end": {
                        "dateTime": params.get("end_time"),
                        "timeZone": params.get("timezone", "UTC")
                    }
                }
                
                with httpx.Client() as client:
                    response = client.post(url, headers=headers, json=event_data, timeout=10)
                    if response.status_code == 200:
                        return {"success": True, "data": response.json()}
                    elif response.status_code == 401:
                        if self.refresh_access_token():
                            return self.execute_action(action, params)
                        return {"success": False, "error": "Authentication failed"}
                    else:
                        return {"success": False, "error": f"HTTP {response.status_code}"}
            
            elif action == "list_events":
                calendar_id = params.get("calendar_id", "primary")
                max_results = params.get("maxResults", 10)
                url = f"{base_url}/calendars/{calendar_id}/events?maxResults={max_results}"
                
                with httpx.Client() as client:
                    response = client.get(url, headers=headers, timeout=10)
                    if response.status_code == 200:
                        return {"success": True, "data": response.json().get("items", [])}
                    elif response.status_code == 401:
                        if self.refresh_access_token():
                            return self.execute_action(action, params)
                        return {"success": False, "error": "Authentication failed"}
                    else:
                        return {"success": False, "error": f"HTTP {response.status_code}"}
            
            elif action == "check_availability":
                calendar_id = params.get("calendar_id", "primary")
                time_min = params.get("time_min")
                time_max = params.get("time_max")
                
                url = f"{base_url}/freeBusy"
                freebusy_data = {
                    "timeMin": time_min,
                    "timeMax": time_max,
                    "items": [{"id": calendar_id}]
                }
                
                with httpx.Client() as client:
                    response = client.post(url, headers=headers, json=freebusy_data, timeout=10)
                    if response.status_code == 200:
                        return {"success": True, "data": response.json()}
                    elif response.status_code == 401:
                        if self.refresh_access_token():
                            return self.execute_action(action, params)
                        return {"success": False, "error": "Authentication failed"}
                    else:
                        return {"success": False, "error": f"HTTP {response.status_code}"}
            
            else:
                return {"success": False, "error": f"Unknown action: {action}"}
                
        except Exception as e:
            logger.error(f"Google Calendar action error: {e}")
            return {"success": False, "error": str(e)}
