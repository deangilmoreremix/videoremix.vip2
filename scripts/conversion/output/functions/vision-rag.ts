import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface AgentInput {
  cohere_api_key: string;
  google_api_key_gemini: string;
  upload_images_png_jpg_jpeg_or_pdfs?: string;
  ask_a_question_about_the_loaded_images: string
  userId?: string;
}

interface AgentResult {
  id: string;
  status: 'processing' | 'completed' | 'error';
  result?: string;
  
  imageUrl?: string;
  
  error?: string;
  timestamp: string;
  processingTime: number;
}

function buildPrompt(input: AgentInput): string {
  return `Cohere API Key: {cohere_api_key}
Google API Key (Gemini): {google_api_key_gemini}
Upload images (PNG, JPG, JPEG) or PDFs: {upload_images_png_jpg_jpeg_or_pdfs}
Ask a question about the loaded images:: {ask_a_question_about_the_loaded_images}`;
}



export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const startTime = Date.now();
  const input: AgentInput = JSON.parse(event.body);

  // Validate required fields
  if (!input.cohere_api_key) return { statusCode: 400, body: JSON.stringify({ error: 'Cohere API Key is required' }) };
  if (!input.google_api_key_gemini) return { statusCode: 400, body: JSON.stringify({ error: 'Google API Key (Gemini) is required' }) };
  if (!input.upload_images_png_jpg_jpeg_or_pdfs) return { statusCode: 400, body: JSON.stringify({ error: 'Upload images (PNG, JPG, JPEG) or PDFs is required' }) };
  if (!input.ask_a_question_about_the_loaded_images) return { statusCode: 400, body: JSON.stringify({ error: 'Ask a question about the loaded images: is required' }) };

  const resultId = `vision-rag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  // Save initial record
  try {
    await supabase.from('ai_agent_runs').insert({
      id: resultId,
      agent_type: 'vision-rag',
      user_id: input.userId || null,
      input_data: input,
      output_data: { id: resultId, status: 'processing' },
      status: 'processing',
      created_at: timestamp
    });
  } catch (dbErr) {
    console.error('DB insert failed:', dbErr);
  }

  try {
    // Call AI
    const prompt = buildPrompt(input);
    const response = await openai.chat.completions.create({
      model: 'gemini-1.5-pro',
      messages: [
        { role: 'system', content: 'You are Gemini, a helpful AI.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const textResult = response.choices[0].message.content;
    const result: AgentResult = {
      id: resultId,
      status: 'completed',
      result: textResult,
      timestamp,
      processingTime: Date.now() - startTime
    }

    // Save result
    await supabase.from('ai_agent_runs')
      .update({ output_data: result, status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', resultId);

    return { statusCode: 200, body: JSON.stringify(result) };

  } catch (error) {
    console.error('Agent error:', error);
    const errorResult: AgentResult = {
      id: resultId,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp,
      processingTime: Date.now() - startTime
    };
    await supabase.from('ai_agent_runs').update({ output_data: errorResult, status: 'error' }).eq('id', resultId);
    return { statusCode: 500, body: JSON.stringify(errorResult) };
  }
}