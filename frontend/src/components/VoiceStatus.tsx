"use client";

import { useEffect, useState } from 'react';
import { 
  Mic, 
  Volume2, 
  Loader2, 
  AlertCircle, 
  WifiOff, 
  MicOff,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface VoiceStatusProps {
  state: VoiceState;
  errorType?: 'mic-denied' | 'connection' | 'service' | 'generic';
  errorMessage?: string;
  onRetry?: () => void;
  onSwitchToText?: () => void;
  reduceAnimations?: boolean;
  className?: string;
}

export default function VoiceStatus({ 
  state, 
  errorType, 
  errorMessage,
  onRetry,
  onSwitchToText,
  reduceAnimations = false,
  className = ''
}: VoiceStatusProps) {
  const [dots, setDots] = useState('');

  // Helper function to get browser-specific microphone help text
  function getMicrophoneHelpText(): string {
    if (typeof navigator === 'undefined') return '';
    
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) {
      return 'Chrome: Click the lock icon in the address bar → Site settings → Microphone → Allow';
    } else if (userAgent.includes('safari')) {
      return 'Safari: Safari → Settings → Websites → Microphone → Allow for this site';
    } else if (userAgent.includes('firefox')) {
      return 'Firefox: Click the lock icon → Permissions → Microphone → Allow';
    } else if (userAgent.includes('edge')) {
      return 'Edge: Click the lock icon → Permissions → Microphone → Allow';
    }
    return 'Check your browser settings to enable microphone access';
  }

  // Request microphone permission
  const handleRequestMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      // Update localStorage
      localStorage.setItem('micPermissionStatus', 'granted');
      
      // Call retry to reinitialize
      if (onRetry) {
        onRetry();
      }
    } catch (error: any) {
      console.error('Failed to request microphone:', error);
      // Show browser-specific help
      alert(`Microphone access denied. ${getMicrophoneHelpText()}\n\nAfter enabling, refresh the page.`);
    }
  };

  // Animated dots for status text
  useEffect(() => {
    if (state === 'listening' || state === 'processing') {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 400);
      return () => clearInterval(interval);
    }
    setDots('');
  }, [state]);

  // Error configurations
  const errorConfig: Record<string, {
    icon: typeof MicOff | typeof WifiOff | typeof AlertCircle;
    title: string;
    message: string;
    action: string;
    helpText?: string;
  }> = {
    'mic-denied': {
      icon: MicOff,
      title: 'Microphone Access Denied',
      message: 'Please enable microphone access in your browser settings to use voice features.',
      action: 'Enable Microphone',
      helpText: getMicrophoneHelpText(),
    },
    'connection': {
      icon: WifiOff,
      title: 'Connection Lost',
      message: 'We\'re having trouble connecting. Please check your internet connection.',
      action: 'Reconnect',
    },
    'service': {
      icon: AlertCircle,
      title: 'Voice Service Unavailable',
      message: 'The voice service is temporarily unavailable. You can continue with text.',
      action: 'Retry',
    },
    'generic': {
      icon: AlertCircle,
      title: 'Something Went Wrong',
      message: errorMessage || 'An unexpected error occurred. Please try again.',
      action: 'Try Again',
    },
  };

  if (state === 'error' && errorType) {
    const config = errorConfig[errorType];
    const ErrorIcon = config.icon;

    return (
      <div className={`bg-red-950/50 border border-red-800/50 rounded-2xl p-6 ${className}`}>
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-red-900/50 rounded-xl">
            <ErrorIcon className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-red-300 mb-1">{config.title}</h4>
            <p className="text-sm text-red-400/80 mb-2">{config.message}</p>
            {errorType === 'mic-denied' && config.helpText && (
              <p className="text-xs text-red-400/60 mb-4 italic">{config.helpText}</p>
            )}
            <div className="flex flex-wrap gap-3">
              {errorType === 'mic-denied' && (
                <button
                  onClick={handleRequestMicrophone}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Mic className="w-4 h-4" />
                  <span>Enable Microphone</span>
                </button>
              )}
              {onRetry && errorType !== 'mic-denied' && (
                <button
                  onClick={onRetry}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{config.action}</span>
                </button>
              )}
              {onSwitchToText && (
                <button
                  onClick={onSwitchToText}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Use Text Instead</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'idle') return null;

  return (
    <div className={`flex items-center justify-center space-x-3 py-4 ${className}`}>
      {state === 'listening' && (
        <>
          <div className="relative">
            <Mic className="w-5 h-5 text-emerald-400" />
            {!reduceAnimations && (
              <span className="absolute inset-0 animate-ping">
                <Mic className="w-5 h-5 text-emerald-400 opacity-50" />
              </span>
            )}
          </div>
          <span className="text-emerald-400 font-medium">
            Listening{dots}
          </span>
          {/* Audio waveform animation */}
          {!reduceAnimations && (
            <div className="flex items-center space-x-0.5 ml-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-emerald-400 rounded-full animate-waveform"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    height: '16px',
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {state === 'processing' && (
        <>
          <div className="relative">
            {reduceAnimations ? (
              <Loader2 className="w-5 h-5 text-violet-400" />
            ) : (
              <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
            )}
          </div>
          <span className="text-violet-400 font-medium">
            Thinking{dots}
          </span>
          {/* Thinking animation - pulsing brain/dots */}
          {!reduceAnimations && (
            <div className="flex items-center space-x-1 ml-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {state === 'speaking' && (
        <>
          <div className="relative">
            <Volume2 className="w-5 h-5 text-blue-400" />
            {!reduceAnimations && (
              <span className="absolute inset-0 animate-pulse">
                <Volume2 className="w-5 h-5 text-blue-400 opacity-50" />
              </span>
            )}
          </div>
          <span className="text-blue-400 font-medium">
            Speaking{dots}
          </span>
          {/* Speaking waveform */}
          {!reduceAnimations && (
            <div className="flex items-center space-x-0.5 ml-2">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-blue-400 rounded-full animate-waveform-speaking"
                  style={{
                    animationDelay: `${i * 0.08}s`,
                    height: '12px',
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Inline status badge for compact displays
export function VoiceStatusBadge({ 
  state, 
  reduceAnimations = false 
}: { 
  state: VoiceState; 
  reduceAnimations?: boolean;
}) {
  if (state === 'idle') return null;

  const config = {
    listening: { color: 'bg-emerald-500', icon: Mic, label: 'Listening' },
    processing: { color: 'bg-violet-500', icon: Loader2, label: 'Processing' },
    speaking: { color: 'bg-blue-500', icon: Volume2, label: 'Speaking' },
    error: { color: 'bg-red-500', icon: AlertCircle, label: 'Error' },
  };

  const { color, icon: Icon, label } = config[state] || config.error;

  return (
    <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 ${color} rounded-full text-white text-xs font-medium`}>
      <Icon className={`w-3 h-3 ${state === 'processing' && !reduceAnimations ? 'animate-spin' : ''}`} />
      <span>{label}</span>
    </div>
  );
}
