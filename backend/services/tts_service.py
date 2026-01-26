"""
Text-to-Speech Service using Google Cloud TTS
Provides high-quality voice synthesis
"""

import os
import logging
from typing import Optional, Dict, Any
from google.cloud import texttospeech
import io

logger = logging.getLogger(__name__)


class GoogleTTS:
    """Google Cloud Text-to-Speech service"""
    
    def __init__(self):
        # Check for credentials
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if not credentials_path and not os.getenv("GOOGLE_API_KEY"):
            logger.warning("Google Cloud credentials not found. TTS may not work.")
        
        try:
            self.client = texttospeech.TextToSpeechClient()
            logger.info("Google Cloud TTS service initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Google Cloud TTS: {e}")
            raise
    
    def synthesize(
        self,
        text: str,
        voice_name: str = "en-US-Neural2-F",
        language_code: str = "en-US",
        audio_encoding: texttospeech.AudioEncoding = texttospeech.AudioEncoding.MP3,
        speaking_rate: float = 1.0,
        pitch: float = 0.0,
        volume_gain_db: float = 0.0
    ) -> bytes:
        """
        Synthesize text to speech
        
        Args:
            text: Text to synthesize
            voice_name: Voice name (default: en-US-Neural2-F)
            language_code: Language code (default: en-US)
            audio_encoding: Audio encoding format
            speaking_rate: Speaking rate (0.25-4.0)
            pitch: Pitch adjustment (-20.0 to 20.0)
            volume_gain_db: Volume gain in dB
        
        Returns:
            Audio data as bytes
        """
        try:
            synthesis_input = texttospeech.SynthesisInput(text=text)
            
            voice = texttospeech.VoiceSelectionParams(
                language_code=language_code,
                name=voice_name
            )
            
            audio_config = texttospeech.AudioConfig(
                audio_encoding=audio_encoding,
                speaking_rate=speaking_rate,
                pitch=pitch,
                volume_gain_db=volume_gain_db
            )
            
            response = self.client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            logger.info(f"TTS synthesis successful for text: {text[:50]}...")
            return response.audio_content
        
        except Exception as e:
            logger.error(f"Google Cloud TTS synthesis error: {e}")
            raise
    
    def list_voices(self, language_code: Optional[str] = None) -> list:
        """
        List available voices
        
        Args:
            language_code: Filter by language code (optional)
        
        Returns:
            List of available voices
        """
        try:
            if language_code:
                voices = self.client.list_voices(language_code=language_code)
            else:
                voices = self.client.list_voices()
            
            return [
                {
                    "name": voice.name,
                    "language_code": voice.language_codes[0],
                    "gender": voice.ssml_gender.name,
                    "natural_sample_rate": voice.natural_sample_rate_hertz
                }
                for voice in voices.voices
            ]
        
        except Exception as e:
            logger.error(f"Failed to list voices: {e}")
            return []
    
    def get_default_voice(self, language_code: str = "en-US", gender: str = "FEMALE") -> str:
        """
        Get default voice for language and gender
        
        Args:
            language_code: Language code
            gender: Gender preference (MALE/FEMALE/NEUTRAL)
        
        Returns:
            Voice name
        """
        voices = self.list_voices(language_code)
        
        # Filter by gender
        gender_voices = [v for v in voices if v["gender"] == gender]
        
        if gender_voices:
            # Prefer Neural2 voices
            neural_voices = [v for v in gender_voices if "Neural2" in v["name"]]
            if neural_voices:
                return neural_voices[0]["name"]
            return gender_voices[0]["name"]
        
        # Fallback to any voice
        if voices:
            return voices[0]["name"]
        
        # Default fallback
        return "en-US-Neural2-F"


def get_tts_service() -> Optional[GoogleTTS]:
    """Factory function to get TTS service"""
    try:
        return GoogleTTS()
    except Exception as e:
        logger.warning(f"TTS service not available: {e}")
        return None
