import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface AgentInput {
  openai_api_key: string;
  tour_duration_minutes: string;
  guide: string
  userId?: string;
}

interface AgentResult {
  id: string;
  status: 'processing' | 'completed' | 'error';
  result?: string;
  
  
  audioUrl?: string;
  error?: string;
  timestamp: string;
  processingTime: number;
}

function buildPrompt(input: AgentInput): string {
  return `OpenAI API Key:: {openai_api_key}
Tour Duration (minutes): {tour_duration_minutes}
Guide: {guide}`;
}


async function generateAudio(text: string, voice: string = 'alloy'): Promise<string> {
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: voice || 'alloy',
    input: text
  });
  const arrayBuffer = await mp3.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.mp3`;
  const filePath = `agent-audio/${filename}`;
  await supabase.storage.from('public').upload(filePath, buffer, {
    contentType: 'audio/mpeg',
    upsert: true
  });
  const { data } = supabase.storage.from('public').getPublicUrl(filePath);
  return data.publicUrl;
}


export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const startTime = Date.now();
  const input: AgentInput = JSON.parse(event.body);

  // Validate required fields
  if (!input.openai_api_key) return { statusCode: 400, body: JSON.stringify({ error: 'OpenAI API Key: is required' }) };
  if (!input.tour_duration_minutes) return { statusCode: 400, body: JSON.stringify({ error: 'Tour Duration (minutes) is required' }) };
  if (!input.guide) return { statusCode: 400, body: JSON.stringify({ error: 'Guide is required' }) };

  const resultId = `ai-audio-tour-agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  // Save initial record
  try {
    await supabase.from('ai_agent_runs').insert({
      id: resultId,
      agent_type: 'ai-audio-tour-agent',
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
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant.' },
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
    };

    // Generate audio from text response
    const voice = input.voice || input.select_voice || 'alloy';
    const audioUrl = await generateAudio(textResult, voice);
    result.audioUrl = audioUrl;

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