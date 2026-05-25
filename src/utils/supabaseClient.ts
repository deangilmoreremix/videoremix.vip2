import { supabase } from "./supabase";
import type {
  HeroContent,
  BenefitFeature,
  Testimonial,
  FAQ,
  PricingPlan,
  Video,
  VideoUploadData,
  VideoUpdateData,
} from "./supabaseTypes";

// Re-export types for backward compatibility
export type {
  HeroContent,
  BenefitFeature,
  Testimonial,
  FAQ,
  PricingPlan,
  Video,
  VideoUploadData,
  VideoUpdateData,
} from "./supabaseTypes";

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
