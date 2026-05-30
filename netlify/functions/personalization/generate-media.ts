import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

interface GenerateMediaRequest {
  appId: string;
  mode: string;
  username: string;
  prompt: string;
  type: 'image' | 'video';
  style?: string;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const body: GenerateMediaRequest = JSON.parse(event.body || '{}');
  if (!body.appId || !body.mode || !body.username || !body.prompt || !body.type) {
    return { statusCode: 400, body: JSON.stringify({ error: 'appId, mode, username, prompt, and type are required' }) };
  }

  try {
    let result: any;
    const mediaPrompt = `Professional, high-quality personalized ${body.type} for ${body.username} - ${body.mode} campaign. ${body.prompt}`;

    if (body.type === 'image') {
      // Use Responses API with built-in image generation tool
      const response = await openai.responses.create({
        model: 'gpt-5.5',
        instructions: 'Generate a professional, high-quality personalized image for business outreach. No text overlay, clean design.',
        input: mediaPrompt,
        tools: [{ type: 'image_generation' }],
      });

      // Extract image URL from response
      const imageOutput = response.output?.find((o: any) => o.type === 'image_generation_call');
      result = { url: imageOutput?.results?.[0]?.url };
    } else if (body.type === 'video') {
      // Video generation via Responses API
      const response = await openai.responses.create({
        model: 'gpt-5.5',
        instructions: 'Generate a personalized video greeting for business outreach. Professional, engaging.',
        input: mediaPrompt,
        tools: [{ type: 'video_generation' }],
      });

      const videoOutput = response.output?.find((o: any) => o.type === 'video_generation_call');
      result = { url: videoOutput?.result?.[0]?.url };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: result?.url,
        type: body.type,
        prompt: body.prompt,
      }),
    };
  } catch (error: any) {
    console.error('Media generation error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to generate media', details: error.message }) };
  }
};