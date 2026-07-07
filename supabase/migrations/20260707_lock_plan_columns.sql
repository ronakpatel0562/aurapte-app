-- The "Users can update their own profile" RLS policy (schema.sql) only
-- restricts which ROW a user can touch (auth.uid() = id) — it does not
-- restrict which COLUMNS they can write. Supabase grants UPDATE on every
-- column of public.profiles to the `authenticated` role by default, so any
-- signed-in user could open devtools and run:
--
--   supabase.from('profiles').update({ plan: 'premium', plan_expiry: '2099-01-01' }).eq('id', user.id)
--
-- and grant themselves full paid access with zero payment. There is no free
-- tier (see src/lib/plans.ts) — plan/plan_expiry must only ever be set by an
-- admin after a payment is confirmed. Lock this down two ways:
--
--   1. Column-level GRANT: authenticated users can only update the columns
--      they legitimately self-serve (name/phone/avatar/theme).
--   2. Trigger (defense-in-depth): even if grants are ever loosened again,
--      any attempt to change plan/plan_expiry outside the service role
--      (which the admin dashboard and any future payment webhook use) is
--      rejected outright.

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, avatar_url, theme) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.protect_plan_columns()
RETURNS trigger AS $$
BEGIN
  IF (NEW.plan IS DISTINCT FROM OLD.plan OR NEW.plan_expiry IS DISTINCT FROM OLD.plan_expiry)
     AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'plan and plan_expiry can only be changed by an administrator';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS protect_plan_columns_trigger ON public.profiles;
CREATE TRIGGER protect_plan_columns_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_plan_columns();
