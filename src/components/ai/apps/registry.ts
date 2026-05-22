import React from "react";
import { type AIAppComponent } from "./types";
import { GenericAIApp } from "./GenericAIApp";
import { isInternalAIApp } from "../../../config/internalAIApps";

/**
 * AI Apps Template + Registry System
 *
 * Batch 1 (Sales, Lead Gen & Prospecting) — 10 apps production-ready with custom UIs.
 * Batch 2 (Content Creation & Marketing) — 4 apps production-ready (blog-to-podcast-ai, daily-content-engine-ai, ai-content-creator-pro, ai-documentation-writer); 6 in progress.
 * Batch 3 (Video, Audio & Voice) — 9 apps production-ready with custom UIs.
 * Batch 4 (RAG, Knowledgebase & Document Chat) — 3 apps production-ready with custom UIs.
 * All future batches/apps must follow the standards documented in _TEMPLATE.tsx.
 */

const registry: Record<string, () => Promise<{ default: AIAppComponent }>> = {
  // === Batch 1: Sales, Lead Gen & Prospecting (Production Ready) ===
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

  // === Batch 2: Content Creation & Marketing (in progress — 10th corrected to ai-music-idea-generator; jingle removed, belongs in Batch 3) ===
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

// === Batch 3: Voice & Audio AI (Production Ready) ===
  "ai-film-producer": () => import("./ai-film-producer"),
  "podcast-creator-ai": () => import("./podcast-creator-ai"),
  "news-to-podcast-ai": () => import("./news-to-podcast-ai"),
  "ai-voice-support-agent": () => import("./ai-voice-support-agent"),
  "talk-to-your-business-ai": () => import("./talk-to-your-business-ai"),
  "ai-audio-guide-creator": () => import("./ai-audio-guide-creator"),
  "ai-intake-voice-agent": () => import("./ai-intake-voice-agent"),
  "ai-dictation-assistant": () => import("./ai-dictation-assistant"),
  "ai-music-jingle-assistant": () => import("./ai-music-jingle-assistant"),

  // === Batch 4: RAG, Knowledgebase & Document Chat ===
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
};

// Production-ready flag for admin / filtering
// Batch 1: all 10 production-ready
// Batch 2: 4 production-ready (blog-to-podcast-ai, daily-content-engine-ai, ai-content-creator-pro, ai-documentation-writer); 6 apps still need implementation
// Batch 3: all 9 production-ready
// Batch 4: all 3 production-ready
const productionReadySlugs = new Set([
  // Batch 1 (all 10 complete)
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
  // Batch 2 (3 complete + ai-documentation-writer now production-ready)
  "blog-to-podcast-ai",
  "daily-content-engine-ai",
  "ai-content-creator-pro",
  "ai-documentation-writer",
// === Batch 3: Video, Audio & Voice AI (all 9 complete) ===
  "ai-film-producer",
  "podcast-creator-ai",
  "news-to-podcast-ai",
  "ai-voice-support-agent",
  "talk-to-your-business-ai",
  "ai-audio-guide-creator",
  "ai-intake-voice-agent",
  "ai-dictation-assistant",
  "ai-music-jingle-assistant",
  // === Batch 4: RAG, Knowledgebase & Document Chat (all 13 apps) ===
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
]);

export function getAIAppComponent(slug: string): React.LazyExoticComponent<AIAppComponent> {
  if (!isInternalAIApp(slug)) {
    throw new Error(`"${slug}" is not one of the 95 internal AI apps`);
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