-- Insert Personalizer AI Agency products
INSERT INTO products_catalog (name, slug, sku, description, product_type, apps_granted, is_active)
VALUES
  (
    'Personalizer AI Agency (Monthly)',
    'personalizer-monthly',
    'PERS-MONTHLY',
    'Monthly subscription to Personalizer AI Agency with access to core personalizer tools',
    'subscription',
    '["voice-coach", "resume-amplifier", "personalizer-recorder", "personalizer-profile", "thumbnail-generator", "ai-skills-monetizer", "ai-signature"]'::jsonb,
    true
  ),
  (
    'Personalizer AI Agency (Lifetime)',
    'personalizer-lifetime',
    'PERS-LIFETIME',
    'Lifetime access to all Personalizer AI Agency apps and tools',
    'one_time',
    '["voice-coach", "resume-amplifier", "personalizer-recorder", "personalizer-profile", "thumbnail-generator", "ai-skills-monetizer", "ai-signature", "personalizer-text-ai-editor", "personalizer-advanced-text-video-editor", "personalizer-writing-toolkit", "personalizer-video-image-transformer", "personalizer-url-video-generation"]'::jsonb,
    true
  ),
  (
    'Personalizer AI Agency (Yearly)',
    'personalizer-yearly',
    'PERS-YEARLY',
    'Yearly subscription to Personalizer AI Agency with access to all personalizer tools',
    'subscription',
    '["voice-coach", "resume-amplifier", "personalizer-recorder", "personalizer-profile", "thumbnail-generator", "ai-skills-monetizer", "ai-signature", "personalizer-text-ai-editor", "personalizer-advanced-text-video-editor", "personalizer-writing-toolkit"]'::jsonb,
    true
  ),
  (
    'Personalizer AI Writing Toolkit',
    'personalizer-writing-toolkit',
    'PERS-WRITING',
    'AI-powered writing toolkit for personalized content creation',
    'one_time',
    '["personalizer-writing-toolkit", "personalizer-text-ai-editor"]'::jsonb,
    true
  ),
  (
    'Personalizer Advanced Text-Video AI Editor',
    'personalizer-text-video-editor',
    'PERS-TEXT-VIDEO',
    'Advanced AI editor for personalized text and video content',
    'one_time',
    '["personalizer-advanced-text-video-editor", "personalizer-text-ai-editor"]'::jsonb,
    true
  ),
  (
    'Personalizer URL Video Generation Templates & Editor',
    'personalizer-url-video',
    'PERS-URL-VIDEO',
    'Generate videos from URLs with smart template matching',
    'one_time',
    '["personalizer-url-video-generation"]'::jsonb,
    true
  ),
  (
    'Personalizer Interactive Shopping',
    'personalizer-interactive-shopping',
    'PERS-SHOPPING',
    'Create engaging interactive shopping experiences',
    'one_time',
    '["interactive-shopping"]'::jsonb,
    true
  ),
  (
    'Personalizer AI Video and Image Transformer',
    'personalizer-video-transformer',
    'PERS-TRANSFORMER',
    'Transform videos and images with advanced AI processing',
    'subscription',
    '["personalizer-video-image-transformer", "ai-video-image"]'::jsonb,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  product_type = EXCLUDED.product_type,
  apps_granted = EXCLUDED.apps_granted,
  is_active = EXCLUDED.is_active,
  updated_at = now();