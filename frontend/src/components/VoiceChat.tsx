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
  User
} from 'lucide-react';
import { startConversation, sendMessage } from '@/lib/api';
import type { Message, Agent } from '@/lib/types';

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
  
  // Refs
  const recognitionRef = useRef<webkitSpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

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

        setCurrentTranscript(interimTranscript);

        if (finalTranscript) {
          handleUserMessage(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.error('Speech recognition not supported');
    }
  }, []);

  // Initialize speech synthesis
  const initializeSpeechSynthesis = useCallback(() => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance();
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      synthesisRef.current = utterance;
    }
  }, []);

  // Start listening
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !isMuted) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  }, [isListening, isMuted]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  // Handle user message
  const handleUserMessage = useCallback(async (message: string) => {
    if (!message || !conversationId) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      conversation_id: conversationId,
      role: 'user',
      content: message,
      timestamp: new Date(),
      isFromUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentTranscript('');
    setIsProcessing(true);

    try {
      // Send message to backend
      const response = await sendMessage(agentId, message, conversationId);
      
      // Add agent response to chat
      const agentMessage: ChatMessage = {
        id: response.message_id,
        conversation_id: response.conversation_id,
        role: 'agent',
        content: response.agent_response,
        timestamp: new Date(response.timestamp),
        isFromUser: false
      };

      setMessages(prev => [...prev, agentMessage]);

      // Update metrics
      const totalMessages = messages.length + 2; // user + agent message
      const sentiment = 'neutral'; // TODO: Extract from response metadata
      setActionsExecuted(prev => [...prev, 'message_sent']);
      
      onMetricsUpdate?.({
        messagesExchanged: totalMessages,
        sentiment,
        actionsExecuted: [...actionsExecuted, 'message_sent']
      });

      // Speak the response
      if (!isMuted) {
        speakText(response.agent_response);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setIsConnected(false);
    } finally {
      setIsProcessing(false);
    }
  }, [agentId, conversationId, isMuted]);

  // Speak text using speech synthesis
  const speakText = useCallback((text: string) => {
    if (synthesisRef.current && 'speechSynthesis' in window) {
      synthesisRef.current.text = text;
      speechSynthesis.speak(synthesisRef.current);
    }
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (newMuted) {
      stopSpeaking();
      stopListening();
    } else {
      startListening();
    }
  }, [isMuted, stopSpeaking, stopListening, startListening]);

  // End call
  const endCall = useCallback(() => {
    stopListening();
    stopSpeaking();
    setIsListening(false);
    setIsSpeaking(false);
    setMessages([]);
    setCurrentTranscript('');
    setConversationId(null);
  }, [stopListening, stopSpeaking]);

  // Initialize conversation
  const initializeConversation = useCallback(async () => {
    try {
      const response = await startConversation(agentId);
      setConversationId(response.conversation_id);
      
      // Add greeting message
      const greetingText = agent?.greeting || 'Hello! I\'m your AI assistant. How can I help you today?';
      const greetingMessage: ChatMessage = {
        id: `greeting-${Date.now()}`,
        conversation_id: response.conversation_id,
        role: 'agent',
        content: greetingText,
        timestamp: new Date(),
        isFromUser: false
      };

      setMessages([greetingMessage]);
      
      // Speak greeting
      if (!isMuted) {
        speakText(greetingText);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setIsConnected(false);
    }
  }, [agentId, agent, isMuted, speakText]);

  // Auto-start listening when conversation starts
  useEffect(() => {
    if (conversationId && !isListening && !isMuted) {
      startListening();
    }
  }, [conversationId, isListening, isMuted, startListening]);

  // Initialize on mount
  useEffect(() => {
    initializeSpeechRecognition();
    initializeSpeechSynthesis();
    initializeConversation();

    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [initializeSpeechRecognition, initializeSpeechSynthesis, initializeConversation, stopListening, stopSpeaking]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Voice Activity Detection - restart listening after processing
  useEffect(() => {
    if (!isProcessing && conversationId && !isListening && !isMuted) {
      const timeout = setTimeout(() => {
        startListening();
      }, 1000); // Wait 1 second before restarting

      return () => clearTimeout(timeout);
    }
  }, [isProcessing, conversationId, isListening, isMuted, startListening]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-600 via-purple-600 to-slate-950">
      {/* Header */}
      <div className="glass border-b border-slate-700/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Voice Assistant</h2>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm text-slate-300">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={endCall}
            className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            End Call
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                message.isFromUser
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                  : 'glass text-white'
              }`}
            >
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  {message.isFromUser ? (
                    <User className="w-4 h-4 mt-1" />
                  ) : (
                    <Bot className="w-4 h-4 mt-1" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Current transcript */}
        {currentTranscript && (
          <div className="flex justify-end">
            <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl bg-slate-700/50 text-slate-300">
              <p className="text-sm italic">{currentTranscript}</p>
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="glass px-4 py-3 rounded-2xl">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span className="text-sm text-slate-300">Processing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Status Bar */}
      <div className="glass border-t border-slate-700/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Microphone visualization */}
            <div className="flex items-center space-x-2">
              {isListening ? (
                <div className="flex space-x-1">
                  <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-6 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-5 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                </div>
              ) : (
                <div className="w-8 h-8 flex items-center justify-center">
                  <MicOff className="w-4 h-4 text-slate-400" />
                </div>
              )}
              <span className="text-sm text-slate-300">
                {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Ready'}
              </span>
            </div>

            {/* Connection status */}
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className="text-sm text-slate-300">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Mute/Unmute button */}
            <button
              onClick={toggleMute}
              className={`p-3 rounded-full transition-all duration-200 ${
                isMuted 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Volume button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-full transition-all duration-200 ${
                isMuted 
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-400' 
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceChat;
