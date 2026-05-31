/**
 * Analysis Engine for Personalization Intelligence
 * Provides confidence scoring and personality analysis utilities
 */

export interface ConfidenceFactors {
  platformCount: number;
  averageScore: number;
  completeness: number;
  recency: number;
}

export interface PersonalityTraits {
  traits: Record<string, number>;
  communicationStyle: {
    formality: number;
    directness: number;
    technicality: number;
  };
  interests: string[];
}

/**
 * Calculate a weighted confidence score based on multiple factors
 */
export function calculateConfidence(factors: ConfidenceFactors): number {
  const weights = {
    platformCount: 0.25,
    averageScore: 0.35,
    completeness: 0.2,
    recency: 0.2,
  };

  return Math.min(1, Math.round(
    (factors.platformCount * weights.platformCount +
     factors.averageScore * weights.averageScore +
     factors.completeness * weights.completeness +
     factors.recency * weights.recency) * 1000
  ) / 1000);
}

/**
 * Analyze personality traits from profile data
 */
export function analyzePersonality(profileData: Record<string, any>): PersonalityTraits {
  // Default traits
  const traits: Record<string, number> = {
    analytical: 0.5,
    creative: 0.5,
    professional: 0.5,
    casual: 0.5,
  };

  // Analyze description/bio for communication style
  const description = (profileData.description || profileData.bio || '').toLowerCase();
  const title = (profileData.title || profileData.role || '').toLowerCase();

  // Adjust traits based on content
  if (description.includes('engineer') || description.includes('developer') || title.includes('tech')) {
    traits.analytical = 0.8;
    traits.technical = 0.9;
  }

  if (description.includes('design') || description.includes('creative') || title.includes('designer')) {
    traits.creative = 0.85;
    traits.casual = 0.7;
  }

  // Extract interests from keywords
  const interests: string[] = [];
  const interestKeywords = [
    'ai', 'machine learning', 'startup', 'saas', 'product',
    'growth', 'marketing', 'sales', 'research', 'open source',
  ];

  interestKeywords.forEach(keyword => {
    if (description.includes(keyword)) {
      interests.push(keyword);
    }
  });

  return {
    traits,
    communicationStyle: {
      formality: traits.professional,
      directness: 0.7,
      technicality: traits.analytical,
    },
    interests,
  };
}

/**
 * Determine the dominant platform from scan results
 */
export function getDominantPlatform(profiles: Array<{ platform: string; confidence_score?: number }>): string | null {
  if (!profiles.length) return null;

  const platformScores = profiles.reduce((acc, profile) => {
    const platform = profile.platform.toLowerCase();
    const score = profile.confidence_score || 0.5;
    acc[platform] = (acc[platform] || 0) + score;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(platformScores)
    .sort(([, a], [, b]) => b - a)
    .map(([platform]) => platform)[0];
}

/**
 * Generate a summary string from profile data
 */
export function generateProfileSummary(
  profiles: Array<{ platform: string; title?: string; description?: string; status: string }>
): string {
  const foundProfiles = profiles.filter(p => p.status === 'found');
  if (!foundProfiles.length) return 'No public profiles found.';

  const summaries = foundProfiles.map(p => {
    const parts = [];
    if (p.platform) parts.push(`${p.platform}: ${p.title || 'User found'}`);
    if (p.description) parts.push(p.description);
    return parts.join(' - ');
  });

  return summaries.join(' | ');
}