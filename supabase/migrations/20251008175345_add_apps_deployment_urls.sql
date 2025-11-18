/*
  # Add Apps Table with Deployment URLs

  ## Summary
  Creates a comprehensive apps table to store application information including deployment URLs (both Netlify and custom domains).

  ## Changes Made

  1. **New Table: `apps`**
     - `id` (uuid, primary key) - Unique identifier for each app
     - `name` (text) - Display name of the application
     - `slug` (text, unique) - URL-friendly identifier (e.g., 'video-creator')
     - `description` (text) - Brief description of what the app does
     - `category` (text) - App category (video, lead-gen, ai-image, etc.)
     - `icon_url` (text, nullable) - URL to app icon/logo
     - `netlify_url` (text, nullable) - Netlify deployment URL (e.g., 'https://example.netlify.app')
     - `custom_domain` (text, nullable) - Custom domain URL if configured
     - `is_active` (boolean, default true) - Whether the app is publicly available
     - `is_featured` (boolean, default false) - Whether to feature the app prominently
     - `sort_order` (integer, default 0) - Display order (lower numbers first)
     - `created_at` (timestamptz) - Timestamp of creation
     - `updated_at` (timestamptz) - Timestamp of last update

  2. **Security**
     - Enable Row Level Security (RLS) on apps table
     - Add policy for public read access to active apps
     - Add policy for admin-only write access (insert, update, delete)

  3. **Indexes**
     - Index on `slug` for fast lookups
     - Index on `category` for filtering
     - Index on `is_active` and `is_featured` for efficient queries

  ## Notes
  - The `netlify_url` and `custom_domain` fields are both nullable to support gradual migration
  - Apps can have both a Netlify URL (for direct deployment access) and a custom domain
  - RLS ensures that only authenticated admin users can modify app data
  - All users can view active apps
*/

-- Create apps table
CREATE TABLE IF NOT EXISTS apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  category text NOT NULL,
  icon_url text,
  netlify_url text,
  custom_domain text,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_apps_slug ON apps(slug);
CREATE INDEX IF NOT EXISTS idx_apps_category ON apps(category);
CREATE INDEX IF NOT EXISTS idx_apps_active ON apps(is_active);
CREATE INDEX IF NOT EXISTS idx_apps_featured ON apps(is_featured);
CREATE INDEX IF NOT EXISTS idx_apps_sort_order ON apps(sort_order);

-- Enable Row Level Security
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active apps
CREATE POLICY "Anyone can view active apps"
  ON apps
  FOR SELECT
  USING (is_active = true);

-- Policy: Authenticated users can view all apps (including inactive ones)
CREATE POLICY "Authenticated users can view all apps"
  ON apps
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can insert apps
CREATE POLICY "Admins can insert apps"
  ON apps
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Only admins can update apps
CREATE POLICY "Admins can update apps"
  ON apps
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Only admins can delete apps
CREATE POLICY "Admins can delete apps"
  ON apps
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_apps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_apps_updated_at_trigger
  BEFORE UPDATE ON apps
  FOR EACH ROW
  EXECUTE FUNCTION update_apps_updated_at();
