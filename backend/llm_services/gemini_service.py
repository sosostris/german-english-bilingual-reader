"""
Google Gemini service implementation.

This module provides Google Gemini integration for German-English translation
and chat functionality.
"""

from typing import Dict, Any
import google.generativeai as genai
from .base import LLMService


class GeminiService(LLMService):
    """Google Gemini service implementation with API-specific code only"""
    
    def __init__(self, api_key: str, model: str = "gemini-1.5-flash"):
        """
        Initialize Gemini service.
        
        Args:
            api_key: Google Gemini API key
            model: Model name (e.g., "gemini-1.5-flash", "gemini-1.5-pro")
        """
        import logging
        
        # Suppress ALTS warnings for non-GCP environments
        logging.getLogger("google.auth._default").setLevel(logging.ERROR)
        logging.getLogger("google.auth.transport.grpc").setLevel(logging.ERROR)
        
        # Configure Gemini API
        genai.configure(api_key=api_key)
        
        self.model_name = model
        self.model = genai.GenerativeModel(model)

    def _simple_translate(self, prompt: str, max_tokens: int = 200, temperature: float = 0.0) -> str:
        """Simple translation for short texts like metadata using Gemini API."""
        response = self.model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature,
            )
        )
        return response.text.strip()
    
    def _json_translate(self, system_prompt: str, user_prompt: str, max_tokens: int = 400, temperature: float = 0.1) -> str:
        """Translation that expects JSON response format using Gemini API."""
        # Gemini doesn't have explicit JSON mode, so we combine prompts and add explicit JSON instruction
        full_prompt = f"{system_prompt}\n\n{user_prompt}\n\nIMPORTANT: Return ONLY valid JSON without any markdown formatting or extra text."
        
        response = self.model.generate_content(
            full_prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature,
            )
        )
        
        # Post-process the response to extract JSON from markdown code blocks
        return self._extract_json_from_response(response.text)
    
    def _extract_json_from_response(self, response_text: str) -> str:
        """Extract JSON from Gemini response that may contain markdown code blocks."""
        import re
        
        # First, try to find JSON in markdown code blocks
        json_pattern = r'```json\s*(\{.*?\})\s*```'
        matches = re.findall(json_pattern, response_text, re.DOTALL)
        
        if matches:
            # If we found JSON in code blocks, return the first valid one
            for match in matches:
                try:
                    # Validate it's actually valid JSON
                    import json
                    json.loads(match)
                    return match
                except json.JSONDecodeError:
                    continue
        
        # If no markdown code blocks, try to find raw JSON
        # Look for content between { and } that might be JSON
        json_pattern = r'(\{[^{}]*"english_sentences"[^{}]*\})'
        matches = re.findall(json_pattern, response_text, re.DOTALL)
        
        if matches:
            for match in matches:
                try:
                    # Validate it's actually valid JSON
                    import json
                    json.loads(match)
                    return match
                except json.JSONDecodeError:
                    continue
        
        # If we still can't find valid JSON, return the original response
        # The calling code will handle the parsing error
        return response_text.strip()
    
    def get_provider_name(self) -> str:
        """Get the provider name for this service."""
        return "gemini"
    
    def _chat_with_llm(self, system_prompt: str, user_prompt: str) -> str:
        """Gemini-specific chat implementation."""
        try:
            # Gemini doesn't have separate system/user roles, so combine prompts
            full_prompt = f"{system_prompt}\n\n{user_prompt}"
            
            response = self.model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=1000,
                    temperature=0.7,
                )
            )
            
            return response.text.strip()
            
        except Exception as e:
            raise Exception(f"Gemini chat failed: {str(e)}")
    
    def get_provider_info(self) -> Dict[str, Any]:
        """Get Gemini provider information"""
        return {
            "provider": "google",
            "model": self.model_name,
            "description": f"Google {self.model_name}"
        }