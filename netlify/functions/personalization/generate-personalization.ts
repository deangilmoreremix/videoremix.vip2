import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

interface GeneratePersonalizationRequest {
  scanId: string;
  appId: string;
  mode: string;
  username: string;
  profiles: Array<Record<string, any>>;
  context?: string;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildPrompt(input: GeneratePersonalizationRequest): string {
  const profileSummary = input.profiles
    .map((profile, index) => `Profile ${index + 1}: ${profile.platform} - ${profile.profileUrl} - ${profile.status}`)
    .join('\n');

  return `You are a personalization engine for VideoRemix. Generate a set of personalized outputs for the target prospect.

Target username: ${input.username}
App ID: ${input.appId}
Mode: ${input.mode}
Context: ${input.context || 'None'}

Profile discovery results:
${profileSummary}

Produce JSON with an array called outputs. Each output should include type, title, and content. Example types: video_script, email, storyboard, proposal. Use the information available to personalize the copy and deliver a concise, professional response.`;
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
    const prompt = buildPrompt(body);
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a personalization assistant for VideoRemix.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1400,
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      return { statusCode: 500, body: JSON.stringify({ error: 'AI generation returned no content' }) };
    }

    let outputs;
    try {
      const parsed = JSON.parse(content);
      outputs = parsed.outputs || [];
    } catch {
      outputs = [{ outputType: 'generated_text', title: 'Personalization result', content }];
    }

    return { statusCode: 200, body: JSON.stringify({ scanId: body.scanId, outputs }) };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to generate personalization', details: error.message }) };
  }
};
