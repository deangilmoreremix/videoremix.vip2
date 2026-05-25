#!/usr/bin/env node

/**
 * Netlify Function Generator (Supabase Edge Function compatible)
 *
 * Converts Streamlit app logic into Supabase Edge Functions (Deno).
 * Generates: handler, input/output types, AI integration, Supabase logging.
 *
 * Templates:
 *   - simple: Single LLM call with prompt
 *   - chat: Conversational with history
 *   - pipeline: Multi-step with progress stages
 *   - orchestrator: Multi-agent coordination
 *   - rag: Vector search + LLM
 *   - async-job: Enqueues long-running job
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============ Template Directory ============
const TEMPLATES_DIR = path.join(__dirname, 'templates');

// Ensure templates directory exists
fs.mkdirSync(TEMPLATES_DIR, { recursive: true });

// ============ Template Definitions ============

const FUNCTION_TEMPLATES = {
   /**
    * Simple agent: Single prompt → LLM response [+ optional TTS audio]
    * Use for: starter agents, simple text/audio generation
    */
   simple: (config) => `import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface AgentInput {
  ${config.inputFields.map(f => `${f.name}${f.type === 'file' ? '?: string' : ': string'}`).join(';\n  ')}
  userId?: string;
}

interface AgentResult {
  id: string;
  status: 'processing' | 'completed' | 'error';
  result?: string;
  ${config.outputFormat === 'json' ? 'data?: any;' : ''}
  ${config.outputFormat === 'image' ? 'imageUrl?: string;' : ''}
  ${config.outputFormat === 'audio' ? 'audioUrl?: string;' : ''}
  error?: string;
  timestamp: string;
  processingTime: number;
}

function buildPrompt(input: AgentInput): string {
  return \`${config.promptTemplate}\`;
}

${config.outputFormat === 'audio' ? `
async function generateAudio(text: string, voice: string = 'alloy'): Promise<string> {
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: voice || 'alloy',
    input: text
  });
  const arrayBuffer = await mp3.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = \`audio_\${Date.now()}_\${Math.random().toString(36).substr(2, 6)}.mp3\`;
  const filePath = \`agent-audio/\${filename}\`;
  await supabase.storage.from('public').upload(filePath, buffer, {
    contentType: 'audio/mpeg',
    upsert: true
  });
  const { data } = supabase.storage.from('public').getPublicUrl(filePath);
  return data.publicUrl;
}
` : ''}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const startTime = Date.now();
  const input: AgentInput = JSON.parse(event.body);

  // Validate required fields
  ${config.inputFields.filter(f => f.required).map(f => `if (!input.${f.name}) return { statusCode: 400, body: JSON.stringify({ error: '${f.label} is required' }) };`).join('\n  ')}

  const resultId = \`${config.appSlug}_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  const timestamp = new Date().toISOString();

  // Save initial record
  try {
    await supabase.from('ai_agent_runs').insert({
      id: resultId,
      agent_type: '${config.appSlug}',
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
      model: '${config.model}',
      messages: [
        { role: 'system', content: '${config.systemPrompt}' },
        { role: 'user', content: prompt }
      ],
      temperature: ${config.temperature || 0.7},
      max_tokens: ${config.maxTokens || 2000}
    });

    const textResult = response.choices[0].message.content;
    const result: AgentResult = {
      id: resultId,
      status: 'completed',
      result: textResult,
      timestamp,
      processingTime: Date.now() - startTime
    }${config.outputFormat === 'audio' ? `;

    // Generate audio from text response
    const voice = input.voice || input.select_voice || 'alloy';
    const audioUrl = await generateAudio(textResult, voice);
    result.audioUrl = audioUrl;` : ''}

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
}`,

  /**
   * Chat agent: Maintains conversation history
   * Use for: chat-with-X, reasoning, conversation agents
   */
  chat: (config) => `import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface ChatInput {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userId?: string;
}

interface ChatResult {
  id: string;
  response: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  timestamp: string;
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const input: ChatInput = JSON.parse(event.body);
  if (!input.message?.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Message is required' }) };
  }

  const resultId = \`chat_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  const timestamp = new Date().toISOString();

  // Build messages array (system + history + current)
  const messages = [
    { role: 'system', content: '${config.systemPrompt}' },
    ...(input.history || []),
    { role: 'user', content: input.message }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: '${config.model}',
      messages,
      temperature: ${config.temperature || 0.7},
      max_tokens: ${config.maxTokens || 2000}
    });

    const assistantMsg = response.choices[0].message.content;
    const newHistory = [...(input.history || []), { role: 'user', content: input.message }, { role: 'assistant', content: assistantMsg }];

    const result: ChatResult = {
      id: resultId,
      response: assistantMsg,
      history: newHistory,
      timestamp
    };

    await supabase.from('ai_agent_runs').insert({
      id: resultId,
      agent_type: '${config.appSlug}',
      user_id: input.userId || null,
      input_data: input,
      output_data: result,
      status: 'completed',
      created_at: timestamp
    });

    return { statusCode: 200, body: JSON.stringify(result) };

  } catch (error) {
    console.error('Chat error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}`,

  /**
   * Multi-step pipeline: Executes stages sequentially with progress
   * Use for: research agents, analysis with multiple phases
   */
  pipeline: (config) => `import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface PipelineInput {
  ${config.inputFields.map(f => `${f.name}: string`).join(';\n  ')}
  userId?: string;
}

interface PipelineStage {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
  error?: string;
}

interface PipelineResult {
  id: string;
  stages: PipelineStage[];
  finalResult: string;
  timestamp: string;
  processingTime: number;
}

const STAGES = ${JSON.stringify(config.stages || ['stage1', 'stage2', 'stage3'])};

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const input: PipelineInput = JSON.parse(event.body);
  const startTime = Date.now();
  const resultId = \`pipeline_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  const timestamp = new Date().toISOString();

  // Initialize stages
  const initialStages: PipelineStage[] = STAGES.map(name => ({ name, status: 'pending' }));

  await supabase.from('ai_agent_runs').insert({
    id: resultId,
    agent_type: '${config.appSlug}',
    user_id: input.userId || null,
    input_data: input,
    output_data: { id: resultId, stages: initialStages, finalResult: '' },
    status: 'processing',
    created_at: timestamp
  });

  try {
    let finalResult = '';

    for (let i = 0; i < STAGES.length; i++) {
      const stageName = STAGES[i];

      // Update stage to running
      await supabase.rpc('pg_sleep', { seconds: 0 }); // placeholder for update
      // (In practice, we'd update the JSONB output_data)

      const stagePrompt = \`Stage \${i+1}: \${stageName}\\n\\nInput: \${JSON.stringify(input)}\\n\${config.stagePrompts ? config.stagePrompts[i] : ''}\`;

      const response = await openai.chat.completions.create({
        model: '${config.model}',
        messages: [
          { role: 'system', content: '${config.systemPrompt}' },
          { role: 'user', content: stagePrompt }
        ],
        temperature: ${config.temperature || 0.7},
        max_tokens: ${config.maxTokens || 2000}
      });

      const stageResult = response.choices[0].message.content;

      // Pass result to next stage via input
      if (i === STAGES.length - 1) {
        finalResult = stageResult;
      } else {
        input[stageName + '_result'] = stageResult;
      }
    }

    const result: PipelineResult = {
      id: resultId,
      stages: STAGES.map((name, idx) => ({ name, status: 'completed' })),
      finalResult,
      timestamp,
      processingTime: Date.now() - startTime
    };

    await supabase.from('ai_agent_runs').update({
      output_data: result,
      status: 'completed',
      updated_at: new Date().toISOString()
    }).eq('id', resultId);

    return { statusCode: 200, body: JSON.stringify(result) };

  } catch (error) {
    console.error('Pipeline error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}`,

   /**
    * Orchestrator: Coordinates multiple agents/tools [+ optional TTS audio]
    * Use for: CrewAI, multi-agent teams, complex workflows
    */
   orchestrator: (config) => `import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface OrchestrationInput {
  ${config.inputFields.map(f => `${f.name}${f.type === 'file' ? '?: string' : ': string'}`).join(';\n  ')}
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
  ${config.outputFormat === 'audio' ? 'audioUrl?: string;' : ''}
  timestamp: string;
  processingTime: number;
}

${config.outputFormat === 'audio' ? `
async function generateAudio(text: string, voice: string = 'alloy'): Promise<string> {
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: voice || 'alloy',
    input: text
  });
  const arrayBuffer = await mp3.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = \`audio_\${Date.now()}_\${Math.random().toString(36).substr(2, 6)}.mp3\`;
  const filePath = \`agent-audio/\${filename}\`;
  await supabase.storage.from('public').upload(filePath, buffer, {
    contentType: 'audio/mpeg',
    upsert: true
  });
  const { data } = supabase.storage.from('public').getPublicUrl(filePath);
  return data.publicUrl;
}
` : ''}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const input: OrchestrationInput = JSON.parse(event.body);
  const startTime = Date.now();
  const resultId = \`orch_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  const timestamp = new Date().toISOString();

  // Define agent roles
  const AGENTS = ${JSON.stringify(config.agents || [{name: 'researcher', role: 'research'}, {name: 'writer', role: 'write'}])};

  let context = '';

  try {
    // Execute each agent sequentially
    const tasks: AgentTask[] = [];

     for (const agent of AGENTS) {
       const agentPrompt = \`You are the \${agent.role} agent.\\n\\n\${agent.instructions || 'Process the input and produce output.'}\\n\\nInput: \${input.primaryInput}\\nPrevious context: \${context}\`;

      const response = await openai.chat.completions.create({
        model: '${config.model}',
        messages: [
          { role: 'system', content: \`You are \${agent.name}, a specialized AI agent responsible for \${agent.role}.\` },
          { role: 'user', content: agentPrompt }
        ],
        temperature: ${config.temperature || 0.7},
        max_tokens: ${config.maxTokens || 2000}
      });

      const output = response.choices[0].message.content;
      tasks.push({ name: agent.name, role: agent.role, input: input.primaryInput, output });
      context += \`\\n\\n[\${agent.name}]: \${output}\`;
    }

    const result: OrchestrationResult = {
      id: resultId,
      tasks,
      finalOutput: context,
      timestamp,
      processingTime: Date.now() - startTime
    }${config.outputFormat === 'audio' ? `;

    // Generate audio from final output
    const voice = input.voice || input.select_voice || 'alloy';
    const audioUrl = await generateAudio(context, voice);
    result.audioUrl = audioUrl;` : ''}

    await supabase.from('ai_agent_runs').insert({
      id: resultId,
      agent_type: '${config.appSlug}',
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
}`,
  
  /**
   * RAG agent: Document Q&A with vector search
   * Use for: chat-with-pdf, RAG tutorials, knowledge base agents
   */
  rag: (config) => `import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface RAGInput {
  query: string;
  documentId?: string;
  topK?: number;
  userId?: string;
}

interface RAGResult {
  id: string;
  answer: string;
  sources: Array<{ content: string; similarity: number }>;
  timestamp: string;
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const input: RAGInput = JSON.parse(event.body);
  if (!input.query?.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Query is required' }) };
  }

  const resultId = \`rag_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;

  try {
    // Generate embedding for query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: input.query
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Search Supabase pgvector
    const { data: matches, error: searchError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.78,
      match_count: input.topK || 5
    });

    if (searchError) throw searchError;

    const contexts = (matches || []).map(m => m.content).join('\\n\\n---\\n\\n');

    // Generate answer
    const prompt = \`Answer based on the following context. If unsure, say so.\\n\\nContext:\\n\${contexts}\\n\\nQuestion: \${input.query}\`;

    const completion = await openai.chat.completions.create({
      model: '${config.model}',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that answers based on provided context.' },
        { role: 'user', content: prompt }
      ],
      temperature: ${config.temperature || 0.7},
      max_tokens: ${config.maxTokens || 1500}
    });

    const result: RAGResult = {
      id: resultId,
      answer: completion.choices[0].message.content,
      sources: (matches || []).map(m => ({ content: m.content?.substring(0, 200), similarity: m.similarity })),
      timestamp: new Date().toISOString()
    };

    await supabase.from('ai_agent_runs').insert({
      id: resultId,
      agent_type: '${config.appSlug}',
      user_id: input.userId || null,
      input_data: input,
      output_data: result,
      status: 'completed',
      created_at: result.timestamp
    });

    return { statusCode: 200, body: JSON.stringify(result) };

  } catch (error) {
    console.error('RAG error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}`,

  /**
   * Async job enqueuer: For long-running agents
   * Use for: multi-agent teams, research >60s, batch processing
   */
  'async-job': (config) => `import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

interface JobInput {
  ${config.inputFields.map(f => `${f.name}: string`).join(';\n  ')}
  userId?: string;
  callbackUrl?: string;
}

interface JobResult {
  jobId: string;
  status: 'queued';
  message: string;
  estimateSeconds: number;
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const input: JobInput = JSON.parse(event.body);
  const jobId = \`job_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  const estimate = ${config.estimatedRuntime || 60};

  const { error } = await supabase.from('agent_jobs').insert({
    id: jobId,
    agent_type: '${config.appSlug}',
    user_id: input.userId || null,
    input_data: input,
    status: 'queued',
    created_at: new Date().toISOString(),
    estimated_completion_at: new Date(Date.now() + estimate * 1000).toISOString()
  });

  if (error) {
    console.error('Job enqueue error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to enqueue job' }) };
  }

  // Trigger background worker (optional webhook)
  // Could also use Supabase scheduled functions or external worker

  const result: JobResult = {
    jobId,
    status: 'queued',
    message: 'Job queued for processing',
    estimateSeconds: estimate
  };

  return { statusCode: 202, body: JSON.stringify(result) };
}`
};

// ============ Helper: Create TypeScript Config ============

// ============ Helper Functions ============

function toPascalCase(str: string): string {
  return str.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
}

function generateFunctionConfig(analyzerOutput) {
  const { appName, primaryProvider, uiType, inputFields, outputFormat, complexity, estimatedRuntime, requiredEnvVars, providers, externalServices } = analyzerOutput;
  
  const providerConfig = {
    openai: { needsOpenAI: true, model: 'gpt-4o-mini', systemPrompt: 'You are a helpful AI assistant.' },
    anthropic: { needsAnthropic: true, model: 'claude-3-opus-20240229', systemPrompt: 'You are Claude, a helpful AI.' },
    google: { needsGoogle: true, model: 'gemini-1.5-pro', systemPrompt: 'You are Gemini, a helpful AI.' },
    agno: { needsOpenAI: true, model: 'gpt-4o-mini', systemPrompt: 'You are a helpful AI agent.' },
    ollama: { needsOpenAI: false, model: 'gpt-4o-mini', systemPrompt: 'You are a helpful AI assistant.' },
    unknown: { needsOpenAI: true, model: 'gpt-4o-mini', systemPrompt: 'You are a helpful AI assistant.' }
  };

  const provider = primaryProvider in providerConfig ? primaryProvider : 'unknown';
  const cfg = providerConfig[provider];
  
  // Determine function template based on UI type + complexity + external services
  let template = 'simple';
  
  // Chat UI → chat template
  if (uiType === 'chat') {
    template = 'chat';
  } 
  // Very long running → async-job
  else if (estimatedRuntime > 50 || complexity === 'complex') {
    template = 'async-job';
  }
  // Multi-agent orchestration (CrewAI, AutoGen, multi-agent frameworks)
  else if (complexity === 'multi-agent') {
    // Check if it's truly orchestrated (multiple distinct agents)
    if (providers && Object.keys(providers).some(p => ['crewai', 'autogen', 'openai_agents'].includes(p))) {
      template = 'orchestrator';
    } else {
      template = 'simple'; // Agno agent with tools but single Agent instance → simple
    }
  }
  // RAG with vector DB
  else if (complexity === 'rag') {
    const services = Object.keys(externalServices || {});
    if (services.some(s => ['qdrant', 'pinecone', 'weaviate', 'pgvector', 'lancedb'].includes(s))) {
      template = 'rag';
    } else {
      template = 'simple'; // RAG-like but not using vector DB
    }
  }
  
  // Build prompt template from input fields
  const promptFields = inputFields.map(f => `${f.label}: {${f.name}}`).join('\n');
  const promptTemplate = promptFields || 'Process the following: {primaryInput}';

  return {
    appSlug: appName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    needsOpenAI: cfg.needsOpenAI,
    model: cfg.model || 'gpt-4o-mini',
    systemPrompt: cfg.systemPrompt,
    inputFields,
    outputFormat,
    uiType,
    complexity,
    estimatedRuntime,
    requiredEnvVars: requiredEnvVars || [],
    promptTemplate,
    temperature: 0.7,
    maxTokens: 2000,
    needsAnthropic: cfg.needsAnthropic || false,
    template,
    // Derived fields for component generation
    componentName: toPascalCase(appName) + 'Page',
    functionSlug: appName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    pageTitle: `${toPascalCase(appName)} - VideoRemix.vip`,
    pageDescription: `Use ${appName} to automate your tasks with AI.`,
    appDescription: `AI-powered ${appName.replace(/-/g, ' ')}.`,
    // Defaults for advanced templates (overridden per-app later)
    stages: ['analyze', 'process', 'finalize'],
    stagePrompts: [
      'Analyze the input thoroughly.',
      'Process the analysis results.',
      'Generate final output.'
    ],
    agents: [
      { name: 'researcher', role: 'research', instructions: 'Gather information on the topic.' },
      { name: 'analyst', role: 'analysis', instructions: 'Analyze gathered information.' },
      { name: 'writer', role: 'writing', instructions: 'Produce final output.' }
    ]
  };
}

// ============ Main Generator ============

export async function generateFunction(analyzerJsonPath, outputDir) {
  const analyzer = JSON.parse(fs.readFileSync(analyzerJsonPath, 'utf-8'));
  const config = generateFunctionConfig(analyzer);
  
  const templateFn = FUNCTION_TEMPLATES[config.template];
  if (!templateFn) {
    throw new Error(`Unknown template: ${config.template}`);
  }

  const code = templateFn(config);

  const outputPath = path.join(outputDir, `${config.appSlug}.ts`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, code);

  console.log(`✅ Generated: ${outputPath}`);
  return { appSlug: config.appSlug, template: config.template, outputPath };
}

export async function generateAllFunctions(analysisDir, outputDir) {
  const files = fs.readdirSync(analysisDir).filter(f => f.endsWith('.json') && !f.startsWith('_'));
  
  fs.mkdirSync(outputDir, { recursive: true });
  
  const results = [];
  for (const file of files) {
    try {
      const result = await generateFunction(path.join(analysisDir, file), outputDir);
      results.push({ file, ...result, status: 'success' });
    } catch (err) {
      console.error(`❌ ${file}: ${err.message}`);
      results.push({ file, status: 'error', error: err.message });
    }
  }
  
  // Write summary
  const summaryPath = path.join(outputDir, '_generation-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    total: files.length,
    success: results.filter(r => r.status === 'success').length,
    errors: results.filter(r => r.status === 'error'),
    generatedAt: new Date().toISOString()
  }, null, 2));

  console.log(`\n📊 Generated ${results.filter(r => r.status === 'success').length}/${files.length} functions`);
  return results;
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: ts-node generate-netlify-function.ts <analysis-json> <output-dir>');
    console.error('       ts-node generate-netlify-function.ts --all <analysis-dir> <output-dir>');
    process.exit(1);
  }

  if (args[0] === '--all') {
    const [_, __, analysisDir, outputDir] = args;
    generateAllFunctions(analysisDir, outputDir);
  } else {
    const [analysisJson, outputDir] = args;
    generateFunction(analysisJson, outputDir);
  }
}
