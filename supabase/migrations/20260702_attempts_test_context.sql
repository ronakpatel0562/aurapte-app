-- Track which practice/mock test (and module) an attempt was made under,
-- so listing pages can show real "Attempted" status per test instead of a
-- static label. Nullable because the single free-practice question flow
-- (QuestionAttemptClient) isn't tied to a numbered test.
ALTER TABLE public.user_attempts
  ADD COLUMN IF NOT EXISTS test_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS module TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS user_attempts_user_test_idx
  ON public.user_attempts (user_id, test_id);
