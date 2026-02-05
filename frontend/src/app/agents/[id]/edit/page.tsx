"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Bot, 
  ArrowLeft,
  Save,
  Loader2,
  Volume2, 
  MessageSquare, 
  Wrench,
  Brain,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { getAgent, updateAgent } from '@/lib/api';
import { INDUSTRIES, ROLES } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import VoiceSelector from '@/components/VoiceSelector';
import KnowledgeUploader from '@/components/KnowledgeUploader';

interface FormData {
  name: string;
  company: string;
  industry: string;
  role: string;
  personality: string[];
  knowledge_base: string;
  greeting: string;
  voice_settings: {
    speed: number;
    pitch: number;
    voice?: string;
    gender?: 'male' | 'female' | 'neutral';
  };
  available_tools: string[];
  is_active: boolean;
}

const personalityOptions = [
  { id: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { id: 'professional', label: 'Professional', description: 'Formal and business-like' },
  { id: 'helpful', label: 'Helpful', description: 'Supportive and solution-oriented' },
  { id: 'patient', label: 'Patient', description: 'Calm and understanding' },
  { id: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic and positive' },
  { id: 'knowledgeable', label: 'Knowledgeable', description: 'Well-informed and expert' },
];

const availableTools = [
  { id: 'lookup_order', label: 'Order Lookup', description: 'Search and retrieve order information' },
  { id: 'schedule_appointment', label: 'Schedule Appointment', description: 'Book appointments and meetings' },
  { id: 'send_email', label: 'Send Email', description: 'Send emails to customers' },
  { id: 'create_ticket', label: 'Create Support Ticket', description: 'Create support tickets for issues' },
  { id: 'transfer_to_human', label: 'Transfer to Human', description: 'Transfer conversation to human agent' }
];

export default function EditAgentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-theme text-theme flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
    </div>}>
      <EditAgentContent />
    </Suspense>
  );
}

function EditAgentContent() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    company: '',
    industry: '',
    role: '',
    personality: [],
    knowledge_base: '',
    greeting: '',
    voice_settings: {
      speed: 1.0,
      pitch: 1.0,
      voice: 'default',
      gender: 'neutral'
    },
    available_tools: [],
    is_active: true
  });

  useEffect(() => {
    loadAgent();
  }, [agentId]);

  const loadAgent = async () => {
    try {
      setLoading(true);
      const agent = await getAgent(agentId, { userId: user?.id ?? undefined });
      
      setFormData({
        name: agent.name || '',
        company: agent.company || '',
        industry: agent.industry || '',
        role: agent.role || '',
        personality: typeof agent.personality === 'string' 
          ? agent.personality.split(',').map(p => p.trim())
          : (Array.isArray(agent.personality) ? agent.personality : []),
        knowledge_base: agent.knowledge_base || '',
        greeting: agent.greeting || '',
        voice_settings: agent.voice_settings || {
          speed: 1.0,
          pitch: 1.0,
          voice: 'default',
          gender: 'neutral'
        },
        available_tools: agent.available_tools || [],
        is_active: agent.is_active !== undefined ? agent.is_active : true
      });
    } catch (error) {
      console.error('Failed to load agent:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handlePersonalityToggle = (personality: string) => {
    setFormData(prev => ({
      ...prev,
      personality: prev.personality.includes(personality)
        ? prev.personality.filter(p => p !== personality)
        : [...prev.personality, personality]
    }));
  };

  const handleToolToggle = (toolId: string) => {
    setFormData(prev => ({
      ...prev,
      available_tools: prev.available_tools.includes(toolId)
        ? prev.available_tools.filter(t => t !== toolId)
        : [...prev.available_tools, toolId]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Agent name is required';
    if (!formData.company.trim()) newErrors.company = 'Company name is required';
    if (!formData.industry) newErrors.industry = 'Industry is required';
    if (!formData.role) newErrors.role = 'Role is required';
    if (formData.personality.length === 0) newErrors.personality = 'Select at least one personality trait';
    if (!formData.greeting.trim()) newErrors.greeting = 'Greeting message is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      setSuccess(false);
      
      await updateAgent(agentId, {
        ...formData,
        personality: formData.personality.join(', ')
      }, { userId: user?.id ?? undefined });
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Failed to update agent:', error);
      setErrors({ submit: error.message || 'Failed to update agent' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme text-theme flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme text-theme">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link 
          href="/dashboard"
          className="inline-flex items-center space-x-2 text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Edit Agent</h1>
          <p className="text-zinc-400">Update your Voice AI agent configuration</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-green-400">Agent updated successfully! Redirecting...</span>
          </div>
        )}

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
            <span className="text-red-400">{errors.submit}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center mb-6">
              <Bot className="w-5 h-5 text-purple-400 mr-2" />
              <h2 className="text-xl font-semibold text-white">Basic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Agent Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Customer Support Bot"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Company *
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Acme Corp"
                />
                {errors.company && <p className="text-red-400 text-sm mt-1">{errors.company}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Industry *
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Industry</option>
                  {INDUSTRIES.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
                {errors.industry && <p className="text-red-400 text-sm mt-1">{errors.industry}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Role</option>
                  {ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {errors.role && <p className="text-red-400 text-sm mt-1">{errors.role}</p>}
              </div>
            </div>
          </div>

          {/* Personality */}
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center mb-6">
              <Bot className="w-5 h-5 text-blue-400 mr-2" />
              <h2 className="text-xl font-semibold text-white">Personality Traits</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {personalityOptions.map((trait) => (
                <label
                  key={trait.id}
                  className="flex items-start space-x-3 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700 hover:border-purple-500/50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.personality.includes(trait.id)}
                    onChange={() => handlePersonalityToggle(trait.id)}
                    className="mt-1 w-4 h-4 text-purple-600 bg-zinc-800 border-zinc-600 rounded focus:ring-purple-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-white">{trait.label}</div>
                    <div className="text-xs text-zinc-400">{trait.description}</div>
                  </div>
                </label>
              ))}
            </div>
            {errors.personality && <p className="text-red-400 text-sm mt-2">{errors.personality}</p>}
          </div>

          {/* Agent Instructions */}
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center mb-6">
              <MessageSquare className="w-5 h-5 text-cyan-400 mr-2" />
              <h2 className="text-xl font-semibold text-white">Agent Instructions</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                How should your agent work? *
              </label>
              <textarea
                value={formData.knowledge_base}
                onChange={(e) => handleInputChange('knowledge_base', e.target.value)}
                rows={8}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Describe how your agent should behave, what information it should know, and how it should interact with users..."
              />
            </div>
          </div>

          {/* Knowledge Base */}
          <div id="knowledge-uploader" className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center mb-6">
              <Brain className="w-5 h-5 text-green-400 mr-2" />
              <h2 className="text-xl font-semibold text-white">Knowledge Base</h2>
            </div>
            <KnowledgeUploader
              agentId={agentId}
              onUploadComplete={() => {
                // Optionally refresh or show success
              }}
            />
          </div>

          {/* Voice Settings */}
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center mb-6">
              <Volume2 className="w-5 h-5 text-green-400 mr-2" />
              <h2 className="text-xl font-semibold text-white">Voice Settings</h2>
            </div>
            
            <VoiceSelector
              selectedVoice={formData.voice_settings.voice || 'default'}
              onVoiceChange={(voiceId) => {
                handleInputChange('voice_settings', {
                  ...formData.voice_settings,
                  voice: voiceId
                });
              }}
              speechRate={formData.voice_settings.speed}
              speechPitch={formData.voice_settings.pitch}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-zinc-700">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Speech Speed: {formData.voice_settings.speed}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={formData.voice_settings.speed}
                  onChange={(e) => handleInputChange('voice_settings', {
                    ...formData.voice_settings,
                    speed: parseFloat(e.target.value)
                  })}
                  className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Voice Pitch: {formData.voice_settings.pitch}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={formData.voice_settings.pitch}
                  onChange={(e) => handleInputChange('voice_settings', {
                    ...formData.voice_settings,
                    pitch: parseFloat(e.target.value)
                  })}
                  className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>

          {/* Greeting */}
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center mb-6">
              <MessageSquare className="w-5 h-5 text-blue-400 mr-2" />
              <h2 className="text-xl font-semibold text-white">Greeting Message</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                First Message to Customers *
              </label>
              <textarea
                value={formData.greeting}
                onChange={(e) => handleInputChange('greeting', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="What should your agent say when a customer first starts a conversation?"
              />
              {errors.greeting && <p className="text-red-400 text-sm mt-1">{errors.greeting}</p>}
            </div>
          </div>

          {/* Available Tools */}
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center mb-6">
              <Wrench className="w-5 h-5 text-orange-400 mr-2" />
              <h2 className="text-xl font-semibold text-white">Available Tools</h2>
            </div>
            <div className="space-y-4">
              {availableTools.map((tool) => (
                <label key={tool.id} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.available_tools.includes(tool.id)}
                    onChange={() => handleToolToggle(tool.id)}
                    className="mt-1 w-4 h-4 text-purple-600 bg-zinc-800 border-zinc-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <div>
                    <div className="text-sm font-medium text-white">{tool.label}</div>
                    <div className="text-xs text-zinc-400">{tool.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl transition-all font-medium shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
