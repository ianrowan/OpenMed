-- IMPROVED SECURITY: More restrictive RLS policies for usage limits
-- This version prevents users from manipulating their usage counts

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own usage limits" ON public.daily_usage_limits;
DROP POLICY IF EXISTS "Users can insert own usage limits" ON public.daily_usage_limits;  
DROP POLICY IF EXISTS "Users can update own usage limits" ON public.daily_usage_limits;

-- More secure policies
-- Users can only READ their usage data, not modify it
CREATE POLICY "Users can view own usage limits" ON public.daily_usage_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Only allow INSERT/UPDATE through the increment_usage function
-- This prevents direct manipulation of usage counts
CREATE POLICY "Block direct user modifications" ON public.daily_usage_limits
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "Block direct user updates" ON public.daily_usage_limits  
  FOR UPDATE TO authenticated USING (false);

-- Allow service role (API routes) full access
CREATE POLICY "Service role can manage usage limits" ON public.daily_usage_limits
  FOR ALL TO service_role USING (true);

-- Enhanced increment function with additional security
CREATE OR REPLACE FUNCTION public.increment_usage(
    p_user_id UUID,
    p_model_tier TEXT,
    p_model_name TEXT,
    p_date DATE
)
RETURNS VOID AS $$
BEGIN
    -- Additional validation could go here
    -- e.g., check if user exists, validate model_tier, etc.
    
    INSERT INTO public.daily_usage_limits (user_id, model_tier, model_name, date, message_count, created_at, updated_at)
    VALUES (p_user_id, p_model_tier, p_model_name, p_date, 1, NOW(), NOW())
    ON CONFLICT (user_id, model_tier, date)
    DO UPDATE SET 
        message_count = daily_usage_limits.message_count + 1,
        updated_at = NOW(),
        model_name = p_model_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission only to service role
REVOKE EXECUTE ON FUNCTION public.increment_usage FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_usage TO service_role;
