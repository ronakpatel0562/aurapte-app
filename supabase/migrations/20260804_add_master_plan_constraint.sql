-- Migration to support 'master' (Aura Mentorship 85+) plan in payment_claims and profiles tables

ALTER TABLE public.payment_claims DROP CONSTRAINT IF EXISTS payment_claims_plan_id_check;
ALTER TABLE public.payment_claims ADD CONSTRAINT payment_claims_plan_id_check CHECK (plan_id IN ('free', 'premium', 'master'));

-- Ensure profiles table accepts 'master' if a plan check constraint exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_plan_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_plan_check;
  END IF;
END $$;
