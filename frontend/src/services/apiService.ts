import axios from 'axios';
import { TextData, TextMetadata, TranslationResponse, ChatResponse, LLMProvider } from '../types';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds timeout for Ollama
});

export const apiService = {
  async getAvailableTexts(): Promise<TextMetadata[]> {
    const response = await api.get('/texts');
    return response.data;
  },

  async getTextPage(textName: string, pageNumber: number): Promise<TextData> {
    const response = await api.get(`/text/${encodeURIComponent(textName)}/page/${pageNumber}`);
    return response.data;
  },

  async translatePage(textName: string, pageNumber: number): Promise<TranslationResponse> {
    const response = await api.post('/translate-page', { 
      text_name: textName, 
      page_number: pageNumber 
    });
    return response.data;
  },

  async sendChatMessage(question: string, context?: string): Promise<ChatResponse & { provider?: LLMProvider }> {
    const response = await api.post('/chat', { question, context });
    return response.data;
  },


  async healthCheck(): Promise<{ status: string; llm_available?: boolean }> {
    const response = await api.get('/health');
    return response.data;
  },

  async dictionaryLookup(word: string, context?: string): Promise<{
    word: string;
    definition: string;
    context?: string;
  }> {
    const response = await api.post('/dictionary', { word, context });
    return response.data;
  },

  // LLM Provider Management
  async getAvailableLLMProviders(): Promise<{
    available_providers: Record<string, {
      available: boolean;
      description: string;
    }>;
    current_provider: {
      provider: LLMProvider;
      description: string;
    } | null;
  }> {
    const response = await api.get('/llm-info');
    return response.data;
  },

  async switchLLMProvider(provider: LLMProvider): Promise<{
    success: boolean;
    provider?: {
      provider: LLMProvider;
      description: string;
    };
    message?: string;
    error?: string;
  }> {
    const response = await api.post('/llm/provider', { provider });
    return response.data;
  },

  async getCurrentLLMProvider(): Promise<{
    provider: any;
    available: boolean;
  }> {
    const response = await api.get('/llm/current');
    return response.data;
  },
};
