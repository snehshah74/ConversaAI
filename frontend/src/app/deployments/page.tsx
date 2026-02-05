"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Globe,
  Phone,
  Code,
  Copy,
  Check,
  Settings,
  BarChart3,
  ExternalLink,
  Play,
  Pause,
  Trash2,
  Rocket,
  Search
} from 'lucide-react';
import { getAgents } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

interface Deployment {
  id: string;
  name: string;
  deployment_type: 'web' | 'phone' | 'api' | 'sms' | 'whatsapp';
  status: 'active' | 'paused' | 'deleted';
  widget_settings?: any;
  phone_number?: string;
  api_key?: string;
  total_conversations?: number;
  monthly_conversations?: number;
  created_at: string;
  agent_id: string;
}

interface Agent {
  id: string;
  name: string;
}

export default function DeploymentsPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) loadAgents();
  }, [user?.id]);
  
  useEffect(() => {
    if (agents.length > 0) loadAllDeployments();
  }, [agents]);
  
  const loadAgents = async () => {
    try {
      const data = await getAgents({ userId: user?.id ?? undefined });
      setAgents(data);
      if (data.length > 0 && !selectedAgentId) {
        setSelectedAgentId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };
  
  const loadAllDeployments = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Load deployments for all agents
      const allDeployments: Deployment[] = [];
      for (const agent of agents) {
        try {
          const response = await fetch(`${apiUrl}/api/agents/${agent.id}/deployments`);
          const data = await response.json();
          if (data.success && data.deployments) {
            allDeployments.push(...data.deployments.map((d: any) => ({ ...d, agent_id: agent.id })));
          }
        } catch (error) {
          console.error(`Failed to load deployments for agent ${agent.id}:`, error);
        }
      }
      
      setDeployments(allDeployments);
    } catch (error) {
      console.error('Error loading deployments:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredDeployments = selectedAgentId
    ? deployments.filter(d => d.agent_id === selectedAgentId)
    : deployments;
  
  const copyEmbedCode = (deploymentId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const embedCode = `<script>
  (function() {
    window.ConversaAI = {
      deploymentId: '${deploymentId}',
      config: {
        position: 'bottom-right',
        theme: 'dark',
        greeting: 'Hi! How can I help you today?'
      }
    };
    var s = document.createElement('script');
    s.src = '${apiUrl}/widget.js?id=${deploymentId}';
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  })();
</script>`;
    
    navigator.clipboard.writeText(embedCode);
    setCopiedId(deploymentId);
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  const getAgentName = (agentId: string) => {
    return agents.find(a => a.id === agentId)?.name || 'Unknown Agent';
  };
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard" className="text-slate-400 hover:text-white mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
                  <Rocket className="w-8 h-8 text-violet-400" />
                  <span>Deployments</span>
                </h1>
                <p className="text-slate-400">Deploy your agents to web, phone, and API</p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedAgentId || ''}
                  onChange={(e) => setSelectedAgentId(e.target.value || null)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">All Agents</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <Globe className="w-6 h-6 text-violet-400" />
                <span className="text-2xl font-bold text-white">
                  {deployments.filter(d => d.deployment_type === 'web').length}
                </span>
              </div>
              <div className="text-sm text-slate-400">Web Widgets</div>
            </div>
            
            <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <Phone className="w-6 h-6 text-green-400" />
                <span className="text-2xl font-bold text-white">
                  {deployments.filter(d => d.deployment_type === 'phone').length}
                </span>
              </div>
              <div className="text-sm text-slate-400">Phone Numbers</div>
            </div>
            
            <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <Code className="w-6 h-6 text-blue-400" />
                <span className="text-2xl font-bold text-white">
                  {deployments.filter(d => d.deployment_type === 'api').length}
                </span>
              </div>
              <div className="text-sm text-slate-400">API Keys</div>
            </div>
            
            <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                <span className="text-2xl font-bold text-white">
                  {deployments.reduce((sum, d) => sum + (d.total_conversations || 0), 0)}
                </span>
              </div>
              <div className="text-sm text-slate-400">Total Conversations</div>
            </div>
          </div>
          
          {/* Deployments List */}
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading deployments...</div>
          ) : filteredDeployments.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
              <Rocket className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No deployments yet</h3>
              <p className="text-slate-400 mb-6">
                {selectedAgentId 
                  ? 'Create a deployment for this agent to get started'
                  : 'Select an agent and create your first deployment'}
              </p>
              {selectedAgentId && (
                <Link
                  href={`/agents/${selectedAgentId}/deploy`}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium"
                >
                  <Rocket className="w-5 h-5" />
                  <span>Create Deployment</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDeployments.map((deployment) => (
                <div
                  key={deployment.id}
                  className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {deployment.deployment_type === 'web' && <Globe className="w-5 h-5 text-violet-400" />}
                        {deployment.deployment_type === 'phone' && <Phone className="w-5 h-5 text-green-400" />}
                        {deployment.deployment_type === 'api' && <Code className="w-5 h-5 text-blue-400" />}
                        <h3 className="font-semibold text-white">{deployment.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs ${
                          deployment.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {deployment.status}
                        </span>
                        <span className="text-sm text-slate-500">
                          {getAgentName(deployment.agent_id)}
                        </span>
                      </div>
                      
                      {deployment.phone_number && (
                        <div className="text-sm text-slate-400 mb-2">
                          Phone: {deployment.phone_number}
                        </div>
                      )}
                      
                      {deployment.api_key && (
                        <div className="text-sm text-slate-400 mb-2 font-mono">
                          API Key: {deployment.api_key.substring(0, 20)}...
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-slate-500 mt-2">
                        <span>{deployment.total_conversations || 0} total conversations</span>
                        <span>{deployment.monthly_conversations || 0} this month</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {deployment.deployment_type === 'web' && (
                        <button
                          onClick={() => copyEmbedCode(deployment.id)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Copy Embed Code"
                        >
                          {copiedId === deployment.id ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      )}
                      <Link
                        href={`/agents/${deployment.agent_id}/deploy`}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Manage Deployment"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
