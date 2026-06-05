import { App } from './appsData';

// VideoRemix Core Apps (EXCLUDED from $597 bundle - premium video tools)
export const VIDEO_REMIX_CORE_APPS = [
  // Core VideoRemix personalized video/content tools
  'ai-sales-email-writer-intelligence-pro',                    // Smart Content Personalizer
  'lead-research-scraper-ai',                          // Professional Video Studio
  'ai-business-growth-consultant',                           // Expert Video & Image Engine
  'blog-to-podcast-ai',                    // Personalization Recorder
  'ai-documentation-writer',                     // Personalizer Profile Creator
  'youtube-repurposer-ai',     // Video Image Transformer
  'newsletter-repurposer-ai',        // URL Video Generation
  'thumbnail-generator',                      // Thumbnail Generator
  'video-creator',                           // Video Creator
  'storyboard',                              // Storyboard Creator
  'rebrander-ai',                            // AI Rebrander
];

// All other apps are converted LLM agents (INCLUDED in $597 bundle)
export const CONVERTED_LLM_AGENT_APPS = [
  // AI Agents and Tools (converted from LLM repos)
  'ai-strategy-advisor',
  'ai-sales-email-writer-email-writer',
  'ai-offer-decision-helper',
  'launch-campaign-builder-ai',
  'competitor-spy-ai',
  'ai-agency-builder-suite',
  'sales-call-follow-up-ai',
  'daily-content-engine-ai',
  'ai-content-creator-pro',
  'ai-content-editor',
  'ai-news-content-writer',
  'ai-video-script-producer',
  'ai-music-jingle-assistant',
  'ai-film-producer',
  'podcast-creator-ai',
  'news-to-podcast-ai',
  'ai-voice-support-agent',
  'talk-to-your-business-ai',
  'ai-audio-guide-creator',
  'ai-intake-voice-agent',
  'ai-dictation-assistant',
  'business-knowledgebase-ai',
  'pdf-business-assistant',
  'research-paper-assistant',
  'codebase-chat-ai',
  'gmail-intelligence-ai',
  'video-knowledge-assistant',
  'blog-knowledge-search-ai',
  'research-memory-assistant',
  'ai-audio-guide-creator',
  'blog-knowledge-search-ai',
  'ai-dashboard-designer-ai',
  'multimodal-knowledge-ai',
  'ai-knowledgebase-debugger',
  'competitor-spy-ai',
  'home-renovation-visualizer-ai',
  'local-business-analytics-ai',
  'local-tour-guide-ai',
  'deep-research-pro',
  'local-business-growth-advisor',
  'candidate-outreach-ai',
  'candidate-outreach-ai',
  'profit-coach-ai',
  'launch-campaign-builder-ai',
  'fraud-investigation-assistant',
  'interview-summary-ai',
  'hiring-plan-builder',
  'ai-news-content-writer',
  'contract-summary-ai',
  'ai-intake-voice-agent',
  'investment-research-assistant',
  'startup-due-diligence-ai',
  'revenue-data-analyst-ai',
  'financial-dashboard-ai',
  'ai-video-script-producer',
  'ai-music-jingle-assistant',
  'policy-compliance-assistant',
  'real-estate-marketing-ai',
  'risk-decision-ai',
  'risk-decision-ai',
  'ai-hiring-assistant',
  'ai-agency-builder-suite',
  'ai-code-review-pro',
  'ai-bug-fixer',
  'ai-fullstack-builder',
  'ai-course-creator-assistant',
  'github-repo-assistant',
  'ai-travel-agent',
  'build-plan-generator',
  'travel-planner-ai',
  'ai-design-studio',
  'landing-page-critic-ai',
  'dashboard-designer-ai',
  'browser-mcp-agent',
  'github-repo-assistant',
  'gmail-intelligence-ai',
  'pdf-business-assistant',
  'research-paper-assistant',
  'newsletter-repurposer-ai',
  'academic-research-ai',
  'video-knowledge-assistant',
  'market-research-ai',
  'fact-check-ai',
  'personal-ai-memory-assistant',
  'local-business-voice-assistant',
  'multi-ai-memory-hub',
  'personal-ai-memory-assistant',
  'private-chatgpt-clone',
  'gemini-agentic-rag',
  'github-automation-agent',
  'gpt-oss-critique-improvement-loop',
  'smart-search-ai',
  'local-contract-summary-ai',
  'local-risk-decision-ai-py',
  'local-ai-scrapper-py',
  'local-chatgpt-clone',
  'local-chatgpt-with-memory',
  'local-smart-search-ai',
  'local-travel-agent',
  'mixture-of-agents',
  'multi-agent-researcher',
  'multi-ai-memory',
  'multi-mcp-agent-router',
  'multimodal-ai-agent',
  'ai-app-builder-assistant',
  'ai-design-studio',
  'music-generator-agent-py',
  'research-assistant-ai',
  'podcastify-ai',
  'qwen-local-rag',
  'rag-agent-cohere',
  'business-knowledgebase-ai',
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
  'lead-research-scraper-ai',
  'web-scraping-agent',
  'finance-research-ai',
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