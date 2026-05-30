import { useState, useEffect, useCallback } from 'react';
import { PersonalizationProfile, ScanJob, ScanEvent, GeneratedAsset, ConfidenceScore } from '../types/personalization';
import { supabase } from '../utils/supabaseClient';

interface UsePersonalizationResult {
  profile: PersonalizationProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseScanJobResult {
  job: ScanJob | null;
  events: ScanEvent[];
  loading: boolean;
  error: string | null;
}

interface UseAssetsResult {
  assets: GeneratedAsset[];
  loading: boolean;
  error: string | null;
  generateAsset: (type: 'cold_email' | 'video_script' | 'linkedin_opener' | 'proposal_intro' | 'meeting_opener' | 'thumbnail_copy') => Promise<GeneratedAsset | null>;
}

export function usePersonalizationProfile(targetName: string): UsePersonalizationResult {
  const [profile, setProfile] = useState<PersonalizationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!targetName) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('personalization_profiles')
        .select(`
          *,
          platform_profiles (*)
        `)
        .eq('target_name', targetName)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setProfile(null);
        } else {
          throw error;
        }
      } else {
        const transformed: PersonalizationProfile = {
          id: data.id,
          targetName: data.target_name,
          company: data.company,
          website: data.website,
          industry: data.industry,
          interests: data.interests || [],
          communicationStyle: data.communication_style,
          personalityTraits: data.personality_traits || [],
          buyingSignals: data.buying_signals || [],
          platforms: data.platform_profiles?.map((p: any) => ({
            id: p.id,
            profileId: p.profile_id,
            platform: p.platform,
            profileUrl: p.profile_url,
            username: p.username,
            confidence: p.confidence,
            extractedBio: p.extracted_bio,
            extractedInterests: p.extracted_interests || [],
            activityIndicators: p.activity_indicators,
            rawData: p.raw_data,
          })) || [],
          confidenceScore: data.confidence_score,
          aiSummary: data.ai_summary,
          recommendedHooks: data.recommended_hooks || [],
          recommendedOffers: data.recommended_offers || [],
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        setProfile(transformed);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [targetName]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}

export function useScanJob(jobId: string | null): UseScanJobResult {
  const [job, setJob] = useState<ScanJob | null>(null);
  const [events, setEvents] = useState<ScanEvent[]>([]);
  const [loading, setLoading] = useState(!!jobId);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('scan_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;

      const jobData: ScanJob = {
        id: data.id,
        userId: data.user_id,
        targetName: data.target_name,
        status: data.status,
        progress: data.progress,
        currentStep: data.current_step,
        resultProfileId: data.result_profile_id,
        errorMessage: data.error_message,
        createdAt: data.created_at,
        completedAt: data.completed_at,
      };
      setJob(jobData);

      // Fetch events
      const { data: eventsData } = await supabase
        .from('scan_events')
        .select('*')
        .eq('job_id', jobId)
        .order('timestamp', { ascending: true });

      if (eventsData) {
        const transformed = eventsData.map((e: any) => ({
          id: e.id,
          jobId: e.job_id,
          step: e.step,
          status: e.status,
          message: e.message,
          timestamp: e.timestamp,
        }));
        setEvents(transformed);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch scan job');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
    const interval = jobId && job?.status === 'processing' ? setInterval(fetchJob, 2000) : undefined;
    return () => interval && clearInterval(interval);
  }, [fetchJob, jobId, job?.status]);

  return { job, events, loading, error };
}

export function useGenerateAssets(profileId: string): UseAssetsResult {
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    if (!profileId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('generated_assets')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformed = data?.map((a: any) => ({
        id: a.id,
        profileId: a.profile_id,
        assetType: a.asset_type,
        title: a.title,
        content: a.content,
        promptUsed: a.prompt_used,
        modelUsed: a.model_used,
        createdAt: a.created_at,
      })) || [];
      setAssets(transformed);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const generateAsset = useCallback(async (
    type: 'cold_email' | 'video_script' | 'linkedin_opener' | 'proposal_intro' | 'meeting_opener' | 'thumbnail_copy'
  ): Promise<GeneratedAsset | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/personalizer/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          profileId,
          assetType: type,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Generation failed');
      }

      const result = await res.json();
      const newAsset: GeneratedAsset = {
        id: result.id,
        profileId: result.profile_id,
        assetType: result.asset_type,
        title: result.title,
        content: result.content,
        promptUsed: result.prompt_used,
        modelUsed: result.model_used,
        createdAt: result.created_at,
      };

      setAssets(prev => [newAsset, ...prev]);
      return newAsset;
    } catch (err: any) {
      setError(err.message || 'Failed to generate asset');
      return null;
    }
  }, [profileId]);

  return { assets, loading, error, generateAsset };
}

export function useConfidenceScore(profileId: string): { score: ConfidenceScore | null; loading: boolean } {
  const [score, setScore] = useState<ConfidenceScore | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profileId) return;

    setLoading(true);
    supabase
      .from('personalization_profiles')
      .select(`
        confidence_score,
        target_name,
        company,
        website
      `)
      .eq('id', profileId)
      .single()
      .then(({ data, error }) => {
        if (error) return;
        if (data) {
          // Simplified confidence breakdown
          setScore({
            total: data.confidence_score,
            breakdown: {
              usernameMatch: Math.min(100, data.confidence_score),
              websiteMatch: Math.min(80, data.confidence_score - 10),
              companyMatch: Math.min(60, data.confidence_score - 20),
              bioMatch: Math.min(40, data.confidence_score - 30),
              crossPlatformConsistency: Math.min(30, data.confidence_score - 40),
            },
          });
        }
      })
      .finally(() => setLoading(false));
  }, [profileId]);

  return { score, loading };
}