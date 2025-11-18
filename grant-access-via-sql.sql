-- Grant app access to users based on CSV purchases
-- This will create records in user_app_access table for users who have completed purchases

-- First, let's create a temporary mapping table
CREATE TEMP TABLE IF NOT EXISTS temp_user_product_mapping (
  email TEXT,
  product_name TEXT,
  app_slug TEXT
);

-- Insert mappings for Personalizer AI Agency (Monthly) subscribers
INSERT INTO temp_user_product_mapping (email, product_name, app_slug) VALUES
('larrylawrence1@gmail.com', 'Monthly', 'voice-coach'),
('larrylawrence1@gmail.com', 'Monthly', 'resume-amplifier'),
('larrylawrence1@gmail.com', 'Monthly', 'personalizer-recorder'),
('larrylawrence1@gmail.com', 'Monthly', 'personalizer-profile'),
('larrylawrence1@gmail.com', 'Monthly', 'thumbnail-generator'),
('larrylawrence1@gmail.com', 'Monthly', 'ai-skills-monetizer'),
('larrylawrence1@gmail.com', 'Monthly', 'ai-signature'),
('ejo1ed@gmail.com', 'Monthly', 'voice-coach'),
('ejo1ed@gmail.com', 'Monthly', 'resume-amplifier'),
('ejo1ed@gmail.com', 'Monthly', 'personalizer-recorder'),
('ejo1ed@gmail.com', 'Monthly', 'personalizer-profile'),
('ejo1ed@gmail.com', 'Monthly', 'thumbnail-generator'),
('ejo1ed@gmail.com', 'Monthly', 'ai-skills-monetizer'),
('ejo1ed@gmail.com', 'Monthly', 'ai-signature'),
('mobileman712@gmail.com', 'Monthly', 'voice-coach'),
('mobileman712@gmail.com', 'Monthly', 'resume-amplifier'),
('mobileman712@gmail.com', 'Monthly', 'personalizer-recorder'),
('mobileman712@gmail.com', 'Monthly', 'personalizer-profile'),
('mobileman712@gmail.com', 'Monthly', 'thumbnail-generator'),
('mobileman712@gmail.com', 'Monthly', 'ai-skills-monetizer'),
('mobileman712@gmail.com', 'Monthly', 'ai-signature');

-- Insert user access records for existing users
INSERT INTO user_app_access (user_id, app_slug, access_type, is_active, granted_at)
SELECT
  u.id,
  t.app_slug,
  'lifetime'::text,
  true,
  NOW()
FROM auth.users u
JOIN temp_user_product_mapping t ON u.email = t.email
WHERE NOT EXISTS (
  SELECT 1 FROM user_app_access uaa
  WHERE uaa.user_id = u.id AND uaa.app_slug = t.app_slug
);

-- Clean up
DROP TABLE IF EXISTS temp_user_product_mapping;
