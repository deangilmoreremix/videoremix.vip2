-- Clerk identity table (server-side identity mapping)
--
-- PROBLEM
--   The platform's customer IdP is Clerk. Purchases must resolve to a
--   *verified* Clerk identity before any entitlement is granted. The existing
--   public.app_users table is populated by the Clerk webhook (svix-verified,
--   service_role) AND by a client-side upsert in src/context/AuthContext.tsx
--   whose RLS policy allows an authenticated user to UPDATE their own row -
--   including its email. Trusting app_users.email for money decisions would
--   let a signed-in user retarget purchases by editing their own email.
--
-- SOLUTION
--   public.clerk_identities: a dedicated identity table whose rows are ONLY
--   written by server-side code paths with verified provenance:
--     * verification_source = 'clerk_webhook'
--         clerk-webhook/index.ts on a svix-verified user.created/user.updated
--         event (service_role, RLS bypass). identity_verified = TRUE.
--     * verification_source = 'clerk_api_reconciliation'
--         scripts/migration-verify-identities.mjs after confirming the email
--         against the Clerk Backend API. identity_verified = TRUE.
--     * verification_source = 'app_users_backfill'
--         seeded from app_users by this migration, explicitly NOT verified
--         (identity_verified = FALSE). These rows are placeholders for
--         reporting/reconciliation only and grant NOTHING until the
--         reconciliation script verifies them against Clerk.
--     * verification_source = 'manual_admin_review'
--         operator-verified rows (emergency path; requires a second human).
--
--   There is NO insert/update/delete RLS policy for authenticated: only
--   service_role (edge functions / scripts) can write.
--
-- SAFETY FOR LEGACY DATA
--   * Nothing is deleted. Rows that cannot be verified simply never flip to
--     identity_verified = TRUE, and users keep every existing entitlement
--     (this migration does not touch user_app_access / purchases at all).
--   * Legacy Supabase-auth UUIDs are never mapped onto Clerk subs by guessing.
--     A mapping is discovered only via email matches confirmed against the
--     Clerk Backend API (scripts/migration-verify-identities.mjs) or a
--     recorded manual review. Never fabricate associations.
--
-- DEPLOY ORDER
--   After 20260709020000/030000/050000 (Clerk alignment) and
--   20261011120000_clerk_credit_system_alignment.sql. Independent of the
--   public purchases/user_app_access re-key only in the sense that it does not
--   modify those tables - but the edge functions that write them with Clerk
--   subs require phase 2 to be applied first.
--
-- IDEMPOTENCY
--   IF NOT EXISTS / guarded DO blocks everywhere; safe to re-run.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. The identity table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clerk_identities (
  clerk_user_id       text PRIMARY KEY,
  app_user_id         text NULL,               -- link to app_users.id (soft link; FK added below when possible)
  email               text NOT NULL,           -- always stored lower-cased
  email_verified      boolean NOT NULL DEFAULT false,
  identity_verified   boolean NOT NULL DEFAULT false,  -- TRUE only via verified provenance (see header)
  verification_source text NOT NULL DEFAULT 'app_users_backfill'
    CHECK (verification_source IN (
      'clerk_webhook',
      'clerk_api_reconciliation',
      'app_users_backfill',
      'manual_admin_review'
    )),
  verified_at         timestamptz NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clerk_identities_clerk_user_id_nonempty CHECK (length(clerk_user_id) > 0),
  CONSTRAINT clerk_identities_email_shape CHECK (email = lower(email))
);

-- Case-insensitive email resolution without relying on citext:
CREATE INDEX IF NOT EXISTS idx_clerk_identities_email_lower
  ON public.clerk_identities (lower(email));

CREATE INDEX IF NOT EXISTS idx_clerk_identities_app_user_id
  ON public.clerk_identities (app_user_id)
  WHERE app_user_id IS NOT NULL;

-- Optional hard link to app_users.id. Added only when app_users exists and
-- actually has a unique constraint on id (the app_users table is created and
-- evolved outside this repo's migrations, so its constraints are not certain
-- from code alone). ON DELETE SET NULL: losing the app_users row must never
-- lose the verified identity.
DO $$
BEGIN
  IF to_regclass('public.app_users') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_index i
       WHERE i.indrelid = 'public.app_users'::regclass
         AND i.indisunique
         AND i.indisvalid
         AND (
           SELECT string_agg(a.attname, ',' ORDER BY a.attname)
           FROM unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
           JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
         ) = 'id'
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conrelid = 'public.clerk_identities'::regclass
         AND conname = 'clerk_identities_app_user_id_fkey'
     )
  THEN
    ALTER TABLE public.clerk_identities
      ADD CONSTRAINT clerk_identities_app_user_id_fkey
      FOREIGN KEY (app_user_id) REFERENCES public.app_users (id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. RLS: users may read their own identity row; writes are service_role-only
-- ---------------------------------------------------------------------------
ALTER TABLE public.clerk_identities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own clerk identity" ON public.clerk_identities;
CREATE POLICY "Users can read own clerk identity"
  ON public.clerk_identities
  FOR SELECT
  TO authenticated
  USING (clerk_user_id = (SELECT auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "Service role can manage clerk identities" ON public.clerk_identities;
CREATE POLICY "Service role can manage clerk identities"
  ON public.clerk_identities
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON public.clerk_identities TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Backfill: seed UNVERIFIED placeholders from app_users (safe by design)
-- ---------------------------------------------------------------------------
-- Rows land with identity_verified = FALSE. They exist so reconciliation and
-- reporting can see the population; they grant nothing. Verification against
-- the Clerk Backend API is a separate, audited step:
--   scripts/migration-verify-identities.mjs
-- Users who never appear (no app_users row, e.g. webhook predates them) simply
-- have no row - also fine, and fail-closed for grants.
DO $$
BEGIN
  IF to_regclass('public.app_users') IS NOT NULL THEN
    INSERT INTO public.clerk_identities (
      clerk_user_id, app_user_id, email, email_verified, identity_verified, verification_source
    )
    SELECT
      u.clerk_user_id,
      u.clerk_user_id,
      lower(u.email),
      false,
      false,
      'app_users_backfill'
    FROM public.app_users u
    WHERE u.clerk_user_id IS NOT NULL
      AND length(u.clerk_user_id) > 0
      AND u.email IS NOT NULL
    ON CONFLICT (clerk_user_id) DO NOTHING;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Audit anchor (what this migration deliberately did NOT do)
-- ---------------------------------------------------------------------------
COMMENT ON TABLE public.clerk_identities IS
  'Verified server-side Clerk identity mapping. Writes: service_role only (clerk-webhook on svix-verified events; migration-verify-identities.mjs against the Clerk Backend API). identity_verified=FALSE rows are placeholders and grant nothing. Legacy Supabase UUIDs are never guessed into this table.';

COMMIT;
