
/*
  # Fix ALL + SELECT permissive policy overlap

  ## Summary
  Four tables have a "Super admins manage X" ALL policy alongside a "Users can
  read X" SELECT policy. An ALL policy covers SELECT, so both policies evaluate
  for every SELECT query by an authenticated user — creating the exact multiple
  permissive SELECT problem we set out to fix.

  The fix is to remove the super_admin condition from each user SELECT policy so
  the two policies no longer overlap: super_admins gain SELECT through the ALL
  policy, regular users gain SELECT through their own policy.

  ## Affected Tables
  - purchases
  - stripe_entitlements
  - subscription_status
  - user_app_access
*/

-- ============================================================
-- purchases
-- ============================================================
DROP POLICY IF EXISTS "Users can read purchases" ON public.purchases;

CREATE POLICY "Users can read purchases"
  ON public.purchases FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- stripe_entitlements
-- ============================================================
DROP POLICY IF EXISTS "Users can read entitlements" ON public.stripe_entitlements;

CREATE POLICY "Users can read entitlements"
  ON public.stripe_entitlements FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- subscription_status
-- ============================================================
DROP POLICY IF EXISTS "Users can read subscription status" ON public.subscription_status;

CREATE POLICY "Users can read subscription status"
  ON public.subscription_status FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- user_app_access
-- ============================================================
DROP POLICY IF EXISTS "Users can read app access" ON public.user_app_access;

CREATE POLICY "Users can read app access"
  ON public.user_app_access FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
