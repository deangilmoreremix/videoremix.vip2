-- Hardened RLS for credits schema
-- Run after 20260924000000_create_credit_system.sql

BEGIN;

-- 1. Enable RLS on all credits tables
ALTER TABLE credits.credit_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits.credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits.credit_transactions ENABLE ROW LEVEL SECURITY;

-- 2. credit_products: public read within app, service_role write
DROP POLICY IF EXISTS "Public can read credit products" ON credits.credit_products;
CREATE POLICY "Public can read credit products"
  ON credits.credit_products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. credit_balances: users can read their own rows within the same app
DROP POLICY IF EXISTS "Users can read own credit balances" ON credits.credit_balances;
CREATE POLICY "Users can read own credit balances"
  ON credits.credit_balances
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
  );

-- 4. credit_transactions: users can read their own rows within the same app
DROP POLICY IF EXISTS "Users can read own credit transactions" ON credits.credit_transactions;
CREATE POLICY "Users can read own credit transactions"
  ON credits.credit_transactions
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
  );

-- 5. Optional: prevent cross-app app_id spoofing from the client side by restricting
--    INSERT/UPDATE/DELETE to service_role only for credits tables.
DROP POLICY IF EXISTS "Service role can manage credit products" ON credits.credit_products;
CREATE POLICY "Service role can manage credit products"
  ON credits.credit_products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage credit balances" ON credits.credit_balances;
CREATE POLICY "Service role can manage credit balances"
  ON credits.credit_balances
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage credit transactions" ON credits.credit_transactions;
CREATE POLICY "Service role can manage credit transactions"
  ON credits.credit_transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;
