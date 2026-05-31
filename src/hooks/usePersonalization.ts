import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import type {
  PersonalizationProfile,
  PlatformProfile,
  IdentityGraphNode,
  IdentityGraphEdge,
  GeneratedAsset,
  ScanJob,
  ScanEvent,
  IntelligenceProfile,
} from '../types/personalization';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Hook to fetch a user's personalization profiles
export function usePersonalizationProfile(userId: string | undefined) {
  const [profiles, setProfiles] = useState<PersonalizationProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchProfiles = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('personalization_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setProfiles(data || []);
      }
      setLoading(false);
    };

    fetchProfiles();
  }, [userId]);

  return { profiles, loading, error };
}

// Hook to manage scan jobs
export function useScanJob(jobId: string | null) {
  const [job, setJob] = useState<ScanJob | null>(null);
  const [events, setEvents] = useState<ScanEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const fetchJob = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('scan_jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      setJob(data);
      setLoading(false);
    };

    fetchJob();

    // Subscribe to realtime events
    const channel = supabase
      .channel(`scan-events-${jobId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scan_events', filter: `job_id=eq.${jobId}` },
        (payload) => {
          setEvents((prev) => [...prev, payload.new as ScanEvent]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  return { job, events, loading };
}

// Hook to generate assets
export function useGenerateAssets(profileId: string | null) {
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profileId) return;

    const fetchAssets = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('generated_assets')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      setAssets(data || []);
      setLoading(false);
    };

    fetchAssets();
  }, [profileId]);

  return { assets, loading };
}

// Hook to calculate confidence score
export function useConfidenceScore(profiles: PlatformProfile[]) {
  const [score, setScore] = useState<number>(0);

  useEffect(() => {
    if (!profiles.length) {
      setScore(0);
      return;
    }

    // Calculate weighted confidence score
    const totalScore = profiles.reduce((sum, profile) => {
      const weight = profile.confidence_score || 0.5;
      const platformMultiplier = {
        github: 1.0,
        twitter: 0.9,
        linkedin: 0.95,
        medium: 0.7,
        devto: 0.75,
      }[profile.platform.toLowerCase()] || 0.5;

      return sum + (weight * platformMultiplier);
    }, 0);

    const avgScore = Math.min(100, Math.round((totalScore / profiles.length) * 100));
    setScore(avgScore);
  }, [profiles]);

  return score;
}

// Hook to build identity graph
export function useIdentityGraph(profileId: string | null) {
  const [nodes, setNodes] = useState<IdentityGraphNode[]>([]);
  const [edges, setEdges] = useState<IdentityGraphEdge[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profileId) return;

    const fetchData = async () => {
      setLoading(true);
      const [nodesRes, edgesRes] = await Promise.all([
        supabase.from('identity_graph_nodes').select('*').eq('profile_id', profileId),
        supabase.from('identity_graph_edges').select('*').eq('source_node_id', profileId),
      ]);

      setNodes(nodesRes.data || []);
      setEdges(edgesRes.data || []);
      setLoading(false);
    };

    fetchData();
  }, [profileId]);

  return { nodes, edges, loading };
}

// Hook to run a full scan job
export function useRunScanJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runScan = useCallback(async (username: string, userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/personalizer/job/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ username, userId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create scan job');

      setLoading(false);
      return data.jobId;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, []);

  return { runScan, loading, error };
}