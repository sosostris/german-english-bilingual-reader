from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
from llm_services import LLMFactory

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)


# Initialize LLM service with smart provider detection
print("🔍 Detecting available LLM providers...")
available_providers = LLMFactory.detect_available_providers()
print(f"📡 Available providers: {available_providers}")

preferred_provider = LLMFactory.get_preferred_provider(available_providers)
print(f"🎯 Preferred provider: {preferred_provider}")

# Initialize with preferred provider
llm_service = None
current_provider = None

if preferred_provider:
    try:
        llm_service = LLMFactory.create_service(preferred_provider)
        current_provider = llm_service.get_provider_info()
        print(f"✅ LLM service initialized with {preferred_provider}: {current_provider}")
    except Exception as e:
        print(f"⚠️ LLM service initialization failed: {e}")
        llm_service = None
        current_provider = None
else:
    print("❌ No LLM providers available - check your API keys in .env file")

class TextManager:
    def __init__(self):
        self.texts = {}
        self.load_sample_texts()

    def load_sample_texts(self):
        """Load sample German texts from folder structure"""
        sample_texts_dir = os.path.join(os.path.dirname(__file__), '..', 'sample-texts')
        if os.path.exists(sample_texts_dir):
            for item in os.listdir(sample_texts_dir):
                item_path = os.path.join(sample_texts_dir, item)
                
                # Handle folder-based structure with metadata
                if os.path.isdir(item_path):
                    metadata_file = os.path.join(item_path, 'metadata.json')
                    if os.path.exists(metadata_file):
                        self.texts[item] = self._load_folder_based_text(item_path)
                    else:
                        print(f"⚠️  Warning: Skipping folder '{item}' - missing metadata.json")

    def _load_folder_based_text(self, folder_path: str) -> dict:
        """Load text from folder structure with metadata and page files"""
        import json
        
        # Load metadata
        metadata_file = os.path.join(folder_path, 'metadata.json')
        with open(metadata_file, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        # Load pages
        pages = {}
        for filename in os.listdir(folder_path):
            if filename.startswith('page-') and filename.endswith('.json'):
                page_path = os.path.join(folder_path, filename)
                with open(page_path, 'r', encoding='utf-8') as f:
                    page_data = json.load(f)
                    # Convert page data to displayable text
                    page_text = self._convert_page_data_to_text(page_data, metadata)
                    page_number = page_data.get('page_number', 1)
                    pages[page_number - 1] = page_text  # 0-indexed for frontend
        
        # Convert to list format expected by frontend
        page_list = []
        for i in range(len(pages)):
            if i in pages:
                page_list.append(pages[i])
        
        return {
            'metadata': metadata,
            'pages': page_list,
            'total_pages': metadata.get('total_pages', len(page_list))
        }

    def _convert_page_data_to_text(self, page_data: dict, metadata: dict) -> str:
        """Convert structured page data to display text"""
        text_parts = []
        
        # Add title and author on first page only
        if page_data.get('page_number', 1) == 1:
            text_parts.append(metadata.get('title', ''))
            text_parts.append(metadata.get('author', ''))
            text_parts.append('')  # Empty line
        
        # Add stage directions if present (for drama)
        if 'stage_directions' in page_data:
            for direction in page_data['stage_directions']:
                text_parts.append(direction['text'])
            text_parts.append('')  # Empty line
        
        # Add speaker if present (for drama)
        if 'speaker' in page_data:
            text_parts.append(f"{page_data['speaker']}:")
            text_parts.append('')  # Empty line
        
        # Add paragraphs
        for paragraph in page_data.get('paragraphs', []):
            # Combine sentences in paragraph
            paragraph_text = ' '.join([sentence['text'] for sentence in paragraph.get('sentences', [])])
            text_parts.append(paragraph_text)
            text_parts.append('')  # Empty line between paragraphs
        
        return '\n'.join(text_parts).strip()

    def get_text_page(self, text_name: str, page_number: int):
        """Get a specific page of a text"""
        if text_name not in self.texts:
            return None
        
        text_data = self.texts[text_name]
        
        # Handle folder-based format with structured data
        if isinstance(text_data, dict) and 'pages' in text_data:
            pages = text_data['pages']
            metadata = text_data.get('metadata', {})
            if page_number < 0 or page_number >= len(pages):
                return None
            
            # Load structured page data as well
            structured_page_data = None
            try:
                import os
                import json
                sample_texts_dir = os.path.join(os.path.dirname(__file__), '..', 'sample-texts')
                page_file = os.path.join(sample_texts_dir, text_name, f'page-{page_number + 1:03d}.json')
                
                if os.path.exists(page_file):
                    with open(page_file, 'r', encoding='utf-8') as f:
                        structured_page_data = json.load(f)
            except Exception as e:
                print(f"Warning: Could not load structured page data: {e}")
            
            response = {
                'current_page': page_number,
                'total_pages': len(pages),
                'text_name': text_name,
                'metadata': metadata
            }
            
            # Include structured page data (required)
            if structured_page_data:
                response['page_data'] = structured_page_data
            else:
                # If no structured data available, return error
                return None
                
            return response
        
        # Only structured format supported
        print(f"⚠️  Warning: Text '{text_name}' does not have the expected structure")
        return None
    
    def get_text_list(self):
        """Get list of available texts with metadata"""
        text_list = []
        for text_name, text_data in self.texts.items():
            # Expect structured format with metadata
            if not (isinstance(text_data, dict) and 'metadata' in text_data):
                print(f"⚠️  Warning: Skipping text '{text_name}' - missing metadata structure")
                continue
                
            metadata = text_data['metadata']
            text_list.append({
                'name': text_name,
                'title': metadata.get('title', text_name),
                'author': metadata.get('author', 'Unknown'),
                'year': metadata.get('year'),
                'genre': metadata.get('genre'),
                'total_pages': text_data.get('total_pages', len(text_data.get('pages', []))),
                'difficulty': metadata.get('difficulty'),
                'estimated_reading_time': metadata.get('estimated_reading_time')
            })
        return text_list

text_manager = TextManager()

@app.route('/api/texts', methods=['GET'])
def get_texts():
    """Get list of available texts"""
    return jsonify(text_manager.get_text_list())

@app.route('/api/text/<text_name>/page/<int:page_number>', methods=['GET'])
def get_text_page(text_name, page_number):
    """Get a specific page of a text"""
    result = text_manager.get_text_page(text_name, page_number)
    if result is None:
        return jsonify({'error': 'Text or page not found'}), 404
    return jsonify(result)

@app.route('/api/translate-page', methods=['POST'])
def translate_page():
    """Translate a structured page with perfect sentence correspondence"""
    if not llm_service:
        return jsonify({'error': 'LLM service not available'}), 503
    
    data = request.get_json()
    text_name = data.get('text_name', '')
    page_number = data.get('page_number', 0)
    
    if not text_name:
        return jsonify({'error': 'No text name provided'}), 400
    
    try:
        # Get the structured page data
        text_data = text_manager.texts.get(text_name)
        if not text_data or not isinstance(text_data, dict) or 'metadata' not in text_data:
            return jsonify({'error': 'Structured text not found'}), 404
        
        # Load the specific page JSON file
        import os
        import json
        sample_texts_dir = os.path.join(os.path.dirname(__file__), '..', 'sample-texts')
        page_file = os.path.join(sample_texts_dir, text_name, f'page-{page_number + 1:03d}.json')
        
        if not os.path.exists(page_file):
            return jsonify({'error': 'Page file not found'}), 404
        
        with open(page_file, 'r', encoding='utf-8') as f:
            page_data = json.load(f)
        
        # Create translation request for LLM
        translation_request = {
            'metadata': text_data['metadata'],
            'page_data': page_data
        }
        
        # Send translation request directly to LLM
        result = llm_service.translate(translation_request)
        
        # LLM service already returns standardized format
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'Page translation failed: {str(e)}'}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages"""
    if not llm_service:
        return jsonify({'error': 'LLM service not available'}), 503
    
    data = request.get_json()
    question = data.get('question', '')
    context = data.get('context', '')
    
    if not question:
        return jsonify({'error': 'No question provided'}), 400
    
    try:
        response = llm_service.chat(question, context)
        provider_info = llm_service.get_provider_info()
        
        return jsonify({
            'response': response,
            'provider': provider_info['provider']
        })
        
    except Exception as e:
        return jsonify({'error': f'Chat failed: {str(e)}'}), 500

@app.route('/api/llm-info', methods=['GET'])
def get_llm_info():
    """Get information about available and current LLM providers"""
    try:
        # Get available providers with their availability status
        available_provider_names = LLMFactory.detect_available_providers()
        provider_models = LLMFactory.get_provider_models()
        
        available_providers = {}
        for provider_name in ['openai', 'google']:
            available_providers[provider_name] = {
                'model': provider_models[provider_name],
                'available': provider_name in available_provider_names,
                'description': f"{provider_models[provider_name]}"
            }
        
        # Get current provider info
        current_info = None
        if llm_service and current_provider:
            current_info = {
                'provider': current_provider['provider'],
                'description': current_provider['description']
            }
        
        return jsonify({
            'current_provider': current_info,
            'available_providers': available_providers
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get LLM info: {str(e)}'}), 500

@app.route('/api/dictionary', methods=['POST'])
def dictionary_lookup():
    """Look up a word or phrase in the dictionary"""
    if not llm_service:
        return jsonify({'error': 'LLM service not available'}), 503
    
    try:
        data = request.get_json()
        if not data or 'word' not in data:
            return jsonify({'error': 'Word or phrase is required'}), 400
        
        word = data['word'].strip()
        context = data.get('context', '').strip()  # Optional context from the sentence
        
        if not word:
            return jsonify({'error': 'Word or phrase cannot be empty'}), 400
        
        # Use LLM service dictionary lookup method
        response = llm_service.dictionary_lookup(word, context)
        
        return jsonify({
            'word': word,
            'definition': response,
            'context': context
        })
        
    except Exception as e:
        print(f"Dictionary lookup error: {e}")
        return jsonify({'error': f'Dictionary lookup failed: {str(e)}'}), 500

@app.route('/api/tts/speak', methods=['POST'])
def text_to_speech():
    """Generate speech audio for a German sentence using GPT-4o mini's TTS capability."""
    if not llm_service:
        return jsonify({'error': 'LLM service not available'}), 503
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    text = data.get('text', '').strip()
    voice = data.get('voice', 'alloy')  # Default voice
    speed = data.get('speed', 1.0)  # Default speed
    
    if not text:
        return jsonify({'error': 'Text cannot be empty'}), 400
    
    # Validate voice parameter
    valid_voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
    if voice not in valid_voices:
        return jsonify({'error': f'Invalid voice. Must be one of: {", ".join(valid_voices)}'}), 400
    
    # Validate speed parameter
    if not (0.25 <= speed <= 4.0):
        return jsonify({'error': 'Speed must be between 0.25 and 4.0'}), 400
    
    try:
        # Generate audio using LLM service
        audio_data = llm_service.generate_speech(text, voice=voice, speed=speed)
        
        # Return audio as base64 encoded data
        import base64
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        return jsonify({
            'success': True,
            'audio': audio_base64,
            'format': 'mp3',
            'text': text,
            'voice': voice,
            'speed': speed
        })
        
    except Exception as e:
        print(f"TTS Error: {str(e)}")
        return jsonify({'error': f'Text-to-speech failed: {str(e)}'}), 500

@app.route('/api/llm/providers', methods=['GET'])
def get_available_providers():
    """Get list of available LLM providers"""
    try:
        providers = LLMFactory.get_provider_models()
        
        # Add status information for each provider
        provider_status = {}
        for provider_name in providers.keys():
            try:
                # Try to create service to check if it's available
                test_service = LLMFactory.create_service(provider_name)
                provider_status[provider_name] = {
                    'available': True,
                    'model': providers[provider_name],
                    'info': test_service.get_provider_info()
                }
            except Exception as e:
                provider_status[provider_name] = {
                    'available': False,
                    'model': providers[provider_name],
                    'error': str(e)
                }
        
        return jsonify({
            'providers': provider_status,
            'current': current_provider
        })
        
    except Exception as e:
        print(f"Error getting providers: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/llm/provider', methods=['POST'])
def switch_provider():
    """Switch LLM provider"""
    global llm_service, current_provider
    
    try:
        data = request.get_json()
        if not data or 'provider' not in data:
            return jsonify({'error': 'Provider name is required'}), 400
        
        provider_name = data['provider'].strip().lower()
        
        # Check if provider is available
        available_providers = LLMFactory.detect_available_providers()
        if provider_name not in available_providers:
            return jsonify({'error': f'Provider {provider_name} is not available'}), 400
        
        # Create new service instance
        new_service = LLMFactory.create_service(provider_name)
        new_provider_info = new_service.get_provider_info()
        
        # Update global service
        llm_service = new_service
        current_provider = new_provider_info
        
        print(f"✅ Switched to LLM provider: {new_provider_info}")
        
        return jsonify({
            'success': True,
            'provider': new_provider_info,
            'message': f"Successfully switched to {new_provider_info['provider']}"
        })
        
    except Exception as e:
        print(f"Error switching provider: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/llm/current', methods=['GET'])
def get_current_provider():
    """Get current LLM provider info"""
    if llm_service is None:
        return jsonify({'error': 'No LLM service available'}), 503
    
    return jsonify({
        'provider': current_provider,
        'available': True
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'llm_available': llm_service is not None,
        'current_provider': current_provider
    })

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', 'true').lower() == 'true'
    app.run(debug=debug_mode, port=5001)