"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');
      const next = searchParams.get('next') ?? '/dashboard';

      // Supabase may pass error in query (e.g. access_denied)
      if (errorParam) {
        const detail = searchParams.get('error_description') || errorParam;
        router.replace(`/login?error=auth_callback_error&detail=${encodeURIComponent(detail)}`);
        return;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseAnonKey) {
        router.replace('/login?error=auth_callback_error&detail=supabase_not_configured');
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // PKCE: code in query - exchange *must* run in browser (code_verifier is in localStorage)
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          router.replace(`/login?error=auth_callback_error&detail=${encodeURIComponent(error.message)}`);
          return;
        }
        router.replace(next);
        return;
      }

      // Implicit / hash flow: tokens in #access_token=...
      // Client auto-parses hash on init - check if session was restored
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      if (hash) {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!error && session) {
          router.replace(next);
          return;
        }
      }

      setStatus('error');
      router.replace(`/login?error=auth_callback_error&detail=no_code_or_token`);
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-theme text-theme flex items-center justify-center">
      <div className="text-center">
        {status === 'loading' ? (
          <>
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Signing you in...</p>
          </>
        ) : (
          <p className="text-zinc-400">Redirecting...</p>
        )}
      </div>
    </div>
  );
}
