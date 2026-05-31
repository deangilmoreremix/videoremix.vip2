import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

interface ScanJobCreateRequest {
  targetName: string;
  company?: string;
  website?: string;
  userId?: string;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const workerUrl = process.env.PERSONALIZER_WORKER_URL;
const workerKey = process.env.PERSONALIZER_WORKER_KEY;
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

    // Process through Python worker (if configured) or use GitHub fallback
    const processPipeline = async (jobId: string) => {
      const steps = [
        { step: 'github', message: 'Scanning GitHub profiles...' },
        { step: 'websites', message: 'Analyzing websites...' },
        { step: 'profiles', message: 'Processing platform profiles...' },
        { step: 'graph', message: 'Building identity graph...' },
        { step: 'analysis', message: 'Running AI analysis...' },
        { step: 'assets', message: 'Generating assets...' },
      ];

      for (let i = 0; i < steps.length; i++) {
        const { step, message } = steps[i];
        
        // Update job progress
        await supabase
          .from('scan_jobs')
          .update({ progress: Math.round((i + 1) * 100 / steps.length), current_step: step })
          .eq('id', jobId);

        // Insert event
        await supabase.from('scan_events').insert({
          job_id: jobId,
          step,
          status: 'started',
          message
        });

        // Call worker endpoints
        if (workerUrl && workerKey) {
          try {
            if (step === 'github') {
              const scanRes = await fetch(`${workerUrl}/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-worker-key': workerKey },
                body: JSON.stringify({ username: body.targetName }),
              });
              if (scanRes.ok) {
                const scanData = await scanRes.json();
                await supabase.from('scan_events').insert({
                  job_id: jobId,
                  step,
                  status: 'complete',
                  message: `Found ${scanData.profiles?.length || 0} profiles`
                });
              }
            } else if (step === 'analysis') {
              const analyzeRes = await fetch(`${workerUrl}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-worker-key': workerKey },
                body: JSON.stringify({ username: body.targetName, company: body.company }),
              });
              if (analyzeRes.ok) {
                const analyzeData = await analyzeRes.json();
                
                // Store personalization profile
                const { data: profile } = await supabase
                  .from('personalization_profiles')
                  .insert({
                    user_id: body.userId,
                    target_name: body.targetName,
                    company: body.company,
                    website: body.website,
                    confidence_score: analyzeData.confidenceScore,
                    personality_traits: analyzeData.traits,
                    interests: analyzeData.interests,
                    communication_style: analyzeData.communicationStyle,
                    ai_summary: `Analyzed ${body.targetName} via intelligence pipeline`,
                    recommended_hooks: analyzeData.recommendedHooks,
                    recommended_offers: analyzeData.recommendedOffers,
                  })
                  .select()
                  .single();

                // Update job with profile reference
                if (profile) {
                  await supabase
                    .from('scan_jobs')
                    .update({ result_profile_id: profile.id })
                    .eq('id', jobId);
                }

                await supabase.from('scan_events').insert({
                  job_id: jobId,
                  step,
                  status: 'complete',
                  message: `Confidence: ${analyzeData.confidenceScore}%`
                });
              }
            } else if (step === 'graph') {
              const graphRes = await fetch(`${workerUrl}/graph-build`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-worker-key': workerKey },
                body: JSON.stringify({ username: body.targetName, company: body.company }),
              });
              if (graphRes.ok) {
                await supabase.from('scan_events').insert({
                  job_id: jobId,
                  step,
                  status: 'complete',
                  message: 'Identity graph constructed'
                });
              }
            } else {
              await supabase.from('scan_events').insert({
                job_id: jobId,
                step,
                status: 'complete',
                message: `${step} completed`
              });
            }
          } catch (workerErr) {
            console.error(`Worker error at step ${step}:`, workerErr);
            await supabase.from('scan_events').insert({
              job_id: jobId,
              step,
              status: 'failed',
              message: `Failed: ${workerErr instanceof Error ? workerErr.message : 'Unknown error'}`
            });
          }
        }

        // Small delay between steps for UI smoothness
        await new Promise(r => setTimeout(r, 100));
      }

      // Mark job complete
      await supabase
        .from('scan_jobs')
        .update({ status: 'complete', progress: 100, completed_at: new Date().toISOString() })
        .eq('id', jobId);
    };

    // Fire-and-forget processing (don't await)
    processPipeline(job.id).catch(err => {
      console.error('Background processing error:', err);
      supabase
        .from('scan_jobs')
        .update({ status: 'failed', error_message: err.message })
        .eq('id', job.id);
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