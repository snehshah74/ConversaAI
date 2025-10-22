"use client";

import { useState } from 'react';
import { getHealthStatus, getApiHealth, checkApiConnection } from '@/lib/api';

export default function ApiTest() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const testApiConnection = async () => {
    setLoading(true);
    setStatus('Testing API connection...');
    
    try {
      const isConnected = await checkApiConnection();
      if (isConnected) {
        setStatus('✅ API connection successful!');
      } else {
        setStatus('❌ API connection failed');
      }
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testHealthEndpoint = async () => {
    setLoading(true);
    setStatus('Testing health endpoint...');
    
    try {
      const health = await getHealthStatus();
      setStatus(`✅ Health: ${health.status} - ${health.service} v${health.version}`);
    } catch (error) {
      setStatus(`❌ Health Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testApiHealth = async () => {
    setLoading(true);
    setStatus('Testing API health...');
    
    try {
      const apiHealth = await getApiHealth();
      setStatus(`✅ API Health: ${apiHealth.status} - Database: ${apiHealth.database}`);
    } catch (error) {
      setStatus(`❌ API Health Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-xl p-6 max-w-md mx-auto">
      <h3 className="text-xl font-semibold text-white mb-4">API Connection Test</h3>
      
      <div className="space-y-3">
        <button
          onClick={testApiConnection}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>
        
        <button
          onClick={testHealthEndpoint}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Testing...' : 'Test Health'}
        </button>
        
        <button
          onClick={testApiHealth}
          disabled={loading}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Testing...' : 'Test API Health'}
        </button>
      </div>
      
      {status && (
        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
          <p className="text-sm text-slate-300">{status}</p>
        </div>
      )}
    </div>
  );
}

