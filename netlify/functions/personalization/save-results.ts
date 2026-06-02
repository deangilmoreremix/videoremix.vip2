import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

interface SaveResultsRequest {
  projectId?: string;
  outputs: Array<Record<string, any>>;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const body: SaveResultsRequest = JSON.parse(event.body || '{}');
  if (!Array.isArray(body.outputs)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'outputs array is required' }) };
  }

  try {
    // Save outputs to Supabase
    const outputRecords = body.outputs.map((output) => ({
      project_id: body.projectId || null,
      output_type: output.type || output.outputType || 'generated_text',
      title: output.title || 'Generated personalization',
      content: output.content || '',
      model_used: output.modelUsed || 'gpt-5.5',
      created_at: new Date().toISOString(),
    }));

    const { error: outputError } = await supabase.from('personalization_outputs').insert(outputRecords);
    if (outputError) {
      console.error('Output save error:', outputError);
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, count: outputRecords.length }) };
  } catch (error: any) {
    console.error('Save error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save results', details: error.message }) };
  }
};