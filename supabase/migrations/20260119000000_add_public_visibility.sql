-- Add public visibility to apps table
-- This allows certain apps to be visible to non-logged-in users

ALTER TABLE apps ADD COLUMN is_public BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN apps.is_public IS 'Whether this app is visible to non-logged-in users for discovery purposes';

-- Create index for performance
CREATE INDEX idx_apps_is_public ON apps(is_public) WHERE is_public = true;

-- Mark some featured apps as public for demonstration
UPDATE apps SET is_public = true WHERE slug IN (
  'video-creator',
  'thumbnail-generator',
  'ai-art',
  'landing-page'
) AND is_active = true;