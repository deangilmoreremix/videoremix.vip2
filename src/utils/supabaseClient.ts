import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Timeout wrapper for fetch requests
const FETCH_TIMEOUT_MS = 10000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithRetry<T>(
  fetchFn: () => Promise<{ data: T | null; error: any }>,
  maxRetries = 2,
  delayMs = 1000
): Promise<{ data: T | null; error: any }> {
  let lastError: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const result = await fetchFn();
      if (!result.error || !isPermissionError(result.error)) {
        return result;
      }
      lastError = result.error;
    } catch (err) {
      lastError = err;
    }
    if (i < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
    }
  }
  return { data: null, error: lastError };
}

function isPermissionError(error: any): boolean {
  return (
    error.code === "PGRST116" ||
    error.code === "42501" ||
    error.message?.includes("permission denied") ||
    error.message?.includes("RLS") ||
    error.message?.includes("row-level security")
  );
}

// Debug logging for environment variables (only in development)
if (import.meta.env.DEV) {
  console.log("Supabase Environment check:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    mode: import.meta.env.MODE,
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ Supabase credentials are not set. Please check your environment variables.",
  );
  console.error("Missing:", {
    VITE_SUPABASE_URL: !supabaseUrl ? "MISSING" : "OK",
    VITE_SUPABASE_ANON_KEY: !supabaseAnonKey ? "MISSING" : "OK",
  });
  console.error(
    "⚠️ Make sure you have a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
  );
  console.error("⚠️ After adding .env, restart your dev server");
  throw new Error("supabaseKey is required.");
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: "videoremix-auth",
      flowType: "pkce",
    },
  },
);

// Hero section types
export interface HeroContent {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  primary_button_text: string;
  primary_button_url: string;
  secondary_button_text: string;
  secondary_button_url: string;
  background_image_url: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Benefits/Features types
export interface BenefitFeature {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  stats: {
    label: string;
    value: string;
  }[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Testimonial types
export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  content: string;
  avatar_url?: string;
  rating: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// FAQ types
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  list_order: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Pricing plan types
export interface PricingPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  description: string;
  features: string[];
  is_popular: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Video types
export interface Video {
  id: string;
  user_id: string;
  title?: string;
  description?: string;
  original_filename: string;
  file_path: string;
  thumbnail_path?: string;
  status: "uploaded" | "processing" | "completed" | "failed";
  duration?: number;
  file_size?: number;
  mime_type?: string;
  processing_started_at?: string;
  completed_at?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  display_on_homepage: boolean;
  is_featured: boolean;
  is_public: boolean;
  homepage_order?: number;
  created_at: string;
  updated_at: string;
}

export interface VideoUploadData {
  file: File;
  title?: string;
  description?: string;
}

export interface VideoUpdateData {
  title?: string;
  description?: string;
  display_on_homepage?: boolean;
  is_featured?: boolean;
  is_public?: boolean;
  homepage_order?: number;
}

// Data fetching functions - using service_role endpoint or anon with fallback
async function getHeroContent() {
  try {
    const { data, error } = await fetchWithRetry(async () => {
      return supabase
        .from("hero_content")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
    });

    if (error) {
      // Log specific error types
      if (isPermissionError(error)) {
        console.warn("[getHeroContent] Permission denied - RLS policy may be missing for public/anon access");
      } else if (error.message?.includes("timeout")) {
        console.warn("[getHeroContent] Request timed out - network connectivity issue");
      }
      console.error("Error fetching hero content:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching hero content:", error);
    return null;
  }
}

async function getBenefitsFeatures() {
  const { data, error } = await fetchWithRetry(async () => {
    return supabase
      .from("benefits_features")
      .select("*")
      .eq("is_active", true)
      .order("id", { ascending: true });
  });

  if (error) {
    if (isPermissionError(error)) {
      console.warn("[getBenefitsFeatures] Permission denied - RLS policy may be missing for public/anon access");
    }
    console.error("Error fetching benefits/features:", error);
    return [];
  }

  return data as BenefitFeature[];
}

async function getTestimonials(featured_only = false) {
  const { data, error } = await fetchWithRetry(async () => {
    return supabase.from("testimonials").select("*").eq("is_active", true).order("sort_order", { ascending: true });
  });

  if (error) {
    if (isPermissionError(error)) {
      console.warn("[getTestimonials] Permission denied - RLS policy may be missing for public/anon access");
    }
    console.error("Error fetching testimonials:", error);
    return [];
  }

  return data as Testimonial[];
}

async function getFAQs(category = "all") {
  let query = supabase.from("faqs").select("*").eq("is_active", true);

  if (category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await fetchWithRetry(async () => {
    return query.order("sort_order", { ascending: true });
  });

  if (error) {
    if (isPermissionError(error)) {
      console.warn("[getFAQs] Permission denied - RLS policy may be missing for public/anon access");
    }
    console.error("Error fetching FAQs:", error);
    return [];
  }

  return data as FAQ[];
}

async function getPricingPlans() {
  const { data, error } = await fetchWithRetry(async () => {
    return supabase
      .from("pricing_plans")
      .select("*")
      .eq("is_active", true)
      .order("price_monthly", { ascending: true });
  });

  if (error) {
    if (isPermissionError(error)) {
      console.warn("[getPricingPlans] Permission denied - RLS policy may be missing for public/anon access");
    }
    console.error("Error fetching pricing plans:", error);
    return [];
  }

  return data as PricingPlan[];
}

export async function getAllLandingPageContent() {
  try {
    const [hero, benefits, testimonials, faqs, pricing] = await Promise.all([
      getHeroContent(),
      getBenefitsFeatures(),
      getTestimonials(true),
      getFAQs(),
      getPricingPlans(),
    ]);

    return {
      hero,
      benefits,
      testimonials,
      faqs,
      pricing,
    };
  } catch (error) {
    console.error("Error fetching all landing page content:", error);
    return {
      hero: null,
      benefits: [],
      testimonials: [],
      faqs: [],
      pricing: [],
    };
  }
}

// Video-related utility functions
async function getUserVideos(): Promise<Video[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching videos:", error);
    return [];
  }

  return data as Video[];
}

async function getVideoById(id: string): Promise<Video | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching video:", error);
    return null;
  }

  return data as Video;
}

async function getPublicVideos(): Promise<Video[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("is_public", true)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching public videos:", error);
    return [];
  }

  return data as Video[];
}

async function getHomepageVideos(): Promise<Video[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("is_public", true)
    .eq("display_on_homepage", true)
    .eq("status", "completed")
    .order("homepage_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching homepage videos:", error);
    return [];
  }

  return data as Video[];
}

async function getFeaturedVideos(): Promise<Video[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("is_public", true)
    .eq("is_featured", true)
    .eq("status", "completed")
    .order("homepage_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching featured videos:", error);
    return [];
  }

  return data as Video[];
}

export {
  getUserVideos,
  getVideoById,
  getPublicVideos,
  getHomepageVideos,
  getFeaturedVideos,
};
