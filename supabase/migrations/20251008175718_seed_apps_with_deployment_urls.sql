/*
  # Seed Apps Table with Deployment URLs

  ## Summary
  Populates the apps table with existing applications and their deployment URLs from the codebase.

  ## Changes Made

  1. **Seed Data**
     - Insert apps with their Netlify URLs and/or custom domains
     - Set appropriate categories, descriptions, and sort orders
     - Mark popular/featured apps accordingly

  ## Notes
  - This migration uses INSERT ... ON CONFLICT DO UPDATE to be idempotent
  - URLs are taken from the previous hardcoded toolUrlMap in the codebase
  - Apps without URLs will have NULL values for netlify_url and custom_domain
*/

-- Insert/Update apps with deployment URLs
INSERT INTO apps (slug, name, description, category, netlify_url, custom_domain, is_active, is_featured, sort_order)
VALUES
  -- AI Content tools
  ('ai-creative-studio', 'AI Creative Studio', 'Create stunning visual content with AI', 'ai-image', 'https://capable-mermaid-3c73fa.netlify.app/', NULL, true, true, 10),
  ('thumbnail-generator', 'Thumbnail Generator', 'Generate eye-catching thumbnails instantly', 'ai-image', 'https://capable-mermaid-3c73fa.netlify.app/', NULL, true, true, 20),
  ('ai-art', 'AI Art Generator', 'Create beautiful AI-generated artwork', 'ai-image', 'https://capable-mermaid-3c73fa.netlify.app/', NULL, true, false, 30),
  ('storyboard', 'Storyboard Creator', 'Design professional storyboards with AI', 'creative', 'https://capable-mermaid-3c73fa.netlify.app/', NULL, true, false, 40),
  ('rebrander-ai', 'RE-BRANDER AI', 'The ultimate AI re-branding system', 'branding', 'https://capable-mermaid-3c73fa.netlify.app/', NULL, true, true, 50),
  ('business-brander', 'Business Brander Enterprise', 'Comprehensive branding solution', 'branding', 'https://capable-mermaid-3c73fa.netlify.app/', NULL, true, false, 60),
  ('branding-analyzer', 'Branding Analyzer', 'Analyze and improve your brand identity', 'branding', 'https://capable-mermaid-3c73fa.netlify.app/', NULL, true, false, 70),
  ('ai-branding', 'AI Branding Suite', 'Complete AI-powered branding tools', 'branding', 'https://capable-mermaid-3c73fa.netlify.app/', NULL, true, false, 80),
  ('gif-editor', 'GIF Editor', 'Create and edit animated GIFs', 'creative', NULL, 'https://ai-personalized-content.videoremix.vip', true, false, 90),
  ('meme-generator', 'Meme Generator', 'Generate viral memes instantly', 'creative', NULL, 'https://ai-personalized-content.videoremix.vip', true, false, 100),
  ('hybrid-ai', 'Hybrid AI Tools', 'Combine multiple AI models for powerful results', 'ai', 'https://capable-mermaid-3c73fa.netlify.app/', NULL, true, false, 110),
  ('gemini-features', 'Gemini Features', 'Advanced features powered by Google Gemini', 'ai', 'https://capable-mermaid-3c73fa.netlify.app/', NULL, true, false, 120),
  ('multimodal-creator', 'Multimodal Creator', 'Create content across multiple formats', 'creative', 'https://capable-mermaid-3c73fa.netlify.app/', NULL, true, false, 130),
  
  -- Sales page related tools
  ('landing-page', 'Landing Page Creator', 'Create full-blown landing pages in 60 seconds', 'page', 'https://prismatic-starship-c0b4c2.netlify.app', NULL, true, true, 140),
  ('page-planner', 'Page Planner', 'Plan and structure your web pages', 'page', 'https://prismatic-starship-c0b4c2.netlify.app', NULL, true, false, 150),
  ('page-cloner', 'Page Cloner', 'Clone and customize existing pages', 'page', 'https://prismatic-starship-c0b4c2.netlify.app', NULL, true, false, 160),
  
  -- Proposal tools
  ('proposal-generator', 'Proposal Generator', 'Generate professional proposals instantly', 'client', 'https://keen-pastelito-6b9074.netlify.app', NULL, true, false, 170),
  ('realtime-proposal', 'Real-time Proposal Builder', 'Build proposals with live collaboration', 'client', 'https://keen-pastelito-6b9074.netlify.app', NULL, true, false, 180),
  ('smart-pricing', 'Smart Pricing Calculator', 'Calculate optimal pricing for your services', 'client', 'https://keen-pastelito-6b9074.netlify.app', NULL, true, false, 190),
  
  -- Sales assistant tools
  ('client-research', 'Client Research Assistant', 'Research and analyze potential clients', 'sales', 'https://gentle-frangipane-ceed17.netlify.app', NULL, true, false, 200),
  ('objection-handler', 'Objection Handler', 'Handle sales objections effectively', 'sales', 'https://gentle-frangipane-ceed17.netlify.app', NULL, true, false, 210),
  ('follow-up-emails', 'Follow-up Email Generator', 'Generate personalized follow-up emails', 'communication', 'https://gentle-frangipane-ceed17.netlify.app', NULL, true, false, 220),
  ('client-sentiment-analyzer', 'Client Sentiment Analyzer', 'Analyze client communication sentiment', 'sales', 'https://gentle-frangipane-ceed17.netlify.app', NULL, true, false, 230),
  
  -- Featured apps
  ('ai-referral-maximizer', 'AI Referral Maximizer', 'Maximize referrals with AI automation', 'lead-gen', 'https://eloquent-kleicha-7e3a3e.netlify.app', NULL, true, true, 240),
  ('ai-sales', 'AI Sales Assistant', 'AI-powered sales automation platform', 'sales', 'https://magnificent-lamington-619374.netlify.app/', NULL, true, true, 250),
  ('personalizer-recorder', 'Personalizer Recorder', 'Record and personalize video content', 'personalizer', 'https://adorable-arithmetic-675d28.netlify.app/', NULL, true, false, 260),
  ('smart-crm-closer', 'Smart CRM Closer', 'Close deals faster with AI-powered CRM', 'sales', 'https://stupendous-twilight-64389a.netlify.app/', NULL, true, true, 270),
  ('video-ai-editor', 'Video AI Editor', 'Edit videos with AI assistance', 'video', 'https://heroic-seahorse-296f32.netlify.app/', NULL, true, true, 280),
  ('ai-video-image', 'AI Video & Image Tools', 'Transform videos and images with AI', 'video', 'https://thriving-mochi-ecd815.netlify.app/', NULL, true, false, 290),
  ('ai-skills-monetizer', 'AI Skills Monetizer', 'Monetize your skills with AI', 'ai', 'https://roaring-mochi-39a60a.netlify.app', NULL, true, false, 300),
  ('ai-signature', 'AI Signature Generator', 'Create professional email signatures', 'personalizer', 'https://kaleidoscopic-tarsier-3d0a6c.netlify.app/', NULL, true, false, 310),
  ('ai-template-generator', 'AI Template Generator', 'Generate templates for any purpose', 'creative', 'https://cute-khapse-4e62cb.netlify.app', NULL, true, false, 320),
  ('funnelcraft-ai', 'FunnelCraft AI', 'Build high-converting sales funnels', 'sales', 'https://serene-valkyrie-fec320.netlify.app/', NULL, true, true, 330),
  ('interactive-shopping', 'Interactive Shopping', 'Create interactive shopping experiences', 'sales', 'https://inspiring-mandazi-d17556.netlify.app', NULL, true, false, 340),
  ('personalizer-profile', 'Personalizer Profile Generator', 'Generate personalized profiles', 'personalizer', 'https://endearing-churros-2ce8c6.netlify.app/', NULL, true, false, 350),
  ('personalizer-video-image-transformer', 'Video Image Transformer', 'Transform videos and images for personalization', 'personalizer', 'https://thriving-mochi-ecd815.netlify.app/', NULL, true, false, 360),
  ('personalizer-url-video-generation', 'URL Video Generator', 'Generate personalized videos from URLs', 'personalizer', 'https://cute-khapse-4e62cb.netlify.app/', NULL, true, false, 370),
  ('sales-assistant-app', 'Sales Assistant', 'Complete sales assistance platform', 'sales', 'https://gentle-frangipane-ceed17.netlify.app', NULL, true, false, 380),
  
  -- Additional Personalizer tools
  ('personalizer-text-ai-editor', 'Text AI Editor', 'Edit and personalize text with AI', 'personalizer', 'https://heroic-seahorse-296f32.netlify.app/', NULL, true, false, 390),
  ('personalizer-advanced-text-video-editor', 'Advanced Text Video Editor', 'Advanced video text editing with AI', 'personalizer', 'https://heroic-seahorse-296f32.netlify.app/', NULL, true, false, 400),
  ('personalizer-writing-toolkit', 'Writing Toolkit', 'Complete writing and editing toolkit', 'personalizer', 'https://heroic-seahorse-296f32.netlify.app/', NULL, true, false, 410)

ON CONFLICT (slug) 
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  netlify_url = EXCLUDED.netlify_url,
  custom_domain = EXCLUDED.custom_domain,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
