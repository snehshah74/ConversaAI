"""
WebSocket endpoint for real-time voice interactions
Maintains backward compatibility - REST API remains primary
"""

import json
import logging
import asyncio
from typing import Dict, Any
from fastapi import WebSocket, WebSocketDisconnect, HTTPException
from fastapi.routing import APIRouter
from sqlalchemy.orm import Session
from models.database import get_db
from agents.voice_agent import create_voice_agent
from services.stt_service import get_stt_service
from services.tts_service import get_tts_service
from routers.chat import _get_conversation_history, _save_message, _update_conversation_status

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["websocket"])


class VoiceWebSocketManager:
    """Manages WebSocket connections for voice interactions"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, agent_id: str):
        """Accept WebSocket connection"""
        await websocket.accept()
        self.active_connections[agent_id] = websocket
        logger.info(f"WebSocket connected for agent: {agent_id}")
    
    def disconnect(self, agent_id: str):
        """Remove WebSocket connection"""
        if agent_id in self.active_connections:
            del self.active_connections[agent_id]
            logger.info(f"WebSocket disconnected for agent: {agent_id}")
    
    async def send_message(self, agent_id: str, message: Dict[str, Any]):
        """Send message through WebSocket"""
        if agent_id in self.active_connections:
            try:
                await self.active_connections[agent_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending WebSocket message: {e}")
                self.disconnect(agent_id)


manager = VoiceWebSocketManager()


@router.websocket("/voice/{agent_id}")
async def voice_websocket(websocket: WebSocket, agent_id: str):
    """
    WebSocket endpoint for real-time voice interactions
    
    Flow:
    1. Client sends audio chunks
    2. Server transcribes audio (STT)
    3. Server processes with LLM
    4. Server synthesizes response (TTS)
    5. Server sends audio back to client
    
    Maintains backward compatibility - REST /api/chat still works
    """
    await manager.connect(websocket, agent_id)
    
    # Initialize services
    stt_service = get_stt_service()
    tts_service = get_tts_service()
    
    if not stt_service:
        await websocket.send_json({
            "type": "error",
            "message": "Speech-to-Text service not available"
        })
        manager.disconnect(agent_id)
        return
    
    if not tts_service:
        await websocket.send_json({
            "type": "error",
            "message": "Text-to-Speech service not available"
        })
        manager.disconnect(agent_id)
        return
    
    # Get agent config (simplified - you may want to fetch from DB)
    agent_config = {
        "name": "Voice Agent",
        "company": "Conversa AI",
        "role": "Customer Support",
        "personality": "friendly, helpful",
        "knowledge_base": "General customer service",
        "greeting": "Hello! How can I help you today?"
    }
    
    voice_agent = create_voice_agent(agent_config)
    conversation_id = None
    
    try:
        # Send connection confirmation
        await websocket.send_json({
            "type": "connected",
            "agent_id": agent_id,
            "message": "Voice connection established"
        })
        
        while True:
            # Receive message from client
            data = await websocket.receive()
            
            if "text" in data:
                # Handle text messages (control messages)
                message = json.loads(data["text"])
                msg_type = message.get("type")
                
                if msg_type == "start_conversation":
                    # Initialize conversation
                    conversation_id = message.get("conversation_id")
                    await websocket.send_json({
                        "type": "conversation_started",
                        "conversation_id": conversation_id
                    })
                
                elif msg_type == "audio_chunk":
                    # Handle audio chunk
                    audio_data = message.get("audio")
                    if audio_data:
                        # Transcribe audio
                        transcript = await stt_service.transcribe_audio(
                            bytes(audio_data, "base64"),
                            language="en-US"
                        )
                        
                        if transcript:
                            # Process with LLM
                            conversation_history = []
                            if conversation_id:
                                # Get conversation history from DB
                                db = next(get_db())
                                conversation_history = await _get_conversation_history(db, conversation_id)
                            
                            response = voice_agent.process_message(transcript, conversation_history)
                            
                            # Save messages to DB
                            if conversation_id:
                                db = next(get_db())
                                await _save_message(db, conversation_id, "user", transcript, {})
                                await _save_message(db, conversation_id, "agent", response.text, {
                                    "actions_taken": response.actions_taken,
                                    "entities": response.entities
                                })
                                db.commit()
                            
                            # Synthesize response
                            audio_response = tts_service.synthesize(
                                response.text,
                                voice_name="en-US-Neural2-F"
                            )
                            
                            # Send audio response
                            await websocket.send_json({
                                "type": "audio_response",
                                "text": response.text,
                                "audio": audio_response.hex(),  # Convert to hex for JSON
                                "transcript": transcript
                            })
            
            elif "bytes" in data:
                # Handle binary audio data
                audio_chunk = data["bytes"]
                
                # For streaming, you'd accumulate chunks and process when complete
                # This is a simplified version
                await websocket.send_json({
                    "type": "audio_received",
                    "message": "Processing audio chunk..."
                })
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for agent: {agent_id}")
        manager.disconnect(agent_id)
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })
        manager.disconnect(agent_id)
