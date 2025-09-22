// GPT TTS Service for Text-to-Speech using OpenAI's TTS API

export interface TTSOptions {
  voice?: string; // OpenAI voice: alloy, echo, fable, onyx, nova, shimmer
  speed?: number; // 0.25 to 4.0
}

interface TTSResponse {
  success?: boolean;
  audio?: string; // base64 encoded audio
  format?: string;
  error?: string;
}

export class GPTTTSService {
  private baseUrl: string;
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioUrl: string | null = null;

  constructor(baseUrl: string = 'http://localhost:5001') {
    this.baseUrl = baseUrl;
  }

  public async speakSentence(text: string, options?: TTSOptions): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Stop any current audio
        this.stop();

        const voice = options?.voice || 'fable';
        const speed = options?.speed || 1.0;
        
        console.log('🔊 GPT TTS: Fetching audio for:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
        
        // Make API request (backend handles caching)
        const response = await fetch(`${this.baseUrl}/api/tts/speak`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            voice: voice,
            speed: speed
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'TTS request failed');
        }

        const data: TTSResponse = await response.json();
        
        if (!data.success || !data.audio) {
          throw new Error(data.error || 'Invalid TTS response');
        }

        // Convert base64 to audio blob
        const audioBlob = this.base64ToBlob(data.audio, 'audio/mpeg');

        // Create and play audio element
        const audioUrl = URL.createObjectURL(audioBlob);
        this.currentAudioUrl = audioUrl;
        this.currentAudio = new Audio(audioUrl);
        
        this.currentAudio.onended = () => {
          this.cleanup();
          resolve();
        };

        this.currentAudio.onerror = () => {
          this.cleanup();
          reject(new Error('Audio playback failed'));
        };

        this.currentAudio.play().catch((error) => {
          this.cleanup();
          reject(error);
        });

      } catch (error) {
        this.cleanup();
        reject(error);
      }
    });
  }

  private cleanup(): void {
    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
      this.currentAudioUrl = null;
    }
    if (this.currentAudio) {
      // Remove event listeners to prevent memory leaks
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio = null;
    }
  }

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
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
    this.cleanup();
  }

  public pause(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
    }
  }

  public resume(): void {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play();
    }
  }

  public isSpeaking(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }

  public isPaused(): boolean {
    return this.currentAudio !== null && this.currentAudio.paused;
  }

  public isSupported(): boolean {
    // Check if we can make API requests and play audio
    return typeof fetch !== 'undefined' && typeof Audio !== 'undefined';
  }

  public getAvailableVoices(): string[] {
    return ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  }

  public async playAudioBlob(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      // Stop any current audio first
      this.stop();
      
      // Create and play audio element
      const audioUrl = URL.createObjectURL(audioBlob);
      this.currentAudioUrl = audioUrl;
      this.currentAudio = new Audio(audioUrl);
      
      this.currentAudio.onended = () => {
        this.cleanup();
        resolve();
      };

      this.currentAudio.onerror = () => {
        this.cleanup();
        reject(new Error('Audio playback failed'));
      };

      this.currentAudio.play().catch((error) => {
        this.cleanup();
        reject(error);
      });
    });
  }
}

// Create a singleton instance
export const gptTtsService = new GPTTTSService();