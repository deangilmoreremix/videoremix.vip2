import { generatedThumbnails } from '../data/generatedThumbnails';

/**
 * Mapping from app IDs to actual local SVG filenames in /public/app-thumbnails/.
 *
 * The app IDs in appsData.ts do not always match the SVG filenames exactly,
 * so this map resolves the correct file for apps that have a local thumbnail.
 */
const LOCAL_THUMBNAIL_FILENAME_MAP: Record<string, string> = {
  'ag2-adaptive-research-team': 'ag2-adaptive-research-team',
  'agentic-rag-with-embedding-gemma': 'agentic-rag-embedding-gemma',
  'agentic-rag-with-reasoning': 'agentic-rag-with-reasoning',
  'ai-3d-pygame-agent': 'ai-3dpygame-r1',
  'ai-arxiv-agent-with-memory': 'ai-arxiv-agent-memory',
  'ai-audio-tour-agent': 'ai-audio-tour-agent',
  'ai-blog-search-rag': 'ai-blog-search',
  'ai-breakup-recovery-agent': 'ai-breakup-recovery-agent',
  'ai-chess-agent': 'ai-chess-agent',
  'ai-competitor-intelligence-agent-team': 'ai-competitor-intelligence-agent-team',
  'ai-data-analysis-agent': 'ai-data-analysis-agent',
  'ai-deep-research-agent': 'ai-deep-research-agent',
  'ai-finance-agent-team': 'business-finance-ai-team',
  'ai-financial-coach-agent': 'ai-financial-coach-agent',
  'ai-fraud-investigation-agent': 'ai-fraud-investigation-agent',
  'ai-game-design-agent-team': 'ai-game-design-agent-team',
  'ai-health-fitness-agent': 'ai-health-fitness-agent',
  'ai-home-renovation-agent': 'home-renovation-visualizer-ai',
  'ai-investment-agent': 'investment-research-assistant',
  'ai-journalist-agent': 'ai-journalist-agent',
  'ai-legal-agent-team-cloud-local': 'ai-legal-agent-team',
  'ai-medical-imaging-agent': 'ai-medical-imaging-agent',
  'ai-meeting-agent': 'ai-meeting-agent',
  'ai-meme-generator-agent-browser': 'ai-meme-generator-agent-browseruse',
  'ai-mental-wellbeing-agent': 'ai-mental-wellbeing-agent',
  'ai-movie-production-agent': 'ai-movie-production-agent',
  'ai-music-generator-agent': 'ai-music-generator-agent',
  'ai-product-launch-intelligence-agent': 'ai-product-launch-intelligence-agent',
  'ai-real-estate-agent-team': 'ai-real-estate-agent-team',
  'ai-recruitment-agent-team': 'ai-recruitment-agent-team',
  'ai-sales-intelligence-agent-team': 'ai-sales-intelligence-pro',
  'ai-services-agency-crewai': 'ai-services-agency',
  'ai-system-architect-agent': 'ai-system-architect-r1',
  'ai-teaching-agent-team': 'ai-teaching-agent-team',
  'ai-tic-tac-toe-agent': 'ai-tic-tac-toe-agent',
  'ai-travel-agent-local-cloud': 'ai-travel-agent',
  'autonomous-rag': 'autonomous-rag',
  'browser-mcp-agent': 'browser-mcp-agent',
  'chat-with-github-gpt-llama3': 'chat-with-github',
  'chat-with-gmail': 'chat-with-gmail',
  'chat-with-pdf-gpt-llama3': 'chat-with-pdf',
  'chat-with-research-papers-arxiv-gpt-llama3': 'chat-with-research-papers',
  'chat-with-substack': 'chat-with-substack',
  'chat-with-youtube-videos': 'chat-with-youtube-videos',
  'contextual-ai-rag-agent': 'contextualai-rag-agent',
  'corrective-rag-crag': 'corrective-rag',
  'customer-support-voice-agent': 'customer-support-voice-agent',
  'deepseek-local-rag-agent': 'deepseek-local-rag-agent',
  'devpulse-ai': 'devpulse-ai',
  'gemini-agentic-rag': 'gemini-agentic-rag',
  'github-mcp-agent': 'github-mcp-agent',
  'hybrid-search-rag-cloud': 'hybrid-search-rag',
  'multi-mcp-agent-router': 'multi-mcp-agent-router',
  'multimodal-coding-agent-team': 'multimodal-coding-agent-team',
  'multimodal-design-agent-team': 'multimodal-design-agent-team',
  'openai-research-agent': 'openai-research-agent',
  'rag-as-a-service': 'rag-as-a-service',
  'research-agent-gemini-interaction-api': 'research-agent-gemini-interaction-api',
  'toonify-token-optimization': 'toonify-token-optimization',
  'voice-rag-agent-openai-sdk': 'voice-rag-openaisdk',
  'web-scraping-ai-agent': 'web-scraping-ai-agent',
  'xai-finance-agent': 'xai-finance-agent',
  'advisor-orchestrator-worker': 'advisor-orchestrator-worker',
  'ai-consultant-agent': 'ai-consultant-agent',
  'ai-dashboard-canvas-agent': 'ai-dashboard-canvas-agent',
  'ai-mcp-app-builder': 'ai-mcp-app-builder',
  'ai-self-evolving-agent': 'ai-self-evolving-agent',
  'ai-shadcn-component-generator': 'ai-shadcn-component-generator',
  'ai-social-media-news-and-podcast-agent': 'ai-social-media-news-and-podcast-agent',
  'ai-vc-due-diligence-agent-team': 'ai-vc-due-diligence-agent-team',
  'ai-x402-paying-agent': 'ai-x402-paying-agent',
  'always-on-hacker-news-briefing-agent': 'always-on-hacker-news-briefing-agent',
  'commit-archaeologist': 'commit-archaeologist',
  'dependency-doctor': 'dependency-doctor',
  'earnings-call-analyst-agent': 'earnings-call-analyst-agent',
  'first-reader': 'first-reader',
  'gemini-multimodal-agent': 'gemini-multimodal-agent',
  'generative-ui-starter-project': 'generative-ui-starter-project',
  'headroom-context-optimization': 'headroom-context-optimization',
  'knowledge-graph-rag-with-citations': 'knowledge-graph-rag-with-citations',
  'llm-app-with-personalized-memory': 'llm-app-with-personalized-memory',
  'llm-panel-agent-team': 'llm-panel-agent-team',
  'local-rag-agent': 'local-rag-agent',
  'mcp-apps-generative-ui-showcase': 'mcp-apps-generative-ui-showcase',
  'multi-llm-application-with-shared-memory': 'multi-llm-application-with-shared-memory',
  'multimodal-ui-ux-feedback-agent-team': 'multimodal-ui-ux-feedback-agent-team',
  'needle-a-new-way-to-find': 'needle-a-new-way-to-find',
  'notion-mcp-agent': 'notion-mcp-agent',
  'openai-remote-mcp-tool-bridge': 'openai-remote-mcp-tool-bridge',
  'rag-failure-diagnostics-clinic': 'rag-failure-diagnostics-clinic',
  'rag-with-database-routing': 'rag-with-database-routing',
  'release-radar-agent': 'release-radar-agent',
  'ripple-change-one-thing-find-what-else-needs-to-change': 'ripple-change-one-thing-find-what-else-needs-to-change',
  'scope-creep-detector': 'scope-creep-detector',
  'thinking-out-loud': 'thinking-out-loud',
  'trust-gated-multi-agent-research-team': 'trust-gated-multi-agent-research-team',
  'typed-agentic-rag-with-pydantic-ai': 'typed-agentic-rag-with-pydantic-ai',
  'gemma-3-fine-tuning': 'gemma-3-fine-tuning',
  'google-adk-crash-course': 'google-adk-crash-course',
  'insurance-claim-live-agent-team': 'insurance-claim-live-agent-team',
  'llama-3-2-fine-tuning': 'llama-3-2-fine-tuning',
  'multimodal-agentic-rag': 'multimodal-agentic-rag',
  'openai-agents-sdk-crash-course': 'openai-agents-sdk-crash-course',
  'project-graveyard': 'project-graveyard',
  'self-improving-agent-skills': 'self-improving-agent-skills',
};

/**
 * Mapping for generated thumbnails where the appId in generatedThumbnails.ts
 * does not match the app ID in appsData.ts.
 */
const GENERATED_THUMBNAIL_APP_ID_MAP: Record<string, string> = {
  'basic-rag-chain': 'rag-chain',
  'llama3-stateful-chat': 'llama3-stateful-chat',
  'local-chatgpt-clone-with-memory': 'local-chatgpt-clone',
  'mixture-of-agents': 'mixture-of-agents',
  'ai-travel-planner-mcp-agent': 'ai-travel-planner-mcp-agent-team',
  'ai-blog-to-podcast-agent': 'ai-blog-to-podcast-agent',
  'ai-travel-agent-with-memory': 'ai-travel-agent-memory',
  'ai-social-media-news-and-podcast-agent': 'ai-news-and-podcast-agents',
  'insurance-claim-live-agent-team': 'insurance-claim-live-team',
  'project-graveyard': 'project-graveyard',
  'self-improving-agent-skills': 'self-improving-agent-skills',
  'ai-home-renovation-agent': 'nano-banana-studio',
  'gemma-3-fine-tuning': 'gemma-3-finetuning',
  'llama-3-2-fine-tuning': 'llama3.2-finetuning',
  'llama-3-1-local-rag': 'llama3-1-local-rag',
  'local-hybrid-search-rag': 'local-hybrid-search-rag',
  'rag-agent-with-cohere': 'rag-agent-cohere',
  'corrective-rag-crag': 'corrective-rag',
  'multimodal-agentic-rag': 'multimodal-agentic-rag',
  'vision-rag': 'vision-rag',
  'voice-rag-agent-openai-sdk': 'voice-rag-openaisdk',
  'openai-agents-sdk-crash-course': 'openai-agents-sdk-crash-course',
  'google-adk-crash-course': 'google-adk-crash-course',
  'chat-with-gmail': 'chat-with-gmail',
};

/**
 * Get the local SVG thumbnail path for an app.
 * SVGs are in /public/app-thumbnails/{filename}.svg
 */
export function getLocalThumbnailPath(appId: string): string | null {
  const filename = LOCAL_THUMBNAIL_FILENAME_MAP[appId];
  if (!filename) {
    return null;
  }
  return `/app-thumbnails/${filename}.svg`;
}

export function updateAppThumbnails(appsData: any[]) {
  const thumbnailMap = new Map(
    generatedThumbnails.map(img => [img.metadata.appId, img])
  );

  return appsData.map(app => {
    // Priority 1: Use local SVG thumbnail (always available, served from /public)
    const localPath = getLocalThumbnailPath(app.id);
    if (localPath) {
      return {
        ...app,
        image: localPath,
        generatedThumbnail: false,
      };
    }

    // Priority 2: Use AI-generated DALL-E thumbnail from Supabase
    const generatedAppId = GENERATED_THUMBNAIL_APP_ID_MAP[app.id] || app.id;
    const thumbnail = thumbnailMap.get(generatedAppId);
    if (thumbnail) {
      return {
        ...app,
        image: thumbnail.url,
        thumbnailAlt: thumbnail.alt,
        generatedThumbnail: true,
      };
    }

    // Priority 3: Keep original image
    return app;
  });
}

export function getThumbnailForApp(appId: string) {
  const mappedAppId = GENERATED_THUMBNAIL_APP_ID_MAP[appId] || appId;
  return generatedThumbnails.find(img => img.metadata.appId === mappedAppId);
}

export function getThumbnailsByCategory(category: string) {
  return generatedThumbnails.filter(img => img.metadata.category === category);
}

export function validateThumbnailCoverage(appsData: any[]) {
  const thumbnailMap = new Map(
    generatedThumbnails.map(img => [img.metadata.appId, img])
  );

  const coverage = {
    total: appsData.length,
    withThumbnails: 0,
    withoutThumbnails: 0,
    missing: []
  };

  appsData.forEach(app => {
    if (getLocalThumbnailPath(app.id)) {
      coverage.withThumbnails++;
    } else {
      const generatedAppId = GENERATED_THUMBNAIL_APP_ID_MAP[app.id] || app.id;
      if (thumbnailMap.has(generatedAppId)) {
        coverage.withThumbnails++;
      } else {
        coverage.withoutThumbnails++;
        coverage.missing.push(app.id);
      }
    }
  });

  return coverage;
}
