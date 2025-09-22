from typing import Dict, Any
import openai
from .base import LLMService


class GPTService(LLMService):
    """OpenAI GPT service implementation with API-specific code only"""
    
    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        import httpx
        http_client = httpx.Client(trust_env=False, timeout=30.0)
        self.client = openai.OpenAI(api_key=api_key, http_client=http_client)
        self.model = model

    def _simple_translate(self, prompt: str, max_tokens: int = 200, temperature: float = 0.0) -> str:
        """Simple translation for short texts like metadata using OpenAI API."""
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "Translate the following from German to English. Return only the translation text."},
                {"role": "user", "content": prompt}
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return resp.choices[0].message.content.strip()
    
    def _json_translate(self, system_prompt: str, user_prompt: str, max_tokens: int = 400, temperature: float = 0.1) -> str:
        """Translation that expects JSON response format using OpenAI API."""
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"}  # OpenAI-specific JSON mode
        )
        return resp.choices[0].message.content
    
    def get_provider_name(self) -> str:
        """Get the provider name for this service."""
        return "openai"
    
    def _chat_with_llm(self, system_prompt: str, user_prompt: str) -> str:
        """GPT-specific chat implementation."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            raise Exception(f"GPT chat failed: {str(e)}")
    
    def generate_speech(self, text: str, voice: str = "alloy", speed: float = 1.0) -> bytes:
        """Generate speech audio from text using OpenAI's TTS."""
        try:
            response = self.client.audio.speech.create(
                model="tts-1",  # Use tts-1 model (faster, good quality)
                voice=voice,
                input=text,
                speed=speed
            )
            
            # Return the audio content as bytes
            return response.content
            
        except Exception as e:
            raise Exception(f"OpenAI TTS failed: {str(e)}")
    
    def get_provider_info(self) -> Dict[str, Any]:
        """Get GPT provider information"""
        return {
            "provider": "openai",
            "model": self.model,
            "description": f"OpenAI {self.model}"
        }
