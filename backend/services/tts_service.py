"""
Text-to-Speech Service
Primary: Google Cloud TTS (high quality)
Fallback: gTTS (free, no credentials - for Chrome when Google Cloud not configured)
"""

import os
import logging
import io
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

try:
    from google.cloud import texttospeech
except ImportError:
    texttospeech = None  # google-cloud-texttospeech not installed; will use gTTS fallback


def _gtts_synthesize(text: str, lang: str = "en") -> bytes:
    """Free TTS fallback using gTTS (no credentials needed)."""
    try:
        from gtts import gTTS
        tts = gTTS(text=text, lang=lang)
        buf = io.BytesIO()
        tts.write_to_fp(buf)
        return buf.getvalue()
    except ImportError:
        raise RuntimeError("gTTS not installed. Run: pip install gtts")
    except Exception as e:
        logger.error(f"gTTS error: {e}")
        raise


class GoogleTTS:
    """Google Cloud Text-to-Speech service"""
    
    def __init__(self):
        if texttospeech is None:
            raise RuntimeError("google-cloud-texttospeech not installed")
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
        audio_encoding: Optional[Any] = None,
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
            if audio_encoding is None:
                audio_encoding = texttospeech.AudioEncoding.MP3
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


class FallbackTTS:
    """Free gTTS fallback when Google Cloud not configured."""

    def synthesize(self, text: str, voice_name: str = "en-US-Neural2-F", **kwargs) -> bytes:
        return _gtts_synthesize(text, lang="en")


def get_tts_service():
    """Factory: Google Cloud TTS if configured, else free gTTS fallback."""
    try:
        return GoogleTTS()
    except Exception as e:
        logger.warning(f"Google TTS not available ({e}), using gTTS fallback")
        try:
            # Just verify gTTS can be imported - skip network test to avoid false failures
            from gtts import gTTS  # noqa: F401
            return FallbackTTS()
        except ImportError as e2:
            logger.warning(f"gTTS not installed: {e2}. Run: pip install gtts")
            return None
        except Exception as e2:
            logger.warning(f"gTTS fallback not available: {e2}")
            return None
