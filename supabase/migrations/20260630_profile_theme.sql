-- Add per-user theme preference to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT NULL
  CHECK (theme IN ('light', 'dark'));
