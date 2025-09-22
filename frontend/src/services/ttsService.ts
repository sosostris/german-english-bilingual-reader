// Web Speech API Text-to-Speech Service
export class TTSService {
  private synth: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();
    
    // Load voices when they become available
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  private loadVoices() {
    this.voices = this.synth.getVoices();
  }

  public getGermanVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => 
      voice.lang.startsWith('de') || 
      voice.lang.includes('german') ||
      voice.name.toLowerCase().includes('german') ||
      voice.name.toLowerCase().includes('deutsch')
    );
  }

  public getAllVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public async speakSentence(sentence: string, options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!sentence.trim()) {
        resolve();
        return;
      }

      // Stop any current speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(sentence.trim());
      
      // Set voice - prefer German voice
      const germanVoices = this.getGermanVoices();
      if (options?.voice) {
        utterance.voice = options.voice;
      } else if (germanVoices.length > 0) {
        // Use the first German voice found
        utterance.voice = germanVoices[0];
      }

      // Set speech parameters for single sentence reading
      utterance.rate = options?.rate || 0.8; // Slower for better comprehension
      utterance.pitch = options?.pitch || 1.0;
      utterance.volume = options?.volume || 1.0;
      utterance.lang = 'de-DE'; // German language

      // Event handlers
      utterance.onend = () => {
        this.currentUtterance = null;
        console.log('🔊 Finished speaking sentence');
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      utterance.onstart = () => {
        console.log('🔊 Speaking sentence:', sentence.substring(0, 50) + (sentence.length > 50 ? '...' : ''));
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  public stop(): void {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }

  public pause(): void {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  public resume(): void {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }

  public isSpeaking(): boolean {
    return this.synth.speaking;
  }

  public isPaused(): boolean {
    return this.synth.paused;
  }

  public isSupported(): boolean {
    return 'speechSynthesis' in window;
  }
}

// Create a singleton instance
export const ttsService = new TTSService();
