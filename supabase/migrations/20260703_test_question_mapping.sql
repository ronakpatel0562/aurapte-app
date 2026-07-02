-- Migration: test_questions mapping table + question pool scoping
-- Date: 2026-07-03
--
-- Why: practice-test and mock-test runner pages resolved their question
-- set live on every page load — one query per original_id-keyed
-- category, then a same-module/task_type backfill query for any
-- shortfall (~15-20 queries per test load), and depended on the
-- `original_id` legacy-Mongo-ID column at request time. There was also
-- no way to add a question that should only ever appear inside a mock
-- test — any active row was fair game for practice-test backfill and
-- the question browse pages too.
--
-- This migration:
--   1. Adds `pool` to `questions` so a question can be marked
--      'mock_only' — excluded from practice-test backfill and the
--      browse-by-task-type/module pages, only ever surfaced via an
--      explicit test_questions mapping or mock-test backfill.
--   2. Adds `test_questions`, a precomputed slot -> question mapping.
--      Populated by scripts/build_test_question_mapping.py, which runs
--      the exact-match + backfill algorithm the runner used to run live
--      once and persists the result. The runner then does a single
--      indexed SELECT per test load instead of resolving live, and
--      never touches `original_id`.

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS pool TEXT NOT NULL DEFAULT 'shared'
    CHECK (pool IN ('shared', 'mock_only'));

COMMENT ON COLUMN public.questions.pool IS
  'Visibility pool. ''shared'' questions are eligible for practice-test backfill and the question browse pages. ''mock_only'' questions are excluded from both and only ever surface via an explicit test_questions mapping or mock-test backfill.';

CREATE INDEX IF NOT EXISTS idx_questions_pool_lookup
  ON public.questions (module, task_type, pool)
  WHERE is_active = true;

-- test_questions: one row per (test, module, position) slot.
CREATE TABLE IF NOT EXISTS public.test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('practice', 'mock')),
  module TEXT NOT NULL CHECK (module IN ('speaking', 'writing', 'reading', 'listening')),
  position INT NOT NULL,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (test_id, module, position),
  UNIQUE (test_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_test_questions_test_id
  ON public.test_questions (test_id);

ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;

-- Read-only for everyone; only the service role (used by the mapping
-- script) can write, same pattern as `questions`.
CREATE POLICY "Anyone can view test question mappings"
  ON public.test_questions FOR SELECT
  USING (true);

-- count_questions_by_module must not count mock_only rows — they should
-- stay invisible everywhere except inside a mock test.
CREATE OR REPLACE FUNCTION public.count_questions_by_module()
RETURNS TABLE(module text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT module::text, COUNT(*)::bigint AS count
  FROM public.questions
  WHERE is_active = true AND pool = 'shared'
  GROUP BY module;
$$;
