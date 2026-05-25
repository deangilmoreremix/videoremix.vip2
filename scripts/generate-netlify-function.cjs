#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Generate Netlify Edge Function from Streamlit metadata
 * Usage: node scripts/generate-netlify-function.ts <metadata-json>
 */

function generateNetlifyFunction(metadata) {
  const { appName, uiType, inputFields, outputFormat, aiProvider, model, complexity } = metadata;

  const functionName = appName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const functionDir = path.join('netlify', 'functions', functionName);

  // Ensure directory exists
  if (!fs.existsSync(functionDir)) {
    fs.mkdirSync(functionDir, { recursive: true });
  }

  // Generate TypeScript types
  const types = `interface InputData {
  ${inputFields.map(field => `${field.name}: ${field.type === 'number_input' ? 'number' : 'string'};`).join('\n  ')}
}

interface OutputData {
  result: string;
  timestamp: string;
}`;

  // Generate function logic based on provider
  let aiLogic = '';
  if (aiProvider === 'openai') {
    aiLogic = `
    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });
    const completion = await openai.chat.completions.create({
      model: '${model}',
      messages: [{ role: 'user', content: prompt }],
      ${outputFormat === 'streaming' ? 'stream: true,' : ''}
    });
    ${outputFormat === 'streaming' ? 'return completion;' : 'return completion.choices[0].message.content;'}
    `;
  } else {
    aiLogic = `// TODO: Implement ${aiProvider} logic`;
  }

  // Generate the function
  const functionCode = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ${inputFields.map(f => f.name).join(', ')} } = await req.json()

    // Build prompt from inputs
    const prompt = \`Generate content based on: ${inputFields.map(f => `\${${f.name}}`).join(', ')}\`

    ${aiLogic}

    // Log usage
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    await supabase.from('ai_agent_runs').insert({
      user_id: req.headers.get('user-id'),
      agent_slug: '${functionName}',
      input_data: { ${inputFields.map(f => `${f.name}: \${${f.name}}`).join(', ')} },
      output_data: { result: ${outputFormat === 'streaming' ? 'null' : 'result'}, timestamp: new Date().toISOString() }
    })

    return new Response(
      JSON.stringify({
        result: ${outputFormat === 'streaming' ? 'null' : 'result'},
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})`;

  // Write the function
  fs.writeFileSync(path.join(functionDir, 'index.ts'), functionCode);

  console.log(`Generated Netlify function: ${functionName}`);
  return functionName;
}

// Main execution
const metadataJson = process.argv[2];
if (!metadataJson) {
  console.error('Usage: node scripts/generate-netlify-function.ts <metadata-json>');
  process.exit(1);
}

const metadata = JSON.parse(metadataJson);
generateNetlifyFunction(metadata);