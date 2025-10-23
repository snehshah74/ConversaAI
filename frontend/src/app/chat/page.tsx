"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import VoiceChat from '@/components/VoiceChat';

function ChatContent() {
  const searchParams = useSearchParams();
  const [agentId, setAgentId] = useState<string>('');

  useEffect(() => {
    const id = searchParams.get('agentId');
    if (id) {
      setAgentId(id);
    }
  }, [searchParams]);

  if (!agentId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-slate-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">No Agent Selected</h1>
          <p className="text-slate-300">Please select an agent to start a conversation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <VoiceChat agentId={agentId} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-slate-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Loading...</h1>
          <p className="text-slate-300">Preparing your chat experience.</p>
        </div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
