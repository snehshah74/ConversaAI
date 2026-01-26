"""
Widget API Endpoints
Handles web widget JavaScript delivery and message handling
"""
from fastapi import APIRouter, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import Response, HTMLResponse, PlainTextResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
import json
import os
from services.deployment import DeploymentService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["widget"])

deployment_service = DeploymentService()

class WidgetMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@router.get("/widget.js")
async def get_widget_js(request: Request, id: Optional[str] = None):
    """Serve the widget JavaScript file"""
    try:
        # Get origin for CORS validation
        origin = request.headers.get("origin", "")
        referer = request.headers.get("referer", "")
        
        if id:
            # Validate domain if deployment has restrictions
            if not deployment_service.validate_domain(id, origin or referer):
                return PlainTextResponse(
                    "// Domain not allowed",
                    status_code=403
                )
        
        # Read widget.js from public folder
        # For now, return inline JavaScript
        widget_js = """
(function() {
  'use strict';
  
  // Configuration from window.ConversaAI
  const config = window.ConversaAI || {};
  const deploymentId = config.deploymentId || new URLSearchParams(window.location.search).get('id');
  const widgetConfig = config.config || {
    position: 'bottom-right',
    theme: 'dark',
    greeting: 'Hi! How can I help you today?'
  };
  
  if (!deploymentId) {
    console.error('ConversaAI: deploymentId is required');
    return;
  }
  
  const API_URL = '""" + str(request.base_url).rstrip('/') + """';
  
  // Widget state
  let isOpen = false;
  let conversationId = null;
  let messageHistory = [];
  
  // Create widget HTML
  function createWidget() {
    const widget = document.createElement('div');
    widget.id = 'conversaai-widget';
    widget.innerHTML = `
      <div class="conversaai-container" style="
        position: fixed;
        ${widgetConfig.position === 'bottom-right' ? 'bottom: 20px; right: 20px;' : ''}
        ${widgetConfig.position === 'bottom-left' ? 'bottom: 20px; left: 20px;' : ''}
        ${widgetConfig.position === 'top-right' ? 'top: 20px; right: 20px;' : ''}
        ${widgetConfig.position === 'top-left' ? 'top: 20px; left: 20px;' : ''}
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <!-- Chat Button -->
        <button id="conversaai-button" style="
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: ${widgetConfig.colors?.primary || '#6366f1'};
          border: none;
          color: white;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          transition: transform 0.2s;
        ">💬</button>
        
        <!-- Chat Window -->
        <div id="conversaai-window" style="
          display: none;
          position: absolute;
          bottom: 80px;
          ${widgetConfig.position?.includes('right') ? 'right: 0;' : 'left: 0;'}
          width: 380px;
          max-width: calc(100vw - 40px);
          height: 600px;
          max-height: calc(100vh - 100px);
          background: ${widgetConfig.theme === 'dark' ? '#1e293b' : '#ffffff'};
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          flex-direction: column;
          overflow: hidden;
        ">
          <!-- Header -->
          <div style="
            padding: 16px;
            background: ${widgetConfig.colors?.primary || '#6366f1'};
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <div>
              <div style="font-weight: 600;">Conversa AI</div>
              <div style="font-size: 12px; opacity: 0.9;">Online</div>
            </div>
            <button id="conversaai-close" style="
              background: none;
              border: none;
              color: white;
              font-size: 20px;
              cursor: pointer;
              padding: 4px 8px;
            ">×</button>
          </div>
          
          <!-- Messages -->
          <div id="conversaai-messages" style="
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            background: ${widgetConfig.theme === 'dark' ? '#0f172a' : '#f8f9fa'};
          "></div>
          
          <!-- Input -->
          <div style="
            padding: 16px;
            border-top: 1px solid ${widgetConfig.theme === 'dark' ? '#334155' : '#e2e8f0'};
            background: ${widgetConfig.theme === 'dark' ? '#1e293b' : '#ffffff'};
          ">
            <div style="display: flex; gap: 8px;">
              <input id="conversaai-input" type="text" placeholder="Type a message..." style="
                flex: 1;
                padding: 12px;
                border: 1px solid ${widgetConfig.theme === 'dark' ? '#334155' : '#e2e8f0'};
                border-radius: 8px;
                background: ${widgetConfig.theme === 'dark' ? '#0f172a' : '#ffffff'};
                color: ${widgetConfig.theme === 'dark' ? '#ffffff' : '#1e293b'};
                font-size: 14px;
              " />
              <button id="conversaai-send" style="
                padding: 12px 20px;
                background: ${widgetConfig.colors?.primary || '#6366f1'};
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
              ">Send</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(widget);
    
    // Event listeners
    document.getElementById('conversaai-button').addEventListener('click', toggleWidget);
    document.getElementById('conversaai-close').addEventListener('click', toggleWidget);
    document.getElementById('conversaai-send').addEventListener('click', sendMessage);
    document.getElementById('conversaai-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
    
    // Show greeting
    if (widgetConfig.greeting) {
      addMessage('agent', widgetConfig.greeting);
    }
  }
  
  function toggleWidget() {
    isOpen = !isOpen;
    const window = document.getElementById('conversaai-window');
    const button = document.getElementById('conversaai-button');
    
    if (isOpen) {
      window.style.display = 'flex';
      button.style.transform = 'scale(0.9)';
    } else {
      window.style.display = 'none';
      button.style.transform = 'scale(1)';
    }
  }
  
  function addMessage(role, content) {
    const messagesDiv = document.getElementById('conversaai-messages');
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      margin-bottom: 12px;
      display: flex;
      ${role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
    `;
    
    const bubble = document.createElement('div');
    bubble.style.cssText = `
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 12px;
      background: ${role === 'user' 
        ? (widgetConfig.colors?.primary || '#6366f1')
        : (widgetConfig.theme === 'dark' ? '#334155' : '#e2e8f0')};
      color: ${role === 'user' || widgetConfig.theme === 'dark' ? '#ffffff' : '#1e293b'};
      font-size: 14px;
      line-height: 1.4;
    `;
    bubble.textContent = content;
    
    messageDiv.appendChild(bubble);
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    messageHistory.push({ role, content });
  }
  
  async function sendMessage() {
    const input = document.getElementById('conversaai-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    input.value = '';
    addMessage('user', message);
    
    try {
      // Start conversation if needed
      if (!conversationId) {
        const convResponse = await fetch(API_URL + '/api/chat/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_id: deploymentId })
        });
        const convData = await convResponse.json();
        conversationId = convData.conversation_id || convData.id;
      }
      
      // Send message
      const response = await fetch(API_URL + '/api/widget/' + deploymentId + '/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          conversation_id: conversationId
        })
      });
      
      const data = await response.json();
      
      if (data.response) {
        addMessage('agent', data.response);
      }
      
      // Track usage
      deployment_service.track_usage(deploymentId);
      
    } catch (error) {
      console.error('ConversaAI error:', error);
      addMessage('agent', 'Sorry, I encountered an error. Please try again.');
    }
  }
  
  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
"""
        
        return Response(
            content=widget_js,
            media_type="application/javascript",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=3600"
            }
        )
    except Exception as e:
        logger.error(f"Error serving widget.js: {e}")
        return PlainTextResponse(f"// Error: {str(e)}", status_code=500)

@router.post("/widget/{deployment_id}/message")
async def handle_widget_message(
    deployment_id: str,
    request: WidgetMessageRequest,
    http_request: Request
):
    """Handle messages from web widget"""
    try:
        # Validate domain
        origin = http_request.headers.get("origin", "")
        if origin and not deployment_service.validate_domain(deployment_id, origin):
            raise HTTPException(status_code=403, detail="Domain not allowed")
        
        # Get agent_id from deployment
        if deployment_service.supabase:
            deployment_result = deployment_service.supabase.table("deployments")\
                .select("agent_id")\
                .eq("id", deployment_id)\
                .single()\
                .execute()
            
            if not deployment_result.data:
                raise HTTPException(status_code=404, detail="Deployment not found")
            
            agent_id = deployment_result.data.get("agent_id")
        else:
            # Fallback: use deployment_id as agent_id for testing
            agent_id = deployment_id
        
        # Track usage
        deployment_service.track_usage(deployment_id)
        
        # Send message to agent via chat API endpoint
        import httpx
        api_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        
        async with httpx.AsyncClient() as client:
            # Start conversation if needed
            if not request.conversation_id:
                conv_response = await client.post(
                    f"{api_url}/api/chat/start",
                    json={"agent_id": agent_id}
                )
                conv_data = conv_response.json()
                conversation_id = conv_data.get("conversation_id") or conv_data.get("id")
            else:
                conversation_id = request.conversation_id
            
            # Send message
            chat_response = await client.post(
                f"{api_url}/api/chat/message",
                json={
                    "agent_id": agent_id,
                    "message": request.message,
                    "conversation_id": conversation_id
                }
            )
            chat_data = chat_response.json()
        
        return {
            "success": True,
            "response": chat_data.get("response", "I'm here to help!"),
            "conversation_id": conversation_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error handling widget message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/ws/widget/{deployment_id}")
async def widget_websocket(websocket: WebSocket, deployment_id: str):
    """WebSocket endpoint for real-time widget chat"""
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_json()
            message = data.get("message")
            
            if message:
                # Handle message (similar to handle_widget_message)
                # Send response back
                await websocket.send_json({
                    "type": "response",
                    "message": "Response from agent"
                })
    except WebSocketDisconnect:
        logger.info(f"Widget WebSocket disconnected: {deployment_id}")
