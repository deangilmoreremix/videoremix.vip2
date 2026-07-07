import { generatedThumbnails } from '../data/generatedThumbnails';

// Build a map of AI-generated thumbnail URLs for instant lookup
const aiThumbnailMap = new Map<string, string>();
generatedThumbnails.forEach(thumb => {
  aiThumbnailMap.set(thumb.metadata.appId, thumb.url);
});

/**
 * Centralized App URL Configuration
 *
 * Single source of truth for all ai-design-studio URLs and thumbnail images.
 * Maps ai-design-studio IDs to their corresponding videoremix.vip subdomain URLs.
 * 
 * The 17 new apps as specified:
 * - AI Personalized Content Hub: https://ai-sales-email-writer-intelligence-pro.videoremix.vip
 * - FunnelCraft AI: https://ai-funnelcraft.videoremix.vip
 * - AI Skills Monetizer: https://daily-content-engine-ai.videoremix.vip
 * - AI Skills & Resume: https://ai-skills.videoremix.vip
 * - Sales Page Builder: https://ai-salespage.videoremix.vip
 * - Sales Assistant Pro: https://ai-salesassistant.videoremix.vip
 * - AI Personalization Studio: https://ai-personalizationstudio.videoremix.vip
 * - AI Personalizer: https://ai-personalizer.videoremix.vip
 * - AI Video Transformer: https://ai-video-transformer.videoremix.vip
 * - AI Screen Recorder: https://ai-screenrecorder.videoremix.vip
 * - AI Signature: https://ai-content-creator-pro.videoremix.vip
 * - AI Thumbnail Generator: https://ai-thumbnail-generator.videoremix.vip
 * - Profile Gen: https://ai-profilegen.videoremix.vip
 * - AI Video Editor: https://ai-videoeditor.videoremix.vip
 * - AI Referral Maximizer Pro: https://referrals.smartcrm.vip
 * - AI Sales Maximizer: https://salesmax.smartcrm.vip
 * - ContentAI: https://contentai.smartcrm.vip
 * - Product Research AI: https://research.smartcrm.vip
 */

export const APP_URLS: Record<string, string> = {
  // =====================================================
  // NEW 17 APPS - As Specified by User
  // =====================================================

  // AI Personalized Content Hub
  "ai-personalized-content": "https://ai-sales-email-writer-intelligence-pro.videoremix.vip",

  // FunnelCraft AI
  "launch-campaign-builder-ai": "https://ai-funnelcraft.videoremix.vip",

  // AI Skills Monetizer
  "daily-content-engine-ai": "https://daily-content-engine-ai.videoremix.vip",

  // AI Skills & Resume
  "ai-skills-resume": "https://ai-skills.videoremix.vip",
  "resume-amplifier": "https://ai-skills.videoremix.vip",
  "voice-coach": "https://ai-skills.videoremix.vip",

  // Sales Page Builder
  "sales-call-follow-up-ai": "https://ai-salespage.videoremix.vip",
  "landing-page": "https://ai-salespage.videoremix.vip",

  // Sales Assistant Pro
  "sales-assistant-pro": "https://ai-salesassistant.videoremix.vip",
  "ai-agency-builder-suite": "https://ai-salesassistant.videoremix.vip",
  "ai-sales-email-writer-email-writer": "https://ai-salesassistant.videoremix.vip",
  "sales-monetizer": "https://ai-salesassistant.videoremix.vip",

  // AI Personalization Studio
  "ai-personalization-studio": "https://ai-personalizationstudio.videoremix.vip",
  "ai-art": "https://ai-personalizationstudio.videoremix.vip",
  "rebrander-ai": "https://ai-personalizationstudio.videoremix.vip",
  "business-brander": "https://ai-personalizationstudio.videoremix.vip",
  "branding-analyzer": "https://ai-personalizationstudio.videoremix.vip",
  "ai-branding": "https://ai-personalizationstudio.videoremix.vip",
  "bg-remover": "https://ai-personalizationstudio.videoremix.vip",
  "ai-image-tools": "https://ai-personalizationstudio.videoremix.vip",
  "smart-presentations": "https://ai-personalizationstudio.videoremix.vip",
  "interactive-outros": "https://ai-personalizationstudio.videoremix.vip",
  "social-pack": "https://ai-personalizationstudio.videoremix.vip",
  "storyboard": "https://ai-personalizationstudio.videoremix.vip",

  // AI Personalizer
  "ai-personalizer": "https://ai-personalizer.videoremix.vip",
  "ai-documentation-writer": "https://ai-personalizer.videoremix.vip",

  // AI Video Transformer
  "ai-video-transformer": "https://ai-video-transformer.videoremix.vip",
  "youtube-repurposer-ai": "https://ai-video-transformer.videoremix.vip",

  // AI Screen Recorder
  "ai-screen-recorder": "https://ai-screenrecorder.videoremix.vip",
  "blog-to-podcast-ai": "https://ai-screenrecorder.videoremix.vip",

  // AI Signature
  "ai-content-creator-pro": "https://ai-content-creator-pro.videoremix.vip",

  // AI Thumbnail Generator
  "ai-thumbnail-generator": "https://ai-thumbnail-generator.videoremix.vip",
  "thumbnail-generator": "https://ai-thumbnail-generator.videoremix.vip",

  // Profile Gen
  "profile-gen": "https://ai-profilegen.videoremix.vip",
  "ai-documentation-writer-generator": "https://ai-profilegen.videoremix.vip",

  // AI Video Editor
"ai-video-editor": "https://ai-videoeditor.videoremix.vip",
  "lead-research-scraper-ai": "https://ai-videoeditor.videoremix.vip",

  // AI Referral Maximizer Pro
  "ai-strategy-advisor": "https://referrals.smartcrm.vip",
  "ai-referral-max-pro-alt": "https://referrals.smartcrm.vip",

  // AI Sales Maximizer
  "ai-sales-email-writer-maximizer": "https://salesmax.smartcrm.vip",
  "ai-offer-decision-helper": "https://salesmax.smartcrm.vip",

  // ContentAI
  "contentai": "https://contentai.smartcrm.vip",
  "ai-content": "https://contentai.smartcrm.vip",

  // Product Research AI
"product-research-ai": "https://research.smartcrm.vip",

   // =====================================================
   // 16 NETLIFY SPECIAL URL APPS
   // =====================================================
   "ai-personalized-content-pro": "https://capable-mermaid-3c73fa.netlify.ai-design-studio/",
   "ai-strategy-advisor-pro": "https://eloquent-kleicha-7e3a3e.netlify.ai-design-studio",
   "ai-sales-email-writer-maximizer-pro": "https://magnificent-lamington-619374.netlify.ai-design-studio/",
   "ai-screen-recorder-pro": "https://adorable-arithmetic-675d28.netlify.ai-design-studio/",
   "ai-offer-decision-helper-pro": "https://stupendous-twilight-64389a.netlify.ai-design-studio/",
   "lead-research-scraper-ai-pro": "https://heroic-seahorse-296f32.netlify.ai-design-studio/",
   "ai-business-growth-consultant-pro": "https://thriving-mochi-ecd815.netlify.ai-design-studio/",
   "daily-content-engine-ai-pro": "https://roaring-mochi-39a60a.netlify.ai-design-studio",
   "ai-content-creator-pro-pro": "https://kaleidoscopic-tarsier-3d0a6c.netlify.ai-design-studio/",
   "ai-documentation-writer-generator-special": "https://endearing-churros-2ce8c6.netlify.ai-design-studio/",
   "personalizer-transformer": "https://thriving-mochi-ecd815.netlify.ai-design-studio/",
   "personalizer-url-templates": "https://cute-khapse-4e62cb.netlify.ai-design-studio/",
   "competitor-spy-ai-generator": "https://keen-pastelito-6b9074.netlify.ai-design-studio",
   "sales-assistant-platform": "https://gentle-frangipane-ceed17.netlify.ai-design-studio",
    "sales-call-follow-up-ai-pro": "https://prismatic-starship-c0b4c2.netlify.ai-design-studio",
    "ai-content-studio": "https://sparkling-druid-4a8b1d.netlify.ai-design-studio",
    "academic-researcher": "/ai-app/academic-researcher",
    "ai-blog-to-podcast-agent": "/ai-app/ai-blog-to-podcast-agent",
    "ai-consultant-agent": "/ai-app/ai-consultant-agent",
    "ai-dashboard-canvas-agent": "/ai-app/ai-dashboard-canvas-agent",
    "ai-finance-agent-team": "/ai-app/ai-finance-agent-team",
    "ai-home-renovation-agent": "/ai-app/ai-home-renovation-agent",
    "ai-investment-agent": "/ai-app/ai-investment-agent",
    "ai-mcp-app-builder": "/ai-app/ai-mcp-app-builder",
    "ai-news-and-podcast-agents": "/ai-app/ai-news-and-podcast-agents",
    "ai-sales-intelligence-agent-team": "/ai-app/ai-sales-intelligence-agent-team",
    "ai-self-evolving-agent": "/ai-app/ai-self-evolving-agent",
    "ai-shadcn-component-generator": "/ai-app/ai-shadcn-component-generator",
    "ai-travel-planner-agent-team": "/ai-app/ai-travel-planner-agent-team",
    "ai-vc-due-diligence-agent-team": "/ai-app/ai-vc-due-diligence-agent-team",
    "always-on-hn-briefing-agent": "/ai-app/always-on-hn-briefing-agent",
    "code-reviewer": "/ai-app/code-reviewer",
    "content-creator": "/ai-app/content-creator",
    "data-analyst": "/ai-app/data-analyst",
    "debugger": "/ai-app/debugger",
    "decision-helper": "/ai-app/decision-helper",
    "deep-research": "/ai-app/deep-research",
    "earnings-call-analyst-agent": "/ai-app/earnings-call-analyst-agent",
    "editor": "/ai-app/editor",
    "email-drafter": "/ai-app/email-drafter",
    "fact-checker": "/ai-app/fact-checker",
    "fullstack-developer": "/ai-app/fullstack-developer",
    "gemma3-finetuning": "/ai-app/gemma3-finetuning",
    "generative-ui-starter-project": "/ai-app/generative-ui-starter-project",
    "google-adk-crash-course": "/ai-app/google-adk-crash-course",
    "headroom-context-optimization": "/ai-app/headroom-context-optimization",
    "insurance-claim-live-agent-team": "/ai-app/insurance-claim-live-agent-team",
    "knowledge-graph-rag-citations": "/ai-app/knowledge-graph-rag-citations",
    "llama3-stateful-chat": "/ai-app/llama3-stateful-chat",
    "llama3.1-local-rag": "/ai-app/llama3.1-local-rag",
    "llama3.2-finetuning": "/ai-app/llama3.2-finetuning",
    "llm-app-personalized-memory": "/ai-app/llm-app-personalized-memory",
    "local-chatgpt-with-memory": "/ai-app/local-chatgpt-with-memory",
    "local-hybrid-search-rag": "/ai-app/local-hybrid-search-rag",
    "local-rag-agent": "/ai-app/local-rag-agent",
    "mcp-apps-generative-ui-showcase": "/ai-app/mcp-apps-generative-ui-showcase",
    "meeting-notes": "/ai-app/meeting-notes",
    "mixture-of-agents": "/ai-app/mixture-of-agents",
    "multi-llm-memory": "/ai-app/multi-llm-memory",
    "multimodal-agentic-rag": "/ai-app/multimodal-agentic-rag",
    "multimodal-uiux-feedback-agent-team": "/ai-app/multimodal-uiux-feedback-agent-team",
    "notion-mcp-agent": "/ai-app/notion-mcp-agent",
    "openai-sdk-crash-course": "/ai-app/openai-sdk-crash-course",
    "project-planner": "/ai-app/project-planner",
    "python-expert": "/ai-app/python-expert",
    "rag-agent-cohere": "/ai-app/rag-agent-cohere",
    "rag-chain": "/ai-app/rag-chain",
    "rag-failure-diagnostics-clinic": "/ai-app/rag-failure-diagnostics-clinic",
    "sprint-planner": "/ai-app/sprint-planner",
    "strategy-advisor": "/ai-app/strategy-advisor",
    "technical-writer": "/ai-app/technical-writer",
    "ux-designer": "/ai-app/ux-designer",
    "vision-rag": "/ai-app/vision-rag",
    "visualization-expert": "/ai-app/visualization-expert",
    "ai-sales-email-writer": "/ai-app/ai-sales-email-writer",
    "ai-sales-intelligence-pro": "/ai-app/ai-sales-intelligence-pro",
    "ai-app-builder-assistant": "/ai-app/ai-app-builder-assistant",
  
  // === Internal AI Apps - /ai-app/:slug fallback routes ===
  "academic-research-ai": "/ai-app/academic-research-ai",
  "ai-ai-design-studio-builder-assistant": "/ai-app/ai-ai-design-studio-builder-assistant",
  "ai-audio-guide-creator": "/ai-app/ai-audio-guide-creator",
  "ai-bug-fixer": "/ai-app/ai-bug-fixer",
  "ai-business-growth-consultant": "/ai-app/ai-business-growth-consultant",
  "ai-code-review-pro": "/ai-app/ai-code-review-pro",
  "ai-content-editor": "/ai-app/ai-content-editor",
  "ai-course-creator-assistant": "/ai-app/ai-course-creator-assistant",
  "ai-design-studio": "/ai-app/ai-design-studio",
  "ai-dictation-assistant": "/ai-app/ai-dictation-assistant",
  "ai-film-producer": "/ai-app/ai-film-producer",
  "ai-fullstack-builder": "/ai-app/ai-fullstack-builder",
  "ai-hiring-assistant": "/ai-app/ai-hiring-assistant",
  "ai-intake-voice-agent": "/ai-app/ai-intake-voice-agent",
  "ai-knowledgebase-debugger": "/ai-app/ai-knowledgebase-debugger",
  "ai-music-idea-generator": "/ai-app/ai-music-idea-generator",
  "ai-music-jingle-assistant": "/ai-app/ai-music-jingle-assistant",
  "ai-news-content-writer": "/ai-app/ai-news-content-writer",
  "ai-saas-architect": "/ai-app/ai-saas-architect",
  "ai-sales-email-writer-intelligence-pro": "/ai-app/ai-sales-email-writer-intelligence-pro",
  "ai-tool-router": "/ai-app/ai-tool-router",
  "ai-ux-designer": "/ai-app/ai-ux-designer",
  "ai-video-script-producer": "/ai-app/ai-video-script-producer",
  "ai-voice-support-agent": "/ai-app/ai-voice-support-agent",
  "blog-knowledge-search-ai": "/ai-app/blog-knowledge-search-ai",
  "browser-task-agent": "/ai-app/browser-task-agent",
  "build-plan-generator": "/ai-app/build-plan-generator",
  "business-finance-ai-team": "/ai-app/business-finance-ai-team",
  "business-knowledgebase-ai": "/ai-app/business-knowledgebase-ai",
  "candidate-decision-ai": "/ai-app/candidate-decision-ai",
  "candidate-outreach-ai": "/ai-app/candidate-outreach-ai",
  "citation-knowledgebase-ai": "/ai-app/citation-knowledgebase-ai",
  "claim-checker-ai": "/ai-app/claim-checker-ai",
  "codebase-chat-ai": "/ai-app/codebase-chat-ai",
  "competitor-spy-ai": "/ai-app/competitor-spy-ai",
  "contract-summary-ai": "/ai-app/contract-summary-ai",
  "conversion-copy-editor": "/ai-app/conversion-copy-editor",
  "dashboard-designer-ai": "/ai-app/dashboard-designer-ai",
  "deep-research-pro": "/ai-app/deep-research-pro",
  "email-memory-assistant": "/ai-app/email-memory-assistant",
  "fact-check-ai": "/ai-app/fact-check-ai",
  "finance-research-ai": "/ai-app/finance-research-ai",
  "financial-dashboard-ai": "/ai-app/financial-dashboard-ai",
  "fraud-investigation-assistant": "/ai-app/fraud-investigation-assistant",
  "github-automation-agent": "/ai-app/github-automation-agent",
  "github-repo-assistant": "/ai-app/github-repo-assistant",
  "gmail-intelligence-ai": "/ai-app/gmail-intelligence-ai",
  "hiring-plan-builder": "/ai-app/hiring-plan-builder",
  "home-renovation-visualizer-ai": "/ai-app/home-renovation-visualizer-ai",
  "interview-summary-ai": "/ai-app/interview-summary-ai",
  "investment-research-assistant": "/ai-app/investment-research-assistant",
  "landing-page-copy-ai": "/ai-app/landing-page-copy-ai",
  "landing-page-critic-ai": "/ai-app/landing-page-critic-ai",
  "legal-pdf-explainer": "/ai-app/legal-pdf-explainer",
  "local-business-analytics-ai": "/ai-app/local-business-analytics-ai",
  "local-business-growth-advisor": "/ai-app/local-business-growth-advisor",
  "local-business-voice-assistant": "/ai-app/local-business-voice-assistant",
  "local-tour-guide-ai": "/ai-app/local-tour-guide-ai",
  "market-research-ai": "/ai-app/market-research-ai",
  "multi-ai-memory-hub": "/ai-app/multi-ai-memory-hub",
  "multimodal-knowledge-ai": "/ai-app/multimodal-knowledge-ai",
  "news-to-podcast-ai": "/ai-app/news-to-podcast-ai",
  "newsletter-repurposer-ai": "/ai-app/newsletter-repurposer-ai",
  "pdf-business-assistant": "/ai-app/pdf-business-assistant",
  "personal-ai-memory-assistant": "/ai-app/personal-ai-memory-assistant",
  "podcast-creator-ai": "/ai-app/podcast-creator-ai",
  "policy-compliance-assistant": "/ai-app/policy-compliance-assistant",
  "private-ai-chat-with-memory": "/ai-app/private-ai-chat-with-memory",
  "private-chatgpt-clone": "/ai-app/private-chatgpt-clone",
  "private-company-ai-assistant": "/ai-app/private-company-ai-assistant",
  "profit-coach-ai": "/ai-app/profit-coach-ai",
  "python-fixer-ai": "/ai-app/python-fixer-ai",
  "real-estate-marketing-ai": "/ai-app/real-estate-marketing-ai",
  "research-assistant-ai": "/ai-app/research-assistant-ai",
  "research-memory-assistant": "/ai-app/research-memory-assistant",
  "research-paper-assistant": "/ai-app/research-paper-assistant",
  "research-planner-ai": "/ai-app/research-planner-ai",
  "resume-analyzer-ai": "/ai-app/resume-analyzer-ai",
  "revenue-data-analyst-ai": "/ai-app/revenue-data-analyst-ai",
  "risk-decision-ai": "/ai-app/risk-decision-ai",
  "smart-search-ai": "/ai-app/smart-search-ai",
  "sprint-planner-ai": "/ai-app/sprint-planner-ai",
  "startup-due-diligence-ai": "/ai-app/startup-due-diligence-ai",
  "talk-to-your-business-ai": "/ai-app/talk-to-your-business-ai",
  "travel-concierge-ai": "/ai-app/travel-concierge-ai",
  "travel-planner-ai": "/ai-app/travel-planner-ai",
  "video-knowledge-assistant": "/ai-app/video-knowledge-assistant",
  "visual-document-ai": "/ai-app/visual-document-ai",
};

// =====================================================
// =====================================================
// THUMBNAIL URLs - AI-Generated thumbnails take priority
// =====================================================
// Note: AI-generated thumbnails (from DALL-E) are checked first in getAppThumbnail()
// These SVG entries serve as fallbacks for apps without AI thumbnails.
export const APP_THUMBNAILS: Record<string, string> = {
  // These apps have AI-generated thumbnails (served from Supabase) so these are secondary fallbacks
  "ai-personalized-content": "/ai-design-studio-thumbnails/ai-personalized-content-realistic.svg",
  "launch-campaign-builder-ai": "/ai-design-studio-thumbnails/launch-campaign-builder-ai-realistic.svg",
  "daily-content-engine-ai": "/ai-design-studio-thumbnails/daily-content-engine-ai-realistic.svg",
  "ai-skills-resume": "/ai-design-studio-thumbnails/ai-skills-resume-realistic.svg",
  "sales-call-follow-up-ai": "/ai-design-studio-thumbnails/sales-call-follow-up-ai-realistic.svg",
  "sales-assistant-pro": "/ai-design-studio-thumbnails/sales-assistant-pro-realistic.svg",
  "ai-personalization-studio": "/ai-design-studio-thumbnails/ai-personalization-studio-realistic.svg",
  "ai-personalizer": "/ai-design-studio-thumbnails/ai-personalizer-realistic.svg",
  "ai-video-transformer": "/ai-design-studio-thumbnails/ai-video-transformer-realistic.svg",
  "ai-screen-recorder": "/ai-design-studio-thumbnails/ai-screen-recorder-realistic.svg",
  "ai-content-creator-pro": "/ai-design-studio-thumbnails/ai-content-creator-pro-realistic.svg",
  "ai-thumbnail-generator": "/ai-design-studio-thumbnails/ai-thumbnail-generator-realistic.svg",
  "profile-gen": "/ai-design-studio-thumbnails/profile-gen-realistic.svg",
  "ai-video-editor": "/ai-design-studio-thumbnails/ai-video-editor-realistic.svg",
  "ai-strategy-advisor-pro": "/ai-design-studio-thumbnails/ai-strategy-advisor-pro-realistic.svg",
  "ai-sales-email-writer-maximizer": "/ai-design-studio-thumbnails/ai-sales-email-writer-maximizer-realistic.svg",
  "contentai": "/ai-design-studio-thumbnails/contentai-realistic.svg",
  "product-research-ai": "/ai-design-studio-thumbnails/product-research-ai-realistic.svg",

  // Apps without AI-generated thumbnails (maybe add them later)
  // "video-creator": ...
  // "ai-art": ...
  // etc.
};

/**
 * Get the URL for a specific ai-design-studio
 * @param appId - The ai-design-studio identifier
 * @returns The ai-design-studio's URL (external) or internal route fallback
 */
export const getAppUrl = (appId: string): string => {
  return APP_URLS[appId] || `/ai-design-studio/${appId}`;
};

/**
 * Get the thumbnail URL for a specific ai-design-studio
 * Priority: 1) Local SVG thumbnail (in /public/app-thumbnails/), 2) APP_THUMBNAILS map, 3) None
 * @param appId - The ai-design-studio identifier
 * @returns The ai-design-studio's thumbnail URL (relative path for local SVGs)
 */
export const getAppThumbnail = (appId: string): string => {
  // Priority 1: Local SVG in /public/app-thumbnails/{appId}.svg
  // This is the primary source - all apps have a local SVG
  return `/app-thumbnails/${appId}.svg`;
};

/**
 * Check if an ai-design-studio has an external URL
 * @param appId - The ai-design-studio identifier
 * @returns True if the ai-design-studio uses an external URL
 */
export const isExternalUrl = (appId: string): boolean => {
  return appId in APP_URLS && APP_URLS[appId].startsWith("https://");
};

/**
 * Get all apps that share the same URL (multi-ai-design-studio hubs)
 * @param url - The URL to check
 * @returns Array of ai-design-studio IDs that use this URL
 */
export const getAppsForUrl = (url: string): string[] => {
  return Object.entries(APP_URLS)
    .filter(([_, appUrl]) => appUrl === url)
    .map(([appId]) => appId);
};

/**
 * URL Categories for organizing apps
 */
export const URL_CATEGORIES = {
  PERSONALIZED_CONTENT: "https://ai-sales-email-writer-intelligence-pro.videoremix.vip",
  FUNNELCRAFT: "https://ai-funnelcraft.videoremix.vip",
  SKILLS: "https://ai-skills.videoremix.vip",
  SKILLS_MONETIZER: "https://daily-content-engine-ai.videoremix.vip",
  SALES_PAGE: "https://ai-salespage.videoremix.vip",
  SALES_ASSISTANT: "https://ai-salesassistant.videoremix.vip",
  PERSONALIZATION_STUDIO: "https://ai-personalizationstudio.videoremix.vip",
  PERSONALIZER: "https://ai-personalizer.videoremix.vip",
  VIDEO_TRANSFORMER: "https://ai-video-transformer.videoremix.vip",
  SCREEN_RECORDER: "https://ai-screenrecorder.videoremix.vip",
  SIGNATURE: "https://ai-content-creator-pro.videoremix.vip",
  THUMBNAIL: "https://ai-thumbnail-generator.videoremix.vip",
  PROFILE_GEN: "https://ai-profilegen.videoremix.vip",
  VIDEO_EDITOR: "https://ai-videoeditor.videoremix.vip",
  REFERRALS: "https://referrals.smartcrm.vip",
  SALESMAX: "https://salesmax.smartcrm.vip",
  CONTENTAI: "https://contentai.smartcrm.vip",
  RESEARCH: "https://research.smartcrm.vip",
} as const;

export type UrlCategory = (typeof URL_CATEGORIES)[keyof typeof URL_CATEGORIES];
