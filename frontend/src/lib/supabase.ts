import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Only create Supabase client if credentials are provided
// This prevents "Auth session missing" errors in development
let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('⚠️ Supabase credentials not found. Running in development mode without authentication.');
}

// Safe wrapper functions that handle missing Supabase
const safeSupabaseCall = async <T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> => {
  if (!supabase) {
    return fallback;
  }
  try {
    return await fn();
  } catch (error) {
    console.error('Supabase error:', error);
    return fallback;
  }
};

// Auth helpers
export const signUp = async (email: string, password: string) => {
  if (!supabase) {
    return { 
      data: null, 
      error: { message: 'Supabase is not configured. Running in development mode.' } 
    };
  }
  
  return await safeSupabaseCall(
    () => supabase!.auth.signUp({ email, password }),
    { data: null, error: { message: 'Supabase not configured' } }
  );
}

export const signIn = async (email: string, password: string) => {
  if (!supabase) {
    return { 
      data: null, 
      error: { message: 'Supabase is not configured. Running in development mode.' } 
    };
  }
  
  return await safeSupabaseCall(
    () => supabase!.auth.signInWithPassword({ email, password }),
    { data: null, error: { message: 'Supabase not configured' } }
  );
}

export const signOut = async () => {
  if (!supabase) {
    return { error: null };
  }
  
  return await safeSupabaseCall(
    () => supabase!.auth.signOut(),
    { error: null }
  );
}

export const getCurrentUser = async () => {
  if (!supabase) {
    return { user: null, error: null };
  }
  
  return await safeSupabaseCall(
    async () => {
      const { data: { user }, error } = await supabase!.auth.getUser();
      return { user, error };
    },
    { user: null, error: null }
  );
}

// Database helpers
export const getAgents = async () => {
  if (!supabase) {
    return { data: [], error: null };
  }
  
  return await safeSupabaseCall(
    () => supabase!.from('agents').select('*').order('created_at', { ascending: false }),
    { data: [], error: null }
  );
}

export const createAgent = async (agentData: any) => {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }
  
  return await safeSupabaseCall(
    () => supabase!.from('agents').insert([agentData]).select(),
    { data: null, error: { message: 'Supabase not configured' } }
  );
}

export const updateAgent = async (id: string, updates: any) => {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }
  
  return await safeSupabaseCall(
    () => supabase!.from('agents').update(updates).eq('id', id).select(),
    { data: null, error: { message: 'Supabase not configured' } }
  );
}

export const deleteAgent = async (id: string) => {
  if (!supabase) {
    return { error: null };
  }
  
  return await safeSupabaseCall(
    () => supabase!.from('agents').delete().eq('id', id),
    { error: null }
  );
}

// Export supabase for direct access (will be null if not configured)
export { supabase };
