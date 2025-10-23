// Shared TypeScript types for the Voice AI Platform

export interface Agent {
  id: string;
  name: string;
  company: string;
  industry: string;
  role: string;
  personality: string;
  knowledge_base: string;
  greeting: string;
  voice_settings?: Record<string, any>;
  available_tools?: string[];
  created_at: string;
  is_active: boolean;
}

export interface AgentCreate {
  name: string;
  company: string;
  industry: string;
  role: string;
  personality: string;
  knowledge_base: string;
  greeting: string;
  voice_settings?: Record<string, any>;
  available_tools?: string[];
  is_active?: boolean;
}

export interface AgentUpdate {
  name?: string;
  company?: string;
  industry?: string;
  role?: string;
  personality?: string;
  knowledge_base?: string;
  greeting?: string;
  voice_settings?: Record<string, any>;
  available_tools?: string[];
  is_active?: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  message_metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  agent_id: string;
  customer_phone?: string;
  customer_name?: string;
  status: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  sentiment?: string;
  messages?: Message[];
}

export interface ConversationCreate {
  agent_id: string;
  customer_phone?: string;
  customer_name?: string;
  status?: string;
}

export interface ConversationUpdate {
  customer_phone?: string;
  customer_name?: string;
  status?: string;
  ended_at?: string;
  duration_seconds?: number;
  sentiment?: string;
}

export interface ChatRequest {
  agent_id: string;
  message: string;
  conversation_id?: string;
  customer_phone?: string;
  customer_name?: string;
  message_metadata?: Record<string, any>;
}

export interface ChatResponse {
  conversation_id: string;
  agent_response: string;
  message_id: string;
  timestamp: string;
  status: string;
  message_metadata?: Record<string, any>;
}

export interface Action {
  id: string;
  conversation_id: string;
  action_type: string;
  parameters: Record<string, any>;
  result?: Record<string, any>;
  status: string;
  executed_at: string;
}

export interface ApiError {
  error: string;
  detail?: string;
  status_code: number;
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
}

export interface ApiHealth {
  status: string;
  database: string;
}

// UI-specific types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Form types
export interface AgentFormData {
  name: string;
  company: string;
  industry: string;
  role: string;
  personality: string;
  knowledge_base: string;
  greeting: string;
  voice_settings?: Record<string, any>;
  is_active: boolean;
}

export interface ChatFormData {
  message: string;
  customer_name?: string;
  customer_phone?: string;
}

// Analytics types
export interface ConversationMetrics {
  total_conversations: number;
  active_conversations: number;
  completed_conversations: number;
  average_duration: number;
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface AgentMetrics {
  agent_id: string;
  agent_name: string;
  total_conversations: number;
  average_rating: number;
  response_time: number;
  customer_satisfaction: number;
}

// Voice settings types
export interface VoiceSettings {
  voice: string;
  speed: number;
  pitch: number;
  volume: number;
  language?: string;
  accent?: string;
}

// Industry and role options
export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Retail',
  'Education',
  'Manufacturing',
  'Real Estate',
  'Travel',
  'Food & Beverage',
  'Automotive',
  'Other'
] as const;

export const ROLES = [
  'Customer Support',
  'Sales Representative',
  'Technical Support',
  'Account Manager',
  'Lead Generation',
  'Appointment Scheduler',
  'Information Assistant',
  'Other'
] as const;

export type Industry = typeof INDUSTRIES[number];
export type Role = typeof ROLES[number];
