"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Bot, 
  Building2, 
  Briefcase, 
  Heart, 
  Brain, 
  Volume2, 
  MessageSquare, 
  Wrench, 
  Check,
  ArrowLeft,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { createAgent } from '@/lib/api';
import { INDUSTRIES, ROLES, type AgentCreate } from '@/lib/types';
import { getTemplateById, type AgentTemplate } from '@/lib/templates';
import VoiceSelector from '@/components/VoiceSelector';
import KnowledgeUploader from '@/components/KnowledgeUploader';
import PendingKnowledgeUploader, { type PendingKnowledgeItem } from '@/components/PendingKnowledgeUploader';

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

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  data: Partial<FormData>;
}

const templates: Template[] = [
  {
    id: 'ecommerce',
    name: 'E-commerce Support',
    description: 'Help customers with orders, returns, and product questions',
    icon: <Building2 className="w-6 h-6" />,
    data: {
      industry: 'Retail',
      role: 'Customer Support',
      personality: ['friendly', 'helpful', 'patient'],
      knowledge_base: `You are a customer support agent for an e-commerce platform. You help customers with:

- Order status and tracking
- Returns and refunds
- Product information and recommendations
- Account issues
- Payment problems
- Shipping questions

Always be polite, helpful, and try to resolve issues quickly. If you can't help directly, offer to transfer to a human agent.`,
      greeting: "Hi! I'm here to help you with your order, returns, or any questions about our products. How can I assist you today?",
      available_tools: ['lookup_order', 'send_email', 'create_ticket', 'transfer_to_human']
    }
  },
  {
    id: 'restaurant',
    name: 'Restaurant Reservations',
    description: 'Handle table bookings and dining inquiries',
    icon: <Heart className="w-6 h-6" />,
    data: {
      industry: 'Food & Beverage',
      role: 'Appointment Scheduler',
      personality: ['friendly', 'enthusiastic', 'accommodating'],
      knowledge_base: `You are a reservation specialist for a restaurant. You help customers with:

- Table reservations and availability
- Special dietary requirements
- Group bookings
- Menu information
- Cancellations and modifications
- Special occasions and celebrations

Be warm, welcoming, and accommodating. Always confirm details and provide clear information about policies.`,
      greeting: "Welcome! I'd be happy to help you make a reservation or answer any questions about our restaurant. What can I do for you today?",
      available_tools: ['schedule_appointment', 'send_email', 'transfer_to_human']
    }
  },
  {
    id: 'healthcare',
    name: 'Healthcare Scheduling',
    description: 'Schedule appointments and handle patient inquiries',
    icon: <Heart className="w-6 h-6" />,
    data: {
      industry: 'Healthcare',
      role: 'Appointment Scheduler',
      personality: ['professional', 'empathetic', 'reassuring'],
      knowledge_base: `You are a healthcare appointment scheduler. You help patients with:

- Scheduling appointments with doctors
- Rescheduling or canceling appointments
- Insurance verification
- Prescription refills
- General health information
- Emergency protocols

Be professional, empathetic, and maintain patient confidentiality. Always prioritize urgent medical needs.`,
      greeting: "Hello! I'm here to help you schedule appointments or answer questions about our healthcare services. How may I assist you today?",
      available_tools: ['schedule_appointment', 'send_email', 'transfer_to_human']
    }
  },
  {
    id: 'saas',
    name: 'SaaS Support',
    description: 'Technical support for software products',
    icon: <Briefcase className="w-6 h-6" />,
    data: {
      industry: 'Technology',
      role: 'Technical Support',
      personality: ['professional', 'knowledgeable', 'patient'],
      knowledge_base: `You are a technical support agent for a SaaS platform. You help customers with:

- Account setup and configuration
- Feature explanations and tutorials
- Troubleshooting technical issues
- Billing and subscription questions
- Integration assistance
- Bug reports and feature requests

Be technical but accessible. Provide step-by-step solutions and escalate complex issues when needed.`,
      greeting: "Hi! I'm here to help you with any technical questions or issues you might have with our platform. What can I help you with today?",
      available_tools: ['send_email', 'create_ticket', 'transfer_to_human']
    }
  },
  {
    id: 'realestate',
    name: 'Real Estate',
    description: 'Property inquiries and client assistance',
    icon: <Building2 className="w-6 h-6" />,
    data: {
      industry: 'Real Estate',
      role: 'Sales Representative',
      personality: ['friendly', 'knowledgeable', 'persuasive'],
      knowledge_base: `You are a real estate assistant. You help clients with:

- Property listings and availability
- Scheduling property viewings
- Market information and pricing
- Mortgage and financing questions
- Neighborhood information
- Investment opportunities

Be knowledgeable about the local market and helpful in guiding clients through their real estate journey.`,
      greeting: "Hello! I'm here to help you find your perfect property or answer any real estate questions. What are you looking for today?",
      available_tools: ['schedule_appointment', 'send_email', 'transfer_to_human']
    }
  },
  {
    id: 'financial',
    name: 'Financial Services',
    description: 'Banking and financial product support',
    icon: <Briefcase className="w-6 h-6" />,
    data: {
      industry: 'Finance',
      role: 'Account Manager',
      personality: ['professional', 'trustworthy', 'knowledgeable'],
      knowledge_base: `You are a financial services representative. You help clients with:

- Account information and balances
- Transaction history and disputes
- Loan applications and approvals
- Investment options and advice
- Credit card services
- Fraud prevention and security

Be professional, secure, and always verify identity before discussing account details. Follow all compliance requirements.`,
      greeting: "Good day! I'm here to assist you with your banking and financial needs. How can I help you today?",
      available_tools: ['send_email', 'create_ticket', 'transfer_to_human']
    }
  }
];

const personalityTraits = [
  { id: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { id: 'professional', label: 'Professional', description: 'Formal and business-like' },
  { id: 'empathetic', label: 'Empathetic', description: 'Understanding and compassionate' },
  { id: 'helpful', label: 'Helpful', description: 'Eager to assist and solve problems' },
  { id: 'patient', label: 'Patient', description: 'Calm and understanding' },
  { id: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic and positive' },
  { id: 'knowledgeable', label: 'Knowledgeable', description: 'Well-informed and expert' },
  { id: 'reassuring', label: 'Reassuring', description: 'Calming and supportive' },
  { id: 'accommodating', label: 'Accommodating', description: 'Flexible and adaptable' },
  { id: 'persuasive', label: 'Persuasive', description: 'Convincing and influential' },
  { id: 'trustworthy', label: 'Trustworthy', description: 'Reliable and honest' }
];

const availableTools = [
  { id: 'lookup_order', label: 'Order Lookup', description: 'Search and retrieve order information' },
  { id: 'schedule_appointment', label: 'Schedule Appointment', description: 'Book appointments and meetings' },
  { id: 'send_email', label: 'Send Email', description: 'Send emails to customers' },
  { id: 'create_ticket', label: 'Create Support Ticket', description: 'Create support tickets for issues' },
  { id: 'transfer_to_human', label: 'Transfer to Human', description: 'Transfer conversation to human agent' }
];

export default function CreateAgent() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-theme text-theme flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
    </div>}>
      <CreateAgentContent />
    </Suspense>
  );
}

function CreateAgentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(templateId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState<'template' | 'customize' | 'review'>('template');
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);
  const [pendingKnowledgeItems, setPendingKnowledgeItems] = useState<PendingKnowledgeItem[]>([]);
  const [isUploadingPending, setIsUploadingPending] = useState(false);

  // Upload pending knowledge items after agent is created
  const uploadPendingItems = useCallback(async (agentId: string, items: PendingKnowledgeItem[]) => {
    if (items.length === 0) return;
    
    setIsUploadingPending(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
      console.log(`📤 Uploading ${items.length} pending knowledge items to agent ${agentId}`);
      
      for (const item of items) {
        try {
          if (item.type === 'document' && item.file) {
            console.log(`📄 Uploading document: ${item.file.name}`);
            const formData = new FormData();
            formData.append('file', item.file);
            const response = await fetch(`${apiUrl}/api/agents/${agentId}/knowledge/upload`, {
              method: 'POST',
              body: formData
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Document upload failed: ${response.status} ${errorText}`);
            }
            console.log(`✅ Document uploaded: ${item.file.name}`);
            
          } else if (item.type === 'url' && item.url) {
            console.log(`🌐 Scraping URL: ${item.url}`);
            const formData = new FormData();
            formData.append('url', item.url);
            const response = await fetch(`${apiUrl}/api/agents/${agentId}/knowledge/url`, {
              method: 'POST',
              body: formData
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`URL scrape failed: ${response.status} ${errorText}`);
            }
            console.log(`✅ URL scraped: ${item.url}`);
            
          } else if (item.type === 'faq' && item.question && item.answer) {
            console.log(`❓ Adding FAQ: ${item.question.substring(0, 50)}...`);
            const formData = new FormData();
            formData.append('question', item.question);
            formData.append('answer', item.answer);
            const response = await fetch(`${apiUrl}/api/agents/${agentId}/knowledge/faq`, {
              method: 'POST',
              body: formData
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`FAQ add failed: ${response.status} ${errorText}`);
            }
            console.log(`✅ FAQ added`);
          }
        } catch (itemError) {
          console.error(`❌ Error uploading item ${item.id}:`, itemError);
          // Continue with other items even if one fails
        }
      }
      
      // Clear pending items after successful upload
      setPendingKnowledgeItems([]);
      console.log(`✅ All pending knowledge items uploaded successfully`);
      
    } catch (error) {
      console.error('❌ Error uploading pending knowledge items:', error);
      // Don't clear items on error so user can retry
    } finally {
      setIsUploadingPending(false);
    }
  }, []);

  // Scroll to knowledge uploader when agent is created
  useEffect(() => {
    if (createdAgentId) {
      setTimeout(() => {
        const uploaderElement = document.getElementById('knowledge-uploader');
        if (uploaderElement) {
          uploaderElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, [createdAgentId]);

  // Upload pending knowledge items after agent is created
  useEffect(() => {
    if (createdAgentId && pendingKnowledgeItems.length > 0 && !isUploadingPending) {
      uploadPendingItems(createdAgentId, pendingKnowledgeItems);
    }
  }, [createdAgentId, pendingKnowledgeItems.length, isUploadingPending, uploadPendingItems]);

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
      gender: 'female'
    },
    available_tools: [],
    is_active: true
  });

  // Load template from URL if provided
  useEffect(() => {
    if (templateId) {
      const template = getTemplateById(templateId);
      if (template) {
        handleTemplateSelectFromLibrary(template);
        setCurrentStep('customize');
      }
    }
  }, [templateId]);

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template.id);
    setFormData(prev => ({
      ...prev,
      ...template.data,
      name: prev.name || '',
      company: prev.company || ''
    }));
    setCurrentStep('customize');
  };

  const handleTemplateSelectFromLibrary = (template: AgentTemplate) => {
    setSelectedTemplate(template.id);
    setFormData(prev => ({
      ...prev,
      industry: template.industry,
      role: template.category,
      personality: template.personality,
      knowledge_base: template.sampleKnowledgeBase,
      greeting: template.greetingMessage,
      available_tools: template.suggestedTools,
      voice_settings: {
        speed: template.voiceSettings.speed,
        pitch: 1.0,
        voice: 'default',
        gender: template.voiceSettings.tone === 'professional' ? 'neutral' : 
                template.voiceSettings.tone === 'welcoming' ? 'female' : 'neutral'
      }
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handlePersonalityChange = (trait: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      personality: checked 
        ? [...prev.personality, trait]
        : prev.personality.filter(p => p !== trait)
    }));
  };

  const handleToolChange = (tool: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      available_tools: checked 
        ? [...prev.available_tools, tool]
        : prev.available_tools.filter(t => t !== tool)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Agent name is required';
    }
    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
    }
    if (!formData.industry) {
      newErrors.industry = 'Industry is required';
    }
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }
    if (formData.personality.length === 0) {
      newErrors.personality = 'At least one personality trait is required';
    }
    if (!formData.knowledge_base.trim()) {
      newErrors.knowledge_base = 'Agent instructions are required - describe how your AI agent should work';
    }
    if (!formData.greeting.trim()) {
      newErrors.greeting = 'Greeting message is required';
    }
    if (formData.available_tools.length === 0) {
      newErrors.available_tools = 'At least one tool must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const agentData: AgentCreate = {
        name: formData.name,
        company: formData.company,
        industry: formData.industry,
        role: formData.role,
        personality: formData.personality.join(', '),
        knowledge_base: formData.knowledge_base,
        greeting: formData.greeting,
        voice_settings: formData.voice_settings,
        available_tools: formData.available_tools,
        is_active: formData.is_active
      };

      const newAgent = await createAgent(agentData);
      setCreatedAgentId(newAgent.id);
      // Don't redirect immediately - allow knowledge upload
      // router.push(`/dashboard`);
    } catch (error) {
      console.error('Error creating agent:', error);
      setErrors({ submit: 'Failed to create agent. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme text-theme">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-zinc-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Create New Agent</h1>
          <p className="text-zinc-400">Build an AI agent tailored to your business needs</p>
        </div>

        {/* Templates Section */}
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Sparkles className="w-5 h-5 text-yellow-400 mr-2" />
              <h2 className="text-xl font-semibold text-white">Quick Start Templates</h2>
            </div>
            <Link
              href="/templates"
              className="flex items-center text-purple-400 hover:text-purple-300 transition-colors text-sm"
            >
              Browse All Templates
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  selectedTemplate === template.id
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3 text-white">
                    {template.icon}
                  </div>
                  <h3 className="font-semibold text-white">{template.name}</h3>
                </div>
                <p className="text-sm text-zinc-400">{template.description}</p>
                {selectedTemplate === template.id && (
                  <div className="flex items-center mt-2 text-purple-400">
                    <Check className="w-4 h-4 mr-1" />
                    <span className="text-sm">Selected</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
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
                  {INDUSTRIES.map((industry) => (
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
                  {ROLES.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {errors.role && <p className="text-red-400 text-sm mt-1">{errors.role}</p>}
              </div>
            </div>
          </div>

          {/* Personality Traits */}
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center mb-6">
              <Bot className="w-5 h-5 text-blue-400 mr-2" />
              <h2 className="text-xl font-semibold text-white">Personality Traits</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personalityTraits.map((trait) => (
                <label key={trait.id} className="flex items-start space-x-3 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700 hover:border-purple-500/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.personality.includes(trait.id)}
                    onChange={(e) => handlePersonalityChange(trait.id, e.target.checked)}
                    className="mt-1 w-4 h-4 text-purple-600 bg-zinc-800 border-zinc-600 rounded focus:ring-purple-500 focus:ring-2"
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

          {/* Agent Instructions - How AI Should Work */}
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center mb-6">
              <MessageSquare className="w-5 h-5 text-cyan-400 mr-2" />
              <h2 className="text-xl font-semibold text-white">Agent Instructions</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                How should your AI agent work? *
              </label>
              <p className="text-xs text-zinc-400 mb-3">
                Describe the agent's behavior, tone, response style, and any specific instructions for how it should interact with users.
              </p>
              <textarea
                value={formData.knowledge_base}
                onChange={(e) => handleInputChange('knowledge_base', e.target.value)}
                rows={8}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Example: You are a friendly customer support agent. Always greet customers warmly, listen carefully to their concerns, and provide clear, helpful solutions. If you cannot resolve an issue, politely offer to transfer to a human agent..."
                required
              />
              {errors.knowledge_base && <p className="text-red-400 text-sm mt-1">{errors.knowledge_base}</p>}
            </div>
          </div>

          {/* Knowledge Base Upload - Documents, URLs, FAQs */}
          <div id="knowledge-uploader" className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center mb-6">
              <Brain className="w-5 h-5 text-green-400 mr-2" />
              <h2 className="text-xl font-semibold text-white">Knowledge Base</h2>
            </div>
            <p className="text-zinc-400 mb-4">
              Upload documents, scrape websites, or add FAQs to train your agent with additional knowledge.
            </p>
            
            {createdAgentId ? (
              <>
                {isUploadingPending && pendingKnowledgeItems.length > 0 && (
                  <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mb-4">
                    <p className="text-blue-300 text-sm flex items-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Uploading {pendingKnowledgeItems.length} pending knowledge source(s)...
                    </p>
                  </div>
                )}
                {!isUploadingPending && pendingKnowledgeItems.length === 0 && (
                  <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-4 animate-fade-in">
                    <p className="text-green-300 text-sm flex items-center">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Agent created! {pendingKnowledgeItems.length > 0 ? 'Uploading knowledge sources...' : 'You can add more knowledge sources below.'}
                    </p>
                  </div>
                )}
                <KnowledgeUploader
                  agentId={createdAgentId}
                  onUploadComplete={() => {
                    // Optionally show success message
                  }}
                />
              </>
            ) : (
              <PendingKnowledgeUploader
                pendingItems={pendingKnowledgeItems}
                onAddItem={(item) => setPendingKnowledgeItems(prev => [...prev, item])}
                onRemoveItem={(id) => setPendingKnowledgeItems(prev => prev.filter(item => item.id !== id))}
              />
            )}
          </div>

          {/* Voice Settings */}
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center mb-6">
              <Volume2 className="w-5 h-5 text-green-400 mr-2" />
              <h2 className="text-xl font-semibold text-white">Voice Settings</h2>
            </div>
            
            {/* Voice Selection */}
            <div className="mb-6">
              <VoiceSelector
                selectedVoice={formData.voice_settings.voice || 'default'}
                onVoiceChange={(voiceId) => {
                  // Extract gender from selected voice
                  const voices = speechSynthesis.getVoices();
                  const selectedVoiceObj = voices.find(v => v.name === voiceId);
                  let gender: 'male' | 'female' | 'neutral' = 'neutral';
                  
                  if (voiceId !== 'default' && selectedVoiceObj) {
                    const name = selectedVoiceObj.name.toLowerCase();
                    if (name.includes('samantha') || name.includes('karen') || name.includes('victoria') || name.includes('female')) {
                      gender = 'female';
                    } else if (name.includes('daniel') || name.includes('david') || name.includes('alex') || name.includes('male')) {
                      gender = 'male';
                    }
                  }
                  
                  handleInputChange('voice_settings', {
                    ...formData.voice_settings,
                    voice: voiceId,
                    gender: gender
                  });
                }}
                speechRate={formData.voice_settings.speed}
                speechPitch={formData.voice_settings.pitch}
              />
            </div>
            
            {/* Speed and Pitch Controls */}
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
                <div className="flex justify-between text-xs text-zinc-400 mt-1">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
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
                <div className="flex justify-between text-xs text-zinc-400 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>
          </div>

          {/* Greeting Message */}
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
                    onChange={(e) => handleToolChange(tool.id, e.target.checked)}
                    className="mt-1 w-4 h-4 text-purple-600 bg-zinc-800 border-zinc-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <div>
                    <div className="text-sm font-medium text-white">{tool.label}</div>
                    <div className="text-xs text-zinc-400">{tool.description}</div>
                  </div>
                </label>
              ))}
            </div>
            {errors.available_tools && <p className="text-red-400 text-sm mt-2">{errors.available_tools}</p>}
          </div>

          {/* Knowledge Base Info - Show before agent creation */}
          {!createdAgentId && (
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
              <div className="flex items-center mb-6">
                <Brain className="w-5 h-5 text-green-400 mr-2" />
                <h2 className="text-xl font-semibold text-white">Knowledge Base</h2>
              </div>
              <p className="text-zinc-400 mb-4">
                After creating your agent, you'll be able to upload documents, scrape websites, and add FAQs to train it with knowledge.
              </p>
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                <p className="text-sm text-zinc-300">
                  <strong className="text-purple-400">Tip:</strong> You can add knowledge sources after creating the agent from the agent edit page.
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {!createdAgentId ? (
            <div className="flex justify-end space-x-4">
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg shadow-purple-500/25"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Bot className="w-5 h-5 mr-2" />
                    Create Agent
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex justify-end space-x-4">
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors font-medium"
              >
                Skip for Now
              </Link>
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all duration-200 flex items-center shadow-lg shadow-purple-500/25"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Finish & Go to Dashboard
              </Link>
            </div>
          )}

          {errors.submit && (
            <div className="text-center">
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
