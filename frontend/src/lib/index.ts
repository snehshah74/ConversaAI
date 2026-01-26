// Main library exports for the Voice AI Platform frontend

// API client and functions
export * from './api';

// Types - only export those not already in api
export { 
  type AgentCreate, 
  type AgentUpdate,
  type ConversationCreate,
  type ChatRequest, 
  type ChatResponse,
  type ApiError,
  type HealthStatus,
  type ApiHealth,
  type LoadingState,
  type PaginatedResponse,
  type AgentFormData,
  type ChatFormData,
  type ConversationMetrics,
  type AgentMetrics,
  type VoiceSettings,
  type Industry,
  type Role,
  INDUSTRIES,
  ROLES
} from './types';
