/*
  # Sync Authoritative App Names from appsData.ts

  This migration ensures the live Supabase `apps` table has the exact
  VideoRemix-curated display names that are in the frontend source of truth
  (src/data/appsData.ts).

  The 116 internal AI apps (plus overflow apps and catalog apps)
  had their display names curated in src/data/appsData.ts.
  This pushes those names into the production Supabase database.

  Generated: 2026-05-23T17:20:16.332Z
  Safe to run multiple times (idempotent).
*/

UPDATE apps AS target
SET name = src.name
FROM (
  VALUES
    (E'ai-sales-intelligence-pro', E'AI Sales Intelligence Pro'),
    (E'lead-research-scraper-ai', E'Lead Research Scraper AI'),
    (E'ai-business-growth-consultant', E'AI Business Growth Consultant'),
    (E'ai-strategy-advisor', E'AI Strategy Advisor'),
    (E'ai-sales-email-writer', E'AI Sales Email Writer'),
    (E'ai-offer-decision-helper', E'AI Offer Decision Helper'),
    (E'launch-campaign-builder-ai', E'Launch Campaign Builder AI'),
    (E'competitor-spy-ai', E'Competitor Spy AI'),
    (E'ai-agency-builder-suite', E'AI Agency Builder Suite'),
    (E'sales-call-follow-up-ai', E'Sales Call Follow-Up AI'),
    (E'blog-to-podcast-ai', E'Blog To Podcast AI'),
    (E'daily-content-engine-ai', E'Daily Content Engine AI'),
    (E'ai-content-creator-pro', E'AI Content Creator Pro'),
    (E'ai-content-editor', E'AI Content Editor'),
    (E'ai-documentation-writer', E'AI Documentation Writer'),
    (E'youtube-repurposer-ai', E'YouTube Repurposer AI'),
    (E'newsletter-repurposer-ai', E'Newsletter Repurposer AI'),
    (E'ai-news-content-writer', E'AI News Content Writer'),
    (E'ai-video-script-producer', E'AI Video Script Producer'),
    (E'ai-music-idea-generator', E'AI Music Idea Generator'),
    (E'ai-film-producer', E'AI Film Producer'),
    (E'podcast-creator-ai', E'Podcast Creator AI'),
    (E'news-to-podcast-ai', E'News-To-Podcast AI'),
    (E'ai-voice-support-agent', E'AI Voice Support Agent'),
    (E'talk-to-your-business-ai', E'Talk To Your Business AI'),
    (E'ai-audio-guide-creator', E'AI Audio Guide Creator'),
    (E'ai-intake-voice-agent', E'AI Intake Voice Agent'),
    (E'ai-dictation-assistant', E'AI Dictation Assistant'),
    (E'ai-music-jingle-assistant', E'AI Music & Jingle Assistant'),
    (E'business-knowledgebase-ai', E'Business Knowledgebase AI'),
    (E'pdf-business-assistant', E'PDF Business Assistant'),
    (E'research-paper-assistant', E'Research Paper Assistant'),
    (E'codebase-chat-ai', E'Codebase Chat AI'),
    (E'gmail-intelligence-ai', E'Gmail Intelligence AI'),
    (E'video-knowledge-assistant', E'Video Knowledge Assistant'),
    (E'blog-knowledge-search-ai', E'Blog Knowledge Search AI'),
    (E'visual-document-ai', E'Visual Document AI'),
    (E'citation-knowledgebase-ai', E'Citation Knowledgebase AI'),
    (E'smart-search-ai', E'Smart Search AI'),
    (E'private-company-ai-assistant', E'Private Company AI Assistant'),
    (E'multimodal-knowledge-ai', E'Multimodal Knowledge AI'),
    (E'ai-knowledgebase-debugger', E'AI Knowledgebase Debugger'),
    (E'real-estate-marketing-ai', E'Real Estate Marketing AI'),
    (E'home-renovation-visualizer-ai', E'Home Renovation Visualizer AI'),
    (E'travel-planner-ai', E'Travel Planner AI'),
    (E'local-tour-guide-ai', E'Local Tour Guide AI'),
    (E'local-business-voice-assistant', E'Local Business Voice Assistant'),
    (E'local-business-growth-advisor', E'Local Business Growth Advisor'),
    (E'local-business-analytics-ai', E'Local Business Analytics AI'),
    (E'ai-hiring-assistant', E'AI Hiring Assistant'),
    (E'resume-analyzer-ai', E'Resume Analyzer AI'),
    (E'candidate-decision-ai', E'Candidate Decision AI'),
    (E'candidate-outreach-ai', E'Candidate Outreach AI'),
    (E'interview-summary-ai', E'Interview Summary AI'),
    (E'hiring-plan-builder', E'Hiring Plan Builder'),
    (E'finance-research-ai', E'Finance Research AI'),
    (E'business-finance-ai-team', E'Business Finance AI Team'),
    (E'profit-coach-ai', E'Profit Coach AI'),
    (E'investment-research-assistant', E'Investment Research Assistant'),
    (E'startup-due-diligence-ai', E'Startup Due Diligence AI'),
    (E'revenue-data-analyst-ai', E'Revenue Data Analyst AI'),
    (E'financial-dashboard-ai', E'Financial Dashboard AI'),
    (E'contract-summary-ai', E'Contract Summary AI'),
    (E'legal-pdf-explainer', E'Legal PDF Explainer'),
    (E'policy-compliance-assistant', E'Policy & Compliance Assistant'),
    (E'claim-checker-ai', E'Claim Checker AI'),
    (E'fraud-investigation-assistant', E'Fraud Investigation Assistant'),
    (E'risk-decision-ai', E'Risk Decision AI'),
    (E'ai-app-builder-assistant', E'AI App Builder Assistant'),
    (E'ai-saas-architect', E'AI SaaS Architect'),
    (E'ai-code-review-pro', E'AI Code Review Pro'),
    (E'ai-bug-fixer', E'AI Bug Fixer'),
    (E'ai-fullstack-builder', E'AI Fullstack Builder'),
    (E'python-fixer-ai', E'Python Fixer AI'),
    (E'github-repo-assistant', E'GitHub Repo Assistant'),
    (E'github-automation-agent', E'GitHub Automation Agent'),
    (E'build-plan-generator', E'Build Plan Generator'),
    (E'sprint-planner-ai', E'Sprint Planner AI'),
    (E'ai-design-studio', E'AI Design Studio'),
    (E'landing-page-critic-ai', E'Landing Page Critic AI'),
    (E'ai-ux-designer', E'AI UX Designer'),
    (E'dashboard-designer-ai', E'Dashboard Designer AI'),
    (E'landing-page-copy-ai', E'Landing Page Copy AI'),
    (E'conversion-copy-editor', E'Conversion Copy Editor'),
    (E'research-assistant-ai', E'Research Assistant AI'),
    (E'deep-research-pro', E'Deep Research Pro'),
    (E'research-planner-ai', E'Research Planner AI'),
    (E'ai-course-creator-assistant', E'AI Course Creator Assistant'),
    (E'academic-research-ai', E'Academic Research AI'),
    (E'market-research-ai', E'Market Research AI'),
    (E'fact-check-ai', E'Fact Check AI'),
    (E'research-memory-assistant', E'Research Memory Assistant'),
    (E'personal-ai-memory-assistant', E'Personal AI Memory Assistant'),
    (E'multi-ai-memory-hub', E'Multi-AI Memory Hub'),
    (E'private-ai-chat-with-memory', E'Private AI Chat With Memory'),
    (E'private-chatgpt-clone', E'Private ChatGPT Clone'),
    (E'travel-concierge-ai', E'Travel Concierge AI'),
    (E'browser-task-agent', E'Browser Task Agent'),
    (E'ai-tool-router', E'AI Tool Router'),
    (E'notion-workspace-ai', E'Notion Workspace AI'),
    (E'email-memory-assistant', E'Email Memory Assistant'),
    (E'ai-personalized-content', E'AI Personalized Content'),
    (E'ai-referral-maximizer-pro', E'AI Referral Maximizer Pro'),
    (E'ai-sales-maximizer', E'AI Sales Maximizer'),
    (E'ai-screen-recorder', E'AI Screen Recorder'),
    (E'smart-crm-closer-pro', E'Smart CRM Closer Pro'),
    (E'video-ai-editor-pro', E'Video AI Editor Pro'),
    (E'ai-video-image-pro', E'AI Video & Image Pro'),
    (E'ai-skills-monetizer-pro', E'AI Skills Monetizer Pro'),
    (E'ai-signature-pro', E'AI Signature Pro'),
    (E'personalizer-profile-generator', E'Personalizer AI Profile Generator'),
    (E'personalizer-transformer', E'Personalizer AI Video & Image Transformer'),
    (E'personalizer-url-templates', E'Personalizer URL Video Generation Templates & Editor'),
    (E'ai-proposal-generator', E'AI Proposal'),
    (E'sales-assistant-platform', E'Sales Assistant Platform'),
    (E'sales-page-builder-pro', E'Sales Page Builder Pro')
  ) AS src(slug, name)
WHERE target.slug = src.slug;

DO $$
DECLARE
  updated_count integer;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'App name sync complete. % rows updated (or matched).', updated_count;
END $$;
