-- Create landing page content tables and enable public read access
-- Fixes 404/PGRST205 errors on hero_content, testimonials, faqs, benefits_features, pricing_plans
-- These tables are queried anonymously on the landing page

-- ============================================================================
-- 1. benefits_features
-- ============================================================================
CREATE TABLE IF NOT EXISTS "public"."benefits_features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "icon" "text" DEFAULT ''::"text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid"
);

ALTER TABLE "public"."benefits_features" OWNER TO "postgres";
ALTER TABLE ONLY "public"."benefits_features"
    ADD CONSTRAINT "benefits_features_pkey" PRIMARY KEY ("id");

-- ============================================================================
-- 2. faqs
-- ============================================================================
CREATE TABLE IF NOT EXISTS "public"."faqs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text" NOT NULL,
    "category" "text" DEFAULT ''::"text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid"
);

ALTER TABLE "public"."faqs" OWNER TO "postgres";
ALTER TABLE ONLY "public"."faqs"
    ADD CONSTRAINT "faqs_pkey" PRIMARY KEY ("id");

-- ============================================================================
-- 3. hero_content
-- ============================================================================
CREATE TABLE IF NOT EXISTS "public"."hero_content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text" DEFAULT ''::"text",
    "description" "text" DEFAULT ''::"text",
    "cta_text" "text" DEFAULT ''::"text",
    "cta_link" "text" DEFAULT ''::"text",
    "background_image_url" "text" DEFAULT ''::"text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid"
);

ALTER TABLE "public"."hero_content" OWNER TO "postgres";
ALTER TABLE ONLY "public"."hero_content"
    ADD CONSTRAINT "hero_content_pkey" PRIMARY KEY ("id");

-- ============================================================================
-- 4. pricing_plans
-- ============================================================================
CREATE TABLE IF NOT EXISTS "public"."pricing_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "price_monthly" numeric DEFAULT 0,
    "price_yearly" numeric DEFAULT 0,
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "ispopular" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid"
);

ALTER TABLE "public"."pricing_plans" OWNER TO "postgres";
ALTER TABLE ONLY "public"."pricing_plans"
    ADD CONSTRAINT "pricing_plans_pkey" PRIMARY KEY ("id");

-- ============================================================================
-- 5. testimonials
-- ============================================================================
CREATE TABLE IF NOT EXISTS "public"."testimonials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" DEFAULT ''::"text",
    "company" "text" DEFAULT ''::"text",
    "content" "text" NOT NULL,
    "avatar_url" "text" DEFAULT ''::"text",
    "rating" integer DEFAULT 5,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid"
);

ALTER TABLE "public"."testimonials" OWNER TO "postgres";
ALTER TABLE ONLY "public"."testimonials"
    ADD CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id");

-- ============================================================================
-- Grants: allow anon and authenticated to read
-- ============================================================================
GRANT ALL ON TABLE "public"."benefits_features" TO "anon";
GRANT ALL ON TABLE "public"."benefits_features" TO "authenticated";
GRANT ALL ON TABLE "public"."benefits_features" TO "service_role";

GRANT ALL ON TABLE "public"."faqs" TO "anon";
GRANT ALL ON TABLE "public"."faqs" TO "authenticated";
GRANT ALL ON TABLE "public"."faqs" TO "service_role";

GRANT ALL ON TABLE "public"."hero_content" TO "anon";
GRANT ALL ON TABLE "public"."hero_content" TO "authenticated";
GRANT ALL ON TABLE "public"."hero_content" TO "service_role";

GRANT ALL ON TABLE "public"."pricing_plans" TO "anon";
GRANT ALL ON TABLE "public"."pricing_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_plans" TO "service_role";

GRANT ALL ON TABLE "public"."testimonials" TO "anon";
GRANT ALL ON TABLE "public"."testimonials" TO "authenticated";
GRANT ALL ON TABLE "public"."testimonials" TO "service_role";

-- ============================================================================
-- RLS: enable row-level security and add public read policies
-- ============================================================================
ALTER TABLE "public"."benefits_features" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."faqs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."hero_content" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pricing_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."testimonials" ENABLE ROW LEVEL SECURITY;

-- Public can read active rows
DROP POLICY IF EXISTS "Public read active benefits_features" ON "public"."benefits_features";
CREATE POLICY "Public read active benefits_features" ON "public"."benefits_features"
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Public read active faqs" ON "public"."faqs";
CREATE POLICY "Public read active faqs" ON "public"."faqs"
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Public read active hero_content" ON "public"."hero_content";
CREATE POLICY "Public read active hero_content" ON "public"."hero_content"
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Public read active pricing_plans" ON "public"."pricing_plans";
CREATE POLICY "Public read active pricing_plans" ON "public"."pricing_plans"
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Public read active testimonials" ON "public"."testimonials";
CREATE POLICY "Public read active testimonials" ON "public"."testimonials"
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

-- Service role bypass for admin operations
DROP POLICY IF EXISTS "Service role bypass - benefits_features" ON "public"."benefits_features";
CREATE POLICY "Service role bypass - benefits_features" ON "public"."benefits_features"
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role bypass - faqs" ON "public"."faqs";
CREATE POLICY "Service role bypass - faqs" ON "public"."faqs"
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role bypass - hero_content" ON "public"."hero_content";
CREATE POLICY "Service role bypass - hero_content" ON "public"."hero_content"
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role bypass - pricing_plans" ON "public"."pricing_plans";
CREATE POLICY "Service role bypass - pricing_plans" ON "public"."pricing_plans"
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role bypass - testimonials" ON "public"."testimonials";
CREATE POLICY "Service role bypass - testimonials" ON "public"."testimonials"
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ============================================================================
-- Seed: insert default content for each table so the landing page renders
-- ============================================================================
INSERT INTO "public"."hero_content" ("title", "subtitle", "description", "cta_text", "cta_link", "background_image_url", "is_active", "sort_order")
VALUES (
    'AI-Powered Video Creation',
    'Transform your ideas into stunning videos in minutes',
    'VideoRemix.vip combines the power of AI with intuitive editing tools to help you create professional videos faster than ever. From social media clips to marketing content, our platform handles it all.',
    'Get Started Free',
    '/signup',
    '',
    true,
    0
)
ON CONFLICT DO NOTHING;

INSERT INTO "public"."benefits_features" ("title", "description", "icon", "is_active", "sort_order")
VALUES
    ('AI Video Generation', 'Create videos from text prompts, scripts, or images using cutting-edge AI models.', 'sparkles', true, 0),
    ('Smart Editing Tools', 'Automatically trim, splice, and enhance your footage with intelligent editing suggestions.', 'scissors', true, 1),
    ('100+ Premium Apps', 'Access our full library of business apps for marketing, productivity, and creative work.', 'apps', true, 2),
    ('Cloud Storage', 'Store and access your projects from anywhere with secure cloud infrastructure.', 'cloud', true, 3)
ON CONFLICT DO NOTHING;

INSERT INTO "public"."testimonials" ("name", "role", "company", "content", "rating", "is_active", "sort_order")
VALUES
    ('Sarah Johnson', 'Content Creator', 'YouTube', 'VideoRemix.vip has completely transformed my workflow. I can produce 10x more content in half the time.', 5, true, 0),
    ('Michael Chen', 'Marketing Director', 'TechStart Inc', 'The AI-powered tools save us hours every week. Our engagement rates have doubled since we started using VideoRemix.', 5, true, 1),
    ('Emily Rodriguez', 'Social Media Manager', 'Creative Agency', 'Finally, a platform that makes professional video creation accessible to everyone on my team.', 5, true, 2)
ON CONFLICT DO NOTHING;

INSERT INTO "public"."faqs" ("question", "answer", "category", "is_active", "sort_order")
VALUES
    ('What is VideoRemix.vip?', 'VideoRemix.vip is an AI-powered video creation platform that helps you create professional videos quickly and easily. We also offer 100+ business apps for marketing, productivity, and creative work.', 'general', true, 0),
    ('How does the AI video generation work?', 'Simply provide a text prompt, script, or upload images, and our AI will generate a professional video for you. You can then customize it with our intuitive editor.', 'general', true, 1),
    ('What is included in the lifetime deal?', 'The lifetime deal gives you permanent access to the platform and all current features. You also get access to all 100+ business apps included in your tier.', 'pricing', true, 2),
    ('Can I cancel my subscription anytime?', 'Yes, you can cancel your subscription at any time. If you have a lifetime deal, there are no recurring charges.', 'pricing', true, 3)
ON CONFLICT DO NOTHING;

INSERT INTO "public"."pricing_plans" ("name", "description", "price_monthly", "price_yearly", "features", "ispopular", "is_active", "sort_order")
VALUES
    ('Free', 'Get started with basic features', 0, 0, '["Basic video editing", "5 projects", "720p export", "Community support"]'::jsonb, false, true, 0),
    ('Pro', 'Perfect for content creators', 29, 290, '["AI video generation", "Unlimited projects", "1080p export", "Priority support", "All 100+ apps"]'::jsonb, true, true, 1),
    ('Business', 'For teams and agencies', 79, 790, '["Everything in Pro", "4K export", "Team collaboration", "API access", "Dedicated support"]'::jsonb, false, true, 2),
    ('Lifetime', 'One-time payment, forever access', 0, 0, '["Everything in Business", "Lifetime updates", "No recurring fees", "Priority features"]'::jsonb, false, true, 3)
ON CONFLICT DO NOTHING;
