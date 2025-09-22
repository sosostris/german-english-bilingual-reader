// Enhanced TTS Service that uses GPT TTS with Web Speech API fallback
import { gptTtsService, TTSOptions as GPTTTSOptions } from './gptTtsService';
import { ttsService } from './ttsService';

export interface EnhancedTTSOptions {
  voice?: string;
  speed?: number;
  useGPT?: boolean; // Whether to prefer GPT TTS over Web Speech API
}

export interface TTSLocationInfo {
  textId: string;
  pageId: string;
  paragraphId: string;
  sentenceId: string;
}

export class EnhancedTTSService {
  private preferGPT: boolean = true;
  private currentProvider: 'gpt' | 'webspeech' | null = null;

  constructor() {}

  public async speakSentence(
    text: string, 
    location: TTSLocationInfo, 
    options?: EnhancedTTSOptions
  ): Promise<void> {
    const useGPT = options?.useGPT ?? this.preferGPT;
    const forceBrowser = options?.voice === 'browser';
    const voice = options?.voice || 'fable';
    const speed = options?.speed || 1.0;
    
    // If user explicitly selected browser voice, skip GPT TTS
    if (forceBrowser) {
      console.log('🔊 Using Browser Voice (user selected):', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
      this.currentProvider = 'webspeech';
      
      if (!ttsService.isSupported()) {
        throw new Error('Web Speech API is not supported in this browser');
      }

      const webSpeechOptions = {
        rate: speed * 0.8, // Adjust speed for web speech
        pitch: 1.0,
        volume: 1.0
      };

      await ttsService.speakSentence(text, webSpeechOptions);
      return;
    }
    
    // For GPT TTS, use backend caching
    if (useGPT && gptTtsService.isSupported()) {
      try {
        console.log('🔊 Using GPT TTS with backend caching for:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
        this.currentProvider = 'gpt';
        
        // Backend will handle caching - we pass location info to the TTS endpoint
        const audioBlob = await this.fetchTTSWithCache(text, voice, speed, location);
        
        // Use GPT TTS service to play the audio for consistent stop/pause controls
        await this.playThroughGPTService(audioBlob);
        return;
        
      } catch (error) {
        console.warn('🔊 GPT TTS failed, falling back to Web Speech API:', error);
        // Fall through to Web Speech API fallback
      }
    }

    // Fallback to Web Speech API
    console.log('🔊 Using Web Speech API fallback for:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    this.currentProvider = 'webspeech';
    
    if (!ttsService.isSupported()) {
      throw new Error('Neither GPT TTS nor Web Speech API is supported');
    }

    const webSpeechOptions = {
      rate: speed * 0.8, // Adjust speed for web speech
      pitch: 1.0,
      volume: 1.0
    };

    await ttsService.speakSentence(text, webSpeechOptions);
  }

  /**
   * Fetch TTS audio from backend with caching support
   */
  private async fetchTTSWithCache(text: string, voice: string, speed: number, location: TTSLocationInfo): Promise<Blob> {
    const response = await fetch('http://localhost:5001/api/tts/speak', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice,
        speed,
        // Include location for backend caching
        location: {
          textId: location.textId,
          pageId: location.pageId,
          paragraphId: location.paragraphId,
          sentenceId: location.sentenceId
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'TTS request failed');
    }

    const data = await response.json();
    
    if (!data.success || !data.audio) {
      throw new Error(data.error || 'Invalid TTS response');
    }

    // Convert base64 to audio blob
    return this.base64ToBlob(data.audio, 'audio/mpeg');
  }

  /**
   * Play audio blob through GPT service for consistent stop/pause controls
   */
  private async playThroughGPTService(audioBlob: Blob): Promise<void> {
    return gptTtsService.playAudioBlob(audioBlob);
  }

  /**
   * Convert base64 to blob
   */
  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  public stop(): void {
    // Stop both services to be safe
    if (this.currentProvider === 'gpt' || this.currentProvider === null) {
      gptTtsService.stop();
    }
    if (this.currentProvider === 'webspeech' || this.currentProvider === null) {
      ttsService.stop();
    }
    this.currentProvider = null;
  }

  public pause(): void {
    if (this.currentProvider === 'gpt') {
      gptTtsService.pause();
    } else if (this.currentProvider === 'webspeech') {
      ttsService.pause();
    }
  }

  public resume(): void {
    if (this.currentProvider === 'gpt') {
      gptTtsService.resume();
    } else if (this.currentProvider === 'webspeech') {
      ttsService.resume();
    }
  }

  public isSpeaking(): boolean {
    if (this.currentProvider === 'gpt') {
      return gptTtsService.isSpeaking();
    } else if (this.currentProvider === 'webspeech') {
      return ttsService.isSpeaking();
    }
    return false;
  }

  public isPaused(): boolean {
    if (this.currentProvider === 'gpt') {
      return gptTtsService.isPaused();
    } else if (this.currentProvider === 'webspeech') {
      return ttsService.isPaused();
    }
    return false;
  }

  public isSupported(): boolean {
    return gptTtsService.isSupported() || ttsService.isSupported();
  }

  public setPreferGPT(prefer: boolean): void {
    this.preferGPT = prefer;
  }

  public getPreferGPT(): boolean {
    return this.preferGPT;
  }

  public getCurrentProvider(): 'gpt' | 'webspeech' | null {
    return this.currentProvider;
  }

  public getAvailableVoices(): { gpt: string[], webspeech: SpeechSynthesisVoice[], all: string[] } {
    const gptVoices = gptTtsService.getAvailableVoices();
    return {
      gpt: gptVoices,
      webspeech: ttsService.getAllVoices(),
      all: [...gptVoices, 'browser'] // Include browser option in the combined list
    };
  }

  public getGermanVoices(): SpeechSynthesisVoice[] {
    // Only Web Speech API has language-specific voices
    return ttsService.getGermanVoices();
  }

  public async getCacheStats(): Promise<{ size: number; totalSize: number; compressionRatio: number } | null> {
    // Backend caching stats - could implement API endpoint if needed
    console.log('Cache stats now managed by backend file system');
    return null;
  }

  public async clearCache(): Promise<void> {
    // Backend cache clearing - could implement API endpoint if needed
    console.log('Cache clearing now managed by backend file system');
  }
}

// Create a singleton instance
export const enhancedTtsService = new EnhancedTTSService();
