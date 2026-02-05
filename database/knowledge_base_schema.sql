-- 📚 KNOWLEDGE BASE TABLE (Enhanced)
-- Run this in Supabase SQL Editor to create/update the knowledge_base table

-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create knowledge_base table with enhanced schema
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID NOT NULL, -- References agents(id) - adjust table name if needed
    content_type VARCHAR(50) NOT NULL DEFAULT 'document', -- 'document', 'url', 'faq'
    title VARCHAR(255),
    content TEXT NOT NULL,
    source VARCHAR(255) NOT NULL, -- filename, URL, or FAQ identifier
    embedding vector(384), -- Dimension for all-MiniLM-L6-v2 model (384)
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_agent_id ON public.knowledge_base(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_type ON public.knowledge_base(content_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_source ON public.knowledge_base(source);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_created_at ON public.knowledge_base(created_at);

-- Vector index for semantic search (only create if embedding column exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'knowledge_base' AND column_name = 'embedding')
       AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_knowledge_base_embedding') THEN
        CREATE INDEX idx_knowledge_base_embedding 
        ON public.knowledge_base USING ivfflat (embedding vector_cosine_ops) 
        WITH (lists = 100);
    END IF;
END $$;

-- Create or replace vector similarity search function
CREATE OR REPLACE FUNCTION public.search_knowledge_base(
    query_embedding vector(384),
    match_agent_id UUID,
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    source VARCHAR(255),
    content_type VARCHAR(50),
    metadata JSONB,
    distance float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kb.id,
        kb.content,
        kb.source,
        kb.content_type,
        kb.metadata,
        1 - (kb.embedding <=> query_embedding) as distance
    FROM public.knowledge_base kb
    WHERE kb.agent_id = match_agent_id
        AND kb.embedding IS NOT NULL
        AND 1 - (kb.embedding <=> query_embedding) > match_threshold
    ORDER BY kb.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Enable RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust table references as needed)
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view KB entries for own agents" ON public.knowledge_base;
    DROP POLICY IF EXISTS "Users can create KB entries for own agents" ON public.knowledge_base;
    DROP POLICY IF EXISTS "Users can update KB entries for own agents" ON public.knowledge_base;
    DROP POLICY IF EXISTS "Users can delete KB entries for own agents" ON public.knowledge_base;
    
    -- Create policies (adjust based on your schema)
    -- Option 1: If agents table has user_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'agents' AND column_name = 'user_id') THEN
        CREATE POLICY "Users can view KB entries for own agents" ON public.knowledge_base
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.agents 
                    WHERE agents.id = knowledge_base.agent_id 
                    AND agents.user_id = auth.uid()
                )
            );

        CREATE POLICY "Users can create KB entries for own agents" ON public.knowledge_base
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.agents 
                    WHERE agents.id = knowledge_base.agent_id 
                    AND agents.user_id = auth.uid()
                )
            );

        CREATE POLICY "Users can update KB entries for own agents" ON public.knowledge_base
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.agents 
                    WHERE agents.id = knowledge_base.agent_id 
                    AND agents.user_id = auth.uid()
                )
            );

        CREATE POLICY "Users can delete KB entries for own agents" ON public.knowledge_base
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM public.agents 
                    WHERE agents.id = knowledge_base.agent_id 
                    AND agents.user_id = auth.uid()
                )
            );
    ELSE
        -- Option 2: Allow all access (for development) - REMOVE IN PRODUCTION
        CREATE POLICY "Allow all access" ON public.knowledge_base
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Create trigger function for updated_at (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $trigger$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$trigger$ LANGUAGE plpgsql;

-- Create trigger for updated_at (if it doesn't exist)
DO $do$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_knowledge_base_updated_at') THEN
        CREATE TRIGGER update_knowledge_base_updated_at 
        BEFORE UPDATE ON public.knowledge_base 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $do$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Knowledge base table created successfully!';
    RAISE NOTICE '📚 Supports documents, URLs, and FAQs';
    RAISE NOTICE '🔍 Vector search function ready';
    RAISE NOTICE '🔒 RLS policies applied';
    RAISE NOTICE '🎯 Ready to train agents with knowledge!';
END $$;
