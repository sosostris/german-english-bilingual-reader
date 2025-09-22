"""
Abstract base class for LLM services.

This module defines the common interface that all LLM providers must implement
and provides shared translation logic.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List
import json


class LLMService(ABC):
    """Abstract base class for LLM services with shared translation logic"""
    
    def translate(self, text: Dict[str, Any]) -> Dict[str, Any]:
        """
        Translate German book data to English with structure preservation.
        
        Args:
            text: Structured book data dict with 'page_data' and optionally 'metadata'
            
        Returns:
            Standardized translation response:
            {
                "page_data": Dict,  # Structured translation preserving paragraph/sentence structure with english_translation arrays
                "provider": str,  # LLM provider name
                "metadata": Dict  # Optional, included if present in input
            }
        """
        # Only handle structured book data
        if isinstance(text, dict) and "page_data" in text:
            # Expected format: {"metadata": {...}, "page_data": {...}} (first page)
            # or: {"page_data": {...}} (subsequent pages)
            return self._translate_book_data(text)
        else:
            raise ValueError("Expected structured book data with 'page_data' field")
    
    def _translate_book_data(self, book_data: dict) -> dict:
        """
        Translate book data with new simplified structure.
        Preserves original German structure and attaches English translations directly.
        No complex mapping needed - English is attached as 'english_translation' array.
        """
        # Create response structure preserving original German data
        response = {
            "page_data": json.loads(json.dumps(book_data["page_data"])),  # deep copy of original structure
            "provider": self.get_provider_name()
        }

        # Translate metadata if it exists (for translation context)
        if "metadata" in book_data:
            translated_metadata = {}
            original_metadata = book_data["metadata"]
            
            # Translate specific fields
            if "title" in original_metadata:
                translated_metadata["title"] = self._translate_metadata_field(original_metadata["title"])
            if "author" in original_metadata:
                translated_metadata["author"] = self._translate_metadata_field(original_metadata["author"])
            if "description" in original_metadata:
                translated_metadata["description"] = original_metadata["description"]
            if "genre" in original_metadata:
                translated_metadata["genre"] = original_metadata["genre"]
            
            response["metadata"] = translated_metadata

        # Extract global metadata context for translation (if available)
        metadata_context = book_data.get("metadata", None)

        # Process each paragraph
        for paragraph in response["page_data"]["paragraphs"]:
            # Extract full paragraph context for better translation
            paragraph_context = []
            for sentence in paragraph["sentences"]:
                paragraph_context.append(sentence["text"])
            full_paragraph_text = " ".join(paragraph_context)
            
            # Process each sentence in the paragraph
            for sent_idx, sentence in enumerate(paragraph["sentences"]):
                german_text = sentence["text"]
                sentence_type = sentence.get("type", "narration")  # Default to narration

                # Translate sentence based on its type and create english_translation array
                if sentence_type == "stage_direction":
                    eng_sentences = self._translate_stage_direction_sentences(german_text, metadata_context)
                elif sentence_type == "speaker_name":
                    eng_sentences = self._translate_speaker_name(german_text, metadata_context)
                else:  # dialogue, narration, or other types
                    eng_sentences = self._translate_and_split_with_context(
                        german_text, 
                        full_paragraph_text, 
                        sent_idx,
                        metadata_context,
                        sentence_type
                    )

                # Store English translation - frontend will handle line breaks using German text
                sentence["english_translation"] = eng_sentences

        return response
    
    def _translate_metadata_field(self, text: str) -> str:
        """Translate short metadata fields using LLM API."""
        prompt = f"Translate the following from German to English. Return only the translation text: {text}"
        return self._simple_translate(prompt, max_tokens=200, temperature=0.0)
    
    def _translate_stage_direction_sentences(self, text: str, metadata: dict = None) -> List[str]:
        """Translate stage direction as sentences, preserving line breaks and formatting."""
        system_prompt = (
            "You are translating stage directions from German drama to English. "
            "Preserve all line breaks (\\n) exactly as they appear in the original. "
            "Stage directions should be concise and clear. "
            "Return ONLY valid JSON of the form: "
            '{"english_sentences": ["Translation text"]}'
        )
        
        user_prompt = f"Translate this German stage direction to English: {text}"
        if metadata:
            user_prompt = f"From '{metadata.get('title', 'German drama')}' by {metadata.get('author', 'unknown')}: {user_prompt}"
        
        response = self._json_translate(system_prompt, user_prompt, max_tokens=300, temperature=0.0)
        
        try:
            result = json.loads(response)
            return result.get("english_sentences", [text])  # fallback to original if parsing fails
        except (json.JSONDecodeError, KeyError):
            return [text]  # fallback to original text
    
    def _translate_speaker_name(self, text: str, metadata: dict = None) -> List[str]:
        """Translate speaker names (usually just return as-is or translate if needed)."""
        # Most speaker names are proper nouns and don't need translation
        # But some might need context (e.g., "CHOR" -> "CHORUS")
        common_translations = {
            "CHOR": "CHORUS",
            "ALLE": "ALL",
            "STIMME": "VOICE",
            "SPRECHER": "NARRATOR"
        }
        
        translated = common_translations.get(text.upper(), text)
        return [translated]

    def _build_context_prompt(self, metadata: dict, paragraph_context: str, german_sentence: str, sentence_index: int) -> str:
        """Build contextual prompt with metadata, paragraph context, and target sentence."""
        prompt_parts = []
        
        # Add book metadata context if available
        if metadata:
            prompt_parts.append("BOOK CONTEXT:")
            if "title" in metadata:
                prompt_parts.append(f"Title: {metadata['title']}")
            if "author" in metadata:
                prompt_parts.append(f"Author: {metadata['author']}")
            if "description" in metadata:
                prompt_parts.append(f"Description: {metadata['description']}")
            prompt_parts.append("")  # Empty line
        else:
            prompt_parts.append("BOOK CONTEXT: German Literary Text")
            prompt_parts.append("")
        
        # Add paragraph context
        prompt_parts.append("PARAGRAPH CONTEXT (for understanding tone and style):")
        prompt_parts.append(paragraph_context)
        prompt_parts.append("")
        
        # Add target sentence
        prompt_parts.append(f"TARGET SENTENCE TO TRANSLATE (sentence #{sentence_index + 1} in the paragraph):")
        prompt_parts.append(german_sentence)
        prompt_parts.append("")
        prompt_parts.append("Translate ONLY the target sentence using the book and paragraph context for better literary quality.")
        prompt_parts.append("🚨 CRITICAL: If the target sentence contains \\n characters, you MUST preserve them in the EXACT same positions in your English translation.")
        prompt_parts.append("Count the \\n characters in the German text and ensure your English has the same number of \\n characters.")
        
        return "\n".join(prompt_parts)

    def _translate_and_split_with_context(self, german_sentence: str, paragraph_context: str, sentence_index: int, metadata: dict = None, sentence_type: str = "narration") -> List[str]:
        """
        Translate a German sentence to one or more English sentences with paragraph context.
        
        Args:
            german_sentence: The specific sentence to translate
            paragraph_context: The full paragraph for context
            sentence_index: Position of the sentence in the paragraph (0-based)
            metadata: Complete book metadata (title, author, description) for stylistic context
            sentence_type: Type of sentence (dialogue, narration, etc.)
            
        Returns:
            List of English sentences
        """
        system_content = (
            f"🚨 CRITICAL: You are translating German literature ({sentence_type} text) with paragraph context for better quality. "
            "TRANSLATE ONLY THE SPECIFIED SENTENCE - do not translate the entire paragraph. "
            "Use the paragraph context to understand tone, style, and meaning, but return only the translation of the target sentence. "
            "PRESERVE THE PARAGRAPH STRUCTURE - do not merge with sentences from other paragraphs. "
            "🚨🚨🚨 ABSOLUTE CRITICAL REQUIREMENT: PRESERVE LINE BREAKS 🚨🚨🚨 "
            "The German text contains \\n characters that represent poetry line breaks. "
            "YOU MUST PRESERVE EVERY SINGLE \\n CHARACTER IN THE EXACT SAME POSITION. "
            "COUNT the \\n characters in the German text and ensure your English has THE SAME NUMBER of \\n characters. "
            "EXAMPLE: German 'Habe nun, ach! Philosophie,\\nJuristerei und Medizin' MUST become English 'I have now, alas! Philosophy,\\nJurisprudence and Medicine' "
            "DO NOT REMOVE LINE BREAKS. DO NOT MERGE LINES. PRESERVE \\n EXACTLY. "
            f"For {sentence_type} text, maintain appropriate style and formatting conventions. "
            "You may split ONE German sentence into multiple English sentences for clarity, "
            "but maintain the literary style and emotional tone. "
            "Convert German quotation marks (»«) to English style (\"\"). "
            "Return ONLY valid JSON of the form: "
            '{"english_sentences": ["Sentence 1.", "Sentence 2."]}'
        )
        
        user_content = self._build_context_prompt(metadata, paragraph_context, german_sentence, sentence_index)
        
        response = self._json_translate(system_content, user_content, max_tokens=400, temperature=0.1)
        
        try:
            data = json.loads(response)
            english_sentences = data["english_sentences"]
            return english_sentences
        except Exception:
            # fallback: treat entire output as one sentence
            return [response.strip()]
    
    # Abstract methods that subclasses must implement (API-specific)
    @abstractmethod
    def _simple_translate(self, prompt: str, max_tokens: int = 200, temperature: float = 0.0) -> str:
        """
        Simple translation for short texts like metadata.
        
        Args:
            prompt: The translation prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            
        Returns:
            Translated text as string
        """
        pass
    
    @abstractmethod
    def _json_translate(self, system_prompt: str, user_prompt: str, max_tokens: int = 400, temperature: float = 0.1) -> str:
        """
        Translation that expects JSON response format.
        
        Args:
            system_prompt: System instructions
            user_prompt: User content to translate
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            
        Returns:
            JSON response as string
        """
        pass
    
    @abstractmethod
    def get_provider_name(self) -> str:
        """Get the provider name for this service."""
        pass
    
    def chat(self, question: str, context: str = "") -> str:
        """
        Answer questions about the text using shared prompt logic.
        
        Args:
            question: User's question
            context: Optional context from the German text
            
        Returns:
            AI assistant's response
        """
        # Shared system prompt for all LLM providers
        system_prompt = """You are a helpful German language tutor and literary expert. You help students understand German texts, grammar, vocabulary, and cultural context. 

When answering questions:
- Use English as default language unless the student explicitly asks for German
- Be clear and educational
- Explain German grammar concepts when relevant
- Provide cultural context when helpful
- Use examples to illustrate points
- Keep responses concise but informative"""
        
        # Build user prompt
        user_prompt = f"Question: {question}"
        if context:
            user_prompt += f"\n\nContext (German text): {context}"
        
        # Delegate to API-specific implementation
        return self._chat_with_llm(system_prompt, user_prompt)
    
    @abstractmethod
    def _chat_with_llm(self, system_prompt: str, user_prompt: str) -> str:
        """
        API-specific chat implementation.
        
        Args:
            system_prompt: The system instructions
            user_prompt: The user's question with context
            
        Returns:
            AI assistant's response
        """
        pass
    
    def generate_speech(self, text: str, voice: str = "alloy", speed: float = 1.0) -> bytes:
        """
        Generate speech audio from text using the LLM's TTS capability.
        
        Args:
            text: Text to convert to speech
            voice: Voice to use (alloy, echo, fable, onyx, nova, shimmer)
            speed: Speed of speech (0.25 to 4.0)
            
        Returns:
            Audio data as bytes
            
        Raises:
            NotImplementedError: If the LLM provider doesn't support TTS
        """
        raise NotImplementedError(f"{self.get_provider_name()} does not support text-to-speech")
    
    def dictionary_lookup(self, word: str, context: str = "") -> str:
        """
        Provide dictionary lookup for German words.
        
        Args:
            word: German word or phrase to look up
            context: Optional context from the sentence
            
        Returns:
            Dictionary entry response
        """
        # Create a specialized dictionary lookup prompt
        prompt = f"""You are a German-English dictionary assistant. Provide a comprehensive dictionary entry for the German word or phrase: "{word}"

Please provide:
1. **Definition**: Clear English definition(s)
2. **Part of Speech**: Grammar category (noun, verb, adjective, etc.)
3. **Gender/Case**: If applicable (der/die/das, declension info)
4. **Etymology**: Word origin and breakdown if compound
5. **Usage**: How it's commonly used
6. **Examples**: 2-3 example sentences in German with English translations
7. **Related Words**: Similar or related German words

{f'Context from text: "{context}"' if context else ''}

Format your response clearly with headers and bullet points. Be concise but comprehensive."""
        
        # Use the chat method to get the response
        return self.chat(prompt)
    
    @abstractmethod
    def get_provider_info(self) -> Dict[str, Any]:
        """
        Get information about this LLM provider.
        
        Returns:
            Dict containing provider, model, and description
        """
        pass