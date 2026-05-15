/*
  # Update Apps Pricing Structure

  ## Summary
  Sets up correct pricing for apps:
  - 102 regular apps: $97 lifetime each
  - 12 category bundles: $397 lifetime each (all apps in category)

  ## Changes
  1. Set base price to $97 for all apps
  2. Bundle pricing is handled separately in appsData.ts bundleConfig
*/

-- Set base price for all apps to $97
UPDATE apps 
SET price = 97
WHERE is_active = true;

-- Also update products_catalog pricing if it exists there
-- This assumes there's a price column or we need to update metadata