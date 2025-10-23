// Main library exports for the Voice AI Platform frontend

// API client and functions
export * from './api';

// Types
export * from './types';

// Re-export commonly used items
export { default as api } from './api';
export type { 
  Agent, 
  AgentCreate, 
  AgentUpdate,
  Conversation, 
  ConversationCreate,
  ChatRequest, 
  ChatResponse,
  Message,
  ApiError,
  HealthStatus,
  ApiHealth,
  LoadingState,
  PaginatedResponse,
  AgentFormData,
  ChatFormData,
  ConversationMetrics,
  AgentMetrics,
  VoiceSettings,
  Industry,
  Role,
  INDUSTRIES,
  ROLES
} from './types';

