/*
  # Update Apps Table with New Categorization System

  ## Summary
  Updates the apps table with the complete catalog of 92 apps organized into 12 categories,
  replacing the old categorization system with the new one used in the dashboard.

  ## Changes Made

  1. **Update Category Values**
     - Maps old categories to new 12-category system:
       - 'video' → 'video-audio-voice'
       - 'lead-gen' → 'sales-lead-gen'
       - 'ai-image' → 'design-uiux'
       - 'branding' → 'design-uiux'
       - 'personalizer' → 'productivity-personal'
       - 'creative' → 'content-marketing'

  2. **Insert/Update Complete App Catalog**
     - 92 apps across 12 categories
     - Proper categorization, descriptions, and metadata
     - Uses UPSERT pattern for idempotency

  3. **Category Distribution**
     - Sales, Lead Gen & Prospecting: 10 apps
     - Content Creation & Marketing: 10 apps
     - Video, Audio & Voice Business: 9 apps
     - RAG, Knowledgebase & Document Chat: 13 apps
     - Real Estate, Home Services & Local Business: 7 apps
     - HR, Hiring & Recruiting: 6 apps
     - Finance, Business Planning & Investment: 7 apps
     - Legal, Compliance & Risk: 6 apps
     - Coding, Developer & SaaS Builder: 10 apps
     - Design, UI/UX & Landing Page: 6 apps
     - Research, Education & Training: 8 apps
     - Productivity, Memory & Personal Assistant: 10 apps

  ## Notes
  - Uses UPSERT pattern (ON CONFLICT DO UPDATE) for safe updates
  - Preserves existing netlify_url and custom_domain values
  - Sets appropriate popular/new flags and pricing
  - Includes proper sort ordering for display
*/

-- First, update existing apps to use new category system
UPDATE apps SET category = 'video-audio-voice' WHERE category = 'video';
UPDATE apps SET category = 'sales-lead-gen' WHERE category = 'lead-gen';
UPDATE apps SET category = 'design-uiux' WHERE category = 'ai-image';
UPDATE apps SET category = 'design-uiux' WHERE category = 'branding';
UPDATE apps SET category = 'productivity-personal' WHERE category = 'personalizer';
UPDATE apps SET category = 'content-marketing' WHERE category = 'creative';

-- Insert/Update all 92 apps with new categorization
INSERT INTO apps (
  slug, name, description, category, image, icon, popular, new, coming_soon, price, is_active, is_featured, sort_order
) VALUES
  -- Sales, Lead Gen & Prospecting Apps
  ('ai-sales-intelligence-pro', 'AI Sales Intelligence Pro', 'An AI-powered sales research and strategy assistant that helps users understand prospects, identify sales opportunities, and create smarter outreach.', 'sales-lead-gen', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Search', true, true, false, 97, true, true, 10),
  ('lead-research-scraper-ai', 'Lead Research Scraper AI', 'Finds and organizes useful business, website, and prospect information so users can quickly build targeted lead lists.', 'sales-lead-gen', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Search', false, true, false, 97, true, false, 20),
  ('ai-business-growth-consultant', 'AI Business Growth Consultant', 'Acts like a virtual business consultant that gives strategy, growth ideas, offer improvements, and client acquisition recommendations.', 'sales-lead-gen', 'https://images.unsplash.com/photo-1552664730-d307ca44d61b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'TrendingUp', false, true, false, 97, true, false, 30),
  ('ai-strategy-advisor', 'AI Strategy Advisor', 'Helps users make smarter business decisions by analyzing goals, options, risks, and next steps.', 'sales-lead-gen', 'https://images.unsplash.com/photo-1552664730-d307ca44d61b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Sparkles', false, true, false, 97, true, false, 40),
  ('ai-sales-email-writer', 'AI Sales Email Writer', 'Writes personalized sales emails, follow-up emails, cold outreach messages, and client communication.', 'sales-lead-gen', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Mail', false, true, false, 97, true, false, 50),
  ('ai-offer-decision-helper', 'AI Offer Decision Helper', 'Helps users compare offers, ideas, pricing, packages, and sales angles so they can choose the strongest direction.', 'sales-lead-gen', 'https://images.unsplash.com/photo-1552664730-d307ca44d61b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'BarChart2', false, true, false, 97, true, false, 60),
  ('launch-campaign-builder-ai', 'Launch Campaign Builder AI', 'Creates product launch campaigns, promotional plans, email angles, social posts, and go-to-market ideas.', 'sales-lead-gen', 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Rocket', true, false, false, 97, true, true, 70),
  ('competitor-spy-ai', 'Competitor Spy AI', 'Analyzes competitors, market positioning, offers, messaging, and opportunities to help users stand out.', 'sales-lead-gen', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Search', false, true, false, 97, true, false, 80),
  ('ai-agency-builder-suite', 'AI Agency Builder Suite', 'Helps users plan, package, price, and sell AI-powered agency services to local businesses or niche markets.', 'sales-lead-gen', 'https://images.unsplash.com/photo-1552664730-d307ca44d61b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Briefcase', false, true, false, 97, true, false, 90),
  ('sales-call-follow-up-ai', 'Sales Call Follow-Up AI', 'Turns meeting notes or sales call details into professional follow-up emails, next steps, summaries, and closing messages.', 'sales-lead-gen', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'MessageSquare', false, true, false, 97, true, false, 100),

  -- Content Creation & Marketing Apps
  ('blog-to-podcast-ai', 'Blog To Podcast AI', 'Turns blog posts, articles, or written content into podcast scripts, outlines, and audio-ready episodes.', 'content-marketing', 'https://images.unsplash.com/photo-1590602847861-fa3be0eb33f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Radio', false, true, false, 97, true, false, 110),
  ('daily-content-engine-ai', 'Daily Content Engine AI', 'Creates daily marketing content from news, trends, business updates, or niche topics.', 'content-marketing', 'https://images.unsplash.com/photo-1499750310101-6cda608e867c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'FileText', false, true, false, 97, true, false, 120),
  ('ai-content-creator-pro', 'AI Content Creator Pro', 'Generates social posts, emails, captions, articles, video scripts, and promotional content for businesses.', 'content-marketing', 'https://images.unsplash.com/photo-1499750310101-6cda608e867c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'FileText', true, false, false, 97, true, true, 130),
  ('ai-content-editor', 'AI Content Editor', 'Improves, rewrites, shortens, expands, or polishes existing content for better clarity and conversions.', 'content-marketing', 'https://images.unsplash.com/photo-1455390528084-8b85e4bcd271?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Edit', false, true, false, 97, true, false, 140),
  ('ai-documentation-writer', 'AI Documentation Writer', 'Creates tutorials, help docs, product guides, SOPs, onboarding instructions, and technical explanations.', 'content-marketing', 'https://images.unsplash.com/photo-1455390528084-8b85e4bcd271?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'FileText', false, true, false, 97, true, false, 150),
  ('youtube-repurposer-ai', 'YouTube Repurposer AI', 'Turns YouTube videos into summaries, social posts, emails, articles, shorts ideas, and marketing content.', 'content-marketing', 'https://images.unsplash.com/photo-1493711662062-fa9a0ceca13e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Video', false, true, false, 97, true, false, 160),
  ('newsletter-repurposer-ai', 'Newsletter Repurposer AI', 'Repurposes newsletter or Substack content into posts, emails, articles, scripts, and promotional assets.', 'content-marketing', 'https://images.unsplash.com/photo-1499750310101-6cda608e867c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Mail', false, true, false, 97, true, false, 170),
  ('ai-news-content-writer', 'AI News Content Writer', 'Creates news-style articles, updates, summaries, and trend-based content for niche audiences.', 'content-marketing', 'https://images.unsplash.com/photo-1499750310101-6cda608e867c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'FileText', false, true, false, 97, true, false, 180),
  ('ai-video-script-producer', 'AI Video Script Producer', 'Creates video scripts, production outlines, story ideas, scene breakdowns, and promotional video concepts.', 'content-marketing', 'https://images.unsplash.com/photo-1493711662062-fa9a0ceca13e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Video', false, true, false, 97, true, false, 190),
  ('ai-music-idea-generator', 'AI Music Idea Generator', 'Helps users create music concepts, jingles, lyrics, hooks, and creative audio ideas.', 'content-marketing', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Mic', false, true, false, 97, true, false, 200),

  -- Video, Audio & Voice Business Apps
  ('ai-film-producer', 'AI Film Producer', 'Helps users plan cinematic videos, AI films, scenes, scripts, shot lists, and production concepts.', 'video-audio-voice', 'https://images.unsplash.com/photo-1493711662062-fa9a0ceca13e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Video', false, true, false, 97, true, false, 210),
  ('podcast-creator-ai', 'Podcast Creator AI', 'Turns ideas, articles, or business topics into podcast episodes, interview outlines, and audio scripts.', 'video-audio-voice', 'https://images.unsplash.com/photo-1590602847861-fa3be0eb33f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Radio', true, false, false, 97, true, true, 220),
  ('news-to-podcast-ai', 'News-To-Podcast AI', 'Converts trending news, niche updates, or business topics into podcast-ready episodes.', 'video-audio-voice', 'https://images.unsplash.com/photo-1590602847861-fa3be0eb33f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Radio', false, true, false, 97, true, false, 230),
  ('ai-voice-support-agent', 'AI Voice Support Agent', 'Creates voice-based support scripts, customer service flows, and automated response systems.', 'video-audio-voice', 'https://images.unsplash.com/photo-1589578527967-67ecab9b246d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Mic', false, true, false, 97, true, false, 240),
  ('talk-to-your-business-ai', 'Talk To Your Business AI', 'Allows users to create a conversational AI assistant that can answer questions about their business, documents, or knowledgebase.', 'video-audio-voice', 'https://images.unsplash.com/photo-1589578527967-67ecab9b246d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'MessageSquare', false, true, false, 97, true, false, 250),
  ('ai-audio-guide-creator', 'AI Audio Guide Creator', 'Creates guided audio tours, location-based narrations, educational walkthroughs, and spoken experiences.', 'video-audio-voice', 'https://images.unsplash.com/photo-1589578527967-67ecab9b246d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Mic', false, true, false, 97, true, false, 260),
  ('ai-intake-voice-agent', 'AI Intake Voice Agent', 'Helps businesses collect client information through structured intake conversations and voice-style workflows.', 'video-audio-voice', 'https://images.unsplash.com/photo-1589578527967-67ecab9b246d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Mic', false, true, false, 97, true, false, 270),
  ('ai-dictation-assistant', 'AI Dictation Assistant', 'Turns spoken ideas, notes, or dictation into organized text, summaries, emails, and documents.', 'video-audio-voice', 'https://images.unsplash.com/photo-1589578527967-67ecab9b246d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Mic', false, true, false, 97, true, false, 280),
  ('ai-music-jingle-assistant', 'AI Music & Jingle Assistant', 'Creates music concepts, brand jingles, audio hooks, podcast intros, and promotional sound ideas.', 'video-audio-voice', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Mic', false, true, false, 97, true, false, 290),

  -- RAG, Knowledgebase & Document Chat Apps
  ('business-knowledgebase-ai', 'Business Knowledgebase AI', 'Lets businesses create an AI assistant trained on their own documents, websites, FAQs, and internal information.', 'rag-knowledgebase', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Database', true, false, false, 97, true, true, 300),
  ('pdf-business-assistant', 'PDF Business Assistant', 'Allows users to chat with PDFs, summarize documents, extract key points, and turn documents into usable business content.', 'rag-knowledgebase', 'https://images.unsplash.com/photo-1455390528084-8b85e4bcd271?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'FileText', false, true, false, 97, true, false, 310),
  ('research-paper-assistant', 'Research Paper Assistant', 'Helps users understand, summarize, and extract insights from research papers and academic documents.', 'rag-knowledgebase', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'BookOpen', false, true, false, 97, true, false, 320),
  ('codebase-chat-ai', 'Codebase Chat AI', 'Lets users ask questions about code repositories, understand files, and get help navigating development projects.', 'rag-knowledgebase', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Code', false, true, false, 97, true, false, 330),
  ('gmail-intelligence-ai', 'Gmail Intelligence AI', 'Helps users analyze, summarize, search, and respond to Gmail conversations with AI assistance.', 'rag-knowledgebase', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Mail', false, true, false, 97, true, false, 340),
  ('video-knowledge-assistant', 'Video Knowledge Assistant', 'Turns video content into searchable knowledge, summaries, key points, and training material.', 'rag-knowledgebase', 'https://images.unsplash.com/photo-1493711662062-fa9a0ceca13e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Video', false, true, false, 97, true, false, 350),
  ('blog-knowledge-search-ai', 'Blog Knowledge Search AI', 'Lets users search and analyze blog content, articles, or written libraries using AI.', 'rag-knowledgebase', 'https://images.unsplash.com/photo-1499750310101-6cda608e867c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Search', false, true, false, 97, true, false, 360),
  ('visual-document-ai', 'Visual Document AI', 'Helps users analyze images, screenshots, diagrams, visual documents, and multimodal business files.', 'rag-knowledgebase', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Image', false, true, false, 97, true, false, 370),
  ('citation-knowledgebase-ai', 'Citation Knowledgebase AI', 'Creates AI answers with citations from documents, knowledgebases, research files, and business content.', 'rag-knowledgebase', 'https://images.unsplash.com/photo-1455390528084-8b85e4bcd271?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'FileText', false, true, false, 97, true, false, 380),
  ('smart-search-ai', 'Smart Search AI', 'Combines keyword search and AI search to find better answers across business content and documents.', 'rag-knowledgebase', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Search', false, true, false, 97, true, false, 390),
  ('private-company-ai-assistant', 'Private Company AI Assistant', 'A private AI assistant that can answer questions using company-specific data and documents.', 'rag-knowledgebase', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Database', false, true, false, 97, true, false, 400),
  ('multimodal-knowledge-ai', 'Multimodal Knowledge AI', 'Works with text, images, documents, screenshots, and mixed media to create smarter business answers.', 'rag-knowledgebase', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Image', false, true, false, 97, true, false, 410),
  ('ai-knowledgebase-debugger', 'AI Knowledgebase Debugger', 'Helps identify why a knowledgebase, chatbot, or RAG system is giving weak, incomplete, or incorrect answers.', 'rag-knowledgebase', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Code', false, true, false, 97, true, false, 420),

  -- Real Estate, Home Services & Local Business Apps
  ('real-estate-marketing-ai', 'Real Estate Marketing AI', 'Creates property descriptions, listing content, buyer emails, seller outreach, neighborhood content, and real estate marketing assets.', 'realestate-local', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Home', true, false, false, 97, true, true, 430),
  ('home-renovation-visualizer-ai', 'Home Renovation Visualizer AI', 'Helps users create renovation ideas, project concepts, room improvement plans, and visual transformation prompts.', 'realestate-local', 'https://images.unsplash.com/photo-1581858726785-95f9523b1f6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Home', false, true, false, 97, true, false, 440),
  ('travel-planner-ai', 'Travel Planner AI', 'Creates travel plans, itineraries, destination guides, trip ideas, and customer travel recommendations.', 'realestate-local', 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Plane', false, true, false, 97, true, false, 450),
  ('local-tour-guide-ai', 'Local Tour Guide AI', 'Creates audio tours, local guides, attraction descriptions, city walkthroughs, and tourism content.', 'realestate-local', 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'MapPin', false, true, false, 97, true, false, 460),
  ('local-business-voice-assistant', 'Local Business Voice Assistant', 'Helps local businesses create voice-based customer support, appointment assistance, FAQs, and service explanations.', 'realestate-local', 'https://images.unsplash.com/photo-1589578527967-67ecab9b246d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Mic', false, true, false, 97, true, false, 470),
  ('local-business-growth-advisor', 'Local Business Growth Advisor', 'Gives local businesses marketing, sales, offer, and customer acquisition ideas.', 'realestate-local', 'https://images.unsplash.com/photo-1552664730-d307ca44d61b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'TrendingUp', false, true, false, 97, true, false, 480),
  ('local-business-analytics-ai', 'Local Business Analytics AI', 'Analyzes business data, performance trends, marketing numbers, and customer insights for local companies.', 'realestate-local', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'BarChart2', false, true, false, 97, true, false, 490),

  -- HR, Hiring & Recruiting Apps
  ('ai-hiring-assistant', 'AI Hiring Assistant', 'Helps businesses screen candidates, write job posts, compare applicants, and improve hiring workflows.', 'hr-hiring', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'UserCheck', true, false, false, 97, true, true, 500),
  ('resume-analyzer-ai', 'Resume Analyzer AI', 'Analyzes resumes, summarizes candidate strengths, identifies gaps, and helps match applicants to roles.', 'hr-hiring', 'https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'FileText', false, true, false, 97, true, false, 510),
  ('candidate-decision-ai', 'Candidate Decision AI', 'Helps compare candidates and make better hiring decisions based on skills, experience, and job fit.', 'hr-hiring', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'UserCheck', false, true, false, 97, true, false, 520),
  ('candidate-outreach-ai', 'Candidate Outreach AI', 'Writes recruiting emails, interview invitations, follow-ups, and candidate communication.', 'hr-hiring', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Mail', false, true, false, 97, true, false, 530),
  ('interview-summary-ai', 'Interview Summary AI', 'Turns interview notes or meeting transcripts into summaries, candidate evaluations, and hiring recommendations.', 'hr-hiring', 'https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'FileText', false, true, false, 97, true, false, 540),
  ('hiring-plan-builder', 'Hiring Plan Builder', 'Creates hiring plans, role requirements, interview steps, onboarding plans, and recruiting workflows.', 'hr-hiring', 'https://images.unsplash.com/photo-1552664730-d307ca44d61b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Layers', false, true, false, 97, true, false, 550),

  -- Finance, Business Planning & Investment Apps
  ('finance-research-ai', 'Finance Research AI', 'Researches financial topics, market information, companies, trends, and business opportunities.', 'finance-business', 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'DollarSign', false, true, false, 97, true, false, 560),
  ('business-finance-ai-team', 'Business Finance AI Team', 'Acts like a team of AI finance assistants for planning, analysis, forecasting, and business finance decisions.', 'finance-business', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'BarChart2', true, false, false, 97, true, true, 570),
  ('profit-coach-ai', 'Profit Coach AI', 'Helps users improve profits by analyzing pricing, costs, offers, revenue streams, and business strategy.', 'finance-business', 'https://images.unsplash.com/photo-1552664730-d307ca44d61b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'TrendingUp', false, true, false, 97, true, false, 580),
  ('investment-research-assistant', 'Investment Research Assistant', 'Helps users research companies, markets, opportunities, risks, and investment-related information.', 'finance-business', 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'DollarSign', false, true, false, 97, true, false, 590),
  ('startup-due-diligence-ai', 'Startup Due Diligence AI', 'Analyzes startups, business models, risks, markets, teams, and opportunities for investment or partnership decisions.', 'finance-business', 'https://images.unsplash.com/photo-1559136555-9303baea6ebd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Search', false, true, false, 97, true, false, 600),
  ('revenue-data-analyst-ai', 'Revenue Data Analyst AI', 'Analyzes sales, revenue, customer, and performance data to identify trends and growth opportunities.', 'finance-business', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'BarChart2', false, true, false, 97, true, false, 610),
  ('financial-dashboard-ai', 'Financial Dashboard AI', 'Helps users create financial reports, dashboards, charts, and business performance summaries.', 'finance-business', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Monitor', false, true, false, 97, true, false, 620),

  -- Legal, Compliance & Risk Apps
  ('contract-summary-ai', 'Contract Summary AI', 'Summarizes contracts, highlights important clauses, explains key terms, and helps users understand agreements.', 'legal-compliance', 'https://images.unsplash.com/photo-1589578527967-67ecab9b246d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'FileSignature', true, false, false, 97, true, true, 630),
  ('legal-pdf-explainer', 'Legal PDF Explainer', 'Explains legal documents, policies, contracts, and PDF files in simple business-friendly language.', 'legal-compliance', 'https://images.unsplash.com/photo-1455390528084-8b85e4bcd271?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'FileText', false, true, false, 97, true, false, 640),
  ('policy-compliance-assistant', 'Policy & Compliance Assistant', 'Helps businesses understand policies, compliance documents, internal rules, and regulatory requirements.', 'legal-compliance', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Shield', false, true, false, 97, true, false, 650),
  ('claim-checker-ai', 'Claim Checker AI', 'Checks claims, statements, facts, and business content for accuracy and consistency.', 'legal-compliance', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Search', false, true, false, 97, true, false, 660),
  ('fraud-investigation-assistant', 'Fraud Investigation Assistant', 'Helps review suspicious activity, organize evidence, summarize issues, and support fraud-related investigations.', 'legal-compliance', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Search', false, true, false, 97, true, false, 670),
  ('risk-decision-ai', 'Risk Decision AI', 'Helps users evaluate risks, compare options, and make better business or operational decisions.', 'legal-compliance', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Shield', false, true, false, 97, true, false, 680),

  -- Coding, Developer & SaaS Builder Apps
  ('ai-app-builder-assistant', 'AI App Builder Assistant', 'Helps users plan, build, improve, and troubleshoot apps using AI-guided development support.', 'coding-developer', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Code', true, false, false, 97, true, true, 690),
  ('ai-saas-architect', 'AI SaaS Architect', 'Creates SaaS architecture plans, feature maps, database structures, workflows, and technical build strategies.', 'coding-developer', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Layers', false, true, false, 97, true, false, 700),
  ('ai-code-review-pro', 'AI Code Review Pro', 'Reviews code, finds issues, suggests improvements, and helps make apps more stable.', 'coding-developer', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Code', false, true, false, 97, true, false, 710),
  ('ai-bug-fixer', 'AI Bug Fixer', 'Helps diagnose errors, explain bugs, and generate fixes for code problems.', 'coding-developer', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Code', false, true, false, 97, true, false, 720),
  ('ai-fullstack-builder', 'AI Fullstack Builder', 'Assists with frontend, backend, database, API, and full-stack app development tasks.', 'coding-developer', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Code', false, true, false, 97, true, false, 730),
  ('python-fixer-ai', 'Python Fixer AI', 'Helps debug, explain, and improve Python scripts, apps, and automation workflows.', 'coding-developer', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Code', false, true, false, 97, true, false, 740),
  ('github-repo-assistant', 'GitHub Repo Assistant', 'Lets users understand GitHub repositories, review files, summarize code, and plan improvements.', 'coding-developer', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Code', false, true, false, 97, true, false, 750),
  ('github-automation-agent', 'GitHub Automation Agent', 'Helps automate GitHub-related tasks, repo updates, issue workflows, and development processes.', 'coding-developer', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Code', false, true, false, 97, true, false, 760),
  ('build-plan-generator', 'Build Plan Generator', 'Creates step-by-step build plans for apps, SaaS products, tools, and technical projects.', 'coding-developer', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Layers', false, true, false, 97, true, false, 770),
  ('sprint-planner-ai', 'Sprint Planner AI', 'Creates development sprints, task lists, milestones, feature priorities, and project timelines.', 'coding-developer', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Layers', false, true, false, 97, true, false, 780),

  -- Design, UI/UX & Landing Page Apps
  ('ai-design-studio', 'AI Design Studio', 'Helps users create design concepts, visual directions, layouts, brand styles, and creative assets.', 'design-uiux', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Palette', true, false, false, 97, true, true, 790),
  ('landing-page-critic-ai', 'Landing Page Critic AI', 'Reviews landing pages and gives feedback on design, messaging, layout, clarity, and conversion improvements.', 'design-uiux', 'https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'LayoutTemplate', false, true, false, 97, true, false, 800),
  ('ai-ux-designer', 'AI UX Designer', 'Helps improve user experience, app flows, page layouts, navigation, and interface structure.', 'design-uiux', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Palette', false, true, false, 97, true, false, 810),
  ('dashboard-designer-ai', 'Dashboard Designer AI', 'Creates dashboard layouts, data visualization ideas, SaaS UI concepts, and reporting screens.', 'design-uiux', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Monitor', false, true, false, 97, true, false, 820),
  ('landing-page-copy-ai', 'Landing Page Copy AI', 'Writes landing page headlines, sections, CTAs, offer copy, and conversion-focused messaging.', 'design-uiux', 'https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'FileText', false, true, false, 97, true, false, 830),
  ('conversion-copy-editor', 'Conversion Copy Editor', 'Improves sales copy, landing page content, emails, ads, and promotional messaging for better conversions.', 'design-uiux', 'https://images.unsplash.com/photo-1455390528084-8b85e4bcd271?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Edit', false, true, false, 97, true, false, 840),

  -- Research, Education & Training Apps
  ('research-assistant-ai', 'Research Assistant AI', 'Helps users research topics, summarize information, organize findings, and create useful business insights.', 'research-education', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Search', true, false, false, 97, true, true, 850),
  ('deep-research-pro', 'Deep Research Pro', 'Performs deeper research across topics, markets, competitors, trends, products, and opportunities.', 'research-education', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Search', false, true, false, 97, true, false, 860),
  ('research-planner-ai', 'Research Planner AI', 'Creates research plans, outlines steps, organizes sources, and helps users complete complex research projects.', 'research-education', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Layers', false, true, false, 97, true, false, 870),
  ('ai-course-creator-assistant', 'AI Course Creator Assistant', 'Helps users create courses, lessons, modules, worksheets, training content, and educational programs.', 'research-education', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'BookOpen', false, true, false, 97, true, false, 880),
  ('academic-research-ai', 'Academic Research AI', 'Helps summarize academic material, explain research concepts, and organize scholarly information.', 'research-education', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'BookOpen', false, true, false, 97, true, false, 890),
  ('market-research-ai', 'Market Research AI', 'Helps users research niches, customer needs, competitors, trends, offers, and business opportunities.', 'research-education', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Search', false, true, false, 97, true, false, 900),
  ('fact-check-ai', 'Fact Check AI', 'Checks facts, claims, statistics, and content for accuracy before publishing or using in marketing.', 'research-education', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Search', false, true, false, 97, true, false, 910),
  ('research-memory-assistant', 'Research Memory Assistant', 'Stores and organizes research context so users can continue projects with better continuity.', 'research-education', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Database', false, true, false, 97, true, false, 920),

  -- Productivity, Memory & Personal Assistant Apps
  ('personal-ai-memory-assistant', 'Personal AI Memory Assistant', 'Remembers useful user preferences, projects, notes, and context to provide more personalized help.', 'productivity-personal', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'UserCircle', true, false, false, 97, true, true, 930),
  ('multi-ai-memory-hub', 'Multi-AI Memory Hub', 'Allows multiple AI assistants or tools to share memory and context across workflows.', 'productivity-personal', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Database', false, true, false, 97, true, false, 940),
  ('private-ai-chat-with-memory', 'Private AI Chat With Memory', 'A private chatbot experience that remembers conversations, projects, and user-specific information.', 'productivity-personal', 'https://images.unsplash.com/photo-1589578527967-67ecab9b246d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'MessageSquare', false, true, false, 97, true, false, 950),
  ('private-chatgpt-clone', 'Private ChatGPT Clone', 'A private AI assistant users can customize for their own business, knowledge, and workflows.', 'productivity-personal', 'https://images.unsplash.com/photo-1589578527967-67ecab9b246d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'MessageSquare', false, true, false, 97, true, false, 960),
  ('travel-concierge-ai', 'Travel Concierge AI', 'Creates personalized travel ideas, itineraries, plans, reminders, and trip recommendations.', 'productivity-personal', 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Plane', false, true, false, 97, true, false, 970),
  ('browser-task-agent', 'Browser Task Agent', 'Helps users complete browser-based tasks, research workflows, online actions, and web productivity steps.', 'productivity-personal', 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Globe', false, true, false, 97, true, false, 980),
  ('ai-tool-router', 'AI Tool Router', 'Routes tasks to the right AI tool, assistant, or workflow based on what the user wants to accomplish.', 'productivity-personal', 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Settings', false, true, false, 97, true, false, 990),
  ('notion-workspace-ai', 'Notion Workspace AI', 'Helps organize Notion workspaces, notes, documents, projects, and knowledge systems.', 'productivity-personal', 'https://images.unsplash.com/photo-1455390528084-8b85e4bcd271?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'FileText', false, true, false, 97, true, false, 1000),
  ('email-memory-assistant', 'Email Memory Assistant', 'Helps users remember, summarize, organize, and act on important email conversations.', 'productivity-personal', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Mail', false, true, false, 97, true, false, 1010)
ON CONFLICT (slug)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  image = COALESCE(EXCLUDED.image, apps.image),
  icon = COALESCE(EXCLUDED.icon, apps.icon),
  popular = EXCLUDED.popular,
  new = EXCLUDED.new,
  coming_soon = EXCLUDED.coming_soon,
  price = COALESCE(EXCLUDED.price, apps.price, 97),
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order;