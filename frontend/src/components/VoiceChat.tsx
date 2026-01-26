"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Volume2, 
  VolumeX, 
  Wifi, 
  WifiOff,
  Loader2,
  Bot,
  User,
  Settings,
  Keyboard,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { startConversation, sendMessage } from '@/lib/api';
import type { Message, Agent } from '@/lib/types';
import { useVoiceSettings } from '@/contexts/VoiceSettingsContext';
import VoiceOnboarding from './VoiceOnboarding';
import VoiceStatus from './VoiceStatus';

interface VoiceChatProps {
  agentId: string;
  agent?: Agent;
  onMetricsUpdate?: (metrics: {
    messagesExchanged: number;
    sentiment: string;
    actionsExecuted: string[];
  }) => void;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  message_metadata?: Record<string, any>;
  isFromUser: boolean;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ agentId, agent, onMetricsUpdate }) => {
  // Voice settings
  const { settings, updateSettings } = useVoiceSettings();
  
  // State management
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [actionsExecuted, setActionsExecuted] = useState<string[]>([]);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [errorState, setErrorState] = useState<{ type: 'mic-denied' | 'connection' | 'service' | 'generic'; message?: string } | null>(null);
  
  // Periodically check microphone permission status (in case user enables it in browser settings)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return;
    
    const checkPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        const currentState = result.state;
        
        if (currentState === 'granted' && localStorage.getItem('micPermissionStatus') !== 'granted') {
          // Permission was granted (user enabled it in browser settings)
          localStorage.setItem('micPermissionStatus', 'granted');
          setErrorState(null);
          console.log('✅ Microphone permission detected as granted');
          // Reinitialize speech recognition if conversation is active
          if (conversationId && !settings.prefersTextOnly) {
            initializeSpeechRecognition();
          }
        } else if (currentState === 'denied' && errorState?.type !== 'mic-denied') {
          // Permission was denied
          localStorage.setItem('micPermissionStatus', 'denied');
        }
        
        // Listen for permission changes
        result.onchange = () => {
          if (result.state === 'granted') {
            localStorage.setItem('micPermissionStatus', 'granted');
            setErrorState(null);
            if (conversationId && !settings.prefersTextOnly) {
              initializeSpeechRecognition();
            }
          }
        };
      } catch (error) {
        // Permissions API not supported
      }
    };
    
    // Check immediately
    checkPermission();
    
    // Check every 5 seconds
    const interval = setInterval(checkPermission, 5000);
    
    return () => clearInterval(interval);
  }, [conversationId, errorState?.type, settings.prefersTextOnly]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRecognitionActiveRef = useRef<boolean>(false);
  const recognitionInitializedRef = useRef<boolean>(false);
  const handleUserMessageRef = useRef<((message: string) => Promise<void>) | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  const conversationIdRef = useRef<string | null>(null);
  const speakingProtectionRef = useRef<boolean>(false); // Prevents cancellation right after starting speech
  const greetingSpokenRef = useRef<boolean>(false); // Prevents greeting from being spoken twice
  const lastSentMessageRef = useRef<string>(''); // Prevents duplicate messages
  const lastSpeechTimeRef = useRef<number>(0); // Track when speech was last detected
  
  // Common false positives to filter out (unless part of longer speech)
  const FALSE_POSITIVES = ['no', 'uh', 'um', 'hmm', 'ah', 'oh', 'yeah', 'yes', 'ok', 'okay', 'huh', 'what'];
  
  // Check if transcript is valid (not just noise/false positive)
  const isValidTranscript = useCallback((transcript: string): boolean => {
    const trimmed = transcript.trim().toLowerCase();
    
    // Must have at least 3 characters
    if (trimmed.length < 3) {
      return false;
    }
    
    // Must have at least 2 words OR be longer than 10 characters
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);
    if (words.length < 2 && trimmed.length < 10) {
      // Check if it's a common false positive
      if (FALSE_POSITIVES.includes(trimmed)) {
        console.log('🚫 Filtered out false positive:', trimmed);
        return false;
      }
    }
    
    // Must have at least one letter (not just numbers/punctuation)
    if (!/[a-zA-Z]/.test(trimmed)) {
      return false;
    }
    
    return true;
  }, []);

  // Keep refs in sync with state (to avoid stale closures in callbacks)
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { conversationIdRef.current = conversationId; }, [conversationId]);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    // Support both standard and webkit speech recognition (Safari/Chrome)
    const SpeechRecognitionAPI = typeof window !== 'undefined' 
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;
    
    if (SpeechRecognitionAPI && !recognitionInitializedRef.current) {
      // Clean up existing recognition if any
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      // Set confidence threshold if supported (Chrome)
      if ('grammars' in recognition) {
        // Chrome-specific: Set max alternatives to help with accuracy
        (recognition as any).maxAlternatives = 1;
      }

      recognition.onstart = () => {
        setIsListening(true);
        isRecognitionActiveRef.current = true;
      };

      // Track interim transcript for timeout-based sending (Safari fix)
      let lastInterimTranscript = '';
      let sendTimeoutId: ReturnType<typeof setTimeout> | null = null;

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        console.log('📝 Speech result:', { interimTranscript, finalTranscript, isFinal: finalTranscript.length > 0 });

        // Only show interim transcripts in the UI (final ones will be added as messages)
        setCurrentTranscript(interimTranscript);

        // If we got a final transcript, validate and send
        if (finalTranscript) {
          if (sendTimeoutId) clearTimeout(sendTimeoutId);
          const message = finalTranscript.trim();
          
          // Validate transcript before processing
          if (!isValidTranscript(message)) {
            console.log('🚫 Invalid transcript filtered out:', message);
            setCurrentTranscript('');
            return;
          }
          
          // Prevent duplicate messages
          if (message === lastSentMessageRef.current) {
            console.log('⚠️ Duplicate message detected, ignoring:', message);
            setCurrentTranscript(''); // Clear transcript immediately
            return;
          }
          
          // Check if this is too soon after last speech (might be echo/noise)
          const now = Date.now();
          if (now - lastSpeechTimeRef.current < 500) {
            console.log('🚫 Speech too soon after last, ignoring (possible echo):', message);
            setCurrentTranscript('');
            return;
          }
          lastSpeechTimeRef.current = now;
          
          console.log('✅ Final transcript received:', message);
          // Clear transcript immediately before sending
          setCurrentTranscript('');
          lastSentMessageRef.current = message;
          
          if (message && handleUserMessageRef.current) {
            console.log('📤 Calling handleUserMessage with:', message);
            handleUserMessageRef.current(message);
          }
        } 
        // Safari workaround: If we only get interim results, send after 2s of silence (increased from 1.5s)
        else if (interimTranscript && interimTranscript.trim().length > 3) {
          // Validate interim transcript before considering it
          if (!isValidTranscript(interimTranscript)) {
            // Don't set timeout for invalid transcripts
            return;
          }
          
          lastInterimTranscript = interimTranscript;
          
          // Clear previous timeout
          if (sendTimeoutId) clearTimeout(sendTimeoutId);
          
          // Set new timeout - send message after 2s of no new results (increased delay)
          sendTimeoutId = setTimeout(() => {
            const message = lastInterimTranscript.trim();
            
            // Re-validate before sending (in case it changed)
            if (!isValidTranscript(message)) {
              console.log('🚫 Invalid transcript filtered out (timeout):', message);
              setCurrentTranscript('');
              lastInterimTranscript = '';
              return;
            }
            
            // Prevent duplicate messages
            if (message === lastSentMessageRef.current) {
              console.log('⚠️ Duplicate message detected (timeout), ignoring:', message);
              setCurrentTranscript('');
              lastInterimTranscript = '';
              return;
            }
            
            // Check if this is too soon after last speech
            const now = Date.now();
            if (now - lastSpeechTimeRef.current < 500) {
              console.log('🚫 Speech too soon after last (timeout), ignoring:', message);
              setCurrentTranscript('');
              lastInterimTranscript = '';
              return;
            }
            lastSpeechTimeRef.current = now;
            
            console.log('⏰ Safari timeout: Sending interim as final:', message);
            setCurrentTranscript(''); // Clear transcript immediately
            lastSentMessageRef.current = message;
            
            if (message && handleUserMessageRef.current) {
              handleUserMessageRef.current(message);
            }
            lastInterimTranscript = '';
          }, 2000); // Increased from 1500ms to 2000ms for better filtering
        }
      };

      recognition.onerror = (event) => {
        const errorType = event.error;
        
        // Handle different error types gracefully
        if (errorType === 'no-speech') {
          // This is normal - user didn't speak yet, just restart listening
          // No speech detected, restarting
          isRecognitionActiveRef.current = false;
        setIsListening(false);
          
          // Restart after a short delay if conversation is active
          // Note: We check state inside setTimeout to avoid stale closure
          setTimeout(() => {
            try {
              if (recognitionRef.current && !isRecognitionActiveRef.current) {
                // Re-check state inside setTimeout
                isRecognitionActiveRef.current = true;
                recognitionRef.current.start();
              }
            } catch (error) {
              // Ignore errors when restarting
              isRecognitionActiveRef.current = false;
            }
          }, 500);
          return; // Don't treat 'no-speech' as an error
        }
        
        // 'aborted' is normal - happens when we intentionally stop recognition
        if (errorType === 'aborted') {
          // Silently handle - this is expected when stopping recognition
          isRecognitionActiveRef.current = false;
          setIsListening(false);
          return;
        }
        
        if (errorType === 'not-allowed') {
          // Permission denied - gracefully fall back to text mode
          console.info('ℹ️ Microphone permission denied - text mode available');
          localStorage.setItem('micPermissionStatus', 'denied');
          setErrorState({ 
            type: 'mic-denied', 
            message: 'Microphone access denied. Click "Enable Microphone" to request access again, or use text mode below.' 
          });
          setIsListening(false);
          isRecognitionActiveRef.current = false;
          // Show text input as fallback
          setShowTextInput(true);
          return;
        }
        
        if (errorType === 'audio-capture') {
          console.info('ℹ️ No microphone found - text mode available');
          setIsListening(false);
          isRecognitionActiveRef.current = false;
          setShowTextInput(true);
          return;
        }
        
        // For other errors, log and restart if appropriate
        if (errorType !== 'network') {
          console.warn('Speech recognition error:', errorType);
        }
        setIsListening(false);
        isRecognitionActiveRef.current = false;
        
        // Restart listening for recoverable errors
        // Use refs and state check functions to avoid stale closure
        setTimeout(() => {
          // Check current state before restarting
          if (conversationId && !isMuted && !isProcessing && errorType !== 'network') {
            try {
              if (recognitionRef.current && !isRecognitionActiveRef.current) {
                isRecognitionActiveRef.current = true;
                recognitionRef.current.start();
              }
            } catch (error) {
              // Ignore errors when restarting
              isRecognitionActiveRef.current = false;
            }
          }
        }, 1000);
      };

      recognition.onend = () => {
        setIsListening(false);
        isRecognitionActiveRef.current = false;
        
        // Auto-restart listening if conversation is active and not speaking
        setTimeout(() => {
          const shouldRestart = conversationIdRef.current && !isMutedRef.current && !isSpeakingRef.current;
          if (shouldRestart && recognitionRef.current && !isRecognitionActiveRef.current) {
            try {
              isRecognitionActiveRef.current = true;
              setIsListening(true);
              recognitionRef.current.start();
            } catch (error) {
              isRecognitionActiveRef.current = false;
              setIsListening(false);
            }
          }
        }, 300);
      };

      recognitionRef.current = recognition;
      recognitionInitializedRef.current = true;
      console.log('✅ Speech recognition initialized successfully');
    } else if (!SpeechRecognitionAPI) {
      console.error('❌ Speech recognition not supported in this browser');
      setErrorState({ type: 'service', message: 'Voice not supported in this browser. Try Chrome or Safari.' });
    }
  }, [conversationId]);

  // Initialize speech synthesis
  const initializeSpeechSynthesis = useCallback(() => {
    if ('speechSynthesis' in window && speechSynthesis) {
      // Load voices - this is async in some browsers
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        // Voices loaded
      };
      
      // Load voices immediately
      loadVoices();
      
      // Some browsers load voices asynchronously
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      // Also try after a delay
      setTimeout(loadVoices, 1000);
    } else {
      // Speech synthesis not available
    }
  }, []);

  // Unlock audio - browsers require user interaction before playing audio
  const unlockAudio = useCallback(() => {
    if (audioUnlocked) return;
    
    // Unlock audio with real speech
    
    if ('speechSynthesis' in window && speechSynthesis) {
      // IMPORTANT: Use a REAL phrase, not empty/silent - Chrome needs real audio
      const testUtterance = new SpeechSynthesisUtterance('Voice enabled');
      testUtterance.volume = 1.0;
      testUtterance.rate = 1.2; // Slightly faster
      
      // Get a voice
      const voices = speechSynthesis.getVoices();
      const voice = voices.find(v => v.name === 'Samantha') 
        || voices.find(v => v.lang.startsWith('en'))
        || voices[0];
      if (voice) testUtterance.voice = voice;
      
      testUtterance.onstart = () => setAudioUnlocked(true);
      testUtterance.onend = () => setAudioUnlocked(true);
      testUtterance.onerror = () => setAudioUnlocked(true);
      
      speechSynthesis.cancel();
      speechSynthesis.resume();
      speechSynthesis.speak(testUtterance);
    }
  }, [audioUnlocked]);

  // Start listening
  const startListening = useCallback(() => {
    // Check if microphone permission was previously denied
    const micPermissionStatus = localStorage.getItem('micPermissionStatus');
    if (micPermissionStatus === 'denied') {
      console.info('ℹ️ Microphone permission denied - skipping voice mode');
      setShowTextInput(true);
      return;
    }
    
    console.log('🎤 startListening called', { 
      hasRecognition: !!recognitionRef.current, 
      isActive: isRecognitionActiveRef.current, 
      isMuted, 
      conversationId 
    });
    
    if (recognitionRef.current && !isRecognitionActiveRef.current && !isMuted && conversationId) {
      try {
        console.log('🎤 Starting speech recognition...');
        isRecognitionActiveRef.current = true;
        setIsListening(true);
        recognitionRef.current.start();
        console.log('✅ Speech recognition started');
      } catch (error: any) {
        // Handle permission errors gracefully
        if (error?.message?.includes('not allowed') || error?.message?.includes('permission')) {
          console.info('ℹ️ Microphone permission denied - switching to text mode');
          localStorage.setItem('micPermissionStatus', 'denied');
          setShowTextInput(true);
          setErrorState({ 
            type: 'mic-denied', 
            message: 'Microphone access denied. You can still chat using text below.' 
          });
        } else {
          console.error('❌ Speech recognition start error:', error);
        }
        
        if (error?.message?.includes('already started')) {
          isRecognitionActiveRef.current = true;
          setIsListening(true);
        } else {
          isRecognitionActiveRef.current = false;
          setIsListening(false);
        }
      }
    } else {
      console.log('⚠️ Cannot start listening:', {
        noRecognition: !recognitionRef.current,
        alreadyActive: isRecognitionActiveRef.current,
        isMuted,
        noConversation: !conversationId
      });
    }
  }, [isMuted, conversationId]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isRecognitionActiveRef.current) {
      try {
      recognitionRef.current.stop();
        isRecognitionActiveRef.current = false;
        setIsListening(false);
      } catch (error) {
        // Ignore errors when stopping
        isRecognitionActiveRef.current = false;
        setIsListening(false);
      }
    }
  }, []);

  // Speak text using speech synthesis (defined before handleUserMessage)
  // Uses Chrome workarounds for the notorious speechSynthesis bugs
  const speakText = useCallback((text: string) => {
    if (!text || text.trim().length === 0) return;
    if (!('speechSynthesis' in window) || !speechSynthesis) return;
    
    // Stop listening while agent speaks
    if (recognitionRef.current && isRecognitionActiveRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) { /* ignore */ }
      isRecognitionActiveRef.current = false;
      setIsListening(false);
    }
    
    // CHROME WORKAROUND: Wait for recognition to fully stop
    setTimeout(() => {
      try {
        // Get voices first
        const voices = speechSynthesis.getVoices();
        
        // Use agent's voice settings if available, otherwise use user settings
        const agentVoiceSettings = agent?.voice_settings || {};
        const voiceName = agentVoiceSettings.voice || settings.preferredVoice;
        const speechRate = agentVoiceSettings.speed || settings.speechRate;
        const speechPitch = agentVoiceSettings.pitch || settings.speechPitch;
        const voiceGender = agentVoiceSettings.gender || settings.voiceGender;
        
        // Find voice based on agent settings or user preferences
        let selectedVoice: SpeechSynthesisVoice | null = null;
        
        if (voiceName && voiceName !== 'default') {
          // Use specific voice name from agent settings
          selectedVoice = voices.find(v => v.name === voiceName) || null;
        }
        
        if (!selectedVoice) {
          // Fall back to gender-based selection
          if (voiceGender === 'female') {
            selectedVoice = voices.find(v => {
              const name = v.name.toLowerCase();
              return name.includes('samantha') || 
                     name.includes('karen') || 
                     name.includes('victoria') ||
                     name.includes('female');
            }) || voices.find(v => v.lang.startsWith('en')) || voices[0];
          } else if (voiceGender === 'male') {
            selectedVoice = voices.find(v => {
              const name = v.name.toLowerCase();
              return name.includes('daniel') || 
                     name.includes('david') ||
                     name.includes('alex') ||
                     name.includes('male');
            }) || voices.find(v => v.lang.startsWith('en')) || voices[0];
          } else {
            // Default: find any English voice
            selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
          }
        }
        
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speechRate;
        utterance.pitch = speechPitch;
        utterance.volume = settings.speechVolume;
        if (selectedVoice) utterance.voice = selectedVoice;
        
        // Store ref to prevent garbage collection
        synthesisRef.current = utterance;

      utterance.onstart = () => {
        setIsSpeaking(true);
          isSpeakingRef.current = true;
      };

      utterance.onend = () => {
        setIsSpeaking(false);
          isSpeakingRef.current = false;
          synthesisRef.current = null;
          
          // Restart listening after speech ends - improved logic
          setTimeout(() => {
            if (conversationIdRef.current && !isMutedRef.current) {
              try {
                // Always restart - don't check isRecognitionActiveRef as it might be stale
                if (recognitionRef.current) {
                  recognitionRef.current.stop(); // Stop first to reset state
                  setTimeout(() => {
                    if (recognitionRef.current && conversationIdRef.current && !isMutedRef.current) {
                      recognitionRef.current.start();
                      isRecognitionActiveRef.current = true;
                      setIsListening(true);
                      console.log('✅ Restarted listening after speech ended');
                    }
                  }, 300);
                }
              } catch (e) { 
                console.warn('⚠️ Error restarting recognition after speech:', e);
                // Try again after a longer delay
                setTimeout(() => {
                  if (recognitionRef.current && conversationIdRef.current && !isMutedRef.current) {
                    try {
                      recognitionRef.current.start();
                      isRecognitionActiveRef.current = true;
                      setIsListening(true);
                    } catch (e2) { /* ignore */ }
                  }
                }, 1000);
              }
            }
          }, 500);
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          synthesisRef.current = null;
          
          // Restart listening
          setTimeout(() => {
            if (conversationIdRef.current && !isMutedRef.current && !isRecognitionActiveRef.current) {
              try {
                recognitionRef.current?.start();
                isRecognitionActiveRef.current = true;
                setIsListening(true);
              } catch (e) { /* ignore */ }
            }
          }, 500);
        };
        
        // Chrome fix: resume() before speak()
        speechSynthesis.resume();
        speechSynthesis.speak(utterance);
        
        // CHROME FIX: Keep poking it to make sure it starts
        const keepAlive = setInterval(() => {
          if (speechSynthesis.speaking) {
            clearInterval(keepAlive);
            return;
          }
          if (!synthesisRef.current) {
            clearInterval(keepAlive);
            return;
          }
          speechSynthesis.resume();
        }, 100);
        
        // Give up after 3 seconds
        setTimeout(() => {
          clearInterval(keepAlive);
          if (!isSpeakingRef.current && synthesisRef.current) {
            synthesisRef.current = null;
            if (conversationIdRef.current && !isMutedRef.current) {
              try {
                if (recognitionRef.current) {
                  recognitionRef.current.stop();
                  setTimeout(() => {
                    if (recognitionRef.current && conversationIdRef.current && !isMutedRef.current) {
                      recognitionRef.current.start();
                      isRecognitionActiveRef.current = true;
                      setIsListening(true);
                      console.log('✅ Restarted listening after speech timeout');
                    }
                  }, 300);
                }
              } catch (e) { /* ignore */ }
            }
          }
        }, 3000);
        
      } catch (error) {
        setTimeout(() => {
          if (conversationIdRef.current && !isMutedRef.current) {
            try {
              recognitionRef.current?.start();
              isRecognitionActiveRef.current = true;
              setIsListening(true);
            } catch (e) { /* ignore */ }
          }
        }, 500);
      }
    }, 300);
  }, [agent, settings.speechRate, settings.speechPitch, settings.speechVolume, settings.preferredVoice, settings.voiceGender, audioUnlocked]);

  // Handle user message
  const handleUserMessage = useCallback(async (message: string) => {
    console.log('🎯 handleUserMessage called:', { message, conversationId, isProcessing: isProcessingRef.current });
    
    // Use ref for isProcessing to get latest value (avoid stale closure)
    if (!message || !conversationId || isProcessingRef.current) {
      console.warn('⚠️ handleUserMessage blocked:', { noMessage: !message, noConversation: !conversationId, isProcessing: isProcessingRef.current });
      return;
    }

    // Set processing immediately to prevent duplicate calls
    isProcessingRef.current = true;
    setIsProcessing(true);
    
    console.log('📨 Processing user message:', message);
    
    // Stop listening while processing
    stopListening();

    // Prevent duplicate messages - check if this message was already added
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage && lastMessage.content === message && lastMessage.isFromUser) {
        console.log('⚠️ Message already in chat, skipping duplicate:', message);
        return prev;
      }

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      conversation_id: conversationId,
      role: 'user',
      content: message,
      timestamp: new Date(),
      isFromUser: true
    };

      return [...prev, userMessage];
    });
    
    // Clear transcript (should already be cleared, but safety net)
    setCurrentTranscript('');

    try {
      // Send message to backend
      console.log('📡 Sending to backend:', { agentId, message, conversationId });
      const response = await sendMessage(agentId, message, conversationId);
      console.log('✅ Backend response received:', response);
      
      // Add agent response to chat
      const agentMessage: ChatMessage = {
        id: response.message_id,
        conversation_id: response.conversation_id,
        role: 'agent',
        content: response.agent_response,
        timestamp: new Date(response.timestamp),
        isFromUser: false
      };

        setMessages(prev => {
        const newMessages = [...prev, agentMessage];
        
        // Update metrics (defer to avoid render conflict)
        const totalMessages = newMessages.length;
        const sentiment = response.message_metadata?.sentiment || 'neutral';
        const actions = response.message_metadata?.actions_taken || [];
        
        setActionsExecuted(prev => [...prev, ...actions]);
        
        // Defer metrics update to next tick to avoid render conflicts
        setTimeout(() => {
      onMetricsUpdate?.({
        messagesExchanged: totalMessages,
        sentiment,
            actionsExecuted: [...actionsExecuted, ...actions]
          });
        }, 0);
        
        return newMessages;
      });

      // Set isProcessing to false - message already displayed
      setIsProcessing(false);
      isProcessingRef.current = false;

      // Speak the response
      if (!isMuted && response.agent_response && 'speechSynthesis' in window) {
        speakText(response.agent_response);
      } else {
        // If muted or no speech, restart listening
        setTimeout(() => {
          if (conversationId && !isMuted) startListening();
        }, 500);
      }

    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        response: error?.response,
        status: error?.response?.status,
        data: error?.response?.data
      });
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response from agent';
      
      // Show error message to user
      const errorChatMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        conversation_id: conversationId!,
        role: 'agent',
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
        isFromUser: false
      };
      
      setMessages(prev => [...prev, errorChatMessage]);
      
      // Speak error message
      if (!isMuted) {
        speakText(errorChatMessage.content);
      }
      
      setIsConnected(false);
      // Restart listening even on error
      setTimeout(() => {
        if (conversationId && !isMuted) {
          startListening();
        }
      }, 2000);
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [agentId, conversationId, isMuted, stopListening, startListening, speakText, onMetricsUpdate]);
  
  // Update ref when handleUserMessage changes
  useEffect(() => {
    handleUserMessageRef.current = handleUserMessage;
  }, [handleUserMessage]);
  
  // Re-initialize recognition when conversation starts
  useEffect(() => {
    if (conversationId && recognitionInitializedRef.current) {
      // Re-initialize to update conversation context
      initializeSpeechRecognition();
    }
  }, [conversationId, initializeSpeechRecognition]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    // Unlock audio on first interaction
    unlockAudio();
    
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (newMuted) {
      stopSpeaking();
      stopListening();
    } else {
      startListening();
    }
  }, [isMuted, stopSpeaking, stopListening, startListening, unlockAudio]);

  // End call
  const endCall = useCallback(() => {
    stopListening();
    stopSpeaking();
    setIsListening(false);
    setIsSpeaking(false);
    setMessages([]);
    setCurrentTranscript('');
    setConversationId(null);
    greetingSpokenRef.current = false; // Reset greeting flag
    lastSentMessageRef.current = ''; // Reset last sent message
  }, [stopListening, stopSpeaking]);

  // Initialize conversation
  const initializeConversation = useCallback(async () => {
    // Prevent double initialization
    if (conversationId) {
      console.log('⚠️ Conversation already initialized');
      return;
    }
    
    // Request microphone permission automatically (only once, remembered in localStorage)
    // This is non-blocking - conversation will start even if permission is denied
    try {
      const micPermissionStatus = localStorage.getItem('micPermissionStatus');
      
      // Check current permission status using Permissions API if available
      let currentPermission: PermissionState | null = null;
      if (typeof navigator !== 'undefined' && navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          currentPermission = result.state;
          // Update localStorage based on actual permission state
          if (currentPermission === 'granted') {
            localStorage.setItem('micPermissionStatus', 'granted');
          } else if (currentPermission === 'denied') {
            localStorage.setItem('micPermissionStatus', 'denied');
          }
        } catch (permError) {
          // Permissions API not supported or failed
          console.debug('Permissions API not available');
        }
      }
      
      // Only request if we haven't asked before and permission is not already granted
      if (micPermissionStatus !== 'granted' && currentPermission !== 'granted') {
        if (micPermissionStatus !== 'denied' && currentPermission !== 'denied') {
          console.log('🎤 Requesting microphone permission...');
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the stream immediately - we just needed permission
            stream.getTracks().forEach(track => track.stop());
            localStorage.setItem('micPermissionStatus', 'granted');
            console.log('✅ Microphone permission granted and saved');
            // Clear any error state
            setErrorState(null);
          } catch (permError: any) {
            // Permission denied - save status and continue (user can use text)
            localStorage.setItem('micPermissionStatus', 'denied');
            console.info('ℹ️ Microphone permission not granted - text mode available');
            // Don't throw - allow conversation to start anyway
          }
        } else {
          console.log('ℹ️ Microphone permission was previously denied - text mode available');
        }
      } else {
        console.log('✅ Microphone permission already granted (remembered)');
        // Clear any error state if permission is granted
        if (errorState?.type === 'mic-denied') {
          setErrorState(null);
        }
      }
    } catch (error: any) {
      // Catch any other errors silently - don't block conversation
      console.info('ℹ️ Microphone check failed - continuing with text mode');
      localStorage.setItem('micPermissionStatus', 'denied');
    }
    
    try {
      const response = await startConversation(agentId);
      // API returns conversation_id, not id
      const convId = (response as any).conversation_id || response.id;
      console.log('🆔 Conversation started:', convId);
      setConversationId(convId);
      
      // Add greeting message
      const greetingText = agent?.greeting || 'Hello! I\'m your AI assistant. How can I help you today?';
      const greetingMessage: ChatMessage = {
        id: `greeting-${Date.now()}`,
        conversation_id: convId,
        role: 'agent',
        content: greetingText,
        timestamp: new Date(),
        isFromUser: false
      };

      setMessages([greetingMessage]);
      
      // Speak greeting ONLY ONCE (prevent double greeting)
      if (!isMuted && !greetingSpokenRef.current) {
        greetingSpokenRef.current = true;
        speakText(greetingText);
        
        // Fallback: If speech synthesis doesn't complete in 5s, start listening anyway
        setTimeout(() => {
          if (!isRecognitionActiveRef.current && recognitionRef.current && !isMutedRef.current) {
            console.log('⏰ Fallback: Starting listening after 5s timeout');
            try {
              isRecognitionActiveRef.current = true;
              setIsListening(true);
              recognitionRef.current.start();
            } catch (e) {
              console.error('Fallback listening start failed:', e);
              isRecognitionActiveRef.current = false;
              setIsListening(false);
            }
          }
        }, 5000);
      } else {
        // If muted or already spoken, start listening immediately
        setTimeout(() => {
          if (recognitionRef.current && !isRecognitionActiveRef.current) {
            try {
              isRecognitionActiveRef.current = true;
              setIsListening(true);
              recognitionRef.current.start();
            } catch (e) {
              isRecognitionActiveRef.current = false;
              setIsListening(false);
            }
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setIsConnected(false);
      setErrorState({ type: 'connection', message: 'Failed to start conversation' });
      greetingSpokenRef.current = false; // Reset on error
    }
  }, [agentId, agent, isMuted, speakText]);

  // Initialize on mount (only speech recognition/synthesis, NOT conversation)
  useEffect(() => {
    initializeSpeechRecognition();
    initializeSpeechSynthesis();
    // DON'T auto-start conversation - user must click the button

    return () => {
      stopListening();
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []); // Only run once on mount

  // Auto-start listening when conversation starts
  useEffect(() => {
    if (conversationId && !isRecognitionActiveRef.current && !isMuted && recognitionInitializedRef.current) {
      // Small delay to ensure recognition is ready
      const timeout = setTimeout(() => {
        startListening();
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [conversationId, isMuted, startListening]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Get current voice state for status component
  const voiceState = isProcessing ? 'processing' : isListening ? 'listening' : isSpeaking ? 'speaking' : 'idle';

  // Handle text input submission
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !conversationId || isProcessing) return;
    
    const message = textInput.trim();
    setTextInput('');
    await handleUserMessage(message);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Space - toggle recording
      if (e.code === 'Space' && conversationId && !settings.prefersTextOnly) {
        e.preventDefault();
        if (isListening) {
          stopListening();
        } else if (!isMuted) {
        startListening();
        }
      }
      
      // Escape - stop speech
      if (e.code === 'Escape' && isSpeaking) {
        e.preventDefault();
        stopSpeaking();
      }
      
      // M - toggle mute
      if (e.code === 'KeyM' && conversationId) {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [conversationId, isListening, isSpeaking, isMuted, settings.prefersTextOnly, startListening, stopListening, stopSpeaking, toggleMute]);

  return (
    <>
      {/* Onboarding Modal */}
      {showOnboarding && (
        <VoiceOnboarding
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      )}

      <div className={`h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 ${settings.highContrastMode ? 'contrast-125' : ''}`}>
      {/* Header */}
      <div className="glass border-b border-slate-700/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
                <h2 className="text-lg font-semibold text-white">{agent?.name || 'Voice Assistant'}</h2>
              <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'} ${!settings.reduceAnimations && isConnected ? 'animate-pulse' : ''}`} />
                  <span className="text-sm text-slate-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          
            <div className="flex items-center space-x-2">
              {/* Settings Link */}
              <Link
                href="/settings/voice"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                title="Voice Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>
              
              {/* End Call */}
          <button
            onClick={endCall}
                className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
          >
            <PhoneOff className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">End</span>
          </button>
            </div>
        </div>
      </div>

        {/* Audio unlock notice */}
        {!audioUnlocked && !settings.prefersTextOnly && (
          <button
            onClick={unlockAudio}
            className="bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 rounded-xl p-4 mx-4 mt-4 hover:from-violet-600/30 hover:to-indigo-600/30 transition-all text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-violet-500/20 rounded-lg">
                <Volume2 className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-violet-200 font-medium">Enable Voice Output</p>
                <p className="text-violet-300/70 text-sm">Click to allow the agent to speak responses</p>
              </div>
            </div>
          </button>
        )}

        {/* Error State */}
        {errorState && (
          <div className="mx-4 mt-4">
            <VoiceStatus
              state="error"
              errorType={errorState.type}
              errorMessage={errorState.message}
              onRetry={async () => {
                setErrorState(null);
                // Try to request microphone permission again
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                  stream.getTracks().forEach(track => track.stop());
                  localStorage.setItem('micPermissionStatus', 'granted');
                  // Reinitialize conversation if needed
                  if (!conversationId) {
                    await initializeConversation();
                  } else {
                    // Reinitialize speech recognition
                    initializeSpeechRecognition();
                  }
                } catch (error) {
                  console.error('Failed to enable microphone:', error);
                  setErrorState({ 
                    type: 'mic-denied', 
                    message: 'Microphone access still denied. Please enable it in your browser settings.' 
                  });
                }
              }}
              onSwitchToText={() => {
                setErrorState(null);
                setShowTextInput(true);
                updateSettings({ prefersTextOnly: true });
              }}
              reduceAnimations={settings.reduceAnimations}
            />
          </div>
        )}

      {/* Messages Container */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4" 
          onClick={unlockAudio}
          role="log"
          aria-live="polite"
          aria-label="Conversation messages"
        >
          {messages.length === 0 && !isProcessing && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className={`w-20 h-20 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 ${!settings.reduceAnimations ? 'animate-pulse-ring' : ''}`}>
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Ready to Chat!</h3>
              <p className="text-slate-400 max-w-sm">
                {settings.prefersTextOnly 
                  ? "Type your message below to start the conversation."
                  : "Speak or type to start the conversation. Press Space to talk."}
              </p>
              
              {/* Keyboard shortcuts hint */}
              {!settings.prefersTextOnly && (
                <div className="flex items-center space-x-4 mt-6 text-sm text-slate-500">
                  <div className="flex items-center space-x-1">
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">Space</kbd>
                    <span>Talk</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">Esc</kbd>
                    <span>Stop</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">M</kbd>
                    <span>Mute</span>
        </div>
      </div>
              )}
            </div>
          )}

        {messages.map((message) => (
          <div
            key={message.id}
              className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'} ${!settings.reduceAnimations ? 'animate-bounce-in' : ''}`}
          >
            <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-2xl ${
                message.isFromUser
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                    : 'bg-slate-800/80 border border-slate-700/50 text-white'
              }`}
            >
              <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 mt-0.5">
                  {message.isFromUser ? (
                      <User className="w-4 h-4" />
                  ) : (
                      <Bot className="w-4 h-4 text-violet-400" />
                  )}
                </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed break-words">{message.content}</p>
                    <p className="text-xs opacity-60 mt-1.5">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Current transcript */}
          {currentTranscript && settings.showTranscriptions && (
          <div className="flex justify-end">
              <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl bg-slate-700/30 border border-slate-600/30 text-slate-300">
                <p className="text-sm italic flex items-center">
                  <Mic className="w-3 h-3 mr-2 text-emerald-400" />
                  {currentTranscript}
                </p>
            </div>
          </div>
        )}

          {/* Voice Status */}
          {voiceState !== 'idle' && (
            <VoiceStatus
              state={voiceState}
              reduceAnimations={settings.reduceAnimations}
            />
        )}

        <div ref={messagesEndRef} />
      </div>

        {/* Input Area */}
      <div className="glass border-t border-slate-700/50 p-4">
          {/* Voice Status Bar */}
          {!settings.prefersTextOnly && !showTextInput && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {/* Waveform visualization */}
                {isListening && !settings.reduceAnimations && (
                  <div className="flex items-center space-x-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-emerald-400 rounded-full animate-waveform"
                        style={{ animationDelay: `${i * 0.1}s`, height: '20px' }}
                      />
                    ))}
                </div>
              )}
                
                <span className="text-sm text-slate-400">
                  {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : isProcessing ? 'Thinking...' : 'Press Space or click mic to talk'}
              </span>
            </div>

              {/* Toggle text input */}
              <button
                onClick={() => setShowTextInput(true)}
                className="flex items-center space-x-2 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors text-sm"
              >
                <Keyboard className="w-4 h-4" />
                <span>Type instead</span>
              </button>
            </div>
          )}

          {/* Text Input */}
          {(showTextInput || settings.prefersTextOnly) && (
            <form onSubmit={handleTextSubmit} className="flex items-center space-x-3 mb-4">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={!textInput.trim() || isProcessing}
                className="p-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
              {!settings.prefersTextOnly && (
                <button
                  type="button"
                  onClick={() => setShowTextInput(false)}
                  className="p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </form>
          )}

          {/* Control Buttons */}
          <div className="flex items-center justify-center space-x-4">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                isMuted 
                  ? 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500' 
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300 focus:ring-slate-500'
              }`}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Main Call Button */}
            {!conversationId ? (
            <button
                onClick={initializeConversation}
                className={`p-5 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white shadow-lg shadow-emerald-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${!settings.reduceAnimations ? 'hover:scale-105' : ''}`}
                aria-label="Start conversation"
              >
                <Phone className="w-7 h-7" />
              </button>
            ) : (
              <button
                onClick={endCall}
                className={`p-5 rounded-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white shadow-lg shadow-red-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${!settings.reduceAnimations ? 'hover:scale-105' : ''}`}
                aria-label="End conversation"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
            )}

            {/* Volume/Speaker Button */}
            <button
              onClick={() => {
                unlockAudio();
                if ('speechSynthesis' in window) {
                  speechSynthesis.cancel();
                  speechSynthesis.resume();
                  const utterance = new SpeechSynthesisUtterance('Voice enabled');
                  utterance.rate = settings.speechRate;
                  utterance.volume = settings.speechVolume;
                  utterance.onstart = () => setIsSpeaking(true);
                  utterance.onend = () => setIsSpeaking(false);
                  speechSynthesis.speak(utterance);
                }
              }}
              className={`p-4 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                isSpeaking
                  ? 'bg-blue-600 text-white focus:ring-blue-500'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300 focus:ring-slate-500'
              }`}
              aria-label={isSpeaking ? 'Currently speaking' : 'Test voice'}
              title="Test voice output"
            >
              {isSpeaking ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
          </div>

          {/* Screen reader status */}
          <div className="sr-only" aria-live="polite">
            {isListening && 'Listening for your voice'}
            {isProcessing && 'Processing your message'}
            {isSpeaking && 'Agent is speaking'}
        </div>
      </div>
    </div>
    </>
  );
};

export default VoiceChat;
