// Web Speech API TypeScript declarations

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  grammars: SpeechGrammarList;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
  addFromURI(src: string, weight?: number): void;
  addFromString(string: string, weight?: number): void;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

declare var SpeechGrammarList: {
  prototype: SpeechGrammarList;
  new (): SpeechGrammarList;
};

declare var webkitSpeechGrammarList: {
  prototype: SpeechGrammarList;
  new (): SpeechGrammarList;
};

declare var SpeechGrammar: {
  prototype: SpeechGrammar;
  new (): SpeechGrammar;
};

declare var webkitSpeechGrammar: {
  prototype: SpeechGrammar;
  new (): SpeechGrammar;
};

// Speech Synthesis API
interface SpeechSynthesisUtterance extends EventTarget {
  text: string;
  lang: string;
  voice: SpeechSynthesisVoice | null;
  volume: number;
  rate: number;
  pitch: number;
  onstart: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onerror: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => any) | null;
  onpause: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onresume: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onmark: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onboundary: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
}

interface SpeechSynthesisEvent extends Event {
  utterance: SpeechSynthesisUtterance;
  charIndex: number;
  charLength: number;
  elapsedTime: number;
  name: string;
}

interface SpeechSynthesisErrorEvent extends SpeechSynthesisEvent {
  error: string;
}

interface SpeechSynthesisVoice {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

interface SpeechSynthesis extends EventTarget {
  pending: boolean;
  speaking: boolean;
  paused: boolean;
  onvoiceschanged: ((this: SpeechSynthesis, ev: Event) => any) | null;
  speak(utterance: SpeechSynthesisUtterance): void;
  cancel(): void;
  pause(): void;
  resume(): void;
  getVoices(): SpeechSynthesisVoice[];
}

declare var SpeechSynthesisUtterance: {
  prototype: SpeechSynthesisUtterance;
  new (text?: string): SpeechSynthesisUtterance;
};

declare var webkitSpeechSynthesisUtterance: {
  prototype: SpeechSynthesisUtterance;
  new (text?: string): SpeechSynthesisUtterance;
};

interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof webkitSpeechRecognition;
  SpeechGrammarList: typeof SpeechGrammarList;
  webkitSpeechGrammarList: typeof webkitSpeechGrammarList;
  SpeechGrammar: typeof SpeechGrammar;
  webkitSpeechGrammar: typeof webkitSpeechGrammar;
  SpeechSynthesisUtterance: typeof SpeechSynthesisUtterance;
  webkitSpeechSynthesisUtterance: typeof webkitSpeechSynthesisUtterance;
  speechSynthesis: SpeechSynthesis;
  webkitSpeechSynthesis: SpeechSynthesis;
}

