-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free','premium')),
  plan_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, avatar_url, plan)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    'free'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL CHECK (module IN ('speaking','writing','reading','listening')),
  task_type TEXT NOT NULL,
  title TEXT,
  content JSONB NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy','medium','hard')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on Questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active questions" 
  ON public.questions FOR SELECT 
  USING (is_active = true);


-- 3. User Attempts Table
CREATE TABLE IF NOT EXISTS public.user_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  user_answer JSONB,
  score NUMERIC,
  max_score NUMERIC,
  is_correct BOOLEAN,
  time_taken_seconds INTEGER,
  attempted_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on User Attempts
ALTER TABLE public.user_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attempts" 
  ON public.user_attempts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts" 
  ON public.user_attempts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);


-- 4. User Sessions Table (Single Session Security)
CREATE TABLE IF NOT EXISTS public.user_sessions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_heartbeat TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on User Sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" 
  ON public.user_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" 
  ON public.user_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
  ON public.user_sessions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" 
  ON public.user_sessions FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================================================
-- Performance: count_questions_by_module RPC
-- ----------------------------------------------------------------------------
-- The dashboard previously did `SELECT id, module FROM questions` and
-- counted rows in JS. That streamed every row on every navigation. This
-- single query returns one COUNT(*) per module in a fraction of the time.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.count_questions_by_module()
RETURNS TABLE(module text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT module::text, COUNT(*)::bigint AS count
  FROM public.questions
  WHERE is_active = true
  GROUP BY module;
$$;

GRANT EXECUTE ON FUNCTION public.count_questions_by_module() TO anon, authenticated;

-- Index that lets the COUNT(*) group-by scan just the active rows quickly.
CREATE INDEX IF NOT EXISTS idx_questions_active_module
  ON public.questions (module)
  WHERE is_active = true;
