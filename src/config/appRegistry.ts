// appRegistry.ts
//
// SINGLE CUSTOMER-FACING CATALOG for SapienX.
//
// Product identity:
//   - 117 Awesome LLM Apps products. Their React conversions are implementations
//     of these products, not a second catalog.
//   - 13 additional VideoRemix-created applications.
//
// Total: 130 unique customer-facing applications.

import { rawAppsData } from "../data/appsData";

export type AppFamily = "awesome-llm" | "external";

export interface AppMeta {
  slug: string;
  name: string;
  description: string;
  category: string;
  group: string;
  family: AppFamily;
  url?: string;
  externalUrl?: string;
  thumbnail?: string;
  source?: "awesome-llm" | "user";
}

const AWESOME_LLM_APPS: AppMeta[] = rawAppsData.map((app) => ({
  slug: app.id,
  name: app.name,
  description: app.description,
  category: app.category,
  group: app.group,
  family: "awesome-llm",
  url: `/ai-runner/${app.id}`,
  thumbnail: app.image,
  source: "awesome-llm",
}));

const VIDEOREMIX_EXTRA_APPS: AppMeta[] = [
  {
      slug: "ai-personalizationstudio",
      name: "AI Personalization Studio",
      description: "AI Personalization Studio",
      category: "user-apps",
      group: "user-apps",
      family: "external",
      url: "https://ai-personalizationstudio.videoremix.vip",
      externalUrl: "https://ai-personalizationstudio.videoremix.vip",
      thumbnail: "/app-thumbnails/ai-personalizationstudio.svg",
      source: "user",
    },
  {
      slug: "ai-personalizedcontent",
      name: "AI Personalized Content Hub",
      description: "AI Personalized Content Hub",
      category: "user-apps",
      group: "user-apps",
      family: "external",
      url: "https://ai-personalizedcontent.videoremix.vip",
      externalUrl: "https://ai-personalizedcontent.videoremix.vip",
      thumbnail: "/app-thumbnails/ai-personalizedcontent.svg",
      source: "user",
    },
  {
      slug: "ai-profilegen",
      name: "Profile Gen",
      description: "Profile Gen",
      category: "user-apps",
      group: "user-apps",
      family: "external",
      url: "https://ai-profilegen.videoremix.vip",
      externalUrl: "https://ai-profilegen.videoremix.vip",
      thumbnail: "/app-thumbnails/ai-profilegen.svg",
      source: "user",
    },
  {
      slug: "ai-referral-maximizer-pro",
      name: "AI Referral Maximizer Pro",
      description: "AI Referral Maximizer Pro",
      category: "user-apps",
      group: "user-apps",
      family: "external",
      url: "https://referrals.smartcrm.vip",
      externalUrl: "https://referrals.smartcrm.vip",
      thumbnail: "/app-thumbnails/ai-referral-maximizer-pro.svg",
      source: "user",
    },
  {
      slug: "ai-sales-maximizer",
      name: "AI Sales Maximizer",
      description: "AI Sales Maximizer",
      category: "user-apps",
      group: "user-apps",
      family: "external",
      url: "https://salesmax.smartcrm.vip",
      externalUrl: "https://salesmax.smartcrm.vip",
      thumbnail: "/app-thumbnails/ai-sales-maximizer.svg",
      source: "user",
    },
  {
      slug: "ai-screenrecorder",
      name: "AI Screen Recorder",
      description: "AI Screen Recorder",
      category: "user-apps",
      group: "user-apps",
      family: "external",
      url: "https://ai-screenrecorder.videoremix.vip",
      externalUrl: "https://ai-screenrecorder.videoremix.vip",
      thumbnail: "/app-thumbnails/ai-screenrecorder.svg",
      source: "user",
    },
  {
      slug: "ai-signature",
      name: "AI Signature",
      description: "AI Signature",
      category: "user-apps",
      group: "user-apps",
      family: "external",
      url: "https://ai-signature.videoremix.vip",
      externalUrl: "https://ai-signature.videoremix.vip",
      thumbnail: "/app-thumbnails/ai-signature.svg",
      source: "user",
    },
  {
      slug: "ai-skills-monetizer",
      name: "AI Skills & Resume",
      description: "AI Skills & Resume",
      category: "user-apps",
      group: "user-apps",
      family: "external",
      url: "https://ai-skills.videoremix.vip",
      externalUrl: "https://ai-skills.videoremix.vip",
      thumbnail: "/app-thumbnails/ai-skills-monetizer.svg",
      source: "user",
    },
  {
      slug: "ai-video-editor",
      name: "AI Video Editor",
      description: "AI Video Editor",
      category: "user-apps",
      group: "user-apps",
      family: "external",
      url: "https://ai-videoeditor.videoremix.vip",
      externalUrl: "https://ai-videoeditor.videoremix.vip",
      thumbnail: "/app-thumbnails/ai-video-editor.svg",
      source: "user",
    },
  {
      slug: "funnelcraft-ai",
      name: "FunnelCraft AI",
      description: "FunnelCraft AI",
      category: "user-apps",
      group: "user-apps",
      family: "external",
      url: "https://ai-funnelcraft.videoremix.vip",
      externalUrl: "https://ai-funnelcraft.videoremix.vip",
      thumbnail: "/app-thumbnails/funnelcraft-ai.svg",
      source: "user",
    },
  {
      slug: "sales-assistant-app",
      name: "Sales Assistant Pro",
      description: "Sales Assistant Pro",
      category: "user-apps",
      group: "user-apps",
      family: "external",
      url: "https://ai-salesassistant.videoremix.vip",
      externalUrl: "https://ai-salesassistant.videoremix.vip",
      thumbnail: "/app-thumbnails/sales-assistant-app.svg",
      source: "user",
    },
  {
      slug: "sales-page-builder",
      name: "Sales Page Builder",
      description: "Sales Page Builder",
      category: "user-apps",
      group: "user-apps",
      family: "external",
      url: "https://ai-salespage.videoremix.vip",
      externalUrl: "https://ai-salespage.videoremix.vip",
      thumbnail: "/app-thumbnails/sales-page-builder.svg",
      source: "user",
    },
  {
      slug: "smartcrmcloser-pro",
      name: "Smart CRM Closer Pro",
      description: "Smart CRM Closer Pro",
      category: "user-apps",
      group: "user-apps",
      family: "external",
      url: "https://smartcrmcloser.netlify.app",
      externalUrl: "https://smartcrmcloser.netlify.app",
      thumbnail: "/app-thumbnails/smartcrmcloser-pro.svg",
      source: "user",
    }
];

export const AWESOME_LLM_APP_COUNT = AWESOME_LLM_APPS.length;
export const VIDEOREMIX_EXTRA_APP_COUNT = VIDEOREMIX_EXTRA_APPS.length;

export const APP_REGISTRY: AppMeta[] = [
  ...AWESOME_LLM_APPS,
  ...VIDEOREMIX_EXTRA_APPS,
];

export const TOTAL_APP_COUNT = APP_REGISTRY.length;

export const APP_REGISTRY_BY_SLUG = new Map(
  APP_REGISTRY.map((app) => [app.slug, app] as const),
);

export function getAppMeta(slug: string): AppMeta | undefined {
  return APP_REGISTRY_BY_SLUG.get(slug);
}

export function isExternalApp(app: AppMeta): boolean {
  return app.family === "external";
}
