import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { PersonalizationProfile } from '../../src/types/personalization';

interface ScanJobCreateRequest {
  targetName: string;
  company?: string;
  website?: string;
  userId?: string;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const body: ScanJobCreateRequest = JSON.parse(event.body || '{}');
  if (!body.targetName) {
    return { statusCode: 400, body: JSON.stringify({ error: 'targetName is required' }) };
  }

  try {
    // Create scan job
    const { data: job, error: jobError } = await supabase
      .from('scan_jobs')
      .insert({
        user_id: body.userId || null,
        target_name: body.targetName,
        status: 'processing',
        progress: 0,
        current_step: 'github'
      })
      .select()
      .single();

    if (jobError) {
      console.error('Scan job creation error:', jobError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create scan job', details: jobError.message }) };
    }

    // Trigger async processing (in production, use background queue)
    // For now, we'll trigger the immediate scan via another endpoint
    
    // Insert initial scan event
    await supabase.from('scan_events').insert({
      job_id: job.id,
      step: 'github',
      status: 'started',
      message: `Starting scan for ${body.targetName}`
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        jobId: job.id,
        status: 'processing',
        targetName: body.targetName
      })
    };
  } catch (error: any) {
    console.error('Scan job error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create scan job', details: error.message }) };
  }
};