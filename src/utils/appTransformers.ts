import { getAppUrl as getCentralizedAppUrl } from "../config/appUrls";

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

  return {
    id: dbApp.slug,
    name: dbApp.name,
    description: dbApp.description || "",
    category: dbApp.category,
    iconName: getIconNameForApp(dbApp),
    image:
      dbApp.image ||
      "https://images.pexels.com/photos/3945313/pexels-photo-3945313.jpeg?auto=compress&cs=tinysrgb&w=800",
    isActive: dbApp.is_active,
    isPublic: dbApp.is_public,
    popular: dbApp.popular || dbApp.is_featured,
    new: dbApp.new || false,
    comingSoon: dbApp.coming_soon || false,
    url: appUrl,
  };
};
