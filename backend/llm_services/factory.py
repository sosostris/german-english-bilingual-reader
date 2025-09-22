"""
LLM service factory for creating instances of different LLM providers.

This module provides a centralized way to create LLM service instances
based on configuration and environment variables.

Security Note: This module includes SSL verification bypass functionality
for development/testing environments with corporate proxies. This is only
enabled when ENVIRONMENT=dev/development/test/testing or ALLOW_INSECURE_SSL=true.
In production environments, full SSL verification is maintained by default.
"""

import os
import ssl
import urllib3
from typing import Dict, List, Tuple, Optional
from .base import LLMService
from .gpt_service import GPTService
from .gemini_service import GeminiService

# Disable SSL warnings for development/testing
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class LLMFactory:
    """Factory class to create LLM service instances"""
    
    @staticmethod
    def create_service(provider: str = None) -> LLMService:
        """
        Create an LLM service instance based on provider name.
        
        Args:
            provider: Provider name ('openai' or 'google')
            
        Returns:
            LLMService instance
            
        Raises:
            ValueError: If provider is unsupported or required config is missing
        """
        if provider == 'openai':
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("OPENAI_API_KEY environment variable is required for OpenAI provider")
            
            model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
            return GPTService(api_key, model)
            
        elif provider == 'google':
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                raise ValueError("GEMINI_API_KEY environment variable is required for Gemini provider")
            
            model = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
            return GeminiService(api_key, model)
            
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")
    
    @staticmethod
    def test_provider_availability(provider: str) -> bool:
        """
        Test if a provider is available by checking API key configuration.
        No connectivity tests to save costs for now but in the future can be extended.
        
        Args:
            provider: Provider name to test
            
        Returns:
            True if provider has valid configuration, False otherwise
        """
        try:
            # Check if API keys are configured
            if provider == 'openai':
                api_key = os.getenv('OPENAI_API_KEY')
                if not api_key:
                    print(f"❌ OpenAI not available: OPENAI_API_KEY environment variable is required")
                    return False
                print(f"✅ OpenAI configured (API key found)")
                return True
                    
            elif provider == 'google':
                api_key = os.getenv('GEMINI_API_KEY')
                if not api_key:
                    print(f"❌ Google/Gemini not available: GEMINI_API_KEY environment variable is required")
                    return False
                print(f"✅ Google/Gemini configured (API key found)")
                return True
                    
            return False
            
        except Exception as e:
            print(f"❌ Provider {provider} configuration check failed: {str(e)}")
            return False
    
    @staticmethod
    def detect_available_providers() -> List[str]:
        """
        Detect which providers are available based on API key configuration.
        No connectivity tests performed to save costs.
        
        Returns:
            List of available provider names
        """
        available = []
        
        # Test OpenAI
        if LLMFactory.test_provider_availability('openai'):
            available.append('openai')
            
        # Test Gemini
        if LLMFactory.test_provider_availability('google'):
            available.append('google')
            
        return available
    
    @staticmethod
    def get_preferred_provider(available_providers: List[str]) -> Optional[str]:
        """
        Get the preferred provider from available ones.
        Priority: Gemini > OpenAI
        
        Args:
            available_providers: List of available provider names
            
        Returns:
            Preferred provider name or None if none available
        """
        if 'openai' in available_providers:
            return 'openai'
        elif 'google' in available_providers:
            return 'google'
        return None
    
    @staticmethod
    def get_provider_models() -> Dict[str, str]:
        """
        Get provider model names from environment variables.
        
        Returns:
            Dict mapping provider names to their model names
        """
        return {
            "openai": os.getenv('OPENAI_MODEL', 'gpt-4o-mini'),
            "google": os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
        }
