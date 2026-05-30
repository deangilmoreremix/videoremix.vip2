import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export const handler: Handler = async (event, context) => {
  const jobId = event.path?.split('/').pop() || event.queryStringParameters?.jobId;
  
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!jobId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'jobId is required' }) };
  }

  try {
    const { data: job, error: jobError } = await supabase
      .from('scan_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Job not found' }) };
    }

    const { data: events } = await supabase
      .from('scan_events')
      .select('*')
      .eq('job_id', jobId)
      .order('timestamp', { ascending: true });

    return {
      statusCode: 200,
      body: JSON.stringify({
        job: {
          id: job.id,
          status: job.status,
          progress: job.progress,
          currentStep: job.current_step,
          resultProfileId: job.result_profile_id,
          errorMessage: job.error_message
        },
        events: events || []
      })
    };
  } catch (error: any) {
    console.error('Scan job status error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch job status', details: error.message }) };
  }
};