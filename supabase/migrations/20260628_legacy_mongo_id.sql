-- Migration: add legacy_mongo_id to questions
-- Date: 2026-06-28
--
-- Why: the legacy PTE prep system used MongoDB with 24-hex ObjectIDs as
-- question identifiers. The two source files (PracticeTest.txt and
-- MockTest.txt) reference 1,532 questions by those ObjectIDs. Without
-- a column linking Mongo IDs to Supabase UUIDs we can't make the runner
-- return the *same* question for the same test slot across sessions.
--
-- This migration adds:
--   1. `legacy_mongo_id text` column (nullable; existing rows unaffected)
--   2. A unique partial index — only enforces uniqueness when set, so
--      legacy and new questions can coexist.
--   3. A lookup index (GIN trigram) for fast IN (…) queries by ID.
--
-- Apply this with `supabase db push` or by pasting into the SQL editor.

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS legacy_mongo_id TEXT;

-- Unique when present; multiple NULLs allowed.
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_legacy_mongo_id_unique
  ON public.questions (legacy_mongo_id)
  WHERE legacy_mongo_id IS NOT NULL;

-- Trigram index for fast "any of these IDs" lookups. Requires the
-- pg_trgm extension which Supabase enables by default on hosted.
CREATE INDEX IF NOT EXISTS idx_questions_legacy_mongo_id_trgm
  ON public.questions USING gin (legacy_mongo_id gin_trgm_ops);

-- Service-role writes are needed by the admin linking page and the
-- bulk-import script. Existing RLS policies still apply for anon/
-- authenticated (read-only on active questions).
-- No policy change required.

COMMENT ON COLUMN public.questions.legacy_mongo_id IS
  'Original MongoDB ObjectID from the legacy PTE prep system. Preserved verbatim from PracticeTest.txt / MockTest.txt so test-runner queries can resolve the exact question for each test slot.';
