-- Create AI Agent Runs table for storing agent execution results
-- Migration: 20260427120000_create_ai_agent_runs_table.sql

CREATE TABLE IF NOT EXISTS public.ai_agent_runs (
    id TEXT PRIMARY KEY,
    agent_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    input_data JSONB NOT NULL,
    output_data JSONB,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    processing_time INTEGER, -- in milliseconds
    error_message TEXT,
    metadata JSONB -- for additional agent-specific data
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_agent_runs_user_id ON public.ai_agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_runs_agent_type ON public.ai_agent_runs(agent_type);
CREATE INDEX IF NOT EXISTS idx_ai_agent_runs_status ON public.ai_agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_ai_agent_runs_created_at ON public.ai_agent_runs(created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_agent_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own agent runs
CREATE POLICY "Users can view own agent runs" ON public.ai_agent_runs
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own agent runs
CREATE POLICY "Users can insert own agent runs" ON public.ai_agent_runs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own agent runs
CREATE POLICY "Users can update own agent runs" ON public.ai_agent_runs
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER handle_ai_agent_runs_updated_at
    BEFORE UPDATE ON public.ai_agent_runs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT ALL ON public.ai_agent_runs TO authenticated;
GRANT ALL ON public.ai_agent_runs TO service_role;</content>
<parameter name="filePath">supabase/migrations/20260427120000_create_ai_agent_runs_table.sql