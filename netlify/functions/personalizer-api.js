import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Rate limiting store (in-memory for demo)
const rateLimit = new Map();
const RATE_LIMIT = 10; // requests per minute
const WINDOW = 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = rateLimit.get(ip) || [];
  const recent = userRequests.filter(t => now - t < WINDOW);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  rateLimit.set(ip, recent);
  return true;
}

// GitHub API profile check (fallback)
async function checkGitHub(username) {
  try {
    const res = await fetch(`https://api.github.com/users/${username}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      platform: 'github',
      exists: true,
      public_repos: data.public_repos,
      followers: data.followers,
      bio: data.bio,
      company: data.company
    };
  } catch {
    return null;
  }
}

// Maigret worker integration
async function runMaigretScan(targetName) {
  const workerUrl = process.env.MAIGRET_WORKER_URL;
  const workerSecret = process.env.MAIGRET_WORKER_SECRET;
  
  // Try Maigret worker if configured
  if (workerUrl && workerSecret) {
    try {
      const res = await fetch(`${workerUrl}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': workerSecret
        },
        body: JSON.stringify({ username: targetName })
      });
      if (!res.ok) throw new Error(`Worker returned ${res.status}`);
      const data = await res.json();
      return {
        summary: data.summary || `Public presence suggests activity on ${data.platforms?.length || 0} platforms`,
        platforms: data.platforms || [],
        confidence: data.confidence || 0.0
      };
    } catch (err) {
      console.error('Maigret worker failed, falling back to GitHub:', err.message);
    }
  }
  
  // Fallback to simple GitHub check
  const github = await checkGitHub(targetName);
  return {
    summary: github ? `Public presence suggests professional activity on GitHub (${github.public_repos} repos)` : 'Public presence suggests professional activity in relevant industry',
    platforms: github ? [github] : [],
    confidence: github ? 0.8 : 0.0
  };
}

export async function handler(event, context) {
  const ip = event.headers['x-forwarded-for'] || 'unknown';
  if (!checkRateLimit(ip)) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Rate limit exceeded' }) };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path.replace('/api/personalizer', '');
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    // /api/personalizer/scan
    if (path === '/scan' && event.httpMethod === 'POST') {
      const { targetName } = body;
      if (!targetName) throw new Error('targetName required');

      const scanData = await runMaigretScan(targetName);

      const { data: scan } = await supabase
        .from('profile_scan_results')
        .insert({
          user_id: body.userId,
          target_name: targetName,
          scan_data: scanData
        })
        .select()
        .single();

      return { statusCode: 200, headers, body: JSON.stringify({ scanId: scan.id, scanData }) };
    }

    // /api/personalizer/generate
    if (path === '/generate' && event.httpMethod === 'POST') {
      const { appId, mode, targetName, targetCompany, manualNotes, offer, goal, tone, cta } = body;
      if (!targetName || !mode) throw new Error('targetName and mode required');

      // TODO: Call OpenAI/Gemini API here with prompts
      const output = {
        type: mode,
        content: `Generated ${mode} for ${targetName} at ${targetCompany || 'N/A'}. ${manualNotes || ''}`,
        metadata: { tone, offer, goal, cta }
      };

      // Save project
      const { data: project } = await supabase
        .from('personalization_projects')
        .insert({
          user_id: body.userId,
          app_id: appId,
          mode,
          target_name: targetName,
          target_company: targetCompany,
          manual_notes: manualNotes,
          status: 'complete'
        })
        .select()
        .single();

      // Save output
      await supabase
        .from('personalization_outputs')
        .insert({
          project_id: project.id,
          output_type: mode,
          content: output
        });

      return { statusCode: 200, headers, body: JSON.stringify({ output, project }) };
    }

    return { statusCode: 404, body: JSON.stringify({ error: 'Endpoint not found' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
}
