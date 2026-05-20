import { FunctionsService } from './firebase';

export class AIService {
  private static instance: AIService;

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async sendMessage(message: string, context?: Record<string, unknown>) {
    const response = await FunctionsService.call('aiChat', {
      message,
      context,
    });
    return response;
  }

  async textToSpeech(text: string) {
    const response = await FunctionsService.call('textToSpeech', { text });
    return response;
  }

  async speechToText(audioUri: string) {
    const response = await FunctionsService.call('speechToText', {
      audioUri,
    });
    return response;
  }
}
