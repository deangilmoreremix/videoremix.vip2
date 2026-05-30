/**
 * Confidence Scoring Engine
 * Calculates confidence score from 0-100 based on profile data quality
 */

interface ConfidenceInput {
  username?: string;
  website?: string;
  company?: string;
  bio?: string;
  platforms: Array<{
    platform: string;
    profileUrl?: string;
    bio?: string;
    confidence?: number;
  }>;
}

interface ConfidenceScore {
  total: number;
  breakdown: {
    usernameMatch: number;
    websiteMatch: number;
    companyMatch: number;
    bioMatch: number;
    crossPlatformConsistency: number;
  };
}

export function calculateConfidence(input: ConfidenceInput): ConfidenceScore {
  const scores = {
    usernameMatch: 0,
    websiteMatch: 0,
    companyMatch: 0,
    bioMatch: 0,
    crossPlatformConsistency: 0,
  };

  // Username match - check if we found valid profiles
  if (input.username) {
    const foundPlatforms = input.platforms.filter(p => p.confidence && p.confidence > 50);
    scores.usernameMatch = Math.min(100, foundPlatforms.length * 20);
  }

  // Website match - check if website was found/analyzed
  if (input.website) {
    scores.websiteMatch = input.platforms.some(p => 
      p.platform === 'website' || p.platform === 'domain'
    ) ? 50 : 25;
  }

  // Company match - check if company info was found
  if (input.company) {
    scores.companyMatch = input.platforms.some(p =>
      p.bio?.toLowerCase().includes(input.company?.toLowerCase() || '') ||
      p.profileUrl?.toLowerCase().includes(input.company?.toLowerCase() || '')
    ) ? 60 : 30;
  }

  // Bio match - check if we extracted meaningful bio
  const biosWithContent = input.platforms.filter(p => p.bio && p.bio.length > 20);
  scores.bioMatch = Math.min(100, biosWithContent.length * 30);

  // Cross-platform consistency - platforms that reference same info
  if (input.platforms.length >= 2) {
    const companiesFound: string[] = [];
    input.platforms.forEach(p => {
      if (p.bio) {
        // Extract company references from bios
        const companyMatch = p.bio.match(/(?:at|@)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g);
        if (companyMatch) {
          companiesFound.push(...companyMatch.map(m => m.replace(/(?:at|@)\s+/i, '')));
        }
      }
    });
    
    // If multiple platforms mention same company, boost consistency
    const uniqueCompanies = new Set(companiesFound).size;
    scores.crossPlatformConsistency = uniqueCompanies > 0 ? Math.min(60, uniqueCompanies * 20) : 10;
  }

  const total = Math.round(
    (scores.usernameMatch * 0.25) +
    (scores.websiteMatch * 0.20) +
    (scores.companyMatch * 0.20) +
    (scores.bioMatch * 0.20) +
    (scores.crossPlatformConsistency * 0.15)
  );

  return { total, breakdown: scores };
}

/**
 * Personality Analysis Engine
 * Analyzes profile data to generate personality traits, communication style, and interests
 */

interface PersonalityAnalysis {
  traits: string[];
  communicationStyle: string;
  likelyProfession: string;
  industry: string;
  interests: string[];
  hooks: string[];
  suggestedCTA: string;
}

export function analyzePersonality(profiles: Array<{ bio?: string; platform: string; activityIndicators?: any }>): PersonalityAnalysis {
  const allBios = profiles.map(p => p.bio || '').join(' ');
  const combinedText = allBios.toLowerCase();

  // Extract interests from bio keywords
  const interestKeywords: Record<string, string[]> = {
    technology: ['react', 'python', 'javascript', 'typescript', 'nodejs', 'ai', 'ml', 'api', 'cloud', 'docker', 'kubernetes'],
    marketing: ['seo', 'content', 'growth', 'campaign', 'brand', 'audience', 'conversion', 'roi'],
    design: ['ui', 'ux', 'figma', 'design', 'creative', 'brand', 'visual', 'prototype'],
    business: ['strategy', 'revenue', 'sales', 'client', 'partnership', 'stakeholder', 'kpi'],
  };

  const interests: string[] = [];
  Object.entries(interestKeywords).forEach(([category, keywords]) => {
    if (keywords.some(k => combinedText.includes(k))) {
      interests.push(category.charAt(0).toUpperCase() + category.slice(1));
    }
  });

  // Determine communication style
  let communicationStyle = 'professional';
  if (combinedText.includes('creative') || combinedText.includes('design')) {
    communicationStyle = 'creative';
  } else if (combinedText.includes('growth') || combinedText.includes('data')) {
    communicationStyle = 'analytical';
  } else if (combinedText.includes('team') || combinedText.includes('collaborate')) {
    communicationStyle = 'collaborative';
  }

  // Personality traits
  const traits: string[] = [];
  if (combinedText.includes('innovative') || combinedText.includes('passionate')) {
    traits.push('Innovative');
  }
  if (combinedText.includes('thought') || combinedText.includes('write')) {
    traits.push('Thoughtful');
  }
  if (profiles.length > 1) {
    traits.push('Multi-faceted');
  }
  traits.push('Professional');

  // Likely profession
  const professionMap: [string, string[]][] = [
    ['Developer', ['code', 'react', 'python', 'javascript', 'api', 'fullstack']],
    ['Designer', ['design', 'ui', 'ux', 'figma', 'creative', 'visual']],
    ['Marketer', ['seo', 'content', 'growth', 'campaign', 'audience']],
    ['Product Manager', ['product', 'strategy', 'roadmap', 'stakeholder']],
    ['Founder', ['founder', 'ceo', 'entrepreneur', 'startup', 'company']],
  ];

  let likelyProfession = 'Professional';
  for (const [profession, keywords] of professionMap) {
    if (keywords.some(k => combinedText.includes(k))) {
      likelyProfession = profession;
      break;
    }
  }

  // Industry
  const industryMap: [string, string[]][] = [
    ['Technology', ['tech', 'software', 'saas', 'ai', 'platform']],
    ['E-commerce', ['ecommerce', 'shopify', 'store', 'retail', 'commerce']],
    ['Healthcare', ['healthcare', 'medical', 'health', 'patient']],
    ['Finance', ['finance', 'fintech', 'banking', 'payment', 'investment']],
  ];

  let industry = 'Technology';
  for (const [ind, keywords] of industryMap) {
    if (keywords.some(k => combinedText.includes(k))) {
      industry = ind;
      break;
    }
  }

  // Generate hooks based on analysis
  const hooks: string[] = [
    `Noticed your work at ${profiles.find(p => p.bio?.includes('at'))?.bio?.match(/at\s+([A-Z][a-z]+)/i)?.[1] || 'a leading company'}`,
    `Your ${interests[0] || 'technical'} background caught my attention`,
    `Saw your recent activity on ${profiles.map(p => p.platform).join(', ')}`,
  ];

  // Suggested CTA based on profession
  const suggestedCTA = likelyProfession === 'Founder' || likelyProfession === 'Product Manager'
    ? 'Would you be open to a 15-minute call to explore synergies?'
    : 'Would you be interested in seeing how this could work for your team?';

  return {
    traits,
    communicationStyle,
    likelyProfession,
    industry,
    interests,
    hooks,
    suggestedCTA,
  };
}