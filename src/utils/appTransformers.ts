import { getAppUrl as getCentralizedAppUrl, getAppThumbnail } from "../config/appUrls";

export interface DatabaseApp {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  image?: string;
  icon?: string;
  netlify_url?: string;
  custom_domain?: string;
  is_active: boolean;
  is_featured: boolean;
  is_public: boolean;
  popular?: boolean;
  new?: boolean;
  coming_soon?: boolean;
  price?: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ComponentApp {
  id: string;
  name: string;
  description: string;
  category: string;
  iconName: string;
  image: string;
  isActive: boolean;
  isPublic: boolean;
  popular?: boolean;
  new?: boolean;
  comingSoon?: boolean;
  url?: string;
}

// Fallback images for when no custom thumbnail is available
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1616469829941-c7200edec809?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
];

// Get icon name for app (used by LazyIcon component)
export const getIconNameForApp = (app: DatabaseApp): string => {
  // Check specific app slug first, then fall back to category
  return app.slug || app.category || "ai";
};

// Transform database app to component app (pure data transformation)
export const transformApp = (dbApp: DatabaseApp): ComponentApp => {
  // URL Priority Order:
  // 1. Database custom_domain (highest priority)
  // 2. Database netlify_url
  // 3. Centralized APP_URLS config (from appUrls.ts)
  // 4. Fallback to internal route
  let appUrl: string;

  if (dbApp.custom_domain) {
    appUrl = dbApp.custom_domain;
  } else if (dbApp.netlify_url) {
    appUrl = dbApp.netlify_url;
  } else {
    // Use centralized config, which will return internal route if not found
    appUrl = getCentralizedAppUrl(dbApp.slug);
  }

  // Image URL Priority Order:
  // 1. Custom AI-generated thumbnail from APP_THUMBNAILS (new SVG thumbnails)
  // 2. Database image field
  // 3. Fallback to curated Unsplash images
  const customThumbnail = getAppThumbnail(dbApp.slug);
  const appImage = dbApp.image;

  let imageUrl: string;
  if (customThumbnail) {
    // Use our custom SVG thumbnail
    imageUrl = customThumbnail;
  } else if (appImage) {
    imageUrl = appImage;
  } else {
    // Fallback to a deterministic Unsplash image based on slug
    const fallbackIndex = dbApp.slug.charCodeAt(0) % FALLBACK_IMAGES.length;
    imageUrl = FALLBACK_IMAGES[fallbackIndex];
  }

  return {
    id: dbApp.slug,
    name: dbApp.name,
    description: dbApp.description || "",
    category: dbApp.category,
    iconName: getIconNameForApp(dbApp),
    image: imageUrl,
    isActive: dbApp.is_active,
    isPublic: dbApp.is_public,
    popular: dbApp.popular || dbApp.is_featured,
    new: dbApp.new || false,
    comingSoon: dbApp.coming_soon || false,
    url: appUrl,
  };
};
