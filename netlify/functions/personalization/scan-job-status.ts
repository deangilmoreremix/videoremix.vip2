import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event) => {
  const jobId = event.path.split('/').pop();

  if (!jobId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'jobId is required' }) };
  }

  try {
    // Get job status
    const { data: job, error: jobError } = await supabase
      .from('scan_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) throw jobError;

    // Get events for progress tracking
    const { data: events, error: eventsError } = await supabase
      .from('scan_events')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    if (eventsError) throw eventsError;

    return {
      statusCode: 200,
      body: JSON.stringify({ job, events }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch job status', details: error.message }),
    };
  }
};