export interface TextData {
  current_page: number;
  total_pages: number;
  text_name: string;
  metadata: TextMetadata;
  page_data: PageData;
}

export interface TextMetadata {
  name: string;
  title: string;
  author: string;
  description?: string;
  year?: number;
  genre?: string;
  total_pages: number;
  difficulty?: string;
  estimated_reading_time?: string;
}

export interface PageData {
  page_number: number;
  paragraphs: Paragraph[];
}

export interface Paragraph {
  paragraph_id: number;
  sentences: Sentence[];
}

export interface Sentence {
  sentence_id: number;
  text: string;
  type: 'dialogue' | 'stage_direction' | 'narration' | 'speaker_name';
  speaker?: string; // Present for dialogue sentences
  english_translation?: EnglishSentence[]; // Present in translation responses
}

export interface EnglishSentence {
  sentence_id: number;
  text: string;
}

export interface TranslationResponse {
  page_data: PageData;
  provider: LLMProvider;
  metadata: {
    title: string;
    author: string;
    description: string;
    genre: string;
  };
}

export type LLMProvider = 'openai' | 'google';

export interface SentenceLocator {
  paragraphIndex: number;
  sentenceIndex: number;
}

export interface TextStyling {
  fontFamily: string;
  fontSize: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatResponse {
  response: string;
}
