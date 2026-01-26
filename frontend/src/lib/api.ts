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
  try {
    const response = await fetch(`${API_URL}/api/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(agentData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to create agent: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend API at ${API_URL}. Make sure the backend server is running.`);
    }
    throw error;
  }
}

export async function getAgents(): Promise<Agent[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    console.log('🔄 Fetching agents from:', `${apiUrl}/api/agents`);
    
    const response = await fetch(`${apiUrl}/api/agents`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add mode and credentials for CORS
      mode: 'cors',
      credentials: 'omit',
    });
    
    console.log('📡 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText || `Failed to fetch agents: ${response.status} ${response.statusText}` };
      }
      throw new Error(errorData.detail || `Failed to fetch agents: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Agents received:', data);
    return data;
  } catch (error) {
    console.error('❌ Fetch error:', error);
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Load failed'))) {
      throw new Error(`Cannot connect to backend API. Make sure the backend server is running at ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}`);
    }
    throw error;
  }
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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const response = await fetch(`${apiUrl}/api/agents/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to delete agent: ${response.status} ${response.statusText}`);
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
  console.log('🔄 API sendMessage:', { agentId, message, conversationId, url: `${API_URL}/api/chat` });
  
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
    const errorText = await response.text();
    console.error('❌ API error:', { status: response.status, statusText: response.statusText, body: errorText });
    throw new Error(`Failed to send message: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  console.log('✅ API response:', data);
  return data;
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