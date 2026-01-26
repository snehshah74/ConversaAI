"use client";

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function ApiTest() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const testApiConnection = async () => {
    setLoading(true);
    setStatus('Testing API connection...');
    
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        setStatus(`✅ API connected! Status: ${data.status}`);
      } else {
        setStatus('❌ API connection failed');
      }
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      </div>
      
      {status && (
        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
          <p className="text-sm text-slate-300">{status}</p>
        </div>
      )}
    </div>
  );
}
