-- Row Level Security (RLS) Policies for OpenMed
-- Run this after creating tables

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genetic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_literature ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

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

-- Genetic data policies
CREATE POLICY "Users can view own genetic data" ON public.genetic_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own genetic data" ON public.genetic_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own genetic data" ON public.genetic_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own genetic data" ON public.genetic_data
  FOR DELETE USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages" ON public.chat_messages
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
