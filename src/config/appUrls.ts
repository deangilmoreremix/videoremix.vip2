/**
 * Centralized App URL Configuration
 *
 * Single source of truth for all app URLs across the platform.
 * Maps app IDs to their corresponding videoremix.vip subdomain URLs.
 */

export const APP_URLS: Record<string, string> = {
  // Personalizer Suite - ai-personalizedcontent.videoremix.vip
  'personalizer-text-ai-editor': 'https://ai-personalizedcontent.videoremix.vip',
  'personalizer-advanced-text-video-editor': 'https://ai-personalizedcontent.videoremix.vip',
  'personalizer-writing-toolkit': 'https://ai-personalizedcontent.videoremix.vip',
  'video-creator': 'https://ai-personalizedcontent.videoremix.vip',
  'promo-generator': 'https://ai-personalizedcontent.videoremix.vip',
  'text-to-speech': 'https://ai-personalizedcontent.videoremix.vip',
  'niche-script': 'https://ai-personalizedcontent.videoremix.vip',

  // FunnelCraft AI
  'funnelcraft-ai': 'https://ai-funnelcraft.videoremix.vip',

  // Skills & Professional Development - ai-skills.videoremix.vip
  'ai-skills-monetizer': 'https://ai-skills-monetizer.videoremix.vip',
  'resume-amplifier': 'https://ai-skills.videoremix.vip',
  'voice-coach': 'https://ai-skills.videoremix.vip',

  // Sales Page & Landing Page Creator
  'landing-page': 'https://ai-salespage.videoremix.vip',

  // Sales Assistant & Proposal Tools
  'sales-assistant-app': 'https://ai-salesassistant.videoremix.vip',
  'ai-sales': 'https://ai-salesassistant.videoremix.vip',
  'sales-monetizer': 'https://ai-salesassistant.videoremix.vip',

  // Personalization Studio Hub (Profile & General)
  'personalizer-profile': 'https://ai-personalizer.videoremix.vip',

  // Video Transformer
  'personalizer-video-image-transformer': 'https://ai-video-transformer.videoremix.vip',

  // Screen Recorder
  'personalizer-recorder': 'https://ai-screenrecorder.videoremix.vip',

  // AI Signature
  'ai-signature': 'https://ai-signature.videoremix.vip',

  // Thumbnail Generator
  'thumbnail-generator': 'https://ai-thumbnail-generator.videoremix.vip',

  // Additional apps that may need URLs assigned (keeping as placeholders)
  'ai-referral-maximizer': 'https://ai-personalizedcontent.videoremix.vip',
  'smart-crm-closer': 'https://ai-salesassistant.videoremix.vip',
  'video-ai-editor': 'https://ai-personalizedcontent.videoremix.vip',
  'ai-video-image': 'https://ai-video-transformer.videoremix.vip',
  'ai-template-generator': 'https://ai-personalizedcontent.videoremix.vip',
  'interactive-shopping': 'https://ai-personalizedcontent.videoremix.vip',
  'personalizer-url-video-generation': 'https://ai-personalizedcontent.videoremix.vip',

  // 15 New Dashboard Apps with Netlify URLs
  'ai-personalized-content': 'https://capable-mermaid-3c73fa.netlify.app/',
  'ai-referral-maximizer-pro': 'https://eloquent-kleicha-7e3a3e.netlify.app',
  'ai-sales-maximizer': 'https://magnificent-lamington-619374.netlify.app/',
  'ai-screen-recorder': 'https://adorable-arithmetic-675d28.netlify.app/',
  'smart-crm-closer-pro': 'https://stupendous-twilight-64389a.netlify.app/',
  'video-ai-editor-pro': 'https://heroic-seahorse-296f32.netlify.app/',
  'ai-video-image-pro': 'https://thriving-mochi-ecd815.netlify.app/',
  'ai-skills-monetizer-pro': 'https://roaring-mochi-39a60a.netlify.app',
  'ai-signature-pro': 'https://kaleidoscopic-tarsier-3d0a6c.netlify.app/',
  'personalizer-profile-generator': 'https://endearing-churros-2ce8c6.netlify.app/',
  'personalizer-transformer': 'https://thriving-mochi-ecd815.netlify.app/',
  'personalizer-url-templates': 'https://cute-khapse-4e62cb.netlify.app/',
  'ai-proposal-generator': 'https://keen-pastelito-6b9074.netlify.app',
  'sales-assistant-platform': 'https://gentle-frangipane-ceed17.netlify.app',
  'sales-page-builder-pro': 'https://prismatic-starship-c0b4c2.netlify.app',

  // Creative tools with ai-personalizationstudio hub
  'storyboard': 'https://ai-personalizationstudio.videoremix.vip',
  'ai-art': 'https://ai-personalizationstudio.videoremix.vip',
  'rebrander-ai': 'https://ai-personalizationstudio.videoremix.vip',
  'business-brander': 'https://ai-personalizationstudio.videoremix.vip',
  'branding-analyzer': 'https://ai-personalizationstudio.videoremix.vip',
  'ai-branding': 'https://ai-personalizationstudio.videoremix.vip',
  'bg-remover': 'https://ai-personalizationstudio.videoremix.vip',
  'ai-image-tools': 'https://ai-personalizationstudio.videoremix.vip',
  'smart-presentations': 'https://ai-personalizationstudio.videoremix.vip',
  'interactive-outros': 'https://ai-personalizationstudio.videoremix.vip',
  'social-pack': 'https://ai-personalizationstudio.videoremix.vip',
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
 * Check if an app has an external URL
 * @param appId - The app identifier
 * @returns True if the app uses an external URL
 */
export const isExternalUrl = (appId: string): boolean => {
  return appId in APP_URLS && APP_URLS[appId].startsWith('https://');
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
  PERSONALIZED_CONTENT: 'https://ai-personalizedcontent.videoremix.vip',
  FUNNELCRAFT: 'https://ai-funnelcraft.videoremix.vip',
  SKILLS: 'https://ai-skills.videoremix.vip',
  SKILLS_MONETIZER: 'https://ai-skills-monetizer.videoremix.vip',
  SALES_PAGE: 'https://ai-salespage.videoremix.vip',
  PROPOSAL: 'https://ai-proposal.videoremix.vip',
  SALES_ASSISTANT: 'https://ai-salesassistant.videoremix.vip',
  PERSONALIZATION_STUDIO: 'https://ai-personalizationstudio.videoremix.vip',
  VIDEO_TRANSFORMER: 'https://ai-video-transformer.videoremix.vip',
  SCREEN_RECORDER: 'https://ai-screenrecorder.videoremix.vip',
  SIGNATURE: 'https://ai-signature.videoremix.vip',
  THUMBNAIL: 'https://ai-thumbnail-generator.videoremix.vip',
  PERSONALIZER: 'https://ai-personalizer.videoremix.vip',
} as const;

export type UrlCategory = typeof URL_CATEGORIES[keyof typeof URL_CATEGORIES];
