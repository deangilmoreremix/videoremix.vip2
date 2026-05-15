import { getAppUrl as getCentralizedAppUrl } from "../config/appUrls";

export interface DatabaseApp {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  image?: string;
  netlify_url?: string;
  custom_domain?: string;
  is_active: boolean;
  is_featured: boolean;
  is_public: boolean;
  popular?: boolean;
  new?: boolean;
  coming_soon?: boolean;
  is_new?: boolean;  // alternate name used in some DB records
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
  price?: number;
}

// Validate that all required fields are present and non-empty
export const isValidAppData = (dbApp: Partial<DatabaseApp>): dbApp is DatabaseApp => {
  const required: (keyof DatabaseApp)[] = [
    "id", "name", "slug", "description", "category",
    "is_active", "is_featured", "is_public",
    "sort_order", "created_at", "updated_at",
  ];
  return required.every(
    (key) => dbApp[key] !== undefined && dbApp[key] !== null && String(dbApp[key]!).trim() !== ""
  );
};

// Safe transform that never throws — returns null for invalid data
export const safeTransform = (dbApp: Partial<DatabaseApp>): ComponentApp | null => {
  if (!isValidAppData(dbApp)) {
    console.warn("[transformApp] Skipping invalid app record (missing required fields):", {
      id: dbApp.id,
      name: dbApp.name,
      slug: dbApp.slug,
    });
    return null;
  }

  try {
    return transformApp(dbApp as DatabaseApp);
  } catch (err) {
    console.warn("[transformApp] Failed to transform app:", dbApp.id, err);
    return null;
  }
};

// Get icon name for app (used by LazyIcon component)
export const getIconNameForApp = (app: DatabaseApp): string => {
  return app.category || "ai";
};

// Validate that an active app has a verified launch target
export const validateAppLaunchTarget = (dbApp: DatabaseApp): boolean => {
  if (!dbApp.is_active) {
    return true; // Inactive apps don't need validation
  }

  // Check URL priority order
  if (dbApp.custom_domain) {
    return true; // Custom domain is verified by admin
  }

  if (dbApp.netlify_url) {
    return true; // Netlify URL is verified by admin
  }

  // Check centralized config
  const centralizedUrl = getCentralizedAppUrl(dbApp.slug);
  if (centralizedUrl !== `/app/${dbApp.slug}`) {
    return true; // Has a centralized mapping
  }

  // No valid launch target found
  console.warn(`Active app "${dbApp.name}" (slug: ${dbApp.slug}) has no verified launch target`);
  return false;
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
      "https://images.unsplash.com/photo-1616469829941-c7200edec809?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isActive: dbApp.is_active,
    isPublic: dbApp.is_public,
    popular: dbApp.popular || dbApp.is_featured,
    new: dbApp.new || false,
    comingSoon: dbApp.coming_soon || false,
    url: appUrl,
    price: dbApp.price,
  };
};
