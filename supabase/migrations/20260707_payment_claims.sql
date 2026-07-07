-- In-app "I've paid" submissions so users don't have to leave the app and
-- send an email after a bank transfer/UPI payment (see BankPaymentPanel).
-- Users submit a reference/UTR + optional screenshot; an admin reviews the
-- queue at /admin/payments and approves/rejects, which flips profiles.plan
-- the same way /admin/users does today.

CREATE TABLE IF NOT EXISTS public.payment_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL CHECK (plan_id IN ('free', 'premium')),
  months integer NOT NULL DEFAULT 1 CHECK (months > 0 AND months <= 36),
  reference text NOT NULL,
  screenshot_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS payment_claims_user_id_idx ON public.payment_claims(user_id);
CREATE INDEX IF NOT EXISTS payment_claims_status_idx ON public.payment_claims(status);

ALTER TABLE public.payment_claims ENABLE ROW LEVEL SECURITY;

-- Users can see and create their own claims. Only the service role (admin
-- dashboard) can update status — mirrors the profiles.plan lockdown in
-- 20260707_lock_plan_columns.sql, so a user can't self-approve.
CREATE POLICY "Users can view own payment claims"
  ON public.payment_claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment claims"
  ON public.payment_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Private bucket for payment screenshots. Each user can only write/read
-- inside a folder prefixed with their own uid; admins read via the service
-- role client, which bypasses storage RLS entirely.
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own payment proof"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own payment proof"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
