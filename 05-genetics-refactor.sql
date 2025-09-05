-- Genetics Data Refactor - Relational Model
-- Run this to migrate from JSONB to relational structure
-- =====================================================

-- Drop existing genetic_data table (BACKUP DATA FIRST!)
-- DROP TABLE IF EXISTS public.genetic_data CASCADE;

-- Create new genetics_variants table with relational structure
CREATE TABLE public.genetics_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rsid TEXT NOT NULL,
  genotype TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('23andme', 'ancestry', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_genetics_variants_user_id ON public.genetics_variants(user_id);
CREATE INDEX idx_genetics_variants_rsid ON public.genetics_variants(rsid);
CREATE INDEX idx_genetics_variants_user_rsid ON public.genetics_variants(user_id, rsid);

-- Create unique constraint to prevent duplicate variants for same user
CREATE UNIQUE INDEX idx_genetics_variants_user_rsid_unique ON public.genetics_variants(user_id, rsid);

-- Enable Row Level Security
ALTER TABLE public.genetics_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own genetic variants" ON public.genetics_variants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own genetic variants" ON public.genetics_variants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own genetic variants" ON public.genetics_variants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own genetic variants" ON public.genetics_variants
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at_genetics_variants
  BEFORE UPDATE ON public.genetics_variants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

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

-- Function to get genetic data for specific RSIDs (replaces old RPC)
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
