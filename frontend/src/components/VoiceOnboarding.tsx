"use client";

import { useState, useEffect } from 'react';
import { 
  Mic, 
  Volume2, 
  MessageSquare, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Check
} from 'lucide-react';
import { useVoiceSettings } from '@/contexts/VoiceSettingsContext';

interface VoiceOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

const steps = [
  {
    id: 1,
    title: "Welcome to Voice AI! 🎙️",
    description: "Talk naturally with your AI agents using your voice. No typing required!",
    icon: Sparkles,
    color: "from-violet-500 to-purple-500",
  },
  {
    id: 2,
    title: "Enable Your Microphone",
    description: "We'll need access to your microphone to hear you. Click 'Allow' when prompted by your browser.",
    icon: Mic,
    color: "from-blue-500 to-cyan-500",
    action: "requestMic",
  },
  {
    id: 3,
    title: "Speak & Listen",
    description: "Press the microphone button and start talking. The AI will listen, think, and respond with voice.",
    icon: Volume2,
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: 4,
    title: "Text Always Available",
    description: "Prefer typing? No problem! You can always switch between voice and text anytime.",
    icon: MessageSquare,
    color: "from-amber-500 to-orange-500",
  },
];

export default function VoiceOnboarding({ onComplete, onSkip }: VoiceOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [showCelebration, setShowCelebration] = useState(false);
  const { updateSettings } = useVoiceSettings();

  useEffect(() => {
    // Check current microphone permission
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then(result => {
        setMicPermission(result.state as any);
      }).catch(() => {
        // Some browsers don't support this
      });
    }
  }, []);

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
    } catch (error) {
      setMicPermission('denied');
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete onboarding
      setShowCelebration(true);
      updateSettings({ hasCompletedOnboarding: true });
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    updateSettings({ hasCompletedOnboarding: true });
    onSkip();
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  if (showCelebration) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
        <div className="text-center animate-bounce-in">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">You're All Set! 🎉</h2>
          <p className="text-slate-400">Start talking to your AI agents now</p>
          
          {/* Confetti effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  backgroundColor: ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'][Math.floor(Math.random() * 5)],
                  width: '10px',
                  height: '10px',
                  borderRadius: Math.random() > 0.5 ? '50%' : '0',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-8 border border-slate-700/50 shadow-2xl relative overflow-hidden">
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-5`} />
        
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
          aria-label="Skip onboarding"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress dots */}
        <div className="flex justify-center space-x-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep 
                  ? 'w-8 bg-gradient-to-r ' + step.color
                  : index < currentStep 
                    ? 'w-2 bg-emerald-500' 
                    : 'w-2 bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-10 h-10 text-white" />
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-3">{step.title}</h2>
          <p className="text-slate-400 leading-relaxed">{step.description}</p>
        </div>

        {/* Mic permission action */}
        {step.action === 'requestMic' && (
          <div className="mb-6">
            {micPermission === 'granted' ? (
              <div className="flex items-center justify-center space-x-2 text-emerald-400">
                <Check className="w-5 h-5" />
                <span>Microphone access granted!</span>
              </div>
            ) : micPermission === 'denied' ? (
              <div className="text-center">
                <p className="text-red-400 mb-2">Microphone access was denied.</p>
                <p className="text-sm text-slate-500">Please enable it in your browser settings to use voice features.</p>
              </div>
            ) : (
              <button
                onClick={requestMicPermission}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-400 hover:to-cyan-400 transition-all duration-200"
              >
                Enable Microphone Access
              </button>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              currentStep === 0 
                ? 'text-slate-600 cursor-not-allowed' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            onClick={handleSkip}
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
          >
            Skip tutorial
          </button>

          <button
            onClick={handleNext}
            className={`flex items-center space-x-2 px-6 py-2 rounded-xl font-medium text-white bg-gradient-to-r ${step.color} hover:opacity-90 transition-all duration-200`}
          >
            <span>{currentStep === steps.length - 1 ? "Get Started" : "Next"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
