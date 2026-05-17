declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  export default class Icon extends Component<IconProps> {}
}

declare module 'react-native-voice' {
  export interface SpeechRecognizedEvent {
    isFinal?: boolean;
  }

  export interface SpeechErrorEvent {
    error?: { message?: string };
  }

  export interface SpeechResultsEvent {
    value?: string[];
  }

  const Voice: {
    onSpeechStart: (() => void) | null;
    onSpeechRecognized: ((event: SpeechRecognizedEvent) => void) | null;
    onSpeechResults: ((event: SpeechResultsEvent) => void) | null;
    onSpeechPartialResults: ((event: SpeechResultsEvent) => void) | null;
    onSpeechError: ((event: SpeechErrorEvent) => void) | null;
    onSpeechEnd: (() => void) | null;
    start: (locale?: string) => Promise<void>;
    stop: () => Promise<void>;
    destroy: () => Promise<void>;
  };

  export default Voice;
  export type { SpeechRecognizedEvent, SpeechErrorEvent, SpeechResultsEvent };
}

declare module '@react-native-voice/voice' {
  export { default } from 'react-native-voice';
  export type {
    SpeechRecognizedEvent,
    SpeechErrorEvent,
    SpeechResultsEvent,
  } from 'react-native-voice';
}

declare module 'react-native-tts' {
  type TtsEvents = 'finish' | 'error' | 'start' | 'progress';

  interface TtsVoice {
    id: string;
    name: string;
    language: string;
  }

  const Tts: {
    setDefaultLanguage: (lang: string) => Promise<void>;
    setDefaultVoice: (voiceId: string) => Promise<void>;
    setDefaultRate: (rate: number) => Promise<void>;
    setDefaultPitch: (pitch: number) => Promise<void>;
    voices: () => Promise<TtsVoice[]>;
    speak: (text: string) => Promise<void>;
    stop: () => Promise<void>;
    addEventListener: (event: TtsEvents, handler: () => void) => void;
    removeAllListeners: (event: TtsEvents) => void;
  };

  export default Tts;
}
