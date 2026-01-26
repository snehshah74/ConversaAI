-- Deployment System Schema
-- This schema supports multi-channel agent deployment (Web, Phone, SMS, WhatsApp, API)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Deployments table
CREATE TABLE IF NOT EXISTS deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    deployment_type VARCHAR(20) NOT NULL CHECK (deployment_type IN ('web', 'phone', 'sms', 'whatsapp', 'api')),
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted')),
    
    -- Web widget configuration
    widget_settings JSONB DEFAULT '{}'::jsonb, -- {position, theme, greeting, avatar, colors}
    allowed_domains TEXT[] DEFAULT ARRAY[]::TEXT[], -- Whitelist domains for CORS
    
    -- Phone configuration
    phone_number VARCHAR(20),
    phone_settings JSONB DEFAULT '{}'::jsonb, -- {recording, voicemail, transfer_number, area_code}
    
    -- SMS/WhatsApp configuration
    messaging_settings JSONB DEFAULT '{}'::jsonb, -- {provider, webhook_url, templates}
    
    -- API configuration
    api_key VARCHAR(64) UNIQUE,
    api_secret VARCHAR(64),
    webhook_url VARCHAR(255),
    rate_limit_per_minute INTEGER DEFAULT 60,
    
    -- Usage tracking
    total_conversations INTEGER DEFAULT 0,
    monthly_conversations INTEGER DEFAULT 0,
    last_conversation_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_deployments_agent_id ON deployments(agent_id);
CREATE INDEX IF NOT EXISTS idx_deployments_api_key ON deployments(api_key);
CREATE INDEX IF NOT EXISTS idx_deployments_type ON deployments(deployment_type);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_deployments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_deployments_timestamp
    BEFORE UPDATE ON deployments
    FOR EACH ROW
    EXECUTE FUNCTION update_deployments_updated_at();

-- Function to reset monthly conversations (run via cron)
CREATE OR REPLACE FUNCTION reset_monthly_conversations()
RETURNS void AS $$
BEGIN
    UPDATE deployments
    SET monthly_conversations = 0
    WHERE EXTRACT(MONTH FROM updated_at) != EXTRACT(MONTH FROM NOW())
       OR EXTRACT(YEAR FROM updated_at) != EXTRACT(YEAR FROM NOW());
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see deployments for their own agents
CREATE POLICY "Users can view their own deployments"
    ON deployments FOR SELECT
    USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can create deployments for their own agents
CREATE POLICY "Users can create their own deployments"
    ON deployments FOR INSERT
    WITH CHECK (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can update their own deployments
CREATE POLICY "Users can update their own deployments"
    ON deployments FOR UPDATE
    USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can delete their own deployments
CREATE POLICY "Users can delete their own deployments"
    ON deployments FOR DELETE
    USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Comments for documentation
COMMENT ON TABLE deployments IS 'Stores deployment configurations for agents across multiple channels';
COMMENT ON COLUMN deployments.deployment_type IS 'Type of deployment: web, phone, sms, whatsapp, api';
COMMENT ON COLUMN deployments.widget_settings IS 'JSON configuration for web widget appearance and behavior';
COMMENT ON COLUMN deployments.allowed_domains IS 'Array of domains allowed to embed the widget (CORS whitelist)';
COMMENT ON COLUMN deployments.api_key IS 'Unique API key for API deployments';
COMMENT ON COLUMN deployments.rate_limit_per_minute IS 'Rate limit for API deployments';
