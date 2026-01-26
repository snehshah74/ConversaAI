"use client";

import { useState, useEffect, useCallback } from 'react';
import { Volume2, Play, Check, Loader2 } from 'lucide-react';

// Declare speechSynthesis types for TypeScript
declare global {
  interface Window {
    speechSynthesis: SpeechSynthesis;
  }
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  accent?: string;
  description?: string;
  lang: string;
  voice?: SpeechSynthesisVoice;
}

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  speechRate?: number;
  speechPitch?: number;
  className?: string;
}

export default function VoiceSelector({
  selectedVoice,
  onVoiceChange,
  speechRate = 1.0,
  speechPitch = 1.0,
  className = ''
}: VoiceSelectorProps) {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [testingVoice, setTestingVoice] = useState<string | null>(null);
  const [voiceOptions, setVoiceOptions] = useState<VoiceOption[]>([]);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = speechSynthesis.getVoices();
        setAvailableVoices(voices);
        
        // Create voice options from available voices
        const options: VoiceOption[] = [];
        
        // Group voices by language and gender
        const englishVoices = voices.filter(v => v.lang.startsWith('en'));
        
        // Female voices
        const femaleVoices = englishVoices.filter(v => {
          const name = v.name.toLowerCase();
          return name.includes('samantha') || 
                 name.includes('karen') || 
                 name.includes('victoria') ||
                 name.includes('susan') ||
                 name.includes('female') ||
                 (name.includes('zira') && !name.includes('male'));
        });
        
        // Male voices
        const maleVoices = englishVoices.filter(v => {
          const name = v.name.toLowerCase();
          return name.includes('daniel') || 
                 name.includes('david') ||
                 name.includes('alex') ||
                 name.includes('mark') ||
                 name.includes('male') ||
                 name.includes('zira');
        });
        
        // Neutral/other voices
        const neutralVoices = englishVoices.filter(v => {
          const name = v.name.toLowerCase();
          return !femaleVoices.includes(v) && !maleVoices.includes(v);
        });
        
        // Create options
        femaleVoices.slice(0, 5).forEach(voice => {
          options.push({
            id: voice.name,
            name: voice.name,
            gender: 'female',
            lang: voice.lang,
            voice: voice,
            description: getVoiceDescription(voice.name, 'female')
          });
        });
        
        maleVoices.slice(0, 5).forEach(voice => {
          options.push({
            id: voice.name,
            name: voice.name,
            gender: 'male',
            lang: voice.lang,
            voice: voice,
            description: getVoiceDescription(voice.name, 'male')
          });
        });
        
        neutralVoices.slice(0, 3).forEach(voice => {
          options.push({
            id: voice.name,
            name: voice.name,
            gender: 'neutral',
            lang: voice.lang,
            voice: voice,
            description: getVoiceDescription(voice.name, 'neutral')
          });
        });
        
        // Add default option
        options.unshift({
          id: 'default',
          name: 'System Default',
          gender: 'neutral',
          lang: 'en-US',
          description: 'Uses browser default voice'
        });
        
        setVoiceOptions(options);
        setIsLoading(false);
      }
    };

    loadVoices();
    
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.onvoiceschanged = loadVoices;
      // Also try after a delay
      setTimeout(loadVoices, 1000);
    }
  }, []);

  const getVoiceDescription = (name: string, gender: string): string => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('samantha')) return 'Clear and friendly female voice';
    if (nameLower.includes('daniel')) return 'Professional male voice';
    if (nameLower.includes('karen')) return 'Warm and welcoming female voice';
    if (nameLower.includes('alex')) return 'Natural male voice';
    if (nameLower.includes('victoria')) return 'Elegant female voice';
    if (nameLower.includes('david')) return 'Confident male voice';
    return `${gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Neutral'} voice`;
  };

  const testVoice = useCallback((voiceId: string) => {
    if (testingVoice) {
      speechSynthesis.cancel();
      setTestingVoice(null);
      return;
    }

    setTestingVoice(voiceId);
    speechSynthesis.cancel();

    const testText = "Hello! This is how I will sound when speaking to you.";
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.volume = 1.0;

    if (voiceId === 'default') {
      // Use system default
      const voices = speechSynthesis.getVoices();
      const defaultVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      if (defaultVoice) utterance.voice = defaultVoice;
    } else {
      const voice = availableVoices.find(v => v.name === voiceId);
      if (voice) utterance.voice = voice;
    }

    utterance.onend = () => setTestingVoice(null);
    utterance.onerror = () => setTestingVoice(null);

    speechSynthesis.speak(utterance);
  }, [availableVoices, speechRate, speechPitch, testingVoice]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-400">Loading voices...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-slate-300 mb-3">
        Select Agent Voice
      </label>
      
      <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
        {voiceOptions.map((option) => {
          const isSelected = selectedVoice === option.id;
          const isTesting = testingVoice === option.id;
          
          return (
            <div
              key={option.id}
              className={`
                relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'border-purple-500 bg-purple-500/20' 
                  : 'border-slate-600 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'
                }
              `}
              onClick={() => onVoiceChange(option.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${option.gender === 'female' ? 'bg-pink-500/20 text-pink-400' :
                      option.gender === 'male' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-slate-500/20 text-slate-400'}
                  `}>
                    <Volume2 className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-white">{option.name}</h3>
                      {isSelected && (
                        <Check className="w-4 h-4 text-purple-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {option.description || `${option.gender} voice`}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-300">
                        {option.gender}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-300">
                        {option.lang}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    testVoice(option.id);
                  }}
                  className={`
                    ml-4 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isTesting
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }
                  `}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 inline animate-spin mr-1" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 inline mr-1" />
                      Test
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {voiceOptions.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <p>No voices available. Your browser may not support speech synthesis.</p>
        </div>
      )}
    </div>
  );
}
