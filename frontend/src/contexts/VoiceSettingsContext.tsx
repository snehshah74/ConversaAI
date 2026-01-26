"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface VoiceSettings {
  // Voice preferences
  preferredVoice: string;
  voiceGender: 'male' | 'female' | 'neutral';
  speechRate: number; // 0.5 to 2.0
  speechPitch: number; // 0.5 to 2.0
  speechVolume: number; // 0 to 1
  
  // Behavior settings
  autoPlayResponses: boolean;
  showTranscriptions: boolean;
  voiceActivityDetection: boolean;
  microphoneSensitivity: number; // 0 to 100
  
  // UX preferences
  hasCompletedOnboarding: boolean;
  prefersTextOnly: boolean;
  reduceAnimations: boolean;
  highContrastMode: boolean;
}

const defaultSettings: VoiceSettings = {
  preferredVoice: 'default',
  voiceGender: 'female',
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVolume: 1.0,
  autoPlayResponses: true,
  showTranscriptions: true,
  voiceActivityDetection: true,
  microphoneSensitivity: 70,
  hasCompletedOnboarding: false,
  prefersTextOnly: false,
  reduceAnimations: false,
  highContrastMode: false,
};

interface VoiceSettingsContextType {
  settings: VoiceSettings;
  updateSettings: (updates: Partial<VoiceSettings>) => void;
  resetSettings: () => void;
  availableVoices: SpeechSynthesisVoice[];
  testVoice: (text?: string) => void;
  isTestingVoice: boolean;
}

const VoiceSettingsContext = createContext<VoiceSettingsContextType | null>(null);

export function VoiceSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<VoiceSettings>(defaultSettings);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('voiceSettings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings({ ...defaultSettings, ...parsed });
        } catch (e) {
          // Invalid JSON, use defaults
        }
      }
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('voiceSettings', JSON.stringify(settings));
    }
  }, [settings, isLoaded]);

  // Load available voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };

      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  const updateSettings = useCallback((updates: Partial<VoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const testVoice = useCallback((text: string = "Hello! This is how I will sound when speaking to you.") => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    setIsTestingVoice(true);
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.speechRate;
    utterance.pitch = settings.speechPitch;
    utterance.volume = settings.speechVolume;

    // Find the selected voice
    const voices = speechSynthesis.getVoices();
    if (settings.preferredVoice !== 'default') {
      const voice = voices.find(v => v.name === settings.preferredVoice);
      if (voice) utterance.voice = voice;
    } else {
      // Use gender preference
      const genderVoice = voices.find(v => {
        const name = v.name.toLowerCase();
        if (settings.voiceGender === 'female') {
          return name.includes('samantha') || name.includes('karen') || name.includes('female');
        } else if (settings.voiceGender === 'male') {
          return name.includes('daniel') || name.includes('alex') || name.includes('male');
        }
        return v.lang.startsWith('en');
      }) || voices.find(v => v.lang.startsWith('en')) || voices[0];
      if (genderVoice) utterance.voice = genderVoice;
    }

    utterance.onend = () => setIsTestingVoice(false);
    utterance.onerror = () => setIsTestingVoice(false);

    speechSynthesis.speak(utterance);
  }, [settings]);

  return (
    <VoiceSettingsContext.Provider value={{
      settings,
      updateSettings,
      resetSettings,
      availableVoices,
      testVoice,
      isTestingVoice,
    }}>
      {children}
    </VoiceSettingsContext.Provider>
  );
}

export function useVoiceSettings() {
  const context = useContext(VoiceSettingsContext);
  if (!context) {
    throw new Error('useVoiceSettings must be used within a VoiceSettingsProvider');
  }
  return context;
}
