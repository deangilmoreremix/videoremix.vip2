/**
 * Centralized App URL Configuration
 *
 * Single source of truth for all app URLs across the platform.
 * Maps app IDs to their corresponding videoremix.vip subdomain URLs.
 */
import { isInternalAIApp } from "./internalAIApps";

export const APP_URLS: Record<string, string> = {
  // Personalizer Suite - ai-personalizedcontent.videoremix.vip
  "personalizer-text-ai-editor":
    "https://ai-personalizedcontent.videoremix.vip",
  "personalizer-advanced-text-video-editor":
    "https://ai-personalizedcontent.videoremix.vip",
  "personalizer-writing-toolkit":
    "https://ai-personalizedcontent.videoremix.vip",
  "video-creator": "https://ai-personalizedcontent.videoremix.vip",
  "promo-generator": "https://ai-personalizedcontent.videoremix.vip",
  "text-to-speech": "https://ai-personalizedcontent.videoremix.vip",
  "niche-script": "https://ai-personalizedcontent.videoremix.vip",

  // FunnelCraft AI
  "funnelcraft-ai": "https://ai-funnelcraft.videoremix.vip",

  // Skills & Professional Development - ai-skills.videoremix.vip
  "ai-skills-monetizer": "https://ai-skills-monetizer.videoremix.vip",
  "resume-amplifier": "https://ai-skills.videoremix.vip",
  "voice-coach": "https://ai-skills.videoremix.vip",

  // Sales Page & Landing Page Creator
  "landing-page": "https://ai-salespage.videoremix.vip",

  // Sales Assistant & Proposal Tools
  "sales-assistant-app": "https://ai-salesassistant.videoremix.vip",
  "ai-sales": "https://ai-salesassistant.videoremix.vip",
  "sales-monetizer": "https://ai-salesassistant.videoremix.vip",

  // Personalization Studio Hub (Profile & General)
  "personalizer-profile": "https://ai-personalizer.videoremix.vip",

  // Video Transformer
  "personalizer-video-image-transformer":
    "https://ai-video-transformer.videoremix.vip",

  // Screen Recorder
  "personalizer-recorder": "https://ai-screenrecorder.videoremix.vip",

  // AI Signature
  "ai-signature": "https://ai-signature.videoremix.vip",

  // Thumbnail Generator
  "thumbnail-generator": "https://ai-thumbnail-generator.videoremix.vip",

  // Additional apps that may need URLs assigned (keeping as placeholders)
  "ai-referral-maximizer": "https://ai-personalizedcontent.videoremix.vip",
  "smart-crm-closer": "https://ai-salesassistant.videoremix.vip",
  "video-ai-editor": "https://ai-personalizedcontent.videoremix.vip",
  "ai-video-image": "https://ai-video-transformer.videoremix.vip",
  "ai-template-generator": "https://ai-personalizedcontent.videoremix.vip",
  "interactive-shopping": "https://ai-personalizedcontent.videoremix.vip",
  "personalizer-url-video-generation":
    "https://ai-personalizedcontent.videoremix.vip",

  // 15 New Dashboard Apps with Netlify URLs
  "ai-personalized-content": "https://capable-mermaid-3c73fa.netlify.app/",
  "ai-referral-maximizer-pro": "https://eloquent-kleicha-7e3a3e.netlify.app",
  "ai-sales-maximizer": "https://magnificent-lamington-619374.netlify.app/",
  "ai-screen-recorder": "https://adorable-arithmetic-675d28.netlify.app/",
  "smart-crm-closer-pro": "https://stupendous-twilight-64389a.netlify.app/",
  "video-ai-editor-pro": "https://heroic-seahorse-296f32.netlify.app/",
  "ai-video-image-pro": "https://thriving-mochi-ecd815.netlify.app/",
  "ai-skills-monetizer-pro": "https://roaring-mochi-39a60a.netlify.app",
  "ai-signature-pro": "https://kaleidoscopic-tarsier-3d0a6c.netlify.app/",
  "personalizer-profile-generator":
    "https://endearing-churros-2ce8c6.netlify.app/",
  "personalizer-transformer": "https://thriving-mochi-ecd815.netlify.app/",
  "personalizer-url-templates": "https://cute-khapse-4e62cb.netlify.app/",
  "ai-proposal-generator": "https://keen-pastelito-6b9074.netlify.app",
  "sales-assistant-platform": "https://gentle-frangipane-ceed17.netlify.app",
  "sales-page-builder-pro": "https://prismatic-starship-c0b4c2.netlify.app",

  // Creative tools with ai-personalizationstudio hub
  storyboard: "https://ai-personalizationstudio.videoremix.vip",
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
};

/**
 * Get the URL for a specific app
 * @param appId - The app identifier
 * @returns The app's URL (external) or internal route fallback
 */
export const getAppUrl = (appId: string): string => {
  // The 95 first-party AI apps run inside the dashboard as rich React UIs
  if (isInternalAIApp(appId)) {
    return `/ai-app/${appId}`;
  }
  return APP_URLS[appId] || `/app/${appId}`;
};

/**
 * Validate that all active apps have verified launch targets
 * This should be called during app loading/initialization
 * @param activeAppSlugs - Array of slugs for active apps
 * @throws Error if any active app lacks a verified launch target
 */
export const validateActiveAppLaunchTargets = (activeAppSlugs: string[]): void => {
  const missingMappings: string[] = [];

  for (const slug of activeAppSlugs) {
    if (!(slug in APP_URLS)) {
      missingMappings.push(slug);
    }
  }

  if (missingMappings.length > 0) {
    throw new Error(
      `Active apps missing launch target mappings: ${missingMappings.join(', ')}. ` +
      `Add these apps to APP_URLS in src/config/appUrls.ts or provide custom_domain/netlify_url in database.`
    );
  }
};

/**
 * Check if an app has an external URL
 * @param appId - The app identifier
 * @returns True if the app uses an external URL
 */
export const isExternalUrl = (appId: string): boolean => {
  return appId in APP_URLS && APP_URLS[appId].startsWith("https://");
};

/**
 * Get all apps that share the same URL (multi-app hubs)
 * @param url - The URL to check
 * @returns Array of app IDs that use this URL
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
  PERSONALIZED_CONTENT: "https://ai-personalizedcontent.videoremix.vip",
  FUNNELCRAFT: "https://ai-funnelcraft.videoremix.vip",
  SKILLS: "https://ai-skills.videoremix.vip",
  SKILLS_MONETIZER: "https://ai-skills-monetizer.videoremix.vip",
  SALES_PAGE: "https://ai-salespage.videoremix.vip",
  PROPOSAL: "https://ai-proposal.videoremix.vip",
  SALES_ASSISTANT: "https://ai-salesassistant.videoremix.vip",
  PERSONALIZATION_STUDIO: "https://ai-personalizationstudio.videoremix.vip",
  VIDEO_TRANSFORMER: "https://ai-video-transformer.videoremix.vip",
  SCREEN_RECORDER: "https://ai-screenrecorder.videoremix.vip",
  SIGNATURE: "https://ai-signature.videoremix.vip",
  THUMBNAIL: "https://ai-thumbnail-generator.videoremix.vip",
  PERSONALIZER: "https://ai-personalizer.videoremix.vip",
} as const;

export type UrlCategory = (typeof URL_CATEGORIES)[keyof typeof URL_CATEGORIES];


// Thumbnail mappings
export const THUMBNAIL_URLS: Record<string, string> = {
  "promo-generator": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/promo-generator-ai-thumbnail-1776704426033.png",
  "video-creator": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/video-creator-ai-thumbnail-1776704425812.png",
  "landing-page": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/landing-page-ai-thumbnail-1776704426524.png",
  "ai-image-tools": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-image-tools-ai-thumbnail-1776704457300.png",
  "rebrander-ai": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/rebrander-ai-ai-thumbnail-1776704460251.png",
  "voice-coach": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/voice-coach-ai-thumbnail-1776704460733.png",
  "storyboard": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/storyboard-ai-thumbnail-1776704492594.png",
  "smart-presentations": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/smart-presentations-ai-thumbnail-1776704492613.png",
  "sales-monetizer": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/sales-monetizer-ai-thumbnail-1776704494615.png",
  "interactive-outros": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/interactive-outros-ai-thumbnail-1776704529477.png",
  "personalizer-recorder": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/personalizer-recorder-ai-thumbnail-1776704529514.png",
  "thumbnail-generator": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/thumbnail-generator-ai-thumbnail-1776704530509.png",
  "ai-art": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-art-ai-thumbnail-1776704561686.png",
  "social-pack": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/social-pack-ai-thumbnail-1776704562321.png",
  "bg-remover": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/bg-remover-ai-thumbnail-1776704565069.png",
  "text-to-speech": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/text-to-speech-ai-thumbnail-1776704597380.png",
  "niche-script": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/niche-script-ai-thumbnail-1776704597610.png",
  "ai-referral-maximizer": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-referral-maximizer-ai-thumbnail-1776704597857.png",
  "video-ai-editor": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/video-ai-editor-ai-thumbnail-1776704630431.png",
  "smart-crm-closer": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/smart-crm-closer-ai-thumbnail-1776704630924.png",
  "ai-video-image": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-video-image-ai-thumbnail-1776704631265.png",
  "ai-signature": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-signature-ai-thumbnail-1776704664298.png",
  "ai-skills-monetizer": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-skills-monetizer-ai-thumbnail-1776704664581.png",
  "ai-template-generator": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-template-generator-ai-thumbnail-1776704665560.png",
  "personalizer-video-image-transformer": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/personalizer-video-image-transformer-ai-thumbnail-1776704696819.png",
  "interactive-shopping": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/interactive-shopping-ai-thumbnail-1776704697742.png",
  "funnelcraft-ai": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/funnelcraft-ai-ai-thumbnail-1776704699683.png",
  "ai-headshot-studio": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-headshot-studio-ai-thumbnail-1776705000001.png",
  "nano-banana-studio": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/nano-banana-studio-ai-thumbnail-1776705000002.png",
  "seedance-v2-studio": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/seedance-v2-studio-ai-thumbnail-1776705000003.png",
  "easyveo": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/easyveo-ai-thumbnail-1776705000004.png",
  "aiclip": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/aiclip-ai-thumbnail-1776705000005.png",
  "pet-product-studio": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/pet-product-studio-ai-thumbnail-1776705000006.png",
  "resale-photo-enhancer": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/resale-photo-enhancer-ai-thumbnail-1776705000007.png",
  "ai-recruiter": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-recruiter-ai-thumbnail-1776705000008.png",
  "talk-to-pdf": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/talk-to-pdf-ai-thumbnail-1776705000009.png",
  "blogger-cms": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/blogger-cms-ai-thumbnail-1776705000010.png",
  "amazon-product-studio": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/amazon-product-studio-ai-thumbnail-1776705000011.png",
  "ai-business-card": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-business-card-ai-thumbnail-1776705000012.png",
  "mailwise": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/mailwise-ai-thumbnail-1776705000013.png",
  "my-podcast": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/my-podcast-ai-thumbnail-1776705000014.png",
  "ezscribe": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ezscribe-ai-thumbnail-1776705000015.png",
  "ai-knowledge-base": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-knowledge-base-ai-thumbnail-1776705000016.png",
  "ai-outbound": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-outbound-ai-thumbnail-1776705000017.png",
  "ai-royal-portrait": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-royal-portrait-ai-thumbnail-1776705000018.png",
  "ai-logo": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-logo-ai-thumbnail-1776705000019.png",
  "old-photo": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/old-photo-ai-thumbnail-1776705000020.png",
  "ai-try-on": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-try-on-ai-thumbnail-1776705000021.png",
  "ai-age-transformation": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-age-transformation-ai-thumbnail-1776705000022.png",
  "ai-professional-makeup-generator": "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-professional-makeup-generator-ai-thumbnail-1776705000023.png",
};



export const getThumbnailUrl = (appId: string): string => {
  return THUMBNAIL_URLS[appId] || '';
};

