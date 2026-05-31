/** Enhanced Personalization Types */

export interface PersonalizationProfile {
  id: string;
  targetName: string;
  company?: string;
  website?: string;
  industry?: string;
  interests: string[];
  communicationStyle?: string;
  personalityTraits: string[];
  buyingSignals: string[];
  platforms: PlatformProfile[];
  confidenceScore: number;
  aiSummary: string;
  recommendedHooks: string[];
  recommendedOffers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlatformProfile {
  id: string;
  profileId: string;
  platform: string;
  profileUrl: string;
  username?: string;
  confidence: number;
  extractedBio?: string;
  extractedInterests: string[];
  activityIndicators?: {
    followers?: number;
    repos?: number;
    posts?: number;
    lastActive?: string;
  };
  rawData?: Record<string, any>;
}

export interface IdentityGraphNode {
  id: string;
  profileId?: string;
  nodeType: 'username' | 'website' | 'company' | 'domain' | 'social';
  nodeValue: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface IdentityGraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: 'same_as' | 'owned_by' | 'works_at' | 'related_to';
  confidence: number;
}

export interface GeneratedAsset {
  id: string;
  profileId: string;
  assetType: 'cold_email' | 'video_script' | 'linkedin_opener' | 'proposal_intro' | 'meeting_opener' | 'thumbnail_copy';
  title: string;
  content: Record<string, any>;
  promptUsed?: string;
  modelUsed?: string;
  createdAt: string;
}

export interface ScanJob {
  id: string;
  userId?: string;
  targetName: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  progress: number;
  currentStep?: string;
  resultProfileId?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ScanEvent {
  id: string;
  jobId: string;
  step: 'github' | 'websites' | 'profiles' | 'graph' | 'analysis' | 'assets';
  status: 'started' | 'progress' | 'complete' | 'failed';
  message?: string;
  timestamp: string;
}

export interface ConfidenceScore {
  total: number;
  breakdown: {
    usernameMatch: number;
    websiteMatch: number;
    companyMatch: number;
    bioMatch: number;
    crossPlatformConsistency: number;
  };
}

export interface IntelligencePipelineInput {
  targetName: string;
  company?: string;
  website?: string;
}

export interface IntelligencePipelineResult {
  profile: PersonalizationProfile;
  confidenceScore: ConfidenceScore;
  assets: GeneratedAsset[];
}