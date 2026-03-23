import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

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
  content: string;
  name: string;
  role: string;
  company?: string;
  image_url: string;
  rating: number;
  category?: string;
  featured: boolean;
  enabled: boolean;
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

// Data fetching functions
async function getHeroContent() {
  try {
    const { data, error } = await supabase
      .from("hero_content")
      .select("*")
      .eq("enabled", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
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
  const { data, error } = await supabase
    .from("benefits_features")
    .select("*")
    .eq("enabled", true)
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching benefits/features:", error);
    return [];
  }

  return data as BenefitFeature[];
}

async function getTestimonials(featured_only = false) {
  let query = supabase.from("testimonials").select("*").eq("enabled", true);

  if (featured_only) {
    query = query.eq("featured", true);
  }

  const { data, error } = await query.order("id", { ascending: true });

  if (error) {
    console.error("Error fetching testimonials:", error);
    return [];
  }

  return data as Testimonial[];
}

async function getFAQs(category = "all") {
  let query = supabase.from("faqs").select("*").eq("enabled", true);

  if (category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await query.order("list_order", { ascending: true });

  if (error) {
    console.error("Error fetching FAQs:", error);
    return [];
  }

  return data as FAQ[];
}

async function getPricingPlans() {
  const { data, error } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("enabled", true)
    .order("price_monthly", { ascending: true });

  if (error) {
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
