import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface OrchestrationInput {
  background_vibe: string;
  game_type: string;
  target_audience: string;
  player_perspective: string;
  multiplayer_support: string;
  game_goal: string;
  art_style: string;
  target_platforms: string;
  development_time_months: string;
  budget_usd: string;
  core_gameplay_mechanics: string;
  game_moodatmosphere: string;
  games_for_inspiration_commaseparated: string;
  unique_features_or_requirements: string;
  level_of_detail_in_response: string
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
  
  timestamp: string;
  processingTime: number;
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
    }

    await supabase.from('ai_agent_runs').insert({
      id: resultId,
      agent_type: 'ai-game-design-agent-team',
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