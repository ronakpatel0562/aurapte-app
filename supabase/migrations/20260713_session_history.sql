-- Append-only device/login log. `user_sessions` only ever holds one row per
-- user (it's a single-active-session kick-out mechanism, overwritten on
-- every login — see 20260628.../schema.sql), so it has no history and no
-- device metadata. This table records every login as its own row so
-- /admin/sessions can show every device an account has ever been used from
-- and flag accounts that look like they're sharing credentials across
-- multiple concurrent devices.
CREATE TABLE IF NOT EXISTS public.session_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS session_history_user_id_idx ON public.session_history(user_id);
CREATE INDEX IF NOT EXISTS session_history_session_id_idx ON public.session_history(session_id);
CREATE INDEX IF NOT EXISTS session_history_last_seen_idx ON public.session_history(last_seen_at);

ALTER TABLE public.session_history ENABLE ROW LEVEL SECURITY;

-- Written by the logged-in user's own request at login time and on
-- heartbeat (same pattern as user_sessions); read by the admin dashboard
-- via the service-role client, which bypasses RLS entirely.
CREATE POLICY "Users can insert their own session history"
  ON public.session_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own session history"
  ON public.session_history FOR UPDATE
  USING (auth.uid() = user_id);
