"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface WidgetPreviewProps {
  config: {
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    theme: 'dark' | 'light';
    greeting: string;
    colors?: {
      primary: string;
      background: string;
      text: string;
    };
  };
  onClose?: () => void;
}

export default function WidgetPreview({ config, onClose }: WidgetPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'agent'; content: string }>>([]);
  const [input, setInput] = useState('');
  
  useEffect(() => {
    // Add greeting message
    if (config.greeting) {
      setMessages([{ role: 'agent', content: config.greeting }]);
    }
  }, [config.greeting]);
  
  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');
    
    // Simulate agent response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: 'This is a preview. In production, the agent will respond here.' 
      }]);
    }, 1000);
  };
  
  const positionStyles = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };
  
  const isDark = config.theme === 'dark';
  const primaryColor = config.colors?.primary || '#6366f1';
  const bgColor = config.colors?.background || (isDark ? '#1e293b' : '#ffffff');
  const textColor = config.colors?.text || (isDark ? '#ffffff' : '#1e293b');
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl p-6 max-w-4xl w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Widget Preview</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </div>
        
        {/* Preview Container */}
        <div className="relative bg-slate-900 rounded-lg p-8 h-[600px] overflow-hidden">
          {/* Simulated Website Background */}
          <div className="absolute inset-0 opacity-20">
            <div className="h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
            <div className="absolute top-8 left-8 right-8 h-16 bg-slate-700/50 rounded" />
            <div className="absolute top-32 left-8 w-64 h-32 bg-slate-700/50 rounded" />
            <div className="absolute top-32 left-80 right-8 h-32 bg-slate-700/50 rounded" />
          </div>
          
          {/* Widget */}
          <div className={`absolute ${positionStyles[config.position]} z-10`}>
            {/* Chat Button */}
            {!isOpen && (
              <button
                onClick={() => setIsOpen(true)}
                className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white text-2xl transition-transform hover:scale-110"
                style={{ backgroundColor: primaryColor }}
              >
                💬
              </button>
            )}
            
            {/* Chat Window */}
            {isOpen && (
              <div
                className="w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                style={{ backgroundColor: bgColor }}
              >
                {/* Header */}
                <div
                  className="p-4 flex items-center justify-between text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div>
                    <div className="font-semibold">Conversa AI</div>
                    <div className="text-xs opacity-90">Online</div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:opacity-80 text-xl"
                  >
                    ×
                  </button>
                </div>
                
                {/* Messages */}
                <div
                  className="flex-1 overflow-y-auto p-4 space-y-3"
                  style={{ backgroundColor: isDark ? '#0f172a' : '#f8f9fa' }}
                >
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-2 rounded-lg ${
                          msg.role === 'user' ? 'rounded-br-none' : 'rounded-bl-none'
                        }`}
                        style={{
                          backgroundColor: msg.role === 'user' 
                            ? primaryColor 
                            : (isDark ? '#334155' : '#e2e8f0'),
                          color: msg.role === 'user' || isDark ? '#ffffff' : '#1e293b'
                        }}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Input */}
                <div
                  className="p-4 border-t"
                  style={{
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    backgroundColor: bgColor
                  }}
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 rounded-lg text-sm"
                      style={{
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        color: textColor,
                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`
                      }}
                    />
                    <button
                      onClick={handleSend}
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 text-sm text-slate-400 text-center">
          This is how your widget will appear on websites
        </div>
      </div>
    </div>
  );
}
