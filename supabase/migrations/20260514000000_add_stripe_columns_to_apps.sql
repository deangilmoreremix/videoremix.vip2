/*
  # Add Stripe Product and Price IDs to Apps Table

  ## Summary
  Adds columns to store Stripe product and price IDs for each app,
  enabling direct integration with Stripe Checkout Sessions.

  ## Changes
  1. Add `stripe_product_id` column (text, nullable)
  2. Add `stripe_price_id` column (text, nullable)
  3. Add index on stripe_product_id for faster lookups
  4. Add index on stripe_price_id for faster lookups

  ## Notes
  - These columns store the Stripe Product and Price IDs for each app
  - Used by the checkout function to create Stripe Checkout Sessions
  - Run sync-stripe-products.ts after deploying to populate these fields
*/

-- Add Stripe columns to apps table
ALTER TABLE apps 
ADD COLUMN IF NOT EXISTS stripe_product_id text,
ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_apps_stripe_product_id ON apps(stripe_product_id);
CREATE INDEX IF NOT EXISTS idx_apps_stripe_price_id ON apps(stripe_price_id);
