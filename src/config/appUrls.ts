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
 * - AI Personalized Content Hub: https://ai-personalizedcontent.videoremix.vip
 * - FunnelCraft AI: https://ai-funnelcraft.videoremix.vip
 * - AI Skills Monetizer: https://ai-skills-monetizer.videoremix.vip
 * - AI Skills & Resume: https://ai-skills.videoremix.vip
 * - Sales Page Builder: https://ai-salespage.videoremix.vip
 * - Sales Assistant Pro: https://ai-salesassistant.videoremix.vip
 * - AI Personalization Studio: https://ai-personalizationstudio.videoremix.vip
 * - AI Personalizer: https://ai-personalizer.videoremix.vip
 * - AI Video Transformer: https://ai-video-transformer.videoremix.vip
 * - AI Screen Recorder: https://ai-screenrecorder.videoremix.vip
 * - AI Signature: https://ai-signature.videoremix.vip
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
  "ai-personalized-content": "https://ai-personalizedcontent.videoremix.vip",

  // FunnelCraft AI
  "funnelcraft-ai": "https://ai-funnelcraft.videoremix.vip",

  // AI Skills Monetizer
  "ai-skills-monetizer": "https://ai-skills-monetizer.videoremix.vip",

  // AI Skills & Resume
  "ai-skills-resume": "https://ai-skills.videoremix.vip",
  "resume-amplifier": "https://ai-skills.videoremix.vip",
  "voice-coach": "https://ai-skills.videoremix.vip",

  // Sales Page Builder
  "sales-page-builder": "https://ai-salespage.videoremix.vip",
  "landing-page": "https://ai-salespage.videoremix.vip",

  // Sales Assistant Pro
  "sales-assistant-pro": "https://ai-salesassistant.videoremix.vip",
  "sales-assistant-app": "https://ai-salesassistant.videoremix.vip",
  "ai-sales": "https://ai-salesassistant.videoremix.vip",
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
  "personalizer-profile": "https://ai-personalizer.videoremix.vip",

  // AI Video Transformer
  "ai-video-transformer": "https://ai-video-transformer.videoremix.vip",
  "personalizer-video-image-transformer": "https://ai-video-transformer.videoremix.vip",

  // AI Screen Recorder
  "ai-screen-recorder": "https://ai-screenrecorder.videoremix.vip",
  "personalizer-recorder": "https://ai-screenrecorder.videoremix.vip",

  // AI Signature
  "ai-signature": "https://ai-signature.videoremix.vip",

  // AI Thumbnail Generator
  "ai-thumbnail-generator": "https://ai-thumbnail-generator.videoremix.vip",
  "thumbnail-generator": "https://ai-thumbnail-generator.videoremix.vip",

  // Profile Gen
  "profile-gen": "https://ai-profilegen.videoremix.vip",
  "personalizer-profile-generator": "https://ai-profilegen.videoremix.vip",

  // AI Video Editor
  "ai-video-editor": "https://ai-videoeditor.videoremix.vip",
  "video-ai-editor": "https://ai-videoeditor.videoremix.vip",

  // AI Referral Maximizer Pro
  "ai-referral-maximizer-pro": "https://referrals.smartcrm.vip",
  "ai-referral-maximizer": "https://referrals.smartcrm.vip",

  // AI Sales Maximizer
  "ai-sales-maximizer": "https://salesmax.smartcrm.vip",
  "smart-crm-closer": "https://salesmax.smartcrm.vip",

  // ContentAI
  "contentai": "https://contentai.smartcrm.vip",
  "ai-content": "https://contentai.smartcrm.vip",

  // Product Research AI
  "product-research-ai": "https://research.smartcrm.vip",

  // =====================================================
  // 16 NETLIFY SPECIAL URL APPS
  // =====================================================
  "ai-personalized-content-pro": "https://capable-mermaid-3c73fa.netlify.app/",
  "ai-referral-maximizer-pro": "https://eloquent-kleicha-7e3a3e.netlify.app",
  "ai-sales-maximizer-pro": "https://magnificent-lamington-619374.netlify.app/",
  "ai-screen-recorder-pro": "https://adorable-arithmetic-675d28.netlify.app/",
  "smart-crm-closer-pro": "https://stupendous-twilight-64389a.netlify.app/",
  "video-ai-editor-pro": "https://heroic-seahorse-296f32.netlify.app/",
  "ai-video-image-pro": "https://thriving-mochi-ecd815.netlify.app/",
  "ai-skills-monetizer-pro": "https://roaring-mochi-39a60a.netlify.app",
  "ai-signature-pro": "https://kaleidoscopic-tarsier-3d0a6c.netlify.app/",
  "personalizer-profile-generator-pro": "https://endearing-churros-2ce8c6.netlify.app/",
  "personalizer-transformer": "https://thriving-mochi-ecd815.netlify.app/",
  "personalizer-url-templates": "https://cute-khapse-4e62cb.netlify.app/",
  "ai-proposal-generator": "https://keen-pastelito-6b9074.netlify.app",
  "sales-assistant-platform": "https://gentle-frangipane-ceed17.netlify.app",
  "sales-page-builder-pro": "https://prismatic-starship-c0b4c2.netlify.app",
  "ai-content-studio": "https://sparkling-druid-4a8b1d.netlify.app",
};

// =====================================================
// =====================================================
// THUMBNAIL URLs - AI-Generated thumbnails take priority
// =====================================================
// Note: AI-generated thumbnails (from DALL-E) are checked first in getAppThumbnail()
// These SVG entries serve as fallbacks for apps without AI thumbnails.
export const APP_THUMBNAILS: Record<string, string> = {
  // These apps have AI-generated thumbnails (served from Supabase) so these are secondary fallbacks
  "ai-personalized-content": "/app-thumbnails/ai-personalized-content-realistic.svg",
  "funnelcraft-ai": "/app-thumbnails/funnelcraft-ai-realistic.svg",
  "ai-skills-monetizer": "/app-thumbnails/ai-skills-monetizer-realistic.svg",
  "ai-skills-resume": "/app-thumbnails/ai-skills-resume-realistic.svg",
  "sales-page-builder": "/app-thumbnails/sales-page-builder-realistic.svg",
  "sales-assistant-pro": "/app-thumbnails/sales-assistant-pro-realistic.svg",
  "ai-personalization-studio": "/app-thumbnails/ai-personalization-studio-realistic.svg",
  "ai-personalizer": "/app-thumbnails/ai-personalizer-realistic.svg",
  "ai-video-transformer": "/app-thumbnails/ai-video-transformer-realistic.svg",
  "ai-screen-recorder": "/app-thumbnails/ai-screen-recorder-realistic.svg",
  "ai-signature": "/app-thumbnails/ai-signature-realistic.svg",
  "ai-thumbnail-generator": "/app-thumbnails/ai-thumbnail-generator-realistic.svg",
  "profile-gen": "/app-thumbnails/profile-gen-realistic.svg",
  "ai-video-editor": "/app-thumbnails/ai-video-editor-realistic.svg",
  "ai-referral-maximizer-pro": "/app-thumbnails/ai-referral-maximizer-pro-realistic.svg",
  "ai-sales-maximizer": "/app-thumbnails/ai-sales-maximizer-realistic.svg",
  "contentai": "/app-thumbnails/contentai-realistic.svg",
  "product-research-ai": "/app-thumbnails/product-research-ai-realistic.svg",

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
  return APP_URLS[appId] || `/app/${appId}`;
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
  PERSONALIZED_CONTENT: "https://ai-personalizedcontent.videoremix.vip",
  FUNNELCRAFT: "https://ai-funnelcraft.videoremix.vip",
  SKILLS: "https://ai-skills.videoremix.vip",
  SKILLS_MONETIZER: "https://ai-skills-monetizer.videoremix.vip",
  SALES_PAGE: "https://ai-salespage.videoremix.vip",
  SALES_ASSISTANT: "https://ai-salesassistant.videoremix.vip",
  PERSONALIZATION_STUDIO: "https://ai-personalizationstudio.videoremix.vip",
  PERSONALIZER: "https://ai-personalizer.videoremix.vip",
  VIDEO_TRANSFORMER: "https://ai-video-transformer.videoremix.vip",
  SCREEN_RECORDER: "https://ai-screenrecorder.videoremix.vip",
  SIGNATURE: "https://ai-signature.videoremix.vip",
  THUMBNAIL: "https://ai-thumbnail-generator.videoremix.vip",
  PROFILE_GEN: "https://ai-profilegen.videoremix.vip",
  VIDEO_EDITOR: "https://ai-videoeditor.videoremix.vip",
  REFERRALS: "https://referrals.smartcrm.vip",
  SALESMAX: "https://salesmax.smartcrm.vip",
  CONTENTAI: "https://contentai.smartcrm.vip",
  RESEARCH: "https://research.smartcrm.vip",
} as const;

export type UrlCategory = (typeof URL_CATEGORIES)[keyof typeof URL_CATEGORIES];
