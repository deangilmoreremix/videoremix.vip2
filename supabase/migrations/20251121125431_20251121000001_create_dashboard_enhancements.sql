/*
  # Dashboard Enhancements Schema

  1. New Tables
    - `user_dashboard_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `theme` (text) - dark/light mode preference
      - `layout_density` (text) - compact/comfortable
      - `widget_order` (jsonb) - custom widget arrangement
      - `hidden_widgets` (jsonb) - array of hidden widget IDs
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `user_achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `achievement_type` (text) - profile_completed, first_video, etc.
      - `earned_at` (timestamptz)
      - `metadata` (jsonb) - additional achievement data
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to read/write their own data only

  3. Functions
    - Helper function to get user progress percentage
    - Function to check and award achievements
*/

-- Create user_dashboard_preferences table
CREATE TABLE IF NOT EXISTS user_dashboard_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  layout_density text DEFAULT 'comfortable' CHECK (layout_density IN ('compact', 'comfortable')),
  widget_order jsonb DEFAULT '[]'::jsonb,
  hidden_widgets jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type text NOT NULL,
  earned_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

-- Enable Row Level Security
ALTER TABLE user_dashboard_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_dashboard_preferences
CREATE POLICY "Users can view own dashboard preferences"
  ON user_dashboard_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dashboard preferences"
  ON user_dashboard_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dashboard preferences"
  ON user_dashboard_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dashboard preferences"
  ON user_dashboard_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_dashboard_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_dashboard_preferences_updated_at_trigger ON user_dashboard_preferences;
CREATE TRIGGER update_user_dashboard_preferences_updated_at_trigger
  BEFORE UPDATE ON user_dashboard_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_dashboard_preferences_updated_at();

-- Create function to calculate user progress percentage
CREATE OR REPLACE FUNCTION get_user_progress_percentage(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  total_steps integer := 5;
  completed_steps integer := 0;
BEGIN
  -- Check profile completion (has email in auth.users)
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id AND email IS NOT NULL) THEN
    completed_steps := completed_steps + 1;
  END IF;

  -- Check first purchase
  IF EXISTS (SELECT 1 FROM user_app_access WHERE user_id = p_user_id LIMIT 1) THEN
    completed_steps := completed_steps + 1;
  END IF;

  -- Check achievements earned
  IF EXISTS (SELECT 1 FROM user_achievements WHERE user_id = p_user_id LIMIT 1) THEN
    completed_steps := completed_steps + 1;
  END IF;

  -- Check dashboard preferences set
  IF EXISTS (SELECT 1 FROM user_dashboard_preferences WHERE user_id = p_user_id) THEN
    completed_steps := completed_steps + 1;
  END IF;

  -- Check if user has accessed at least one app
  IF EXISTS (
    SELECT 1 FROM user_app_access
    WHERE user_id = p_user_id
    AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1
  ) THEN
    completed_steps := completed_steps + 1;
  END IF;

  RETURN (completed_steps * 100 / total_steps);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to award achievement
CREATE OR REPLACE FUNCTION award_achievement(
  p_user_id uuid,
  p_achievement_type text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  achievement_id uuid;
BEGIN
  INSERT INTO user_achievements (user_id, achievement_type, metadata)
  VALUES (p_user_id, p_achievement_type, p_metadata)
  ON CONFLICT (user_id, achievement_type) DO NOTHING
  RETURNING id INTO achievement_id;

  RETURN achievement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_dashboard_preferences_user_id ON user_dashboard_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(achievement_type);

-- Insert default preferences for existing users
INSERT INTO user_dashboard_preferences (user_id, theme, layout_density)
SELECT id, 'dark', 'comfortable'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_dashboard_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Award initial achievements for existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users
  LOOP
    -- Award profile_completed achievement
    PERFORM award_achievement(user_record.id, 'profile_completed', '{"auto_awarded": true}'::jsonb);

    -- Award first_purchase if they have any purchases
    IF EXISTS (SELECT 1 FROM user_app_access WHERE user_id = user_record.id LIMIT 1) THEN
      PERFORM award_achievement(user_record.id, 'first_purchase', '{"auto_awarded": true}'::jsonb);
    END IF;
  END LOOP;
END $$;