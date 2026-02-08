-- Add missing columns to agents table (required by backend)
-- Run this in Supabase SQL Editor if you get "column does not exist" errors

ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS user_id VARCHAR(36);

ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS voice_settings JSONB;

ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS available_tools JSONB;

CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
