import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

interface ScanProspectRequest {
  username: string;
  appId: string;
  mode: string;
  userId?: string;
}

const workerUrl = process.env.PERSONALIZER_WORKER_URL;
const workerKey = process.env.PERSONALIZER_WORKER_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

// GitHub API profile check (built-in fallback)
async function checkGitHub(username: string): Promise<ProfileResult | null> {
  try {
    const res = await fetch(`https://api.github.com/users/${username}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      platform: 'github',
      profileUrl: `https://github.com/${username}`,
      status: 'found',
      bio: data.bio || undefined,
      followers: data.followers,
      public_repos: data.public_repos,
      company: data.company || undefined,
    };
  } catch {
    return null;
  }
}

// Maigret worker integration with fallback
async function runProfileScan(targetName: string): Promise<{ profiles: ProfileResult[]; summary: string; confidence: number } | null> {
  // Try Maigret worker if configured
  if (workerUrl && workerKey) {
    try {
      const res = await fetch(`${workerUrl}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-worker-key': workerKey,
        },
        body: JSON.stringify({ username: targetName }),
      });
      if (!res.ok) throw new Error(`Worker returned ${res.status}`);
      const data = await res.json();
      return {
        profiles: data.platforms || [],
        summary: data.summary || `Public presence suggests activity on ${data.platforms?.length || 0} platforms`,
        confidence: data.confidence || 0.0,
      };
    } catch (err) {
      console.error('Maigret worker failed, falling back to GitHub:', err);
    }
  }

  // Fallback to simple GitHub check
  const github = await checkGitHub(targetName);
  return {
    profiles: github ? [github] : [],
    summary: github 
      ? `Public presence suggests professional activity on GitHub (${github.public_repos} repos, ${github.followers} followers)` 
      : 'No public profiles found for this target',
    confidence: github ? 0.8 : 0.0,
  };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const body: ScanProspectRequest = JSON.parse(event.body || '{}');
  if (!body.username || !body.appId || !body.mode) {
    return { statusCode: 400, body: JSON.stringify({ error: 'username, appId, and mode are required' }) };
  }

  try {
    // Run profile scan with fallback
    const scanData = await runProfileScan(body.username);

// Store scan results in Supabase
     const { data: scan, error: scanError } = await supabase
       .from('profile_scan_results')
       .insert({
         user_id: body.userId || null,
         target_name: body.username,
         scan_data: scanData
       })
       .select()
       .single();

    if (scanError) {
      console.error('Supabase scan insert error:', scanError);
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        scanId: scan?.id || `direct-${Date.now()}`,
        profiles: scanData?.profiles || [],
        summary: scanData?.summary || '',
        confidence: scanData?.confidence || 0,
        scanData: scanData
      }) 
    };
  } catch (error: any) {
    console.error('Scan error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to scan prospect', details: error.message }) };
  }
};