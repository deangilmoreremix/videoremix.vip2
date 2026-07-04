import React from "react";
import { type AIAppComponent } from "./types";
import { GenericAIApp } from "./GenericAIApp";
import { isInternalAIApp } from "../../../config/internalAIApps";

// Re-export so consumers can import from registry.ts directly
export { isInternalAIApp };

/**
 * AI Apps Template + Registry System
 *
 * Batch 1 (Sales, Lead Gen & Prospecting) — 10 apps production-ready with custom UIs.
 * Batch 2 (Content Creation & Marketing) — 10 apps production-ready with custom UIs.
 * Batch 3 (Video, Audio & Voice AI) — 9 apps production-ready with custom UIs.
 * Batch 4 (RAG, Knowledgebase & Document Chat) — 13 apps production-ready with custom UIs.
 * Batch 5 (Research & Analysis) — 12 apps production-ready with custom UIs.
 * Batch 6 (Developer & Code Apps) — 10 apps production-ready with custom UIs.
 * Batch 7 (Design & UX Apps) — 6 apps production-ready with custom UIs.
 * Batch 8 (Finance & Legal Apps) — 13 apps production-ready with custom UIs.
 * Batch 9 (HR & Hiring Apps) — 6 apps production-ready with custom UIs.
 * Batch 10 (Local & Travel Apps) — 7 apps production-ready with custom UIs.
 * Overflow Apps — 4 apps production-ready with custom UIs.
 * All future batches/apps must follow the standards documented in _TEMPLATE.tsx.
 */

const registry: Record<string, () => Promise<{ default: AIAppComponent }>> = {
  // === Batch 1: Sales, Lead Gen & Prospecting (10 apps - Production Ready) ===
  "ai-sales-intelligence-pro": () => import("./ai-sales-intelligence-pro"),
  "lead-research-scraper-ai": () => import("./lead-research-scraper-ai"),
  "ai-business-growth-consultant": () => import("./ai-business-growth-consultant"),
  "ai-strategy-advisor": () => import("./ai-strategy-advisor"),
  "ai-sales-email-writer": () => import("./ai-sales-email-writer"),
  "ai-offer-decision-helper": () => import("./ai-offer-decision-helper"),
  "launch-campaign-builder-ai": () => import("./launch-campaign-builder-ai"),
  "competitor-spy-ai": () => import("./competitor-spy-ai"),
  "ai-agency-builder-suite": () => import("./ai-agency-builder-suite"),
  "sales-call-follow-up-ai": () => import("./sales-call-follow-up-ai"),

  // === Batch 2: Content Creation & Marketing (10 apps - Production Ready) ===
  "blog-to-podcast-ai": () => import("./blog-to-podcast-ai"),
  "daily-content-engine-ai": () => import("./daily-content-engine-ai"),
  "ai-content-creator-pro": () => import("./ai-content-creator-pro"),
  "ai-content-editor": () => import("./ai-content-editor"),
  "ai-documentation-writer": () => import("./ai-documentation-writer"),
  "youtube-repurposer-ai": () => import("./youtube-repurposer-ai"),
  "newsletter-repurposer-ai": () => import("./newsletter-repurposer-ai"),
  "ai-news-content-writer": () => import("./ai-news-content-writer"),
  "ai-video-script-producer": () => import("./ai-video-script-producer"),
  "ai-music-idea-generator": () => import("./ai-music-idea-generator"),

  // === Batch 3: Voice & Audio AI (9 apps - Production Ready) ===
  "ai-film-producer": () => import("./ai-film-producer"),
  "podcast-creator-ai": () => import("./podcast-creator-ai"),
  "news-to-podcast-ai": () => import("./news-to-podcast-ai"),
  "ai-voice-support-agent": () => import("./ai-voice-support-agent"),
  "talk-to-your-business-ai": () => import("./talk-to-your-business-ai"),
  "ai-audio-guide-creator": () => import("./ai-audio-guide-creator"),
  "ai-intake-voice-agent": () => import("./ai-intake-voice-agent"),
  "ai-dictation-assistant": () => import("./ai-dictation-assistant"),
  "ai-music-jingle-assistant": () => import("./ai-music-jingle-assistant"),

  // === Batch 4: RAG, Knowledgebase & Document Chat (13 apps - Production Ready) ===
  "business-knowledgebase-ai": () => import("./business-knowledgebase-ai"),
  "pdf-business-assistant": () => import("./pdf-business-assistant"),
  "research-paper-assistant": () => import("./research-paper-assistant"),
  "codebase-chat-ai": () => import("./codebase-chat-ai"),
  "gmail-intelligence-ai": () => import("./gmail-intelligence-ai"),
  "video-knowledge-assistant": () => import("./video-knowledge-assistant"),
  "blog-knowledge-search-ai": () => import("./blog-knowledge-search-ai"),
  "visual-document-ai": () => import("./visual-document-ai"),
  "citation-knowledgebase-ai": () => import("./citation-knowledgebase-ai"),
  "smart-search-ai": () => import("./smart-search-ai"),
  "private-company-ai-assistant": () => import("./private-company-ai-assistant"),
  "multimodal-knowledge-ai": () => import("./multimodal-knowledge-ai"),
  "ai-knowledgebase-debugger": () => import("./ai-knowledgebase-debugger"),

  // === Batch 5: Research & Analysis (12 apps - Production Ready) ===
  "research-assistant-ai": () => import("./research-assistant-ai"),
  "deep-research-pro": () => import("./deep-research-pro"),
  "research-planner-ai": () => import("./research-planner-ai"),
  "ai-course-creator-assistant": () => import("./ai-course-creator-assistant"),
  "academic-research-ai": () => import("./academic-research-ai"),
  "market-research-ai": () => import("./market-research-ai"),
  "fact-check-ai": () => import("./fact-check-ai"),
  "research-memory-assistant": () => import("./research-memory-assistant"),
  "personal-ai-memory-assistant": () => import("./personal-ai-memory-assistant"),
  "multi-ai-memory-hub": () => import("./multi-ai-memory-hub"),
  "private-ai-chat-with-memory": () => import("./private-ai-chat-with-memory"),
  "private-chatgpt-clone": () => import("./private-chatgpt-clone"),

  // === Batch 6: Developer & Code Apps (10 apps - Production Ready) ===
  "ai-app-builder-assistant": () => import("./ai-app-builder-assistant"),
  "ai-saas-architect": () => import("./ai-saas-architect"),
  "ai-code-review-pro": () => import("./ai-code-review-pro"),
  "ai-bug-fixer": () => import("./ai-bug-fixer"),
  "ai-fullstack-builder": () => import("./ai-fullstack-builder"),
  "python-fixer-ai": () => import("./python-fixer-ai"),
  "github-repo-assistant": () => import("./github-repo-assistant"),
  "github-automation-agent": () => import("./github-automation-agent"),
  "build-plan-generator": () => import("./build-plan-generator"),
  "sprint-planner-ai": () => import("./sprint-planner-ai"),

  // === Batch 7: Design & UX Apps (6 apps — Production Ready) ===
  "ai-design-studio": () => import("./ai-design-studio"),
  "landing-page-critic-ai": () => import("./landing-page-critic-ai"),
  "ai-ux-designer": () => import("./ai-ux-designer"),
  "dashboard-designer-ai": () => import("./dashboard-designer-ai"),
  "landing-page-copy-ai": () => import("./landing-page-copy-ai"),
  "conversion-copy-editor": () => import("./conversion-copy-editor"),

  // === Batch 8: Finance & Legal Apps (13 apps — Production Ready) ===
  "finance-research-ai": () => import("./finance-research-ai"),
  "business-finance-ai-team": () => import("./business-finance-ai-team"),
  "profit-coach-ai": () => import("./profit-coach-ai"),
  "investment-research-assistant": () => import("./investment-research-assistant"),
  "startup-due-diligence-ai": () => import("./startup-due-diligence-ai"),
  "revenue-data-analyst-ai": () => import("./revenue-data-analyst-ai"),
  "financial-dashboard-ai": () => import("./financial-dashboard-ai"),
  "contract-summary-ai": () => import("./contract-summary-ai"),
  "legal-pdf-explainer": () => import("./legal-pdf-explainer"),
  "policy-compliance-assistant": () => import("./policy-compliance-assistant"),
  "claim-checker-ai": () => import("./claim-checker-ai"),
  "fraud-investigation-assistant": () => import("./fraud-investigation-assistant"),
  "risk-decision-ai": () => import("./risk-decision-ai"),

  // === Batch 9: HR & Hiring Apps (6 apps) ===
  "ai-hiring-assistant": () => import("./ai-hiring-assistant"),
  "resume-analyzer-ai": () => import("./resume-analyzer-ai"),
  "candidate-decision-ai": () => import("./candidate-decision-ai"),
  "candidate-outreach-ai": () => import("./candidate-outreach-ai"),
  "interview-summary-ai": () => import("./interview-summary-ai"),
  "hiring-plan-builder": () => import("./hiring-plan-builder"),

  // === Batch 10: Local & Travel Apps (7 apps — Production Ready) ===
  "real-estate-marketing-ai": () => import("./real-estate-marketing-ai"),
  "home-renovation-visualizer-ai": () => import("./home-renovation-visualizer-ai"),
  "travel-planner-ai": () => import("./travel-planner-ai"),
  "local-tour-guide-ai": () => import("./local-tour-guide-ai"),
  "local-business-voice-assistant": () => import("./local-business-voice-assistant"),
  "local-business-growth-advisor": () => import("./local-business-growth-advisor"),
  "local-business-analytics-ai": () => import("./local-business-analytics-ai"),
  "travel-concierge-ai": () => import("./travel-concierge-ai"),
  "email-memory-assistant": () => import("./email-memory-assistant"),
  "browser-task-agent": () => import("./browser-task-agent"),
  "ai-tool-router": () => import("./ai-tool-router"),
};

// Production-ready flag for admin / filtering
const productionReadySlugs = new Set([
  // Batch 1 (10)
  "ai-sales-intelligence-pro",
  "lead-research-scraper-ai",
  "ai-business-growth-consultant",
  "ai-strategy-advisor",
  "ai-sales-email-writer",
  "ai-offer-decision-helper",
  "launch-campaign-builder-ai",
  "competitor-spy-ai",
  "ai-agency-builder-suite",
  "sales-call-follow-up-ai",

  // Batch 2 (10)
  "blog-to-podcast-ai",
  "daily-content-engine-ai",
  "ai-content-creator-pro",
  "ai-content-editor",
  "ai-documentation-writer",
  "youtube-repurposer-ai",
  "newsletter-repurposer-ai",
  "ai-news-content-writer",
  "ai-video-script-producer",
  "ai-music-idea-generator",

  // Batch 3 (9)
  "ai-film-producer",
  "podcast-creator-ai",
  "news-to-podcast-ai",
  "ai-voice-support-agent",
  "talk-to-your-business-ai",
  "ai-audio-guide-creator",
  "ai-intake-voice-agent",
  "ai-dictation-assistant",
  "ai-music-jingle-assistant",

  // Batch 4 (13)
  "business-knowledgebase-ai",
  "pdf-business-assistant",
  "research-paper-assistant",
  "codebase-chat-ai",
  "gmail-intelligence-ai",
  "video-knowledge-assistant",
  "blog-knowledge-search-ai",
  "visual-document-ai",
  "citation-knowledgebase-ai",
  "smart-search-ai",
  "private-company-ai-assistant",
  "multimodal-knowledge-ai",
  "ai-knowledgebase-debugger",

  // Batch 5 (12)
  "research-assistant-ai",
  "deep-research-pro",
  "research-planner-ai",
  "ai-course-creator-assistant",
  "academic-research-ai",
  "market-research-ai",
  "fact-check-ai",
  "research-memory-assistant",
  "personal-ai-memory-assistant",
  "multi-ai-memory-hub",
  "private-ai-chat-with-memory",
  "private-chatgpt-clone",

  // Batch 6 (10)
  "ai-app-builder-assistant",
  "ai-saas-architect",
  "ai-code-review-pro",
  "ai-bug-fixer",
  "ai-fullstack-builder",
  "python-fixer-ai",
  "github-repo-assistant",
  "github-automation-agent",
  "build-plan-generator",
  "sprint-planner-ai",

  // Batch 7 (6)
  "ai-design-studio",
  "landing-page-critic-ai",
  "ai-ux-designer",
  "dashboard-designer-ai",
  "landing-page-copy-ai",
  "conversion-copy-editor",

  // Batch 8 (13)
  "finance-research-ai",
  "business-finance-ai-team",
  "profit-coach-ai",
  "investment-research-assistant",
  "startup-due-diligence-ai",
  "revenue-data-analyst-ai",
  "financial-dashboard-ai",
  "contract-summary-ai",
  "legal-pdf-explainer",
  "policy-compliance-assistant",
  "claim-checker-ai",
  "fraud-investigation-assistant",
  "risk-decision-ai",

  // Batch 9 (6)
  "ai-hiring-assistant",
  "resume-analyzer-ai",
  "candidate-decision-ai",
  "candidate-outreach-ai",
  "interview-summary-ai",
  "hiring-plan-builder",

  // Batch 10: Local & Travel Apps (7 apps — Production Ready)
  "real-estate-marketing-ai",
  "home-renovation-visualizer-ai",
  "travel-planner-ai",
  "local-tour-guide-ai",
  "local-business-voice-assistant",
  "local-business-growth-advisor",
  "local-business-analytics-ai",

  // Overflow apps (4 apps — Production Ready)
  "travel-concierge-ai",
  "email-memory-assistant",
  "browser-task-agent",
  "ai-tool-router",
]);

// Apps that have full Live Voice / Realtime API support in their custom UI
// (uses the existing run-ai-app Edge Function with ?mode=realtime — no extra servers)
export const VOICE_ENABLED_APPS = new Set([
  "ai-intake-voice-agent",
  "ai-dictation-assistant",
  // Batch 6 developer/planning apps that declare realtime (wired below)
  "ai-app-builder-assistant",
  "build-plan-generator",
  "sprint-planner-ai",
]);

export function getAIAppComponent(slug: string): React.LazyExoticComponent<AIAppComponent> {
  if (!isInternalAIApp(slug)) {
    throw new Error(`"${slug}" is not one of the 100 internal AI apps`);
  }

  const loader = registry[slug];
  if (loader) {
    return React.lazy(() =>
      loader().catch(() => ({ default: GenericAIApp }))
    );
  }

  return GenericAIApp as any;
}

export function isAIAppImplemented(slug: string): boolean {
  return slug in registry;
}

export function isAIAppProductionReady(slug: string): boolean {
  return productionReadySlugs.has(slug);
}

export function getImplementedAIAppSlugs(): string[] {
  return Object.keys(registry);
}

export function getProductionReadyAIAppSlugs(): string[] {
  return Array.from(productionReadySlugs);
}

export function supportsVoiceMode(slug: string): boolean {
  return VOICE_ENABLED_APPS.has(slug);
}