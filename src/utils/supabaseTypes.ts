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