import Voice, {
  SpeechRecognizedEvent,
  SpeechErrorEvent,
  SpeechResultsEvent,
} from '@react-native-voice/voice';
import Tts from 'react-native-tts';

type VoiceCallback = (text: string) => void;
type ErrorCallback = (error: string) => void;
type ListeningCallback = (isListening: boolean) => void;

class VoiceService {
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private onResultCallback: VoiceCallback | null = null;
  private onErrorCallback: ErrorCallback | null = null;
  private onListeningChange: ListeningCallback | null = null;
  private partialResults: string[] = [];

  constructor() {
    this.setupListeners();
    this.initTts();
  }

  private setupListeners() {
    Voice.onSpeechStart = () => {
      this.isListening = true;
      this.partialResults = [];
      this.onListeningChange?.(true);
    };

    Voice.onSpeechRecognized = (event: SpeechRecognizedEvent) => {
      if (!event.isFinal) return;
    };

    Voice.onSpeechResults = (event: SpeechResultsEvent) => {
      if (event.value && event.value.length > 0) {
        const text = event.value[0];
        this.onResultCallback?.(text);
      }
    };

    Voice.onSpeechPartialResults = (event: SpeechResultsEvent) => {
      if (event.value) {
        this.partialResults = event.value;
      }
    };

    Voice.onSpeechError = (event: SpeechErrorEvent) => {
      const errorMessage = event.error?.message || 'Error de reconocimiento de voz';
      this.onErrorCallback?.(errorMessage);
      this.stopListening();
    };

    Voice.onSpeechEnd = () => {
      this.isListening = false;
      this.onListeningChange?.(false);
    };
  }

  private async initTts() {
    try {
      await Tts.setDefaultLanguage('es-VE');
      await Tts.setDefaultVoice('es-VE');
      await Tts.setDefaultRate(0.48);
      await Tts.setDefaultPitch(1.0);

      const voices = await Tts.voices();
      const spanishVoice = voices.find(
        (v: any) => v.language === 'es-VE' || v.language === 'es-ES' || v.language === 'es-US'
      );
      if (spanishVoice) {
        await Tts.setDefaultVoice(spanishVoice.id);
      }
    } catch (error) {
      console.warn('Error inicializando TTS:', error);
    }
  }

  async startListening(
    onResult: VoiceCallback,
    onError?: ErrorCallback,
    onListening?: ListeningCallback
  ): Promise<void> {
    if (this.isListening) {
      await this.stopListening();
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    this.onListeningChange = onListening || null;

    try {
      await Voice.start('es-VE');
    } catch (error) {
      this.onErrorCallback?.('Error al iniciar el micrófono');
    }
  }

  async stopListening(): Promise<void> {
    try {
      await Voice.stop();
    } catch (error) {
      // Ignore errors on stop
    } finally {
      this.isListening = false;
      this.onListeningChange?.(false);
    }
  }

  async speak(text: string): Promise<void> {
    if (this.isSpeaking) {
      await Tts.stop();
    }

    return new Promise((resolve) => {
      this.isSpeaking = true;

      Tts.addEventListener('finish', () => {
        this.isSpeaking = false;
        resolve();
      });

      Tts.addEventListener('error', () => {
        this.isSpeaking = false;
        resolve();
      });

      Tts.speak(text);
    });
  }

  async stopSpeaking(): Promise<void> {
    try {
      await Tts.stop();
    } finally {
      this.isSpeaking = false;
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  async destroy(): Promise<void> {
    await this.stopListening();
    await this.stopSpeaking();
    Voice.destroy().catch(() => {});
    Tts.removeAllListeners('finish');
    Tts.removeAllListeners('error');
  }
}

export const voiceService = new VoiceService();
export default voiceService;
