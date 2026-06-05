import { generatedThumbnails } from '../data/generatedThumbnails';

// Build a map of AI-generated thumbnail URLs for instant lookup
const aiThumbnailMap = new Map<string, string>();
generatedThumbnails.forEach(thumb => {
  aiThumbnailMap.set(thumb.metadata.appId, thumb.url);
});

/**
 * Centralized App URL Configuration
 *
 * Single source of truth for all app URLs and thumbnail images.
 * Maps app IDs to their corresponding videoremix.vip subdomain URLs.
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
 * Get the URL for a specific app
 * @param appId - The app identifier
 * @returns The app's URL (external) or internal route fallback
 */
export const getAppUrl = (appId: string): string => {
  return APP_URLS[appId] || `/ai-design-studio/${appId}`;
};

/**
 * Get the thumbnail URL for a specific app
 * Priority: 1) AI-generated DALL-E thumbnail, 2) Local SVG thumbnail, 3) None
 * @param appId - The app identifier
 * @returns The app's thumbnail URL (absolute URL for AI-generated, relative path for SVG)
 */
export const getAppThumbnail = (appId: string): string => {
  // Priority 1: AI-generated DALL-E thumbnail (if available)
  const aiThumbnail = aiThumbnailMap.get(appId);
  if (aiThumbnail) {
    return aiThumbnail;
  }
  
  // Priority 2: Local static SVG thumbnail
  const localThumbnail = APP_THUMBNAILS[appId];
  if (localThumbnail) {
    return localThumbnail;
  }
  
  // Priority 3: No thumbnail available
  return "";
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
