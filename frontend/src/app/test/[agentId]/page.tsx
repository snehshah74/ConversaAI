"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Bot, 
  Clock, 
  MessageCircle, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  Download,
  Save,
  ArrowLeft,
  Target,
  BarChart3,
  Activity
} from 'lucide-react';
import VoiceChat from '@/components/VoiceChat';
import { getAgent } from '@/lib/api';
import type { Agent } from '@/lib/types';

interface TestMetrics {
  conversationDuration: number;
  messagesExchanged: number;
  sentiment: string;
  actionsExecuted: string[];
  startTime: Date;
}

interface SuccessCriteria {
  id: string;
  label: string;
  completed: boolean;
  description: string;
}

export default function AgentTestPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<TestMetrics>({
    conversationDuration: 0,
    messagesExchanged: 0,
    sentiment: 'neutral',
    actionsExecuted: [],
    startTime: new Date()
  });
  const [successCriteria, setSuccessCriteria] = useState<SuccessCriteria[]>([]);

  // Load agent data
  useEffect(() => {
    const loadAgent = async () => {
      try {
        setLoading(true);
        const agentData = await getAgent(agentId);
        setAgent(agentData);
        
        // Initialize success criteria based on agent role
        const criteria = getSuccessCriteriaForRole(agentData.role);
        setSuccessCriteria(criteria);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agent');
      } finally {
        setLoading(false);
      }
    };

    if (agentId) {
      loadAgent();
    }
  }, [agentId]);

  // Update conversation duration
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        conversationDuration: Math.floor((Date.now() - prev.startTime.getTime()) / 1000)
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Get success criteria based on agent role
  const getSuccessCriteriaForRole = (role: string): SuccessCriteria[] => {
    const baseCriteria = [
      {
        id: 'greeting',
        label: 'Proper greeting',
        completed: false,
        description: 'Agent provides appropriate greeting'
      },
      {
        id: 'understanding',
        label: 'Message understanding',
        completed: false,
        description: 'Agent correctly interprets user messages'
      },
      {
        id: 'response_quality',
        label: 'Response quality',
        completed: false,
        description: 'Agent provides helpful and relevant responses'
      }
    ];

    switch (role.toLowerCase()) {
      case 'customer support':
        return [
          ...baseCriteria,
          {
            id: 'problem_resolution',
            label: 'Problem resolution',
            completed: false,
            description: 'Agent attempts to resolve customer issues'
          },
          {
            id: 'empathy',
            label: 'Shows empathy',
            completed: false,
            description: 'Agent demonstrates understanding and empathy'
          },
          {
            id: 'escalation',
            label: 'Proper escalation',
            completed: false,
            description: 'Agent escalates complex issues appropriately'
          }
        ];
      
      case 'sales representative':
        return [
          ...baseCriteria,
          {
            id: 'product_knowledge',
            label: 'Product knowledge',
            completed: false,
            description: 'Agent demonstrates good product knowledge'
          },
          {
            id: 'lead_qualification',
            label: 'Lead qualification',
            completed: false,
            description: 'Agent asks qualifying questions'
          },
          {
            id: 'closing_attempt',
            label: 'Closing attempt',
            completed: false,
            description: 'Agent attempts to close or schedule follow-up'
          }
        ];

      case 'appointment scheduler':
        return [
          ...baseCriteria,
          {
            id: 'availability_check',
            label: 'Availability check',
            completed: false,
            description: 'Agent checks and confirms availability'
          },
          {
            id: 'details_collection',
            label: 'Details collection',
            completed: false,
            description: 'Agent collects necessary appointment details'
          },
          {
            id: 'confirmation',
            label: 'Confirmation provided',
            completed: false,
            description: 'Agent provides clear confirmation details'
          }
        ];

      default:
        return baseCriteria;
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'text-green-400';
      case 'negative':
        return 'text-red-400';
      case 'neutral':
      default:
        return 'text-slate-400';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'negative':
        return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
      case 'neutral':
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleEndTest = () => {
    router.push('/');
  };

  const handleSaveConversation = () => {
    // TODO: Implement save conversation functionality
    console.log('Save conversation');
  };

  const handleExportTranscript = () => {
    // TODO: Implement export transcript functionality
    console.log('Export transcript');
  };

  const handleMetricsUpdate = (newMetrics: {
    messagesExchanged: number;
    sentiment: string;
    actionsExecuted: string[];
  }) => {
    setMetrics(prev => ({
      ...prev,
      messagesExchanged: newMetrics.messagesExchanged,
      sentiment: newMetrics.sentiment,
      actionsExecuted: newMetrics.actionsExecuted
    }));
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-slate-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading agent...</p>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-slate-950">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Error Loading Agent</h1>
          <p className="text-slate-300 mb-4">{error || 'Agent not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-blue-600 via-purple-600 to-slate-950">
      {/* Left Panel - Voice Chat (60%) */}
      <div className="flex-1" style={{ width: '60%' }}>
        <VoiceChat 
          agentId={agentId} 
          agent={agent}
          onMetricsUpdate={handleMetricsUpdate}
        />
      </div>

      {/* Right Panel - Agent Info and Metrics (40%) */}
      <div className="w-2/5 border-l border-slate-700/50 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <h1 className="text-lg font-semibold text-white">Test Results</h1>
          </div>

          {/* Agent Details Card */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{agent.name}</h2>
                <p className="text-slate-400">{agent.role} • {agent.company}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-1">Personality</h3>
                <p className="text-sm text-slate-400">{agent.personality}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-1">Industry</h3>
                <p className="text-sm text-slate-400">{agent.industry}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${agent.is_active ? 'bg-green-400' : 'bg-slate-400'}`}></div>
                <span className="text-sm text-slate-400">
                  {agent.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Metrics */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-5 h-5 text-blue-400 mr-2" />
              <h2 className="text-lg font-semibold text-white">Live Metrics</h2>
            </div>
            
            <div className="space-y-4">
              {/* Conversation Duration */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">Duration</span>
                </div>
                <span className="text-sm font-medium text-white">
                  {formatDuration(metrics.conversationDuration)}
                </span>
              </div>

              {/* Messages Exchanged */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">Messages</span>
                </div>
                <span className="text-sm font-medium text-white">
                  {metrics.messagesExchanged}
                </span>
              </div>

              {/* Sentiment */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getSentimentIcon(metrics.sentiment)}
                  <span className="text-sm text-slate-300">Sentiment</span>
                </div>
                <span className={`text-sm font-medium ${getSentimentColor(metrics.sentiment)}`}>
                  {metrics.sentiment}
                </span>
              </div>

              {/* Actions Executed */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">Actions</span>
                </div>
                <div className="space-y-1">
                  {metrics.actionsExecuted.length > 0 ? (
                    metrics.actionsExecuted.map((action, index) => (
                      <div key={index} className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
                        {action}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No actions executed yet</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Success Criteria */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <h2 className="text-lg font-semibold text-white">Success Criteria</h2>
            </div>
            
            <div className="space-y-3">
              {successCriteria.map((criteria) => (
                <div key={criteria.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {criteria.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-slate-600 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-white">{criteria.label}</h3>
                    <p className="text-xs text-slate-400">{criteria.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            
            <div className="space-y-3">
              <button
                onClick={handleSaveConversation}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Conversation
              </button>
              
              <button
                onClick={handleExportTranscript}
                className="w-full flex items-center justify-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Transcript
              </button>
              
              <button
                onClick={handleEndTest}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4 mr-2" />
                End Test
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
