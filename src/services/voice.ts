import Voice from 'react-native-voice';
import Tts from 'react-native-tts';

export class VoiceService {
  private static instance: VoiceService;

  static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  async startListening(
    onResult: (text: string) => void,
    onError?: (error: string) => void,
  ) {
    Voice.onSpeechResults = (event) => {
      if (event.value && event.value.length > 0) {
        onResult(event.value[0]);
      }
    };
    Voice.onSpeechError = (event) => {
      if (onError) {
        onError(event.error?.message || 'Error de voz');
      }
    };
    await Voice.start('es-VE');
  }

  async stopListening() {
    await Voice.stop();
    Voice.destroy();
  }

  async speak(text: string) {
    await Tts.setDefaultLanguage('es-VE');
    await Tts.setDefaultRate(0.5);
    await Tts.speak(text);
  }

  async stopSpeaking() {
    await Tts.stop();
  }

  isSpeaking() {
    return Tts.isSpeaking();
  }
}
