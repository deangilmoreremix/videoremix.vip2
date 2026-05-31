/**
 * Personalization Intelligence Platform Types
 * TypeScript interfaces for the Universal Personalization Intelligence Platform
 */

// Personalization Profile
export interface PersonalizationProfile {
  id: string;
  user_id: string;
  target_name: string;
  target_company?: string;
  target_username?: string;
  content: Record<string, any>;
  confidence_score?: number;
  profile_data?: {
    name?: string;
    company?: string;
    role?: string;
    bio?: string;
    location?: string;
    avatar?: string;
  };
  created_at: string;
  updated_at: string;
}

// Platform Profile (from Maigret scan)
export interface PlatformProfile {
  id: string;
  profile_id: string;
  platform: string;
  platform_username?: string;
  profile_url?: string;
  status: 'found' | 'not_found' | 'error' | 'pending';
  confidence_score?: number;
  title?: string;
  description?: string;
  raw_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Identity Graph Node
export interface IdentityGraphNode {
  id: string;
  profile_id: string;
  platform: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  confidence: number;
  evidence?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Identity Graph Edge
export interface IdentityGraphEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
  confidence: number;
  evidence?: Record<string, any>;
  created_at: string;
}

// Generated Asset
export interface GeneratedAsset {
  id: string;
  profile_id: string;
  asset_type: 'email' | 'video_script' | 'proposal' | 'thumbnail' | 'social_post' | 'blog_outline';
  content: string;
  title?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// Scan Job for async processing
export interface ScanJob {
  id: string;
  user_id: string;
  target_username: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  current_step?: string;
  total_steps: number;
  error_message?: string;
  result_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Scan Event for realtime progress
export interface ScanEvent {
  id: string;
  job_id: string;
  step_name: string;
  step_number: number;
  total_steps: number;
  status: 'started' | 'progress' | 'completed' | 'error';
  message?: string;
  data?: Record<string, any>;
  created_at: string;
}

// Intelligence Profile - aggregated insights
export interface IntelligenceProfile {
  id: string;
  profile_id: string;
  personality_traits?: Record<string, any>;
  communication_style?: Record<string, any>;
  interests?: string[];
  platforms_active?: string[];
  influence_score?: number;
  demographics?: Record<string, any>;
  content_preferences?: Record<string, any>;
  confidence_score?: number;
  created_at: string;
  updated_at: string;
}