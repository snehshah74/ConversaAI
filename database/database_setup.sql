-- 🗄️ SUPABASE DATABASE SETUP - COMPLETE SCHEMA
-- Run this script in your Supabase database to set up everything

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; -- pgvector for semantic search

-- 1. USER PROFILES TABLE
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    company VARCHAR(255),
    industry VARCHAR(100),
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    credits_remaining INTEGER DEFAULT 1000,
    usage_limit INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}'::jsonb
);

-- Indexes for profiles
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_company ON public.profiles(company);
CREATE INDEX idx_profiles_subscription ON public.profiles(subscription_tier, subscription_status);

-- 2. VOICE AI AGENTS TABLE
CREATE TABLE public.voice_agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    personality TEXT,
    knowledge_base TEXT,
    greeting_message TEXT,
    voice_settings JSONB DEFAULT '{}'::jsonb,
    llm_provider VARCHAR(50) DEFAULT 'google',
    model_name VARCHAR(100) DEFAULT 'gemini-2.5-flash',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    available_tools JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.0,
    avg_response_time DECIMAL(8,3) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for voice_agents
CREATE INDEX idx_voice_agents_user_id ON public.voice_agents(user_id);
CREATE INDEX idx_voice_agents_active ON public.voice_agents(is_active);
CREATE INDEX idx_voice_agents_public ON public.voice_agents(is_public);
CREATE INDEX idx_voice_agents_created_at ON public.voice_agents(created_at);

-- 3. CONVERSATIONS TABLE
CREATE TABLE public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    agent_id UUID REFERENCES public.voice_agents(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5),
    feedback TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for conversations
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_agent_id ON public.conversations(agent_id);
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_conversations_started_at ON public.conversations(started_at);

-- 4. MESSAGES TABLE
CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'agent', 'system')),
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text',
    audio_url TEXT,
    audio_duration DECIMAL(8,3),
    transcription TEXT,
    sentiment_score DECIMAL(3,2),
    intent VARCHAR(100),
    entities JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_role ON public.messages(role);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_messages_intent ON public.messages(intent);

-- 5. USER SESSIONS TABLE
CREATE TABLE public.user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_sessions
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- 6. ANALYTICS TABLE
CREATE TABLE public.analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.voice_agents(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    session_id UUID REFERENCES public.user_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX idx_analytics_agent_id ON public.analytics(agent_id);
CREATE INDEX idx_analytics_event_type ON public.analytics(event_type);
CREATE INDEX idx_analytics_created_at ON public.analytics(created_at);

-- 7. FILE STORAGE TABLE
CREATE TABLE public.file_storage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    agent_id UUID REFERENCES public.voice_agents(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(100),
    is_public BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for file_storage
CREATE INDEX idx_file_storage_user_id ON public.file_storage(user_id);
CREATE INDEX idx_file_storage_agent_id ON public.file_storage(agent_id);
CREATE INDEX idx_file_storage_conversation_id ON public.file_storage(conversation_id);
CREATE INDEX idx_file_storage_file_type ON public.file_storage(file_type);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- 9. KNOWLEDGE BASE TABLE (with pgvector for RAG)
CREATE TABLE public.knowledge_base (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID REFERENCES public.voice_agents(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    source VARCHAR(255) NOT NULL,
    doc_type VARCHAR(50) DEFAULT 'text',
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(384), -- Dimension for all-MiniLM-L6-v2 model
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for knowledge_base
CREATE INDEX idx_knowledge_base_agent_id ON public.knowledge_base(agent_id);
CREATE INDEX idx_knowledge_base_source ON public.knowledge_base(source);
CREATE INDEX idx_knowledge_base_doc_type ON public.knowledge_base(doc_type);
CREATE INDEX idx_knowledge_base_embedding ON public.knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Vector similarity search function
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
    doc_type VARCHAR(50),
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
        kb.doc_type,
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

-- 10. SUBSCRIPTION PLANS TABLE
CREATE TABLE public.subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    credits_included INTEGER NOT NULL,
    usage_limit INTEGER NOT NULL,
    features JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plans
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, credits_included, usage_limit, features) VALUES
('Free', 'Basic voice AI agent features', 0.00, 0.00, 1000, 1000, '{"max_agents": 3, "max_conversations_per_month": 100, "voice_synthesis": false}'),
('Pro', 'Advanced features for professionals', 29.99, 299.99, 10000, 10000, '{"max_agents": 25, "max_conversations_per_month": 1000, "voice_synthesis": true, "analytics": true}'),
('Enterprise', 'Full-featured solution for teams', 99.99, 999.99, 50000, 50000, '{"max_agents": 100, "max_conversations_per_month": 5000, "voice_synthesis": true, "analytics": true, "custom_branding": true, "api_access": true}');

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Voice agents policies
CREATE POLICY "Users can view own agents" ON public.voice_agents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public agents" ON public.voice_agents
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create agents" ON public.voice_agents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agents" ON public.voice_agents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own agents" ON public.voice_agents
    FOR DELETE USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages from own conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in own conversations" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

-- Knowledge base policies
CREATE POLICY "Users can view KB entries for own agents" ON public.knowledge_base
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.voice_agents 
            WHERE voice_agents.id = knowledge_base.agent_id 
            AND voice_agents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create KB entries for own agents" ON public.knowledge_base
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.voice_agents 
            WHERE voice_agents.id = knowledge_base.agent_id 
            AND voice_agents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update KB entries for own agents" ON public.knowledge_base
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.voice_agents 
            WHERE voice_agents.id = knowledge_base.agent_id 
            AND voice_agents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete KB entries for own agents" ON public.knowledge_base
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.voice_agents 
            WHERE voice_agents.id = knowledge_base.agent_id 
            AND voice_agents.user_id = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_voice_agents_updated_at BEFORE UPDATE ON public.voice_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON public.user_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_file_storage_updated_at BEFORE UPDATE ON public.file_storage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON public.knowledge_base FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User dashboard view
CREATE VIEW public.user_dashboard AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.company,
    p.subscription_tier,
    p.credits_remaining,
    COUNT(DISTINCT va.id) as total_agents,
    COUNT(DISTINCT c.id) as total_conversations,
    COUNT(DISTINCT CASE WHEN c.created_at >= NOW() - INTERVAL '30 days' THEN c.id END) as conversations_this_month,
    COALESCE(SUM(c.message_count), 0) as total_messages
FROM public.profiles p
LEFT JOIN public.voice_agents va ON p.id = va.user_id
LEFT JOIN public.conversations c ON p.id = c.user_id
GROUP BY p.id, p.email, p.full_name, p.company, p.subscription_tier, p.credits_remaining;

-- Agent analytics view
CREATE VIEW public.agent_analytics AS
SELECT 
    va.id,
    va.name,
    va.user_id,
    va.usage_count,
    va.success_rate,
    va.avg_response_time,
    COUNT(DISTINCT c.id) as total_conversations,
    COUNT(DISTINCT m.id) as total_messages,
    AVG(c.user_satisfaction) as avg_satisfaction,
    MAX(c.started_at) as last_conversation_at
FROM public.voice_agents va
LEFT JOIN public.conversations c ON va.id = c.agent_id
LEFT JOIN public.messages m ON c.id = m.conversation_id
GROUP BY va.id, va.name, va.user_id, va.usage_count, va.success_rate, va.avg_response_time;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '📊 Tables created: profiles, voice_agents, conversations, messages, user_sessions, analytics, file_storage, notifications, knowledge_base, subscription_plans';
    RAISE NOTICE '🔒 RLS policies applied for security';
    RAISE NOTICE '⚡ Triggers and functions configured';
    RAISE NOTICE '📈 Analytics views created';
    RAISE NOTICE '🧠 Knowledge base with pgvector (RAG) enabled';
    RAISE NOTICE '🎯 Ready for production!';
END $$;

