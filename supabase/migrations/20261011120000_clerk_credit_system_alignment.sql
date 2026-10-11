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
--
-- DEPLOY ORDER (CRITICAL)
--   Apply this migration BEFORE deploying the run-ai-app / proxy-openai edge
--   functions. Those functions bill against credits.credit_balances with a
--   Clerk-sub user id and call credits.deduct_credits with a text user id;
--   against the pre-migration schema those calls fail (uuid/text mismatch) and
--   the credit gate would reject every request (fail-closed, but broken).
--
-- SAFETY
--   * Idempotent: safe to re-run.
--   * No production data is modified; existing rows keyed by legacy Supabase
--     UUIDs are preserved as text and simply stop matching Clerk users. A
--     separate, audited data migration must map any legacy balances onto
--     Clerk subs (NOT included here on purpose).

BEGIN;

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

-- Drop RLS policies that reference the column before changing its type.
DROP POLICY IF EXISTS "Users can read own credit balances" ON credits.credit_balances;
DROP POLICY IF EXISTS "Service role can manage credit balances" ON credits.credit_balances;

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

DROP POLICY IF EXISTS "Users can read own credit transactions" ON credits.credit_transactions;
DROP POLICY IF EXISTS "Service role can manage credit transactions" ON credits.credit_transactions;

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
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get current balance or 0 if not exists
  SELECT balance_credits INTO v_current_balance
  FROM credits.credit_balances
  WHERE user_id = p_user_id AND app_id = p_app_id;

  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
    -- Create balance row if it doesn't exist
    INSERT INTO credits.credit_balances (user_id, app_id, balance_credits, total_purchased_credits, total_spent_credits)
    VALUES (p_user_id, p_app_id, 0, 0, 0)
    ON CONFLICT (user_id, app_id) DO NOTHING;
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance + p_amount;

  -- Validate non-negative balance
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient credits: current %, attempted to deduct %', v_current_balance, ABS(p_amount);
  END IF;

  -- Update balance
  UPDATE credits.credit_balances
  SET
    balance_credits = v_new_balance,
    total_purchased_credits = total_purchased_credits + GREATEST(p_amount, 0),
    total_spent_credits = total_spent_credits + GREATEST(-p_amount, 0),
    updated_at = NOW()
  WHERE user_id = p_user_id AND app_id = p_app_id;

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

ALTER TABLE ai_app_usage
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- The usage table historically shipped without RLS. Now that it is Clerk-keyed,
-- enable RLS with a Clerk-sub ownership policy (service_role keeps full access).
ALTER TABLE ai_app_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own ai app usage" ON ai_app_usage;
CREATE POLICY "Users can read own ai app usage"
  ON ai_app_usage
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.jwt() ->> 'sub')
  );

DROP POLICY IF EXISTS "Service role can manage ai app usage" ON ai_app_usage;
CREATE POLICY "Service role can manage ai app usage"
  ON ai_app_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

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

-- Analytics helpers are internal-only as well.
REVOKE ALL ON FUNCTION record_ai_app_run(TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_ai_app_run(TEXT, TEXT, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION get_ai_app_usage(user_uuid TEXT)
RETURNS TABLE(used_count BIGINT, period_start TIMESTAMPTZ, period_end TIMESTAMPTZ) AS $$
DECLARE
  period_start_val TIMESTAMPTZ;
  period_end_val TIMESTAMPTZ;
BEGIN
  -- Monthly reset - first day of current month to first day of next month
  period_start_val := date_trunc('month', now());
  period_end_val := date_trunc('month', now()) + INTERVAL '1 month';

  RETURN QUERY
  SELECT COUNT(*), period_start_val, period_end_val
  FROM ai_app_usage
  WHERE user_id = user_uuid
    AND run_timestamp >= period_start_val
    AND run_timestamp < period_end_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_ai_app_remaining_runs(user_uuid TEXT, max_runs INTEGER DEFAULT 100)
RETURNS INTEGER AS $$
DECLARE
  used_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO used_count
  FROM ai_app_usage
  WHERE user_id = user_uuid
    AND run_timestamp >= date_trunc('month', now())
    AND run_timestamp < date_trunc('month', now()) + INTERVAL '1 month';

  RETURN max_runs - used_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
