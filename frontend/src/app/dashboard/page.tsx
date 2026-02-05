"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bot, 
  Plus, 
  Activity, 
  MessageCircle, 
  TrendingUp, 
  Users,
  Clock,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Globe,
  Rocket,
  Zap,
  Trash2
} from 'lucide-react';
import { getAgents, deleteAgent } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

interface Agent {
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

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadAgents();
  }, [user?.id]);

  const loadAgents = async () => {
    try {
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      console.log('🔄 Loading agents from:', apiUrl);
      const data = await getAgents({ userId: user?.id ?? undefined });
      console.log('✅ Agents loaded:', data);
      setAgents(data || []);
    } catch (error: any) {
      console.error('❌ Failed to load agents:', error);
      const errorMessage = error?.message || 'Failed to load agents';
      setError(errorMessage);
      
      // If it's a connection error, show helpful message
      if (errorMessage.includes('Cannot connect to backend') || errorMessage.includes('fetch') || errorMessage.includes('Load failed')) {
        setError('Backend server is not running or not accessible. Please ensure the backend is running at http://localhost:8000');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = async (agentId: string, agentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${agentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingAgentId(agentId);
      await deleteAgent(agentId, { userId: user?.id ?? undefined });
      // Remove agent from list
      setAgents(prev => prev.filter(a => a.id !== agentId));
    } catch (error: any) {
      console.error('Failed to delete agent:', error);
      alert(`Failed to delete agent: ${error.message || 'Unknown error'}`);
    } finally {
      setDeletingAgentId(null);
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.personality.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.knowledge_base.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-theme text-theme">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-zinc-900/50 border-r border-zinc-800 backdrop-blur-xl">
        <div className="p-6">
          <Link href="/" className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Conversa AI</span>
          </Link>

          <nav className="space-y-2">
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-3 px-4 py-3 bg-white/10 rounded-xl text-white"
            >
              <Activity className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link 
              href="/agents/create" 
              className="flex items-center space-x-3 px-4 py-3 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Create Voice AI Agent</span>
            </Link>
            <Link 
              href="/deployments" 
              className="flex items-center space-x-3 px-4 py-3 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors"
            >
              <Globe className="w-5 h-5" />
              <span className="font-medium">Deployments</span>
            </Link>
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-6 border-t border-zinc-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name || 'User'}</div>
              <div className="text-xs text-zinc-500 truncate">{user?.email || ''}</div>
            </div>
          </div>
          <button 
            onClick={() => {
              logout();
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
            }}
            className="flex items-center space-x-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-zinc-400">Manage your Voice AI agents and monitor performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Bot className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-sm text-green-400">+12%</span>
            </div>
            <div className="text-3xl font-bold mb-1">{agents.length}</div>
            <div className="text-sm text-zinc-500">Active Voice AI Agents</div>
          </div>

          <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <MessageCircle className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-sm text-green-400">+23%</span>
            </div>
            <div className="text-3xl font-bold mb-1">1,234</div>
            <div className="text-sm text-zinc-500">Conversations</div>
          </div>

          <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-cyan-500/10 rounded-xl">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="text-sm text-green-400">+8%</span>
            </div>
            <div className="text-3xl font-bold mb-1">98.5%</div>
            <div className="text-sm text-zinc-500">Success Rate</div>
          </div>

          <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-pink-500/10 rounded-xl">
                <Clock className="w-6 h-6 text-pink-400" />
              </div>
              <span className="text-sm text-green-400">-15%</span>
            </div>
            <div className="text-3xl font-bold mb-1">1.2s</div>
            <div className="text-sm text-zinc-500">Avg Response</div>
          </div>
        </div>

        {/* Agents Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Voice AI Agents</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search Voice AI agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <Link 
                href="/agents/create"
                className="flex items-center space-x-2 px-4 py-2 bg-white text-black rounded-xl hover:bg-zinc-200 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Create Voice AI Agent</span>
              </Link>
            </div>
          </div>

          {error ? (
            <div className="text-center py-20 bg-red-950/20 border border-red-800/50 rounded-2xl">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-900/50 rounded-2xl mb-6">
                <Activity className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-red-300">Failed to Load Agents</h3>
              <p className="text-red-400 mb-6 max-w-md mx-auto">{error}</p>
              <button
                onClick={loadAgents}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors font-medium"
              >
                <Activity className="w-5 h-5" />
                <span>Retry</span>
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-zinc-800 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-zinc-800 rounded mb-2"></div>
                      <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-zinc-800 rounded mb-2"></div>
                  <div className="h-4 bg-zinc-800 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-20 bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 rounded-2xl border border-zinc-800">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl mb-6">
                <Bot className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">No Voice AI agents yet</h3>
              <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                {searchQuery 
                  ? "No agents match your search. Try different keywords or create a new agent."
                  : "Create your first Voice AI agent to start building intelligent voice interactions. It only takes a few minutes!"}
              </p>
              {!searchQuery && (
                <Link 
                  href="/agents/create"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all font-medium shadow-lg shadow-purple-500/25"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Voice AI Agent</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="group p-6 bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 rounded-2xl border border-zinc-800 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      onClick={() => router.push(`/agents/${agent.id}/edit`)}
                      className="flex items-center space-x-3 flex-1 cursor-pointer group/edit"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/25">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg group-hover/edit:text-purple-400 transition-colors">{agent.name}</h3>
                        <div className="flex items-center space-x-2 text-xs text-zinc-500 mt-1">
                          <div className={`w-2 h-2 rounded-full ${agent.is_active ? 'bg-green-400 animate-pulse' : 'bg-zinc-600'}`}></div>
                          <span>{agent.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAgent(agent.id, agent.name, e);
                      }}
                      disabled={deletingAgentId === agent.id}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Delete Agent"
                    >
                      {deletingAgentId === agent.id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div 
                    onClick={() => router.push(`/agents/${agent.id}/edit`)}
                    className="cursor-pointer"
                  >
                    <p className="text-sm text-zinc-400 mb-4 line-clamp-2 min-h-[2.5rem]">
                      {agent.personality}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                    <div className="flex items-center space-x-4 text-xs text-zinc-500">
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>234</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>89</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/agents/${agent.id}/deploy`);
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-all text-xs hover:scale-105"
                        title="Deploy"
                      >
                        <Rocket className="w-3 h-3" />
                        <span>Deploy</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/test/${agent.id}`);
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all text-xs"
                        title="Test"
                      >
                        <Activity className="w-4 h-4" />
                        <span>Test</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800">
          <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { action: 'New conversation started', agent: 'Customer Support Agent', time: '2 minutes ago' },
              { action: 'Agent updated', agent: 'Sales Assistant', time: '1 hour ago' },
              { action: 'New conversation started', agent: 'Technical Support', time: '3 hours ago' },
              { action: 'Agent created', agent: 'Appointment Scheduler', time: '1 day ago' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{activity.action}</div>
                  <div className="text-sm text-zinc-500">{activity.agent}</div>
                </div>
                <div className="text-sm text-zinc-500">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
      </div>
    </ProtectedRoute>
  );
}

