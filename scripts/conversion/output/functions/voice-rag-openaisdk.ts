import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface OrchestrationInput {
  qdrant_url: string;
  qdrant_api_key: string;
  openai_api_key: string;
  select_voice: string;
  upload_pdf?: string;
  what_would_you_like_to_know_about_the_documentation: string
  userId?: string;
}

interface AgentTask {
  name: string;
  role: string;
  input: string;
  output?: string;
}

interface OrchestrationResult {
  id: string;
  tasks: AgentTask[];
  finalOutput: string;
  audioUrl?: string;
  timestamp: string;
  processingTime: number;
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

  const input: OrchestrationInput = JSON.parse(event.body);
  const startTime = Date.now();
  const resultId = `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  // Define agent roles
  const AGENTS = [{"name":"researcher","role":"research","instructions":"Gather information on the topic."},{"name":"analyst","role":"analysis","instructions":"Analyze gathered information."},{"name":"writer","role":"writing","instructions":"Produce final output."}];

  let context = '';

  try {
    // Execute each agent sequentially
    const tasks: AgentTask[] = [];

     for (const agent of AGENTS) {
       const agentPrompt = `You are the ${agent.role} agent.\n\n${agent.instructions || 'Process the input and produce output.'}\n\nInput: ${input.primaryInput}\nPrevious context: ${context}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `You are ${agent.name}, a specialized AI agent responsible for ${agent.role}.` },
          { role: 'user', content: agentPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const output = response.choices[0].message.content;
      tasks.push({ name: agent.name, role: agent.role, input: input.primaryInput, output });
      context += `\n\n[${agent.name}]: ${output}`;
    }

    const result: OrchestrationResult = {
      id: resultId,
      tasks,
      finalOutput: context,
      timestamp,
      processingTime: Date.now() - startTime
    };

    // Generate audio from final output
    const voice = input.voice || input.select_voice || 'alloy';
    const audioUrl = await generateAudio(context, voice);
    result.audioUrl = audioUrl;

    await supabase.from('ai_agent_runs').insert({
      id: resultId,
      agent_type: 'voice-rag-openaisdk',
      user_id: input.userId || null,
      input_data: input,
      output_data: result,
      status: 'completed',
      created_at: timestamp
    });

    return { statusCode: 200, body: JSON.stringify(result) };

  } catch (error) {
    console.error('Orchestration error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}