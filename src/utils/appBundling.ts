import { App } from './appsData';

// VideoRemix Core Apps (EXCLUDED from $597 bundle - premium video tools)
export const VIDEO_REMIX_CORE_APPS = [
  // Core VideoRemix personalized video/content tools
  'ai-personalizedcontent',                    // Smart Content Personalizer
  'video-ai-editor',                          // Professional Video Studio
  'ai-video-image',                           // Expert Video & Image Engine
  'personalizer-recorder',                    // Personalization Recorder
  'personalizer-profile',                     // Personalizer Profile Creator
  'personalizer-video-image-transformer',     // Video Image Transformer
  'personalizer-url-video-generation',        // URL Video Generation
  'thumbnail-generator',                      // Thumbnail Generator
  'video-creator',                           // Video Creator
  'storyboard',                              // Storyboard Creator
  'rebrander-ai',                            // AI Rebrander
];

// All other apps are converted LLM agents (INCLUDED in $597 bundle)
export const CONVERTED_LLM_AGENT_APPS = [
  // AI Agents and Tools (converted from LLM repos)
  'ai-referral-maximizer',
  'ai-sales',
  'smart-crm-closer',
  'funnelcraft-ai',
  'ai-proposal',
  'sales-assistant-app',
  'sales-page-builder',
  'ai-skills-monetizer',
  'ai-signature',
  'ai-template-generator',
  '1-starter-agent',
  '4-running-agents',
  '5-1-in-memory-conversation-agent',
  '5-2-persistent-conversation-agent',
  '6-1-agent-lifecycle-callbacks',
  '6-2-ai-interaction-callbacks',
  '6-3-tool-execution-callbacks',
  '7-plugins',
  '7-sessions',
  '9-1-sequential-agent',
  '9-2-loop-agent',
  '9-3-parallel-agent',
  'ag2-adaptive-research-team',
  'agentic-rag-embedding-gemma',
  'agentic-rag-gpt5',
  'agentic-rag-with-reasoning',
  'ai-3dpygame-r1',
  'ai-aqi-analysis-agent',
  'ai-arxiv-agent-memory',
  'ai-audio-tour-agent',
  'ai-blog-search',
  'ai-blog-to-podcast-agent',
  'ai-breakup-recovery-agent',
  'ai-chess-agent',
  'ai-competitor-intelligence-agent-team',
  'ai-customer-support-agent',
  'ai-data-analysis-agent',
  'ai-data-visualisation-agent',
  'ai-deep-research-agent',
  'ai-domain-deep-research-agent',
  'ai-email-gtm-outreach-agent',
  'ai-email-gtm-reachout-agent',
  'ai-financial-coach-agent',
  'ai-product-launch-intelligence-agent',
  'ai-fraud-investigation-agent',
  'ai-game-design-agent-team',
  'ai-health-fitness-agent',
  'ai-journalist-agent',
  'ai-legal-agent-team',
  'ai-life-insurance-advisor-agent',
  'ai-medical-imaging-agent',
  'ai-meeting-agent',
  'ai-meme-generator-agent-browseruse',
  'ai-mental-wellbeing-agent',
  'ai-movie-production-agent',
  'ai-music-generator-agent',
  'ai-personal-finance-agent',
  'ai-real-estate-agent-team',
  'ai-reasoning-agent',
  'ai-recipe-meal-planning-agent',
  'ai-recruitment-agent-team',
  'ai-services-agency',
  'ai-startup-insight-fire1-agent',
  'ai-startup-trend-analysis-agent',
  'ai-system-architect-r1',
  'ai-teaching-agent-team',
  'ai-tic-tac-toe-agent',
  'ai-travel-agent',
  'ai-travel-agent-memory',
  'ai-travel-planner-mcp-agent-team',
  'app',
  'autonomous-rag',
  'blog-to-podcast-agent',
  'browser-mcp-agent',
  'chat-with-github',
  'chat-with-gmail',
  'chat-with-pdf',
  'chat-with-research-papers',
  'chat-with-substack',
  'chat-with-tarots',
  'chat-with-youtube-videos',
  'contextualai-rag-agent',
  'corrective-rag',
  'cursor-ai-experiments',
  'customer-support-voice-agent',
  'deepseek-local-rag-agent',
  'devpulse-ai',
  'frontend',
  'gemini-agentic-rag',
  'github-mcp-agent',
  'gpt-oss-critique-improvement-loop',
  'hybrid-search-rag',
  'local-ai-legal-agent-team',
  'local-ai-reasoning-agent-py',
  'local-ai-scrapper-py',
  'local-chatgpt-clone',
  'local-chatgpt-with-memory',
  'local-hybrid-search-rag',
  'local-travel-agent',
  'mixture-of-agents',
  'multi-agent-researcher',
  'multi-ai-memory',
  'multi-mcp-agent-router',
  'multimodal-ai-agent',
  'multimodal-coding-agent-team',
  'multimodal-design-agent-team',
  'music-generator-agent-py',
  'openai-research-agent',
  'podcastify-ai',
  'qwen-local-rag',
  'rag-agent-cohere',
  'rag-as-a-service',
  'rag-chain',
  'rag-database-routing',
  'reasoning-agent',
  'research-agent-gemini-interaction-api',
  'resume-job-matcher',
  'sales-force-ai',
  'social-buzz-ai',
  'startup-trends-agent',
  'toonify-token-optimization',
  'trust-gated-agent-team',
  'vision-rag',
  'voice-rag-openaisdk',
  'web-scraping-ai-agent',
  'web-scraping-agent',
  'xai-finance-agent',
];

// Helper functions
export const isVideoRemixCoreApp = (appId: string): boolean => {
  return VIDEO_REMIX_CORE_APPS.includes(appId);
};

export const isConvertedLlmAgent = (appId: string): boolean => {
  return CONVERTED_LLM_AGENT_APPS.includes(appId);
};

export const isAppIncludedInBundle = (appId: string): boolean => {
  return isConvertedLlmAgent(appId);
};

export const getVideoRemixCoreApps = (apps: App[]): App[] => {
  return apps.filter(app => isVideoRemixCoreApp(app.id));
};

export const getLlmAgentApps = (apps: App[]): App[] => {
  return apps.filter(app => isConvertedLlmAgent(app.id));
};

export const getBundlePricing = () => {
  const llmAgentCount = CONVERTED_LLM_AGENT_APPS.length;
  const individualTotal = llmAgentCount * 37;
  const bundlePrice = 597;
  const savings = individualTotal - bundlePrice;
  const savingsPercent = Math.round((savings / individualTotal) * 100);

  return {
    totalApps: llmAgentCount,
    individualPrice: 37,
    bundlePrice,
    originalTotal: individualTotal,
    savings,
    savingsPercent,
    videoRemixCoreCount: VIDEO_REMIX_CORE_APPS.length
  };
};