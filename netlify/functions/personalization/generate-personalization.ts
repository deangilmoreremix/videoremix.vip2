import { Handler } from '@netlify/functions';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

interface GeneratePersonalizationRequest {
  scanId: string;
  appId: string;
  mode: string;
  username: string;
  profiles: Array<Record<string, any>>;
  context?: string;
  tone?: string;
  offer?: string;
  goal?: string;
  cta?: string;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

// Build instructions for Responses API
function buildPersonalizationInput(input: GeneratePersonalizationRequest): string {
  const profileSection = input.profiles.length > 0
    ? input.profiles.map((profile, index) => 
        `Profile ${index + 1}:
Platform: ${profile.platform || 'unknown'}
URL: ${profile.profileUrl || profile.url || 'N/A'}
Status: ${profile.status || 'found'}
Details: ${profile.bio || profile.description || 'No additional details'}`
      ).join('\n\n')
    : 'No public profiles found for this target.';

  return `TARGET: ${input.username}
COMPANY: ${input.context?.includes('company:') ? input.context.split('company:')[1]?.split('\n')[0] : 'Not specified'}
MODE: ${input.mode}
APP: ${input.appId}

PROFILES:
${profileSection}

CONTEXT:
- Tone: ${input.tone || 'professional'}
- Offer: ${input.offer || 'Not specified'}
- Goal: ${input.goal || 'Not specified'}
- Call to Action: ${input.cta || 'Not specified'}
- Notes: ${input.context || 'None'}

Generate personalized content with multiple output types. Each output includes type, title, and content. Example types: email_content, video_script, thumbnail_text, proposal_outline, social_hook, value_proposition. Use profile information to create hooks and personalized copy.`;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const body: GeneratePersonalizationRequest = JSON.parse(event.body || '{}');
  if (!body.scanId || !body.appId || !body.mode || !body.username || !Array.isArray(body.profiles)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'scanId, appId, mode, username, and profiles are required' }) };
  }

  try {
    // Use Responses API with built-in tools and structured output
    const input = buildPersonalizationInput(body);

    const response = await openai.responses.create({
      model: 'gpt-5.5',
      instructions: 'You are an AI personalization engine for VideoRemix.vip. Generate highly personalized, conversion-focused content for business outreach. Be professional, ethical, and focus on value propositions.',
      input,
      text: {
        format: {
          type: 'json_schema',
          name: 'personalization_outputs',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              outputs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['email_content', 'video_script', 'thumbnail_text', 'proposal_outline', 'social_hook', 'value_proposition', 'personalized_hook'] },
                    title: { type: 'string' },
                    content: { type: 'string' }
                  },
                  required: ['type', 'title', 'content']
                }
              }
            },
            required: ['outputs']
          }
        }
      },
      store: true,
    });

    const content = response.output_text;
    if (!content) {
      throw new Error('AI generation returned no content');
    }

    let outputs;
    try {
      const parsed = JSON.parse(content);
      outputs = parsed.outputs || [];
    } catch {
      outputs = [{ type: 'email_content', title: 'Personalization result', content }];
    }

    // Save project to Supabase
    const { data: project, error: projectError } = await supabase
      .from('personalization_projects')
      .insert({
        user_id: body.userId || null,
        app_id: body.appId,
        mode: body.mode,
        target_name: body.username,
        target_company: body.context?.includes('company:') ? body.context.split('company:')[1]?.split('\n')[0] : null,
        manual_notes: body.context,
        status: 'complete',
        scan_id: body.scanId,
        response_id: response.id
      })
      .select()
      .single();

    if (projectError) {
      console.error('Project save error:', projectError);
    }

// Save outputs to Supabase
     if (outputs.length > 0 && project) {
       const outputRecords = outputs.map((output: any) => ({
         project_id: project.id,
         output_type: output.type || 'generated_text',
         title: output.title || 'Generated personalization',
         content: JSON.stringify({ content: output.content || '' }), // JSONB format per schema
         model_used: 'gpt-5.5',
       }));

       await supabase.from('personalization_outputs').insert(outputRecords);
     }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        scanId: body.scanId, 
        outputs,
        project: project || null,
        responseId: response.id
      }) 
    };
  } catch (error: any) {
    console.error('Generation error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to generate personalization', details: error.message }) };
  }
};