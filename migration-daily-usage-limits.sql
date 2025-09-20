-- Migration: Add Daily Usage Limits for AI Models
-- Run this in your Supabase SQL Editor to add usage limiting functionality
-- =====================================================================

-- Add daily usage limits table
CREATE TABLE public.daily_usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  model_tier TEXT NOT NULL CHECK (model_tier IN ('premium', 'basic')),
  model_name TEXT NOT NULL,
  date DATE NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint to ensure one record per user per tier per day
CREATE UNIQUE INDEX idx_daily_usage_user_tier_date ON public.daily_usage_limits(user_id, model_tier, date);

-- Indexes for performance
CREATE INDEX idx_daily_usage_limits_user_id ON public.daily_usage_limits(user_id);
CREATE INDEX idx_daily_usage_limits_date ON public.daily_usage_limits(date DESC);
CREATE INDEX idx_daily_usage_limits_tier ON public.daily_usage_limits(model_tier);
CREATE INDEX idx_daily_usage_limits_user_date ON public.daily_usage_limits(user_id, date);

-- Enable Row Level Security
ALTER TABLE public.daily_usage_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies (SECURE VERSION)
-- Users can only read their usage data, not modify it directly
CREATE POLICY "Users can view own usage limits" ON public.daily_usage_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Block direct user INSERT/UPDATE to prevent usage manipulation  
CREATE POLICY "Block direct user insertions" ON public.daily_usage_limits
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "Block direct user updates" ON public.daily_usage_limits
  FOR UPDATE TO authenticated USING (false);

-- Allow service role (API routes) full access for usage tracking
CREATE POLICY "Service role can manage usage limits" ON public.daily_usage_limits
  FOR ALL TO service_role USING (true);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at_daily_usage_limits
  BEFORE UPDATE ON public.daily_usage_limits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to increment daily usage for a user and model tier
CREATE OR REPLACE FUNCTION public.increment_usage(
    p_user_id UUID,
    p_model_tier TEXT,
    p_model_name TEXT,
    p_date DATE
)
RETURNS VOID AS $$
BEGIN
    -- Validate input parameters
    IF p_user_id IS NULL OR p_model_tier IS NULL OR p_model_name IS NULL OR p_date IS NULL THEN
        RAISE EXCEPTION 'All parameters are required for increment_usage';
    END IF;
    
    -- Validate model_tier
    IF p_model_tier NOT IN ('premium', 'basic') THEN
        RAISE EXCEPTION 'Invalid model_tier. Must be premium or basic';
    END IF;
    
    INSERT INTO public.daily_usage_limits (user_id, model_tier, model_name, date, message_count, created_at, updated_at)
    VALUES (p_user_id, p_model_tier, p_model_name, p_date, 1, NOW(), NOW())
    ON CONFLICT (user_id, model_tier, date)
    DO UPDATE SET 
        message_count = daily_usage_limits.message_count + 1,
        updated_at = NOW(),
        model_name = p_model_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure permissions for increment_usage function
-- Revoke public access and grant only to service_role
REVOKE EXECUTE ON FUNCTION public.increment_usage FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_usage TO service_role;
