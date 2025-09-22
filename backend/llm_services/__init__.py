"""
LLM Services Package

This package provides a modular architecture for integrating different
Large Language Model providers including OpenAI and Google Gemini.

Usage:
    from llm_services import LLMFactory
    
    # Create a service instance
    llm_service = LLMFactory.create_service('gemini')
    
    # Or detect available providers automatically
    available = LLMFactory.detect_available_providers()
    preferred = LLMFactory.get_preferred_provider(available)
    llm_service = LLMFactory.create_service(preferred)
    
    # Use the service
    translation = llm_service.translate("Hallo Welt")
    response = llm_service.chat("What does this mean?", "Hallo Welt")
"""

# Export main classes for easy importing
from .base import LLMService
from .factory import LLMFactory
from .gpt_service import GPTService
from .gemini_service import GeminiService

# Version information
__version__ = "1.0.0"

# Public API
__all__ = [
    "LLMService",
    "LLMFactory", 
    "GPTService",
    "GeminiService"
]
