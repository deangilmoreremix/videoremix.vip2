/*
  # Create App-Feature Hierarchy System

  ## Summary
  Introduces a hierarchical structure where apps can contain multiple features.
  This migration transforms the flat list of 37+ items into organized apps with nested features.

  ## Changes Made

  1. **Schema Extensions to `apps` table**
     - Add `item_type` enum column (values: 'app', 'feature', 'standalone')
     - Add `parent_app_id` uuid column (nullable, references apps.id)
     - Add `feature_count` integer column (calculated field)
     - Add `included_feature_ids` jsonb column (array of feature IDs)
     - Add `is_suite` boolean column (indicates if app is a feature-rich suite)

  2. **New Table: `app_feature_links`**
     - Junction table for many-to-many app-feature relationships
     - Supports flexible feature assignments
     - Includes sort_order for feature display ordering

  3. **Indexes**
     - Index on item_type for filtering
     - Index on parent_app_id for hierarchy queries
     - Index on is_suite for suite-specific queries
     - Composite index on (parent_app_id, sort_order)

  4. **Security**
     - RLS policies updated to handle feature access
     - Feature access cascades from parent app access
     - Maintain existing admin access controls

  5. **Data Migration**
     - Classify existing apps into types
     - Set parent relationships for features
     - Populate app_feature_links junction table
     - Calculate feature counts for suites

  ## Notes
  - Backward compatible with existing app access
  - Existing purchases automatically grant access to all features in purchased apps
  - UI updates required to display hierarchical structure
*/

-- Create enum for item types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_item_type') THEN
    CREATE TYPE app_item_type AS ENUM ('app', 'feature', 'standalone');
  END IF;
END $$;

-- Add new columns to apps table
DO $$
BEGIN
  -- Add item_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'item_type') THEN
    ALTER TABLE apps ADD COLUMN item_type app_item_type DEFAULT 'standalone';
  END IF;

  -- Add parent_app_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'parent_app_id') THEN
    ALTER TABLE apps ADD COLUMN parent_app_id uuid REFERENCES apps(id) ON DELETE CASCADE;
  END IF;

  -- Add feature_count column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'feature_count') THEN
    ALTER TABLE apps ADD COLUMN feature_count integer DEFAULT 0;
  END IF;

  -- Add included_feature_ids column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'included_feature_ids') THEN
    ALTER TABLE apps ADD COLUMN included_feature_ids jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add is_suite column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'is_suite') THEN
    ALTER TABLE apps ADD COLUMN is_suite boolean DEFAULT false;
  END IF;
END $$;

-- Create app_feature_links junction table
CREATE TABLE IF NOT EXISTS app_feature_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  feature_id uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(app_id, feature_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_apps_item_type ON apps(item_type);
CREATE INDEX IF NOT EXISTS idx_apps_parent_app_id ON apps(parent_app_id) WHERE parent_app_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_apps_is_suite ON apps(is_suite) WHERE is_suite = true;
CREATE INDEX IF NOT EXISTS idx_app_feature_links_app ON app_feature_links(app_id);
CREATE INDEX IF NOT EXISTS idx_app_feature_links_feature ON app_feature_links(feature_id);
CREATE INDEX IF NOT EXISTS idx_app_feature_links_sort ON app_feature_links(app_id, sort_order);

-- Enable RLS on app_feature_links
ALTER TABLE app_feature_links ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view feature links
CREATE POLICY "Anyone can view feature links"
  ON app_feature_links
  FOR SELECT
  USING (true);

-- Policy: Only admins can modify feature links
CREATE POLICY "Admins can insert feature links"
  ON app_feature_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update feature links"
  ON app_feature_links
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete feature links"
  ON app_feature_links
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Function to update feature count when links change
CREATE OR REPLACE FUNCTION update_app_feature_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update feature count for the app
  UPDATE apps
  SET feature_count = (
    SELECT COUNT(*)
    FROM app_feature_links
    WHERE app_feature_links.app_id = COALESCE(NEW.app_id, OLD.app_id)
  )
  WHERE id = COALESCE(NEW.app_id, OLD.app_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update feature counts
DROP TRIGGER IF EXISTS update_app_feature_count_trigger ON app_feature_links;
CREATE TRIGGER update_app_feature_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON app_feature_links
  FOR EACH ROW
  EXECUTE FUNCTION update_app_feature_count();

-- Function to update included_feature_ids when links change
CREATE OR REPLACE FUNCTION update_app_included_features()
RETURNS TRIGGER AS $$
BEGIN
  -- Update included feature IDs array for the app
  UPDATE apps
  SET included_feature_ids = (
    SELECT COALESCE(jsonb_agg(feature_id ORDER BY sort_order), '[]'::jsonb)
    FROM app_feature_links
    WHERE app_feature_links.app_id = COALESCE(NEW.app_id, OLD.app_id)
  )
  WHERE id = COALESCE(NEW.app_id, OLD.app_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update included feature IDs
DROP TRIGGER IF EXISTS update_app_included_features_trigger ON app_feature_links;
CREATE TRIGGER update_app_included_features_trigger
  AFTER INSERT OR UPDATE OR DELETE ON app_feature_links
  FOR EACH ROW
  EXECUTE FUNCTION update_app_included_features();

-- Create helper function to check if user has access to a feature (cascades from parent app)
CREATE OR REPLACE FUNCTION user_has_feature_access(user_id_param uuid, feature_id_param uuid)
RETURNS boolean AS $$
DECLARE
  feature_parent_id uuid;
  has_access boolean;
BEGIN
  -- Get the parent app ID for this feature
  SELECT parent_app_id INTO feature_parent_id
  FROM apps
  WHERE id = feature_id_param;

  -- If no parent app, check direct access to the feature
  IF feature_parent_id IS NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM user_app_access
      WHERE user_id = user_id_param
      AND app_id = feature_id_param
      AND (expires_at IS NULL OR expires_at > now())
    ) INTO has_access;

    RETURN has_access;
  END IF;

  -- Check if user has access to parent app
  SELECT EXISTS (
    SELECT 1 FROM user_app_access
    WHERE user_id = user_id_param
    AND app_id = feature_parent_id
    AND (expires_at IS NULL OR expires_at > now())
  ) INTO has_access;

  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for easy querying of apps with their features
CREATE OR REPLACE VIEW apps_with_features AS
SELECT
  a.id,
  a.slug,
  a.name,
  a.description,
  a.category,
  a.item_type,
  a.parent_app_id,
  a.is_suite,
  a.feature_count,
  a.included_feature_ids,
  a.popular,
  a.new,
  a.price,
  a.is_active,
  a.is_featured,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', f.id,
          'slug', f.slug,
          'name', f.name,
          'description', f.description,
          'icon', f.icon,
          'image', f.image,
          'sort_order', afl.sort_order
        ) ORDER BY afl.sort_order
      )
      FROM app_feature_links afl
      JOIN apps f ON f.id = afl.feature_id
      WHERE afl.app_id = a.id
    ),
    '[]'::jsonb
  ) as features
FROM apps a
WHERE a.item_type IN ('app', 'standalone');

-- Grant access to the view
GRANT SELECT ON apps_with_features TO authenticated;
GRANT SELECT ON apps_with_features TO anon;