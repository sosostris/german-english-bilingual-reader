# German-English Bilingual Reader 🦒

A simple web application for reading German texts with side-by-side English translations powered by AI.

## Key Features

- **LLM-powered translation**: Get AI translations using OpenAI GPT or Google Gemini
- **Highlighting and audio support**: Click sentences for highlighting and text-to-speech playback
- **AI assistant**: Ask questions about the text content via chat interface  
- **Vocabulary lookup**: Click words for instant dictionary definitions

## Architecture

Flask backend with Python serving REST API endpoints:
- `/api/texts` - list available texts
- `/api/translate-page` - translate text pages
- `/api/chat` - AI assistant conversations
- `/api/dictionary` - word definitions
- `/api/tts/speak` - text-to-speech audio (GPT only)

React frontend with TypeScript providing the user interface and text interaction features.

## Quick Start

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file with your API keys
cp env.example .env
# Edit .env with your OPENAI_API_KEY and/or GEMINI_API_KEY

python app.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The app will be available at `http://localhost:3000` with the backend running on `http://localhost:5001`.

## Configuration

Set up your API keys in `backend/.env`:
- `OPENAI_API_KEY` - for GPT translation and TTS
- `GEMINI_API_KEY` - for Gemini translation (TTS not supported)

Text files go in `sample-texts/` directory with JSON metadata and page structure.