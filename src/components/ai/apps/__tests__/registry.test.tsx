import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import {
  getAIAppComponent,
  getImplementedAIAppSlugs,
  isAIAppImplemented,
  isAIAppProductionReady,
  supportsVoiceMode,
} from "../registry";
import { isInternalAIApp } from "../../../../config/internalAIApps";

const PREVIOUSLY_UNREACHABLE = [
  "ai-sales-email-writer-email-writer",
  "ai-sales-email-writer-intelligence-pro",
];

const BACKFILLED_CONFIGURED_APPS = [
  "knowledge-graph-rag-citations",
  "llm-app-personalized-memory",
  "local-chatgpt-with-memory",
  "always-on-hn-briefing-agent",
  "gemma3-finetuning",
];

describe("AI app registry — reachability", () => {
  it.each(PREVIOUSLY_UNREACHABLE)(
    "getAIAppComponent('%s') resolves instead of throwing (was unreachable: not in INTERNAL_AI_APP_SLUGS)",
    (slug) => {
      expect(isInternalAIApp(slug)).toBe(true);
      expect(() => getAIAppComponent(slug)).not.toThrow();

      const Component = getAIAppComponent(slug);
      expect(Component).toBeDefined();
      // React.lazy components are objects with a $$typeof of react.lazy
      expect(typeof Component).toBe("object");
    },
  );

  it.each(PREVIOUSLY_UNREACHABLE)("'%s' is registered as implemented", (slug) => {
    expect(isAIAppImplemented(slug)).toBe(true);
    expect(isAIAppProductionReady(slug)).toBe(true);
  });

  it.each(PREVIOUSLY_UNREACHABLE)(
    "'%s' lazy loader renders the real component under Suspense",
    async (slug) => {
      const Component = getAIAppComponent(slug);
      render(
        <React.Suspense fallback={<div>loading…</div>}>
          <Component appId={slug} appName={slug} />
        </React.Suspense>,
      );
      // GenericAIApp renders an h2 with the app name once the chunk resolves.
      expect(await screen.findByRole("heading", { level: 2, name: slug })).toBeInTheDocument();
    },
  );

  it.each(BACKFILLED_CONFIGURED_APPS)("backfilled app '%s' resolves through the runner", (slug) => {
    expect(isInternalAIApp(slug)).toBe(true);
    expect(() => getAIAppComponent(slug)).not.toThrow();
    expect(getImplementedAIAppSlugs()).toContain(slug);
  });

  it("every registry slug is an internal AI app that resolves", () => {
    const slugs = getImplementedAIAppSlugs();
    expect(slugs.length).toBeGreaterThan(100);
    for (const slug of slugs) {
      expect(isInternalAIApp(slug), `${slug} must be internal`).toBe(true);
      expect(() => getAIAppComponent(slug), `${slug} must resolve`).not.toThrow();
    }
  });

  it("throws for a slug that is not an internal AI app", () => {
    expect(() => getAIAppComponent("definitely-not-an-app")).toThrow(/not one of the internal AI apps/);
  });

  it("VOICE_ENABLED_APPS covers every app with a realtime config + voice UI", () => {
    // These 8 apps declare `realtime` in supabase/functions/run-ai-app/app-configs.ts
    // and render RealtimeVoiceSession; the flag previously under-reported by 3.
    const realtimeApps = [
      "ai-intake-voice-agent",
      "ai-dictation-assistant",
      "ai-app-builder-assistant",
      "build-plan-generator",
      "sprint-planner-ai",
      "ai-strategy-advisor",
      "ai-business-growth-consultant",
      "market-research-ai",
    ];
    for (const slug of realtimeApps) {
      expect(supportsVoiceMode(slug), `${slug} must be voice-enabled`).toBe(true);
    }
    expect(supportsVoiceMode("ai-bug-fixer")).toBe(false);
  });
});
