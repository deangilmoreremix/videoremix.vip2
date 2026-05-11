-- Fix RLS policies for landing page tables
-- Allow anon users to SELECT from these tables

-- hero_content
ALTER TABLE IF EXISTS hero_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon select" ON hero_content;
CREATE POLICY "Allow anon select" ON hero_content FOR SELECT USING (true);

-- benefits_features  
ALTER TABLE IF EXISTS benefits_features ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon select" ON benefits_features;
CREATE POLICY "Allow anon select" ON benefits_features FOR SELECT USING (true);

-- testimonials
ALTER TABLE IF EXISTS testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon select" ON testimonials;
CREATE POLICY "Allow anon select" ON testimonials FOR SELECT USING (true);

-- faqs
ALTER TABLE IF EXISTS faqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon select" ON faqs;
CREATE POLICY "Allow anon select" ON faqs FOR SELECT USING (true);

-- pricing_plans
ALTER TABLE IF EXISTS pricing_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon select" ON pricing_plans;
CREATE POLICY "Allow anon select" ON pricing_plans FOR SELECT USING (true);

-- Also seed some default data for hero_content
INSERT INTO hero_content (title, subtitle, description, is_active)
VALUES ('Welcome to VideoRemix', 'AI-Powered Marketing Platform', 'Create personalized marketing content that converts.', true)
ON CONFLICT DO NOTHING;
