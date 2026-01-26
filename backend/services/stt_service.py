"""
Speech-to-Text Service using Deepgram
Provides real-time audio transcription
"""

import os
import logging
from typing import Optional
from deepgram import DeepgramClient

logger = logging.getLogger(__name__)


class DeepgramSTT:
    """Deepgram Speech-to-Text service"""
    
    def __init__(self):
        api_key = os.getenv("DEEPGRAM_API_KEY")
        if not api_key:
            raise ValueError("DEEPGRAM_API_KEY not found in environment variables")
        
        # Initialize DeepgramClient with api_key as keyword argument
        self.client = DeepgramClient(api_key=api_key)
        logger.info("Deepgram STT service initialized")
    
    async def transcribe_audio(self, audio_data: bytes, language: str = "en-US") -> str:
        """
        Transcribe audio data to text
        
        Args:
            audio_data: Raw audio bytes
            language: Language code (default: en-US)
        
        Returns:
            Transcribed text
        """
        try:
            # Use the REST API for transcription with options dict
            response = self.client.listen.rest.v("1").transcribe_file(
                {"buffer": audio_data},
                {
                    "model": "nova-2",
                    "language": language,
                    "smart_format": True,
                    "punctuate": True
                }
            )
            
            if response.results and response.results.channels:
                transcript = response.results.channels[0].alternatives[0].transcript
                logger.info(f"Transcription successful: {transcript[:50]}...")
                return transcript
            else:
                logger.warning("No transcription results")
                return ""
        
        except Exception as e:
            logger.error(f"Deepgram transcription error: {e}")
            raise


def get_stt_service() -> Optional[DeepgramSTT]:
    """Factory function to get STT service"""
    try:
        return DeepgramSTT()
    except Exception as e:
        logger.warning(f"STT service not available: {e}")
        return None
