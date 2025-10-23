const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Agent {
  id: string;
  name: string;
  company: string;
  industry: string;
  role: string;
  personality: string;
  knowledge_base: string;
  greeting: string;
  is_active: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  agent_id: string;
  started_at: string;
  messages: Message[];
}

// Agent API functions
export async function createAgent(agentData: Partial<Agent>): Promise<Agent> {
  const response = await fetch(`${API_URL}/api/agents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(agentData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create agent');
  }
  
  return response.json();
}

export async function getAgents(): Promise<Agent[]> {
  const response = await fetch(`${API_URL}/api/agents`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch agents');
  }
  
  return response.json();
}

export async function getAgent(id: string): Promise<Agent> {
  const response = await fetch(`${API_URL}/api/agents/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch agent');
  }
  
  return response.json();
}

export async function updateAgent(id: string, agentData: Partial<Agent>): Promise<Agent> {
  const response = await fetch(`${API_URL}/api/agents/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(agentData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update agent');
  }
  
  return response.json();
}

export async function deleteAgent(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/agents/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete agent');
  }
}

export async function activateAgent(id: string): Promise<Agent> {
  const response = await fetch(`${API_URL}/api/agents/${id}/activate`, {
    method: 'PATCH',
  });
  
  if (!response.ok) {
    throw new Error('Failed to activate agent');
  }
  
  return response.json();
}

export async function deactivateAgent(id: string): Promise<Agent> {
  const response = await fetch(`${API_URL}/api/agents/${id}/deactivate`, {
    method: 'PATCH',
  });
  
  if (!response.ok) {
    throw new Error('Failed to deactivate agent');
  }
  
  return response.json();
}

// Chat API functions
export async function sendMessage(agentId: string, message: string, conversationId?: string) {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agent_id: agentId,
      message,
      conversation_id: conversationId,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  
  return response.json();
}

export async function startConversation(agentId: string): Promise<Conversation> {
  const response = await fetch(`${API_URL}/api/conversations/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agent_id: agentId,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to start conversation');
  }
  
  return response.json();
}

export async function getConversation(id: string): Promise<Conversation> {
  const response = await fetch(`${API_URL}/api/conversations/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch conversation');
  }
  
  return response.json();
}