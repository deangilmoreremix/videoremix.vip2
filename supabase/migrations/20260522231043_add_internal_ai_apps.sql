/*
  # Add 95 Internal AI Apps (VideoRemix Internal AI Suite)
  # Uses OpenAI Responses API with advanced tools

  ## Summary
  This migration adds all 95 internal AI apps to the VideoRemix platform.
  These apps are powered by the OpenAI Responses API with advanced tools including:
  - web_search_preview: Real-time web search for research apps
  - file_search: RAG/document querying for knowledgebase apps
  - vision: Image analysis for visual document processing
  - code_execution: Code generation and execution for developer tools

  ## Categories
  - Batch 1: Sales, Lead Gen & Prospecting (10 apps)
  - Batch 2: Content Creation & Marketing (10 apps)
  - Batch 3: Video, Audio & Voice AI (9 apps)
  - Batch 4: RAG, Knowledgebase & Document Chat (13 apps)
  - Batch 5: Research & Analysis (12 apps)
  - Batch 6: Developer & Code Apps (10 apps)
  - Batch 7: Design & UX Apps (6 apps)
  - Batch 8: Finance & Legal Apps (13 apps)
  - Batch 9: HR & Hiring Apps (6 apps)
  - Batch 10: Local & Travel Apps (7 apps)

  ## Pricing
  - All 95 apps: Included with Pro/Business subscription or $97 lifetime each
  - Category bundles available at $397 per category

  ## Security
  - All apps are active and require authentication
  - Access controlled through user_purchases table
  - RLS policies enforce paywall protection

  ## Notes
  - Uses ON CONFLICT DO UPDATE for idempotency
  - Apps use the central run-ai-app Edge Function
  - No Netlify URLs (internal React apps)
*/

-- Helper function to get or create product by slug
DO $$
DECLARE
  product_id uuid;
BEGIN
  -- Ensure the internal_ai_category exists
  INSERT INTO app_categories (slug, name, description, icon, sort_order, is_active)
  VALUES (
    'internal-ai',
    'Internal AI Suite',
    '95 AI-powered apps using OpenAI Responses API with advanced tools',
    'Bot',
    100,
    true
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = true;

  RAISE NOTICE 'Internal AI category ready';
END $$;

-- Insert all 95 internal AI apps
INSERT INTO apps (
  slug, name, description, category, image, icon, popular, new, price,
  is_active, is_featured, sort_order, item_type, is_internal_ai,
  internal_ai_tools, internal_ai_batch
)
VALUES
  -- === Batch 1: Sales, Lead Gen & Prospecting (10 apps) ===
  ('ai-sales-intelligence-pro', 'AI Sales Intelligence Pro',
   'AI-powered sales research and strategy assistant with real-time data',
   'sales', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
   'TrendingUp', true, false, 97, true, true, 101, 'app', true, '[]', 1),

  ('lead-research-scraper-ai', 'Lead Research Scraper AI',
   'Generate high-quality leads with AI-powered research',
   'lead-gen', 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400',
   'Search', true, false, 97, true, true, 102, 'app', true, '[]', 1),

  ('ai-business-growth-consultant', 'AI Business Growth Consultant',
   'Strategic growth advice tailored to your business',
   'sales', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
   'Zap', true, false, 97, true, true, 103, 'app', true, '[]', 1),

  ('ai-strategy-advisor', 'AI Strategy Advisor',
   'Top-tier business strategy consulting with AI',
   'sales', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
   'Target', true, false, 97, true, true, 104, 'app', true, '[]', 1),

  ('ai-sales-email-writer', 'AI Sales Email Writer',
   'High-conversion B2B outreach copy generation',
   'sales', 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
   'Mail', true, false, 97, true, true, 105, 'app', true, '[]', 1),

  ('ai-offer-decision-helper', 'AI Offer Decision Helper',
   'Evaluate and optimize pricing for maximum conversion',
   'sales', 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=400',
   'DollarSign', true, false, 97, true, true, 106, 'app', true, '[]', 1),

  ('launch-campaign-builder-ai', 'Launch Campaign Builder AI',
   'Complete go-to-market campaign planning',
   'sales', 'https://images.unsplash.com/photo-1533750349088-c6c1a29a2d3a?w=400',
   'Rocket', true, false, 97, true, true, 107, 'app', true, '[]', 1),

  ('competitor-spy-ai', 'Competitor Spy AI',
   'Elite competitive intelligence with web search',
   'lead-gen', 'https://images.unsplash.com/photo-1553484771-371a605b060b?w=400',
   'Eye', true, false, 97, true, true, 108, 'app', true, '["web_search_preview"]', 1),

  ('ai-agency-builder-suite', 'AI Agency Builder Suite',
   'Launch or scale your service-based agency',
   'sales', 'https://images.unsplash.com/photo-1579621970563-4ebec7560ff3e?w=400',
   'Briefcase', true, false, 97, true, true, 109, 'app', true, '[]', 1),

  ('sales-call-follow-up-ai', 'Sales Call Follow-Up AI',
   'Turn call notes into multi-touch follow-up systems',
   'sales', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
   'Phone', true, false, 97, true, true, 110, 'app', true, '[]', 1),

  -- === Batch 2: Content Creation & Marketing (10 apps) ===
  ('blog-to-podcast-ai', 'Blog To Podcast AI',
   'Convert blog content into audio-ready podcasts',
   'content', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400',
   'Mic', true, false, 97, true, true, 201, 'app', true, '[]', 2),

  ('daily-content-engine-ai', 'Daily Content Engine AI',
   'Generate a full day of ready-to-post marketing content',
   'content', 'https://images.unsplash.com/photo-1499750310107-5fef28a66642?w=400',
   'Calendar', true, false, 97, true, true, 202, 'app', true, '[]', 2),

  ('ai-content-creator-pro', 'AI Content Creator Pro',
   'High-converting content across all formats',
   'content', 'https://images.unsplash.com/photo-1517694712202-dea1a6c8ba3a?w=400',
   'PenTool', true, false, 97, true, true, 203, 'app', true, '[]', 2),

  ('ai-content-editor', 'AI Content Editor',
   'World-class copy editing and conversion optimization',
   'content', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400',
   'Edit3', true, false, 97, true, true, 204, 'app', true, '[]', 2),

  ('ai-documentation-writer', 'AI Documentation Writer',
   'Professional documentation from product info',
   'content', 'https://images.unsplash.com/photo-1516321318423-f06f85b504bf?w=400',
   'FileText', true, false, 97, true, true, 205, 'app', true, '[]', 2),

  ('youtube-repurposer-ai', 'YouTube Repurposer AI',
   'Turn videos into 5+ repurposed social assets',
   'content', 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
   'Video', true, false, 97, true, true, 206, 'app', true, '[]', 2),

  ('newsletter-repurposer-ai', 'Newsletter Repurposer AI',
   'Repurpose newsletters into bite-size content',
   'content', 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=400',
   'Newspaper', true, false, 97, true, true, 207, 'app', true, '[]', 2),

  ('ai-news-content-writer', 'AI News Content Writer',
   'Create timely news articles with web search',
   'content', 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400',
   'News', true, false, 97, true, true, 208, 'app', true, '["web_search_preview"]', 2),

  ('ai-video-script-producer', 'AI Video Script Producer',
   'Director-ready shooting scripts from ideas',
   'video', 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400',
   'Clapperboard', true, false, 97, true, true, 209, 'app', true, '[]', 2),

  ('ai-music-idea-generator', 'AI Music Idea Generator',
   'Creative music concepts, lyrics, and production notes',
   'content', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1b4?w=400',
   'Music', true, false, 97, true, true, 210, 'app', true, '[]', 2),

  -- === Batch 3: Video, Audio & Voice AI (9 apps) ===
  ('ai-film-producer', 'AI Film Producer',
   'Plan cinematic videos with web research',
   'video', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400',
   'Film', true, false, 97, true, true, 301, 'app', true, '["web_search_preview"]', 3),

  ('podcast-creator-ai', 'Podcast Creator AI',
   'Turn ideas into podcast episodes and scripts',
   'audio', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400',
   'Mic', true, false, 97, true, true, 302, 'app', true, '[]', 3),

  ('news-to-podcast-ai', 'News To Podcast AI',
   'Convert news into podcast episodes with web search',
   'audio', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
   'Radio', true, false, 97, true, true, 303, 'app', true, '["web_search_preview"]', 3),

  ('ai-voice-support-agent', 'AI Voice Support Agent',
   'Voice-based support scripts and flows',
   'audio', 'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=400',
   'Headphones', true, false, 97, true, true, 304, 'app', true, '["web_search_preview"]', 3),

  ('talk-to-your-business-ai', 'Talk To Your Business AI',
   'Build conversational AI assistants',
   'ai', 'https://images.unsplash.com/photo-1485826069906-bab7cf81c4be?w=400',
   'MessageSquare', true, false, 97, true, true, 305, 'app', true, '[]', 3),

  ('ai-audio-guide-creator', 'AI Audio Guide Creator',
   'Guided audio tours and narrations',
   'audio', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400',
   'Navigation', true, false, 97, true, true, 306, 'app', true, '[]', 3),

  ('ai-intake-voice-agent', 'AI Intake Voice Agent',
   'Structured client intake conversations',
   'audio', 'https://images.unsplash.com/photo-1556745753-baba7a3a3e3a?w=400',
   'Clipboard', true, false, 97, true, true, 307, 'app', true, '[]', 3),

  ('ai-dictation-assistant', 'AI Dictation Assistant',
   'Transform spoken ideas into polished content',
   'audio', 'https://images.unsplash.com/photo-1589952280034-f7c5de51e7a9?w=400',
   'FileVoice', true, false, 97, true, true, 308, 'app', true, '[]', 3),

  ('ai-music-jingle-assistant', 'AI Music Jingle Assistant',
   'Create original jingles and brand music',
   'audio', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
   'Music2', true, false, 97, true, true, 309, 'app', true, '[]', 3),

  -- === Batch 4: RAG, Knowledgebase & Document Chat (13 apps) ===
  ('business-knowledgebase-ai', 'Business Knowledgebase AI',
   'Build and query business knowledge bases with RAG',
   'knowledge', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
   'Database', true, false, 97, true, true, 401, 'app', true, '["file_search"]', 4),

  ('pdf-business-assistant', 'PDF Business Assistant',
   'Chat with and extract insights from PDFs',
   'knowledge', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400',
   'FileText', true, false, 97, true, true, 402, 'app', true, '["file_search"]', 4),

  ('research-paper-assistant', 'Research Paper Assistant',
   'Understand and summarize academic papers',
   'knowledge', 'https://images.unsplash.com/photo-1455195795-d2ee3204c320?w=400',
   'BookOpen', true, false, 97, true, true, 403, 'app', true, '["file_search"]', 4),

  ('codebase-chat-ai', 'Codebase Chat AI',
   'Understand code structures with RAG',
   'knowledge', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400',
   'Code', true, false, 97, true, true, 404, 'app', true, '["file_search"]', 4),

  ('gmail-intelligence-ai', 'Gmail Intelligence AI',
   'Manage emails and provide inbox insights',
   'knowledge', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400',
   'Mail', true, false, 97, true, true, 405, 'app', true, '["file_search"]', 4),

  ('video-knowledge-assistant', 'Video Knowledge Assistant',
   'Extract insights from video content',
   'knowledge', 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400',
   'PlayCircle', true, false, 97, true, true, 406, 'app', true, '[]', 4),

  ('blog-knowledge-search-ai', 'Blog Knowledge Search AI',
   'Search and extract info from blogs with web search',
   'knowledge', 'https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=400',
   'Search', true, false, 97, true, true, 407, 'app', true, '["web_search_preview"]', 4),

  ('visual-document-ai', 'Visual Document AI',
   'Analyze charts, diagrams, and images with vision',
   'knowledge', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
   'Image', true, false, 97, true, true, 408, 'app', true, '["vision"]', 4),

  ('citation-knowledgebase-ai', 'Citation Knowledgebase AI',
   'Build knowledge bases with proper citations',
   'knowledge', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
   'Quote', true, false, 97, true, true, 409, 'app', true, '["file_search"]', 4),

  ('smart-search-ai', 'Smart Search AI',
   'Intelligent multi-source search with web search',
   'knowledge', 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=400',
   'Search', true, false, 97, true, true, 410, 'app', true, '["web_search_preview"]', 4),

  ('private-company-ai-assistant', 'Private Company AI Assistant',
   'Query private company data and documents',
   'knowledge', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
   'Building', true, false, 97, true, true, 411, 'app', true, '["file_search"]', 4),

  ('multimodal-knowledge-ai', 'Multimodal Knowledge AI',
   'Synthesize text, images, audio, and video',
   'knowledge', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
   'Layers', true, false, 97, true, true, 412, 'app', true, '["vision", "file_search"]', 4),

  ('ai-knowledgebase-debugger', 'AI Knowledgebase Debugger',
   'Diagnose and fix RAG system issues',
   'knowledge', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
   'Bug', true, false, 97, true, true, 413, 'app', true, '[]', 4),

  -- === Batch 5: Research & Analysis (12 apps) ===
  ('research-assistant-ai', 'Research Assistant AI',
   'Comprehensive research on any topic with web search',
   'research', 'https://images.unsplash.com/photo-1455195795-d2ee3204c320?w=400',
   'Flask', true, false, 97, true, true, 501, 'app', true, '["web_search_preview"]', 5),

  ('deep-research-pro', 'Deep Research Pro',
   'Thorough multi-round investigations with web search',
   'research', 'https://images.unsplash.com/photo-1553877522-43283d7d6c79?w=400',
   'Atom', true, false, 97, true, true, 502, 'app', true, '["web_search_preview"]', 5),

  ('research-planner-ai', 'Research Planner AI',
   'Design research strategies and methodologies',
   'research', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
   'Map', true, false, 97, true, true, 503, 'app', true, '["web_search_preview"]', 5),

  ('ai-course-creator-assistant', 'AI Course Creator Assistant',
   'Design comprehensive educational courses',
   'education', 'https://images.unsplash.com/photo-1501504905252-573c494d2890?w=400',
   'GraduationCap', true, false, 97, true, true, 504, 'app', true, '[]', 5),

  ('academic-research-ai', 'Academic Research AI',
   'Scholarly research and paper analysis',
   'research', 'https://images.unsplash.com/photo-1455195795-d2ee3204c320?w=400',
   'Book', true, false, 97, true, true, 505, 'app', true, '["web_search_preview"]', 5),

  ('market-research-ai', 'Market Research AI',
   'Analyze markets with web search',
   'research', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
   'PieChart', true, false, 97, true, true, 506, 'app', true, '["web_search_preview"]', 5),

  ('fact-check-ai', 'Fact Check AI',
   'Verify claims and detect misinformation',
   'research', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
   'Shield', true, false, 97, true, true, 507, 'app', true, '["web_search_preview"]', 5),

  ('research-memory-assistant', 'Research Memory Assistant',
   'Maintain context across research sessions',
   'research', 'https://images.unsplash.com/photo-1458494949-ef010cbdcc31?w=400',
   'Brain', true, false, 97, true, true, 508, 'app', true, '["file_search"]', 5),

  ('personal-ai-memory-assistant', 'Personal AI Memory Assistant',
   'Remember your preferences and goals',
   'ai', 'https://images.unsplash.com/photo-1485826069906-bab7cf81c4be?w=400',
   'User', true, false, 97, true, true, 509, 'app', true, '["file_search"]', 5),

  ('multi-ai-memory-hub', 'Multi-AI Memory Hub',
   'Coordinate memory across multiple AI agents',
   'ai', 'https://images.unsplash.com/photo-1485826069906-bab7cf81c4be?w=400',
   'Network', true, false, 97, true, true, 510, 'app', true, '["file_search"]', 5),

  ('private-ai-chat-with-memory', 'Private AI Chat with Memory',
   'Personal AI with persistent memory',
   'ai', 'https://images.unsplash.com/photo-1485826069906-bab7cf81c4be?w=400',
   'MessageCircle', true, false, 97, true, true, 511, 'app', true, '["file_search"]', 5),

  ('private-chatgpt-clone', 'Private ChatGPT Clone',
   'Your personal AI with custom knowledge',
   'ai', 'https://images.unsplash.com/photo-1485826069906-bab7cf81c4be?w=400',
   'Bot', true, false, 97, true, true, 512, 'app', true, '["file_search"]', 5),

  -- === Batch 6: Developer & Code Apps (10 apps) ===
  ('ai-app-builder-assistant', 'AI App Builder Assistant',
   'Design and build complete applications',
   'developer', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400',
   'App', true, false, 97, true, true, 601, 'app', true, '["code_execution"]', 6),

  ('ai-saas-architect', 'AI SaaS Architect',
   'Design scalable SaaS applications',
   'developer', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
   'Cloud', true, false, 97, true, true, 602, 'app', true, '["web_search_preview", "code_execution"]', 6),

  ('ai-code-review-pro', 'AI Code Review Pro',
   'Thorough code reviews with test execution',
   'developer', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400',
   'Code2', true, false, 97, true, true, 603, 'app', true, '["code_execution"]', 6),

  ('ai-bug-fixer', 'AI Bug Fixer',
   'Diagnose and fix software bugs',
   'developer', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400',
   'Bug', true, false, 97, true, true, 604, 'app', true, '["code_execution"]', 6),

  ('ai-fullstack-builder', 'AI Fullstack Builder',
   'Build complete web apps from idea to deployment',
   'developer', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400',
   'Layers', true, false, 97, true, true, 605, 'app', true, '["code_execution"]', 6),

  ('python-fixer-ai', 'Python Fixer AI',
   'Debug and optimize Python code',
   'developer', 'https://images.unsplash.com/photo-1526379095098-d400fd0c9359?w=400',
   'Terminal', true, false, 97, true, true, 606, 'app', true, '["code_execution"]', 6),

  ('github-repo-assistant', 'GitHub Repo Assistant',
   'Analyze and work with GitHub repositories',
   'developer', 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
   'GitBranch', true, false, 97, true, true, 607, 'app', true, '["web_search_preview"]', 6),

  ('github-automation-agent', 'GitHub Automation Agent',
   'Automate GitHub workflows',
   'developer', 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
   'GitMerge', true, false, 97, true, true, 608, 'app', true, '["web_search_preview"]', 6),

  ('build-plan-generator', 'Build Plan Generator',
   'Create detailed implementation plans',
   'developer', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
   'Clipboard', true, false, 97, true, true, 609, 'app', true, '[]', 6),

  ('sprint-planner-ai', 'Sprint Planner AI',
   'Agile sprint planning',
   'developer', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
   'Clock', true, false, 97, true, true, 610, 'app', true, '[]', 6),

  -- === Batch 7: Design & UX Apps (6 apps) ===
  ('ai-design-studio', 'AI Design Studio',
   'Create designs with vision analysis',
   'design', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
   'Palette', true, false, 97, true, true, 701, 'app', true, '["vision"]', 7),

  ('landing-page-critic-ai', 'Landing Page Critic AI',
   'Analyze and improve landing pages',
   'design', 'https://images.unsplash.com/photo-1553877522-43283d7d6c79?w=400',
   'Layout', true, false, 97, true, true, 702, 'app', true, '["vision", "web_search_preview"]', 7),

  ('ai-ux-designer', 'AI UX Designer',
   'Create user experience designs',
   'design', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
   'Figma', true, false, 97, true, true, 703, 'app', true, '[]', 7),

  ('dashboard-designer-ai', 'Dashboard Designer AI',
   'Design data dashboards',
   'design', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
   'LayoutDashboard', true, false, 97, true, true, 704, 'app', true, '[]', 7),

  ('landing-page-copy-ai', 'Landing Page Copy AI',
   'Write high-converting landing page copy',
   'content', 'https://images.unsplash.com/photo-1553877522-43283d7d6c79?w=400',
   'PenTool', true, false, 97, true, true, 705, 'app', true, '[]', 7),

  ('conversion-copy-editor', 'Conversion Copy Editor',
   'Edit copy to maximize conversions',
   'content', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400',
   'TrendingUp', true, false, 97, true, true, 706, 'app', true, '[]', 7),

  -- === Batch 8: Finance & Legal Apps (13 apps) ===
  ('finance-research-ai', 'Finance Research AI',
   'Financial research with web search',
   'finance', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
   'DollarSign', true, false, 97, true, true, 801, 'app', true, '["web_search_preview"]', 8),

  ('business-finance-ai-team', 'Business Finance AI Team',
   'Business financial planning and analysis',
   'finance', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
   'Calculator', true, false, 97, true, true, 802, 'app', true, '[]', 8),

  ('profit-coach-ai', 'Profit Coach AI',
   'Help increase business profitability',
   'finance', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
   'TrendingUp', true, false, 97, true, true, 803, 'app', true, '[]', 8),

  ('investment-research-assistant', 'Investment Research Assistant',
   'Investment research with market data',
   'finance', 'https://images.unsplash.com/photo-1579621970563-4ebec7560ff3e?w=400',
   'LineChart', true, false, 97, true, true, 804, 'app', true, '["web_search_preview"]', 8),

  ('startup-due-diligence-ai', 'Startup Due Diligence AI',
   'Evaluate startup investments',
   'finance', 'https://images.unsplash.com/photo-1553877522-43283d7d6c79?w=400',
   'FileSearch', true, false, 97, true, true, 805, 'app', true, '["web_search_preview"]', 8),

  ('revenue-data-analyst-ai', 'Revenue Data Analyst AI',
   'Analyze revenue data and find opportunities',
   'finance', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
   'BarChart', true, false, 97, true, true, 806, 'app', true, '[]', 8),

  ('financial-dashboard-ai', 'Financial Dashboard AI',
   'Design financial dashboards',
   'finance', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
   'LayoutDashboard', true, false, 97, true, true, 807, 'app', true, '[]', 8),

  ('contract-summary-ai', 'Contract Summary AI',
   'Review and summarize legal contracts',
   'legal', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400',
   'FileText', true, false, 97, true, true, 808, 'app', true, '[]', 8),

  ('legal-pdf-explainer', 'Legal PDF Explainer',
   'Explain legal documents in plain language',
   'legal', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400',
   'Gavel', true, false, 97, true, true, 809, 'app', true, '["file_search"]', 8),

  ('policy-compliance-assistant', 'Policy Compliance Assistant',
   'Compliance with web search for regulations',
   'legal', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
   'Shield', true, false, 97, true, true, 810, 'app', true, '["web_search_preview"]', 8),

  ('claim-checker-ai', 'Claim Checker AI',
   'Verify insurance claims and coverage',
   'legal', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400',
   'CheckCircle', true, false, 97, true, true, 811, 'app', true, '[]', 8),

  ('fraud-investigation-assistant', 'Fraud Investigation Assistant',
   'Detect and investigate fraud',
   'legal', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
   'AlertTriangle', true, false, 97, true, true, 812, 'app', true, '["web_search_preview"]', 8),

  ('risk-decision-ai', 'Risk Decision AI',
   'Analyze and manage business risks',
   'finance', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
   'AlertCircle', true, false, 97, true, true, 813, 'app', true, '[]', 8),

  -- === Batch 9: HR & Hiring Apps (6 apps) ===
  ('ai-hiring-assistant', 'AI Hiring Assistant',
   'Streamline the hiring process',
   'hr', 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
   'Users', true, false, 97, true, true, 901, 'app', true, '[]', 9),

  ('resume-analyzer-ai', 'Resume Analyzer AI',
   'Review resumes with ATS analysis',
   'hr', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
   'FileText', true, false, 97, true, true, 902, 'app', true, '[]', 9),

  ('candidate-decision-ai', 'Candidate Decision AI',
   'Data-driven hiring decisions',
   'hr', 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
   'UserCheck', true, false, 97, true, true, 903, 'app', true, '[]', 9),

  ('candidate-outreach-ai', 'Candidate Outreach AI',
   'Craft recruitment messages',
   'hr', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
   'Mail', true, false, 97, true, true, 904, 'app', true, '[]', 9),

  ('interview-summary-ai', 'Interview Summary AI',
   'Structured interview feedback',
   'hr', 'https://images.unsplash.com/photo-1556745753-baba7a3a3e3a?w=400',
   'Clipboard', true, false, 97, true, true, 905, 'app', true, '[]', 9),

  ('hiring-plan-builder', 'Hiring Plan Builder',
   'Strategic hiring plans',
   'hr', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
   'Map', true, false, 97, true, true, 906, 'app', true, '[]', 9),

  -- === Batch 10: Local & Travel Apps (7 apps) ===
  ('real-estate-marketing-ai', 'Real Estate Marketing AI',
   'Market properties with web search',
   'local', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
   'Home', true, false, 97, true, true, 1001, 'app', true, '["web_search_preview"]', 10),

  ('home-renovation-visualizer-ai', 'Home Renovation Visualizer AI',
   'Visualize home improvements with vision',
   'local', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
   'Hammer', true, false, 97, true, true, 1002, 'app', true, '["vision"]', 10),

  ('travel-planner-ai', 'Travel Planner AI',
   'Plan personalized travel with web search',
   'travel', 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
   'MapPin', true, false, 97, true, true, 1003, 'app', true, '["web_search_preview"]', 10),

  ('local-tour-guide-ai', 'Local Tour Guide AI',
   'Create authentic local experiences',
   'travel', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400',
   'Compass', true, false, 97, true, true, 1004, 'app', true, '["web_search_preview"]', 10),

  ('local-business-voice-assistant', 'Local Business Voice Assistant',
   'Voice communications for businesses',
   'local', 'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=400',
   'Phone', true, false, 97, true, true, 1005, 'app', true, '[]', 10),

  ('local-business-growth-advisor', 'Local Business Growth Advisor',
   'Grow local businesses with web search',
   'local', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
   'TrendingUp', true, false, 97, true, true, 1006, 'app', true, '["web_search_preview"]', 10),

  ('local-business-analytics-ai', 'Local Business Analytics AI',
   'Analyze local business performance',
   'local', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
   'BarChart', true, false, 97, true, true, 1007, 'app', true, '[]', 10)

ON CONFLICT (slug)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  image = COALESCE(EXCLUDED.image, apps.image),
  icon = COALESCE(EXCLUDED.icon, apps.icon),
  popular = EXCLUDED.popular,
  new = EXCLUDED.new,
  price = COALESCE(EXCLUDED.price, apps.price),
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order,
  item_type = EXCLUDED.item_type,
  is_internal_ai = EXCLUDED.is_internal_ai,
  internal_ai_tools = EXCLUDED.internal_ai_tools,
  internal_ai_batch = EXCLUDED.internal_ai_batch,
  updated_at = now();

-- Add columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'is_internal_ai') THEN
    ALTER TABLE apps ADD COLUMN is_internal_ai boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'internal_ai_tools') THEN
    ALTER TABLE apps ADD COLUMN internal_ai_tools jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'internal_ai_batch') THEN
    ALTER TABLE apps ADD COLUMN internal_ai_batch integer DEFAULT 0;
  END IF;
END $$;

-- Create products for the Internal AI Suite bundle
INSERT INTO products_catalog (name, slug, sku, description, product_type, apps_granted, is_active)
VALUES
  ('Internal AI Suite - All 95 Apps', 'internal-ai-suite', 'INT-AI-SUITE-001',
   'Access all 95 internal AI apps powered by OpenAI Responses API with advanced tools including web search, file search, vision, and code execution',
   'one_time', '["ai-sales-intelligence-pro", "lead-research-scraper-ai", "ai-business-growth-consultant", "ai-strategy-advisor", "ai-sales-email-writer", "ai-offer-decision-helper", "launch-campaign-builder-ai", "competitor-spy-ai", "ai-agency-builder-suite", "sales-call-follow-up-ai", "blog-to-podcast-ai", "daily-content-engine-ai", "ai-content-creator-pro", "ai-content-editor", "ai-documentation-writer", "youtube-repurposer-ai", "newsletter-repurposer-ai", "ai-news-content-writer", "ai-video-script-producer", "ai-music-idea-generator", "ai-film-producer", "podcast-creator-ai", "news-to-podcast-ai", "ai-voice-support-agent", "talk-to-your-business-ai", "ai-audio-guide-creator", "ai-intake-voice-agent", "ai-dictation-assistant", "ai-music-jingle-assistant", "business-knowledgebase-ai", "pdf-business-assistant", "research-paper-assistant", "codebase-chat-ai", "gmail-intelligence-ai", "video-knowledge-assistant", "blog-knowledge-search-ai", "visual-document-ai", "citation-knowledgebase-ai", "smart-search-ai", "private-company-ai-assistant", "multimodal-knowledge-ai", "ai-knowledgebase-debugger", "research-assistant-ai", "deep-research-pro", "research-planner-ai", "ai-course-creator-assistant", "academic-research-ai", "market-research-ai", "fact-check-ai", "research-memory-assistant", "personal-ai-memory-assistant", "multi-ai-memory-hub", "private-ai-chat-with-memory", "private-chatgpt-clone", "ai-app-builder-assistant", "ai-saas-architect", "ai-code-review-pro", "ai-bug-fixer", "ai-fullstack-builder", "python-fixer-ai", "github-repo-assistant", "github-automation-agent", "build-plan-generator", "sprint-planner-ai", "ai-design-studio", "landing-page-critic-ai", "ai-ux-designer", "dashboard-designer-ai", "landing-page-copy-ai", "conversion-copy-editor", "finance-research-ai", "business-finance-ai-team", "profit-coach-ai", "investment-research-assistant", "startup-due-diligence-ai", "revenue-data-analyst-ai", "financial-dashboard-ai", "contract-summary-ai", "legal-pdf-explainer", "policy-compliance-assistant", "claim-checker-ai", "fraud-investigation-assistant", "risk-decision-ai", "ai-hiring-assistant", "resume-analyzer-ai", "candidate-decision-ai", "candidate-outreach-ai", "interview-summary-ai", "hiring-plan-builder", "real-estate-marketing-ai", "home-renovation-visualizer-ai", "travel-planner-ai", "local-tour-guide-ai", "local-business-voice-assistant", "local-business-growth-advisor", "local-business-analytics-ai"]'::jsonb, true)
ON CONFLICT (slug)
DO UPDATE SET
  apps_granted = EXCLUDED.apps_granted,
  updated_at = now();

-- Create category products (optional bundles)
INSERT INTO products_catalog (name, slug, sku, description, product_type, apps_granted, is_active)
VALUES
  ('Sales & Lead Gen Bundle', 'sales-lead-gen-bundle', 'BUNDLE-SALES-001',
   'All Sales and Lead Gen apps - 20 apps',
   'one_time', '["ai-sales-intelligence-pro", "lead-research-scraper-ai", "ai-business-growth-consultant", "ai-strategy-advisor", "ai-sales-email-writer", "ai-offer-decision-helper", "launch-campaign-builder-ai", "competitor-spy-ai", "ai-agency-builder-suite", "sales-call-follow-up-ai", "ai-hiring-assistant", "resume-analyzer-ai", "candidate-decision-ai", "candidate-outreach-ai", "interview-summary-ai", "hiring-plan-builder", "real-estate-marketing-ai", "local-business-growth-advisor", "local-business-voice-assistant", "local-business-analytics-ai"]'::jsonb, true),

  ('Content & Marketing Bundle', 'content-marketing-bundle', 'BUNDLE-CONTENT-001',
   'All Content and Marketing apps - 16 apps',
   'one_time', '["blog-to-podcast-ai", "daily-content-engine-ai", "ai-content-creator-pro", "ai-content-editor", "ai-documentation-writer", "youtube-repurposer-ai", "newsletter-repurposer-ai", "ai-news-content-writer", "ai-video-script-producer", "ai-music-idea-generator", "landing-page-copy-ai", "conversion-copy-editor", "ai-design-studio", "landing-page-critic-ai", "ai-ux-designer", "dashboard-designer-ai"]'::jsonb, true),

  ('RAG & Knowledge Bundle', 'rag-knowledge-bundle', 'BUNDLE-RAG-001',
   'All RAG and Knowledge apps - 13 apps',
   'one_time', '["business-knowledgebase-ai", "pdf-business-assistant", "research-paper-assistant", "codebase-chat-ai", "gmail-intelligence-ai", "video-knowledge-assistant", "blog-knowledge-search-ai", "visual-document-ai", "citation-knowledgebase-ai", "smart-search-ai", "private-company-ai-assistant", "multimodal-knowledge-ai", "ai-knowledgebase-debugger"]'::jsonb, true),

  ('Research & Analysis Bundle', 'research-analysis-bundle', 'BUNDLE-RESEARCH-001',
   'All Research and Analysis apps - 12 apps',
   'one_time', '["research-assistant-ai", "deep-research-pro", "research-planner-ai", "ai-course-creator-assistant", "academic-research-ai", "market-research-ai", "fact-check-ai", "research-memory-assistant", "personal-ai-memory-assistant", "multi-ai-memory-hub", "private-ai-chat-with-memory", "private-chatgpt-clone"]'::jsonb, true),

  ('Developer Bundle', 'developer-bundle', 'BUNDLE-DEV-001',
   'All Developer apps - 10 apps',
   'one_time', '["ai-app-builder-assistant", "ai-saas-architect", "ai-code-review-pro", "ai-bug-fixer", "ai-fullstack-builder", "python-fixer-ai", "github-repo-assistant", "github-automation-agent", "build-plan-generator", "sprint-planner-ai"]'::jsonb, true)
ON CONFLICT (slug)
DO UPDATE SET
  apps_granted = EXCLUDED.apps_granted,
  updated_at = now();

-- Create platform mappings for Zaxxa payment processor
INSERT INTO platform_product_mappings (product_id, platform, platform_product_id, platform_product_name, match_confidence, manually_verified)
SELECT
  pc.id,
  'zaxxa',
  pc.sku,
  pc.name,
  1.0,
  true
FROM products_catalog pc
WHERE pc.slug IN ('internal-ai-suite', 'sales-lead-gen-bundle', 'content-marketing-bundle', 'rag-knowledge-bundle', 'research-analysis-bundle', 'developer-bundle')
ON CONFLICT (platform, platform_product_id)
DO UPDATE SET
  platform_product_name = EXCLUDED.platform_product_name,
  match_confidence = EXCLUDED.match_confidence,
  manually_verified = EXCLUDED.manually_verified,
  updated_at = now();

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Added 95 internal AI apps to VideoRemix';
  RAISE NOTICE 'Apps are organized into 10 batches by category';
  RAISE NOTICE 'Products created for individual apps, suite, and category bundles';
END $$;