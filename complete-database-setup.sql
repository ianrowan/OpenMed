-- OpenMed Database Setup
-- Generated automatically - run this in Supabase SQL Editor
-- ============================================================

-- STEP 1: DATABASE EXTENSIONS
-- Source: 01-extensions.sql
-- ----------------------------------------

-- Enable required extensions for OpenMed
-- Run this first in Supabase SQL Editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector operations (for future ML/AI features)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable full text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable JSON operations
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- ============================================================

-- STEP 2: TABLES AND INDEXES
-- Source: 02-tables.sql
-- ----------------------------------------

-- OpenMed Database Schema
-- Run this after extensions are enabled

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical profiles table (used by auth system)
CREATE TABLE public.medical_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  age INTEGER,
  gender TEXT,
  weight DECIMAL,
  height DECIMAL,
  conditions TEXT[],
  medications TEXT[],
  allergies TEXT[],
  family_history TEXT[],
  lifestyle JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blood test results table
CREATE TABLE public.blood_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_date DATE NOT NULL,
  lab_name TEXT,
  biomarkers JSONB NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Genetic variants table (relational model for performance)
CREATE TABLE public.genetics_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rsid TEXT NOT NULL,
  genotype TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('23andme', 'ancestry', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table for conversation history
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tool_calls JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table to track conversation metadata
CREATE TABLE public.conversations (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical literature cache (for search optimization)
CREATE TABLE public.medical_literature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT UNIQUE NOT NULL,
  query TEXT NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- User preferences and settings
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  biomarker_preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily usage limits for AI model tiers
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
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_medical_profiles_user_id ON public.medical_profiles(user_id);

CREATE INDEX idx_blood_test_results_user_id ON public.blood_test_results(user_id);
CREATE INDEX idx_blood_test_results_test_date ON public.blood_test_results(test_date DESC);
CREATE INDEX idx_blood_test_results_biomarkers ON public.blood_test_results USING GIN (biomarkers);

CREATE INDEX idx_genetics_variants_user_id ON public.genetics_variants(user_id);
CREATE INDEX idx_genetics_variants_rsid ON public.genetics_variants(rsid);
CREATE INDEX idx_genetics_variants_user_rsid ON public.genetics_variants(user_id, rsid);
CREATE INDEX idx_genetics_variants_source ON public.genetics_variants(source);
CREATE INDEX idx_genetics_variants_created_at ON public.genetics_variants(created_at DESC);

-- Unique constraint to prevent duplicate variants for same user
CREATE UNIQUE INDEX idx_genetics_variants_user_rsid_unique ON public.genetics_variants(user_id, rsid);

CREATE INDEX idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_user_conversation ON public.chat_messages(user_id, conversation_id);

CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at DESC);

CREATE INDEX idx_medical_literature_query_hash ON public.medical_literature(query_hash);
CREATE INDEX idx_medical_literature_expires_at ON public.medical_literature(expires_at);

CREATE INDEX idx_daily_usage_limits_user_id ON public.daily_usage_limits(user_id);
CREATE INDEX idx_daily_usage_limits_date ON public.daily_usage_limits(date DESC);
CREATE INDEX idx_daily_usage_limits_tier ON public.daily_usage_limits(model_tier);
CREATE INDEX idx_daily_usage_limits_user_date ON public.daily_usage_limits(user_id, date);

-- Updated at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_medical_profiles
  BEFORE UPDATE ON public.medical_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_blood_test_results
  BEFORE UPDATE ON public.blood_test_results
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_genetics_variants
  BEFORE UPDATE ON public.genetics_variants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_conversations
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_user_preferences
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_daily_usage_limits
  BEFORE UPDATE ON public.daily_usage_limits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================

-- STEP 3: ROW LEVEL SECURITY POLICIES
-- Source: 03-policies.sql
-- ----------------------------------------

-- Row Level Security (RLS) Policies for OpenMed
-- Run this after creating tables

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genetics_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_literature ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_usage_limits ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Medical profiles policies
CREATE POLICY "Users can view own medical profile" ON public.medical_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medical profile" ON public.medical_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medical profile" ON public.medical_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medical profile" ON public.medical_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Blood test results policies
CREATE POLICY "Users can view own blood test results" ON public.blood_test_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blood test results" ON public.blood_test_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blood test results" ON public.blood_test_results
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own blood test results" ON public.blood_test_results
  FOR DELETE USING (auth.uid() = user_id);

-- Genetic variants policies
CREATE POLICY "Users can view own genetic variants" ON public.genetics_variants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own genetic variants" ON public.genetics_variants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own genetic variants" ON public.genetics_variants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own genetic variants" ON public.genetics_variants
  FOR DELETE USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages" ON public.chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Medical literature policies (shared cache, but read-only for users)
CREATE POLICY "Authenticated users can view medical literature" ON public.medical_literature
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can manage medical literature" ON public.medical_literature
  FOR ALL TO service_role USING (true);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON public.user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Daily usage limits policies (SECURE VERSION)
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

-- ============================================================

-- STEP 4: DATABASE FUNCTIONS
-- Source: 04-functions.sql
-- ----------------------------------------

-- Database functions for OpenMed
-- Run this after tables and policies are set up

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  
  -- Create default user preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get user's latest blood work
CREATE OR REPLACE FUNCTION public.get_latest_blood_work(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  test_date DATE,
  lab_name TEXT,
  biomarkers JSONB,
  uploaded_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    btr.id,
    btr.test_date,
    btr.lab_name,
    btr.biomarkers,
    btr.uploaded_at
  FROM public.blood_test_results btr
  WHERE btr.user_id = user_uuid
  ORDER BY btr.test_date DESC, btr.uploaded_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get biomarker trends
CREATE OR REPLACE FUNCTION public.get_biomarker_trends(
  user_uuid UUID,
  biomarker_name TEXT,
  days_back INTEGER DEFAULT 365
)
RETURNS TABLE (
  test_date DATE,
  value NUMERIC,
  unit TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    btr.test_date,
    (biomarker->>'value')::NUMERIC as value,
    biomarker->>'unit' as unit,
    biomarker->>'status' as status
  FROM public.blood_test_results btr,
       jsonb_array_elements(btr.biomarkers) as biomarker
  WHERE btr.user_id = user_uuid
    AND biomarker->>'name' ILIKE biomarker_name
    AND btr.test_date >= (CURRENT_DATE - INTERVAL '1 day' * days_back)
  ORDER BY btr.test_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search genetic variants
CREATE OR REPLACE FUNCTION public.search_genetic_variants(
  user_uuid UUID,
  search_terms TEXT[] DEFAULT NULL,
  gene_names TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  rsid TEXT,
  chromosome TEXT,
  "position" BIGINT,
  genotype TEXT,
  gene TEXT,
  annotation JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (snp->>'rsid')::TEXT as rsid,
    (snp->>'chromosome')::TEXT as chromosome,
    (snp->>'position')::BIGINT as "position",
    (snp->>'genotype')::TEXT as genotype,
    (snp->>'gene')::TEXT as gene,
    (snp->'annotation')::JSONB as annotation
  FROM public.genetic_data gd,
       jsonb_array_elements(gd.snps) as snp
  WHERE gd.user_id = user_uuid
    AND (
      search_terms IS NULL OR
      EXISTS (
        SELECT 1 FROM unnest(search_terms) as term
        WHERE snp->>'rsid' ILIKE '%' || term || '%'
           OR snp->>'gene' ILIKE '%' || term || '%'
           OR snp->'annotation'->>'phenotype' ILIKE '%' || term || '%'
      )
    )
    AND (
      gene_names IS NULL OR
      snp->>'gene' = ANY(gene_names)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired medical literature cache
CREATE OR REPLACE FUNCTION public.cleanup_expired_literature()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.medical_literature
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get biomarker statistics
CREATE OR REPLACE FUNCTION public.get_biomarker_stats(
  user_uuid UUID,
  biomarker_name TEXT
)
RETURNS TABLE (
  latest_value NUMERIC,
  latest_date DATE,
  avg_value NUMERIC,
  min_value NUMERIC,
  max_value NUMERIC,
  trend_direction TEXT
) AS $$
DECLARE
  latest_val NUMERIC;
  latest_dt DATE;
  avg_val NUMERIC;
  min_val NUMERIC;
  max_val NUMERIC;
  recent_avg NUMERIC;
  older_avg NUMERIC;
  trend TEXT;
BEGIN
  -- Get latest value
  SELECT 
    (biomarker->>'value')::NUMERIC,
    btr.test_date
  INTO latest_val, latest_dt
  FROM public.blood_test_results btr,
       jsonb_array_elements(btr.biomarkers) as biomarker
  WHERE btr.user_id = user_uuid
    AND biomarker->>'name' ILIKE biomarker_name
  ORDER BY btr.test_date DESC, btr.uploaded_at DESC
  LIMIT 1;

  -- Get overall statistics
  SELECT 
    AVG((biomarker->>'value')::NUMERIC),
    MAX((biomarker->>'value')::NUMERIC)
  INTO avg_val, min_val, max_val
  FROM public.blood_test_results btr,
       jsonb_array_elements(btr.biomarkers) as biomarker
  WHERE btr.user_id = user_uuid
    AND biomarker->>'name' ILIKE biomarker_name;

  -- Calculate trend (recent 90 days vs previous 90 days)
  SELECT AVG((biomarker->>'value')::NUMERIC)
  INTO recent_avg
  FROM public.blood_test_results btr,
       jsonb_array_elements(btr.biomarkers) as biomarker
  WHERE btr.user_id = user_uuid
  RETURN QUERY SELECT latest_val, latest_dt, avg_val, min_val, max_val, trend;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk insert genetic variants (optimized for large datasets)
CREATE OR REPLACE FUNCTION public.bulk_insert_genetic_variants(
  p_user_id UUID,
  p_source TEXT,
  p_variants JSONB
)
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER;
  rsid_array TEXT[];
  genotype_array TEXT[];
BEGIN
  -- Delete existing variants for this user to replace with new data
  DELETE FROM public.genetics_variants WHERE user_id = p_user_id;
  
  -- Extract arrays from JSONB for more efficient bulk insert
  SELECT 
    array_agg(variant->>'rsid'),
    array_agg(variant->>'genotype')
  INTO rsid_array, genotype_array
  FROM jsonb_array_elements(p_variants) AS variant;
  
  -- Bulk insert using UNNEST (much faster than jsonb_array_elements for large datasets)
  INSERT INTO public.genetics_variants (user_id, rsid, genotype, source)
  SELECT 
    p_user_id,
    unnest(rsid_array),
    unnest(genotype_array),
    p_source;
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk insert genetic variants in batches (for large uploads)
CREATE OR REPLACE FUNCTION public.bulk_insert_genetic_variants_batch(
  p_user_id UUID,
  p_source TEXT,
  p_variants JSONB,
  p_delete_existing BOOLEAN DEFAULT FALSE
)
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER;
  rsid_array TEXT[];
  genotype_array TEXT[];
BEGIN
  -- Only delete existing variants on first batch
  IF p_delete_existing THEN
    DELETE FROM public.genetics_variants WHERE user_id = p_user_id;
  END IF;
  
  -- Extract arrays from JSONB for more efficient bulk insert
  SELECT 
    array_agg(variant->>'rsid'),
    array_agg(variant->>'genotype')
  INTO rsid_array, genotype_array
  FROM jsonb_array_elements(p_variants) AS variant;
  
  -- Bulk insert using UNNEST with ON CONFLICT to handle duplicates
  INSERT INTO public.genetics_variants (user_id, rsid, genotype, source)
  SELECT 
    p_user_id,
    unnest(rsid_array),
    unnest(genotype_array),
    p_source
  ON CONFLICT (user_id, rsid) DO UPDATE SET
    genotype = EXCLUDED.genotype,
    source = EXCLUDED.source,
    updated_at = NOW();
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get genetic data for specific RSIDs
CREATE OR REPLACE FUNCTION public.get_genetic_variants_by_rsids(
  p_user_id UUID,
  p_rsid_list TEXT[]
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  rsid TEXT,
  genotype TEXT,
  source TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gv.id,
    gv.user_id,
    gv.rsid,
    gv.genotype,
    gv.source,
    gv.created_at
  FROM public.genetics_variants gv
  WHERE gv.user_id = p_user_id
    AND gv.rsid = ANY(p_rsid_list)
  ORDER BY gv.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's genetic data summary
CREATE OR REPLACE FUNCTION public.get_genetic_summary(p_user_id UUID)
RETURNS TABLE (
  total_variants BIGINT,
  sources TEXT[],
  latest_upload TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_variants,
    ARRAY_AGG(DISTINCT gv.source) as sources,
    MAX(gv.created_at) as latest_upload
  FROM public.genetics_variants gv
  WHERE gv.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------
--  Function : get_latest_genetic_data
--  Purpose  : Return the newest row for a given user, but keep only the
--             variants whose rsid appears in the supplied array.
-- ---------------------------------------------------------------
create or replace function public.get_latest_genetic_data(
    p_user_id   uuid,        -- the user we are interested in
    p_rsid_list text[]       -- array of rs‑ids to keep
)
returns table (
    id          uuid,
    user_id     uuid,
    source      text,
    uploaded_at timestamptz,
    snps_filt        jsonb         -- JSONB object { "variants": [ … ] }
)
language sql
security definer                     -- runs with the owner's privileges
as $$
    select
        gd.id,
        gd.user_id,
        gd.source,
        gd.uploaded_at,
        jsonb_build_object(
            'variants',
            (
                select jsonb_agg(v)
                from jsonb_array_elements(gd.snps -> 'variants') as v
                where v ->> 'rsid' = any(p_rsid_list)        -- ← filter
            )
        ) as snps_filt
    from genetic_data gd
    where gd.user_id = p_user_id
    order by gd.uploaded_at desc
    limit 1;                               -- only the latest row
$$;

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

-- ============================================================
