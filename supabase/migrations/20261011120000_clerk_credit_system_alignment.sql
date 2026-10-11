-- Clerk credit system alignment
--
-- PURPOSE
--   1. Lock down the credit mutation RPCs: credits.add_credits / credits.deduct_credits
--      must be executable ONLY by service_role (edge functions). By default
--      PostgreSQL grants EXECUTE to PUBLIC, which means any signed-in user (or
--      anon with the apikey) could mint or burn credits with a plain RPC call.
--   2. Re-key the credits + usage tables from auth.users UUIDs to Clerk
--      subjects (text, e.g. "user_2abc..."), because the platform's identity
--      provider is now Clerk. Clerk ids do not exist in auth.users, so the
--      foreign keys and auth.uid()-based RLS policies are dead weight that
--      also blocks the Clerk-sub writes the edge functions now perform.
--   3. Make the analytics RPCs caller-scoped so an authenticated user cannot
--      read another user's usage (get_ai_app_usage / get_ai_app_remaining_runs
--      are reachable from the client, see src/pages/AIAppRunnerPage.tsx:60).
--   4. Grant the schema/table privileges the client needs to keep working:
--      src/pages/CreditsPage.tsx and src/components/credit/CreditBalanceDisplay.tsx
--      read credits.credit_balances / credit_transactions directly, which
--      requires GRANT USAGE ON SCHEMA credits + SELECT to `authenticated`.
--      No migration before this one granted those privileges.
--
-- DEPLOY ORDER (CRITICAL)
--   Apply this migration BEFORE deploying the run-ai-app / proxy-openai edge
--   functions. Those functions bill against credits.credit_balances with a
--   Clerk-sub user id and call credits.deduct_credits with a text user id;
--   against the pre-migration schema those calls fail (uuid/text mismatch) and
--   the credit gate would reject every request (fail-closed, but broken).
--   It must also run AFTER 20260709030000_clerk_full_alignment_phase2.sql
--   (public.purchases / user_app_access / subscription_status re-keyed to TEXT)
--   and BEFORE 20261011160000_clerk_identity_table.sql.
--
-- SAFETY / IDEMPOTENCY (audited 2026-10-11)
--   * Idempotent: safe to re-run.
--     - DROP ... IF EXISTS precedes every DROP.
--     - Policy recreation drops the canonical policy names first, and a
--       catalog-driven DO block additionally drops ANY other policy on the
--       three re-keyed tables, so a second application (or a DB with extra,
--       unknown policies) cannot abort the ALTER COLUMN TYPE.
--     - ALTER COLUMN TYPE TEXT USING user_id::TEXT is a no-op once the column
--       is already text.
--     - CREATE OR REPLACE FUNCTION + REVOKE/GRANT are naturally idempotent.
--   * No production data is modified; existing rows keyed by legacy Supabase
--     UUIDs are preserved as text and simply stop matching Clerk users. A
--     separate, audited data migration must map any legacy balances onto
--     Clerk subs (NOT included here on purpose). Unmapped rows must NEVER be
--     deleted: see docs/completion/db-clerk-migration.md and
--     scripts/migration-reconcile.mjs.
--   * Transaction: the whole file is one BEGIN/COMMIT block; any failure rolls
--     the entire migration back (DDL is transactional in PostgreSQL).
--
-- STATUS: file only - NEVER APPLIED to any database yet. If it has since been
-- applied anywhere, DO NOT edit it further; create a follow-up migration
-- instead (applied migrations are immutable - the checksum matters).

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Privileges the Clerk-keyed client still needs (audit gap, see PURPOSE 4)
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA credits TO anon, authenticated;
GRANT SELECT ON credits.credit_products TO anon, authenticated;
GRANT SELECT ON credits.credit_balances TO authenticated;
GRANT SELECT ON credits.credit_transactions TO authenticated;

-- ---------------------------------------------------------------------------
-- 1. Lock down credit mutation RPCs (fail closed)
-- ---------------------------------------------------------------------------
-- Functions are re-created below with text user ids; drop the old signatures
-- first so the new parameter types can be introduced. The REVOKE/GRANT for the
-- new signatures happens immediately after they are (re)created in section 4 -
-- revoking a not-yet-created signature would abort this transaction.
DROP FUNCTION IF EXISTS credits.add_credits(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS credits.deduct_credits(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, JSONB);

-- ---------------------------------------------------------------------------
-- 2. Re-key credits.credit_balances to Clerk subs (text)
-- ---------------------------------------------------------------------------
ALTER TABLE credits.credit_balances
  DROP CONSTRAINT IF EXISTS credit_balances_user_id_fkey;

-- Drop EVERY policy on the re-keyed tables up front. PostgreSQL refuses
-- ALTER COLUMN TYPE on a column referenced by a policy definition, and the
-- deployed database may carry policies with names this migration does not
-- know about. The canonical policy set is recreated after the type change.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name, c.relname AS table_name, p.policyname
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE (n.nspname, c.relname) IN (
      ('credits', 'credit_balances'),
      ('credits', 'credit_transactions'),
      ('public', 'ai_app_usage')
    )
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schema_name, r.table_name);
  END LOOP;
END $$;

ALTER TABLE credits.credit_balances
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Clerk-sub RLS: the Clerk JWT's `sub` claim is the user id.
CREATE POLICY "Users can read own credit balances"
  ON credits.credit_balances
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.jwt() ->> 'sub')
  );

CREATE POLICY "Service role can manage credit balances"
  ON credits.credit_balances
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 3. Re-key credits.credit_transactions to Clerk subs (text)
-- ---------------------------------------------------------------------------
ALTER TABLE credits.credit_transactions
  DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey;

ALTER TABLE credits.credit_transactions
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

CREATE POLICY "Users can read own credit transactions"
  ON credits.credit_transactions
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.jwt() ->> 'sub')
  );

CREATE POLICY "Service role can manage credit transactions"
  ON credits.credit_transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 4. Re-create the credit RPCs with text user ids, service_role-only execute
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION credits.add_credits(
  p_user_id TEXT,
  p_app_id TEXT,
  p_amount INTEGER,
  p_type TEXT,
  p_source TEXT DEFAULT NULL,
  p_source_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  new_balance INTEGER,
  transaction_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Ensure the balance row exists (race-safe: concurrent inserts collapse on
  -- the unique key).
  INSERT INTO credits.credit_balances (user_id, app_id, balance_credits, total_purchased_credits, total_spent_credits)
  VALUES (p_user_id, p_app_id, 0, 0, 0)
  ON CONFLICT (user_id, app_id) DO NOTHING;

  -- Atomic locked update: the row-level lock serializes concurrent callers
  -- (no lost updates / double-spend) and the WHERE guard makes negative
  -- balances impossible. A failed guard updates zero rows, so
  -- v_new_balance stays NULL -> exception -> full transaction rollback.
  UPDATE credits.credit_balances
  SET
    balance_credits = balance_credits + p_amount,
    total_purchased_credits = total_purchased_credits + GREATEST(p_amount, 0),
    total_spent_credits = total_spent_credits + GREATEST(-p_amount, 0),
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND app_id = p_app_id
    AND balance_credits + p_amount >= 0
  RETURNING balance_credits INTO v_new_balance;

  -- Validate non-negative balance
  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient credits: balance too low for amount %', p_amount;
  END IF;

  -- Log transaction
  INSERT INTO credits.credit_transactions (
    user_id,
    app_id,
    amount_credits,
    balance_after_credits,
    type,
    source,
    source_id,
    metadata
  )
  VALUES (
    p_user_id,
    p_app_id,
    p_amount,
    v_new_balance,
    p_type,
    p_source,
    p_source_id,
    p_metadata
  )
  RETURNING id INTO v_transaction_id;

  RETURN QUERY SELECT v_new_balance, v_transaction_id;
END;
$$;

CREATE OR REPLACE FUNCTION credits.deduct_credits(
  p_user_id TEXT,
  p_app_id TEXT,
  p_amount INTEGER,
  p_type TEXT DEFAULT 'api_usage',
  p_source TEXT DEFAULT NULL,
  p_source_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  new_balance INTEGER,
  transaction_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- add_credits with negative amount will validate and deduct
  RETURN QUERY SELECT * FROM credits.add_credits(
    p_user_id,
    p_app_id,
    -ABS(p_amount),
    p_type,
    p_source,
    p_source_id,
    p_metadata
  );
END;
$$;

-- Execute is granted to service_role ONLY (edge functions). anon/authenticated
-- must never be able to move credit balances via RPC.
REVOKE ALL ON FUNCTION credits.add_credits(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION credits.deduct_credits(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION credits.add_credits(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION credits.deduct_credits(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, JSONB) TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Re-key the AI app usage table to Clerk subs (text)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS record_ai_app_run(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS get_ai_app_usage(UUID);
DROP FUNCTION IF EXISTS get_ai_app_remaining_runs(UUID, INTEGER);

ALTER TABLE ai_app_usage
  DROP CONSTRAINT IF EXISTS ai_app_usage_user_id_fkey;

-- Note: the dropped FK carried ON DELETE CASCADE from auth.users. Clerk subs
-- have no auth.users row, so no FK can exist; row lifecycle is now managed by
-- explicit service_role cleanup (if ever needed) instead of cascade deletes.

ALTER TABLE ai_app_usage
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- The usage table historically shipped without RLS. Now that it is Clerk-keyed,
-- enable RLS with a Clerk-sub ownership policy (service_role keeps full access).
ALTER TABLE ai_app_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own ai app usage"
  ON ai_app_usage
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.jwt() ->> 'sub')
  );

CREATE POLICY "Service role can manage ai app usage"
  ON ai_app_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 6. Usage RPCs: caller-scoped identity
-- ---------------------------------------------------------------------------
-- record_ai_app_run is server-only (called by run-ai-app with the service-role
-- client). get_ai_app_usage / get_ai_app_remaining_runs are called from the
-- client (src/pages/AIAppRunnerPage.tsx:60) by `authenticated` users, but they
-- must never read another user's rows: the effective id is forced to the
-- caller's own Clerk `sub` unless the caller is service_role.
CREATE OR REPLACE FUNCTION record_ai_app_run(
  user_uuid TEXT,
  app_slug TEXT,
  tokens INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_app_usage (user_id, app_slug, tokens_used)
  VALUES (user_uuid, app_slug, tokens);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION record_ai_app_run(TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_ai_app_run(TEXT, TEXT, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION get_ai_app_usage(user_uuid TEXT)
RETURNS TABLE(used_count BIGINT, period_start TIMESTAMPTZ, period_end TIMESTAMPTZ) AS $$
DECLARE
  v_effective_user TEXT;
  period_start_val TIMESTAMPTZ;
  period_end_val TIMESTAMPTZ;
BEGIN
  -- Monthly reset - first day of current month to first day of next month
  period_start_val := date_trunc('month', now());
  period_end_val := date_trunc('month', now()) + INTERVAL '1 month';

  v_effective_user := CASE
    WHEN auth.role() = 'service_role' THEN user_uuid
    ELSE auth.jwt() ->> 'sub'
  END;

  RETURN QUERY
  SELECT COUNT(*), period_start_val, period_end_val
  FROM ai_app_usage
  WHERE user_id = v_effective_user
    AND run_timestamp >= period_start_val
    AND run_timestamp < period_end_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_ai_app_remaining_runs(user_uuid TEXT, max_runs INTEGER DEFAULT 100)
RETURNS INTEGER AS $$
DECLARE
  v_effective_user TEXT;
  used_count INTEGER;
BEGIN
  v_effective_user := CASE
    WHEN auth.role() = 'service_role' THEN user_uuid
    ELSE auth.jwt() ->> 'sub'
  END;

  SELECT COUNT(*)::INTEGER INTO used_count
  FROM ai_app_usage
  WHERE user_id = v_effective_user
    AND run_timestamp >= date_trunc('month', now())
    AND run_timestamp < date_trunc('month', now()) + INTERVAL '1 month';

  RETURN max_runs - used_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- These two helpers stay callable by `authenticated` (client display), but the
-- param name `user_uuid` is kept for backward compatibility with the client
-- call; the value is a Clerk sub (text) and is ignored for authenticated
-- callers (the JWT sub is used instead).
REVOKE ALL ON FUNCTION get_ai_app_usage(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_ai_app_remaining_runs(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_ai_app_usage(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_ai_app_remaining_runs(TEXT, INTEGER) TO authenticated, service_role;

COMMIT;
