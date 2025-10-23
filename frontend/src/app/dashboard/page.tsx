"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
  Search
} from 'lucide-react';
import { getAgents } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';

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
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const data = await getAgents();
      setAgents(data);
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
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
              href="/analytics" 
              className="flex items-center space-x-3 px-4 py-3 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Analytics</span>
            </Link>
            <Link 
              href="/conversations" 
              className="flex items-center space-x-3 px-4 py-3 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Conversations</span>
            </Link>
            <Link 
              href="/settings" 
              className="flex items-center space-x-3 px-4 py-3 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </Link>
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-6 border-t border-zinc-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full"></div>
            <div className="flex-1">
              <div className="text-sm font-medium">John Doe</div>
              <div className="text-xs text-zinc-500">john@company.com</div>
            </div>
          </div>
          <button className="flex items-center space-x-2 text-sm text-zinc-400 hover:text-white transition-colors">
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

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 animate-pulse">
                  <div className="h-6 bg-zinc-800 rounded mb-4"></div>
                  <div className="h-4 bg-zinc-800 rounded mb-2"></div>
                  <div className="h-4 bg-zinc-800 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800">
              <Bot className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Voice AI agents found</h3>
              <p className="text-zinc-500 mb-6">
                {searchQuery ? 'Try a different search term' : 'Create your first Voice AI agent to get started'}
              </p>
              {!searchQuery && (
                <Link 
                  href="/agents/create"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-white text-black rounded-xl hover:bg-zinc-200 transition-colors font-medium"
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
                  className="group p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{agent.name}</h3>
                        <div className="flex items-center space-x-2 text-xs text-zinc-500">
                          <div className={`w-2 h-2 rounded-full ${agent.is_active ? 'bg-green-400' : 'bg-zinc-600'}`}></div>
                          <span>{agent.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                    {agent.personality}
                  </p>

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
                      <Link
                        href={`/test/${agent.id}`}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Test agent"
                      >
                        <Activity className="w-4 h-4 text-zinc-400" />
                      </Link>
                      <Link
                        href={`/agents/${agent.id}/edit`}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Edit agent"
                      >
                        <Settings className="w-4 h-4 text-zinc-400" />
                      </Link>
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

