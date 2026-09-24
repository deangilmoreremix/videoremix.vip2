-- Credit system helper functions in credits schema
-- Run after 20260924000000_create_credit_system.sql and 20260924000001_credit_system_rls.sql

BEGIN;

-- Function to add credits to a user's balance within an app
CREATE OR REPLACE FUNCTION credits.add_credits(
  p_user_id UUID,
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

-- Function to deduct credits from a user's balance within an app
CREATE OR REPLACE FUNCTION credits.deduct_credits(
  p_user_id UUID,
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

COMMIT;
