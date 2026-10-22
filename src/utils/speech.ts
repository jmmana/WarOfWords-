// Speech synthesis and accent audio management for dynamic listening mode

export type Accent = 'US' | 'UK' | 'AU';

export interface AccentInfo {
  code: Accent;
  name: string;
  flag: string;
  langCode: string;
}

export const ACCENTS: Record<Accent, AccentInfo> = {
  US: { code: 'US', name: 'American English', flag: '🇺🇸', langCode: 'en-US' },
  UK: { code: 'UK', name: 'British English', flag: '🇬🇧', langCode: 'en-GB' },
  AU: { code: 'AU', name: 'Australian English', flag: '🇦🇺', langCode: 'en-AU' },
};

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isSpeaking: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public getVoicesForAccent(accent: Accent): SpeechSynthesisVoice[] {
    const info = ACCENTS[accent];
    return this.voices.filter((v) => v.lang.toLowerCase().startsWith(info.langCode.toLowerCase()));
  }

  public speak(
    text: string,
    accent: Accent = 'US',
    rate: number = 1.0,
    onStart?: () => void,
    onEnd?: () => void
  ): boolean {
    if (!this.synth) return false;

    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate; // 0.8 for slow, 1.0 for normal, 1.2 for fast
    utterance.pitch = 1.0;

    const accentInfo = ACCENTS[accent];
    utterance.lang = accentInfo.langCode;

    // Pick best matching voice
    const matchingVoices = this.getVoicesForAccent(accent);
    if (matchingVoices.length > 0) {
      // Prefer Google or Natural voices if available
      const preferred = matchingVoices.find((v) =>
        v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Enhanced')
      );
      utterance.voice = preferred || matchingVoices[0];
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
    return true;
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const speechService = new SpeechService();
