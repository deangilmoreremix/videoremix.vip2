import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateScanJobRequest {
  username: string;
  userId: string;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const body: CreateScanJobRequest = JSON.parse(event.body || '{}');
  if (!body.username || !body.userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'username and userId are required' }) };
  }

  try {
    // Create scan job
    const { data: job, error: jobError } = await supabase
      .from('scan_jobs')
      .insert({
        user_id: body.userId,
        target_username: body.username,
        status: 'running',
        progress: 0,
        current_step: 'initiate',
        total_steps: 5,
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Trigger background processing
    const workerUrl = process.env.PERSONALIZER_WORKER_URL;
    const workerKey = process.env.PERSONALIZER_WORKER_KEY;

    if (workerUrl && workerKey) {
      // Fire off async processing (don't wait for response)
      fetch(`${workerUrl}/scan-full`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-worker-key': workerKey,
        },
        body: JSON.stringify({
          jobId: job.id,
          username: body.username,
        }),
      }).catch(console.error);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ jobId: job.id }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create scan job', details: error.message }),
    };
  }
};