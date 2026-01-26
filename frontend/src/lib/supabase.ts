import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const signUp = async (email: string, password: string) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { 
      data: null, 
      error: { message: 'Supabase is not configured. Please set up your environment variables.' } 
    };
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { 
      data: null, 
      error: { message: 'Supabase is not configured. Please set up your environment variables.' } 
    };
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: { message: 'Supabase is not configured.' } };
  }
  
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, error: { message: 'Supabase is not configured.' } };
  }
  
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Database helpers
export const getAgents = async () => {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const createAgent = async (agentData: any) => {
  const { data, error } = await supabase
    .from('agents')
    .insert([agentData])
    .select()
  
  return { data, error }
}

export const updateAgent = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('agents')
    .update(updates)
    .eq('id', id)
    .select()
  
  return { data, error }
}

export const deleteAgent = async (id: string) => {
  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('id', id)
  
  return { error }
}
