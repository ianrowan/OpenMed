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
    MIN((biomarker->>'value')::NUMERIC),
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
    AND biomarker->>'name' ILIKE biomarker_name
    AND btr.test_date >= (CURRENT_DATE - INTERVAL '90 days');

  SELECT AVG((biomarker->>'value')::NUMERIC)
  INTO older_avg
  FROM public.blood_test_results btr,
       jsonb_array_elements(btr.biomarkers) as biomarker
  WHERE btr.user_id = user_uuid
    AND biomarker->>'name' ILIKE biomarker_name
    AND btr.test_date BETWEEN (CURRENT_DATE - INTERVAL '180 days') 
                          AND (CURRENT_DATE - INTERVAL '90 days');

  -- Determine trend
  IF recent_avg IS NULL OR older_avg IS NULL THEN
    trend := 'insufficient_data';
  ELSIF recent_avg > older_avg * 1.05 THEN
    trend := 'increasing';
  ELSIF recent_avg < older_avg * 0.95 THEN
    trend := 'decreasing';
  ELSE
    trend := 'stable';
  END IF;

  RETURN QUERY SELECT latest_val, latest_dt, avg_val, min_val, max_val, trend;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
