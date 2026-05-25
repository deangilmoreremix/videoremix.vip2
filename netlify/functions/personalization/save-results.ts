import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

interface SaveResultsRequest {
  scanId: string;
  appId: string;
  username: string;
  mode: string;
  profiles: Array<Record<string, any>>;
  outputs: Array<Record<string, any>>;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const body: SaveResultsRequest = JSON.parse(event.body || '{}');
  if (!body.scanId || !body.appId || !body.username || !Array.isArray(body.profiles) || !Array.isArray(body.outputs)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'scanId, appId, username, profiles, and outputs are required' }) };
  }

  try {
    const scanPayload = {
      id: body.scanId,
      app_id: body.appId,
      prospect_name: body.username,
      username: body.username,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    const { error: scanError } = await supabase.from('prospect_scans').upsert(scanPayload, { onConflict: 'id' });
    if (scanError) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save scan', details: scanError.message }) };
    }

    const outputs = body.outputs.map((output) => ({
      scan_id: body.scanId,
      output_type: output.outputType || 'generated_text',
      title: output.title || 'Generated personalization',
      content: output.content || '',
      model_used: output.modelUsed || 'openai',
      created_at: new Date().toISOString(),
    }));

    const { error: outputError } = await supabase.from('personalization_outputs').insert(outputs);
    if (outputError) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save outputs', details: outputError.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, scanId: body.scanId }) };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save personalization results', details: error.message }) };
  }
};
