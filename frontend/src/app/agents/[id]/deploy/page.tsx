"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { getApiUrl } from '@/lib/api';

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
}

export default function DeploymentPage() {
  const params = useParams();
  const agentId = params.id as string;
  
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'web' | 'phone' | 'api'>('web');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Form states
  const [webName, setWebName] = useState('');
  const [webPosition, setWebPosition] = useState('bottom-right');
  const [webTheme, setWebTheme] = useState('dark');
  const [webGreeting, setWebGreeting] = useState('Hi! How can I help you today?');
  const [allowedDomains, setAllowedDomains] = useState('');
  
  const [phoneName, setPhoneName] = useState('');
  const [phoneAreaCode, setPhoneAreaCode] = useState('415');
  
  const [apiName, setApiName] = useState('');
  const [apiWebhook, setApiWebhook] = useState('');
  const [apiRateLimit, setApiRateLimit] = useState(60);
  
  useEffect(() => {
    loadDeployments();
  }, [agentId]);
  
  const loadDeployments = async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/agents/${agentId}/deployments`);
      const data = await response.json();
      
      if (data.success) {
        setDeployments(data.deployments || []);
      }
    } catch (error) {
      console.error('Error loading deployments:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const createWebDeployment = async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/agents/${agentId}/deployments/web`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: webName || 'Web Widget',
          widget_settings: {
            position: webPosition,
            theme: webTheme,
            greeting: webGreeting,
            colors: {
              primary: '#6366f1',
              background: webTheme === 'dark' ? '#1e293b' : '#ffffff',
              text: webTheme === 'dark' ? '#ffffff' : '#1e293b'
            }
          },
          allowed_domains: allowedDomains.split(',').map(d => d.trim()).filter(Boolean)
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadDeployments();
        setWebName('');
        setAllowedDomains('');
        // Show embed code modal
        if (data.embed_code) {
          alert('Deployment created! Embed code:\n\n' + data.embed_code);
        }
      }
    } catch (error) {
      console.error('Error creating web deployment:', error);
      alert('Failed to create deployment');
    }
  };
  
  const createPhoneDeployment = async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/agents/${agentId}/deployments/phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: phoneName || 'Phone Deployment',
          area_code: phoneAreaCode
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadDeployments();
        setPhoneName('');
        alert(`Phone deployment created! Number: ${data.phone_number}`);
      }
    } catch (error) {
      console.error('Error creating phone deployment:', error);
      alert('Failed to create deployment');
    }
  };
  
  const createAPIDeployment = async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/agents/${agentId}/deployments/api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: apiName || 'API Deployment',
          webhook_url: apiWebhook || undefined,
          rate_limit: apiRateLimit
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadDeployments();
        setApiName('');
        setApiWebhook('');
        // Show API credentials
        if (data.api_key) {
          alert(`API Deployment created!\n\nAPI Key: ${data.api_key}\n\nSave this key - it won't be shown again!`);
        }
      }
    } catch (error) {
      console.error('Error creating API deployment:', error);
      alert('Failed to create deployment');
    }
  };
  
  const copyEmbedCode = (deploymentId: string) => {
    const apiUrl = getApiUrl();
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
  
  const toggleDeployment = async (deploymentId: string, currentStatus: string) => {
    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/deployments/${deploymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: currentStatus === 'active' ? 'paused' : 'active'
        })
      });
      await loadDeployments();
    } catch (error) {
      console.error('Error toggling deployment:', error);
    }
  };
  
  const deleteDeployment = async (deploymentId: string) => {
    if (!confirm('Are you sure you want to delete this deployment?')) return;
    
    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/deployments/${deploymentId}`, {
        method: 'DELETE'
      });
      await loadDeployments();
    } catch (error) {
      console.error('Error deleting deployment:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-slate-400">Loading deployments...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/agents/${agentId}/edit`} className="text-slate-400 hover:text-white mb-4 inline-block">
            ← Back to Agent
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Deploy Agent</h1>
          <p className="text-slate-400">Deploy your agent to multiple channels</p>
        </div>
        
        {/* Deployment Type Selector */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setActiveTab('web')}
            className={`p-6 rounded-xl border-2 transition-all ${
              activeTab === 'web'
                ? 'border-violet-500 bg-violet-500/10'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <Globe className="w-8 h-8 text-violet-400 mb-2" />
            <div className="text-white font-semibold">Web Widget</div>
            <div className="text-sm text-slate-400">Embed on your website</div>
          </button>
          
          <button
            onClick={() => setActiveTab('phone')}
            className={`p-6 rounded-xl border-2 transition-all ${
              activeTab === 'phone'
                ? 'border-violet-500 bg-violet-500/10'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <Phone className="w-8 h-8 text-violet-400 mb-2" />
            <div className="text-white font-semibold">Phone</div>
            <div className="text-sm text-slate-400">Voice calls via phone</div>
          </button>
          
          <button
            onClick={() => setActiveTab('api')}
            className={`p-6 rounded-xl border-2 transition-all ${
              activeTab === 'api'
                ? 'border-violet-500 bg-violet-500/10'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <Code className="w-8 h-8 text-violet-400 mb-2" />
            <div className="text-white font-semibold">API</div>
            <div className="text-sm text-slate-400">Integrate via API</div>
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-8">
          {/* Create Deployment Form */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-6">
              Create {activeTab === 'web' ? 'Web Widget' : activeTab === 'phone' ? 'Phone' : 'API'} Deployment
            </h2>
            
            {activeTab === 'web' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={webName}
                    onChange={(e) => setWebName(e.target.value)}
                    placeholder="My Website Widget"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Position</label>
                  <select
                    value={webPosition}
                    onChange={(e) => setWebPosition(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Theme</label>
                  <select
                    value={webTheme}
                    onChange={(e) => setWebTheme(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Greeting Message</label>
                  <input
                    type="text"
                    value={webGreeting}
                    onChange={(e) => setWebGreeting(e.target.value)}
                    placeholder="Hi! How can I help you today?"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Allowed Domains (comma-separated, leave empty for all)
                  </label>
                  <input
                    type="text"
                    value={allowedDomains}
                    onChange={(e) => setAllowedDomains(e.target.value)}
                    placeholder="example.com, app.example.com"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                
                <button
                  onClick={createWebDeployment}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium"
                >
                  Create Web Widget
                </button>
              </div>
            )}
            
            {activeTab === 'phone' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={phoneName}
                    onChange={(e) => setPhoneName(e.target.value)}
                    placeholder="Customer Support Line"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Area Code</label>
                  <input
                    type="text"
                    value={phoneAreaCode}
                    onChange={(e) => setPhoneAreaCode(e.target.value)}
                    placeholder="415"
                    maxLength={3}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                
                <button
                  onClick={createPhoneDeployment}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium"
                >
                  Provision Phone Number
                </button>
              </div>
            )}
            
            {activeTab === 'api' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={apiName}
                    onChange={(e) => setApiName(e.target.value)}
                    placeholder="Production API"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Webhook URL (optional)</label>
                  <input
                    type="url"
                    value={apiWebhook}
                    onChange={(e) => setApiWebhook(e.target.value)}
                    placeholder="https://your-app.com/webhook"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Rate Limit (per minute)</label>
                  <input
                    type="number"
                    value={apiRateLimit}
                    onChange={(e) => setApiRateLimit(parseInt(e.target.value))}
                    min={1}
                    max={1000}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                
                <button
                  onClick={createAPIDeployment}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium"
                >
                  Generate API Keys
                </button>
              </div>
            )}
          </div>
          
          {/* Existing Deployments */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-6">Active Deployments</h2>
            
            {deployments.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No deployments yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deployments.map((deployment) => (
                  <div
                    key={deployment.id}
                    className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          {deployment.deployment_type === 'web' && <Globe className="w-4 h-4 text-violet-400" />}
                          {deployment.deployment_type === 'phone' && <Phone className="w-4 h-4 text-violet-400" />}
                          {deployment.deployment_type === 'api' && <Code className="w-4 h-4 text-violet-400" />}
                          <span className="font-semibold text-white">{deployment.name}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            deployment.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {deployment.status}
                          </span>
                        </div>
                        {deployment.phone_number && (
                          <div className="text-sm text-slate-400">{deployment.phone_number}</div>
                        )}
                        {deployment.api_key && (
                          <div className="text-sm text-slate-400 font-mono">{deployment.api_key.substring(0, 20)}...</div>
                        )}
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
                        <button
                          onClick={() => toggleDeployment(deployment.id, deployment.status)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          {deployment.status === 'active' ? (
                            <Pause className="w-4 h-4 text-slate-400" />
                          ) : (
                            <Play className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteDeployment(deployment.id)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <span>{deployment.total_conversations || 0} conversations</span>
                      <span>{deployment.monthly_conversations || 0} this month</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
