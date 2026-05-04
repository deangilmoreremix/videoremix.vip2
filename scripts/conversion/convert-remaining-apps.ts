#!/usr/bin/env node

/**
 * Batch Converter for Remaining 16 Apps
 *
 * MCP AI Agents (4 apps):
 *   - ai_travel_planner_mcp_agent_team
 *   - browser_mcp_agent
 *   - github_mcp_agent
 *   - multi_mcp_agent_router
 *
 * AI Agent Framework Crash Course - OpenAI SDK (12 apps):
 *   - 1_starter_agent
 *   - 4_running_agents
 *   - 7_sessions/7_1_basic_sessions (5_1_in_memory_conversation_agent)
 *   - 7_sessions/7_2_memory_operations (5_2_persistent_conversation_agent)
 *   - 6_guardrails_validation (6_1_agent_lifecycle_callbacks)
 *   - 6_guardrails_validation (6_2_llm_interaction_callbacks) - note: combo with above
 *   - 6_guardrails_validation (6_3_tool_execution_callbacks) - note: combo with above
 *   - 7_plugins
 *   - 7_sessions
 *   - 9_multi_agent_orchestration/9_1_parallel_execution (9_1_sequential_agent)
 *   - 9_multi_agent_orchestration/9_2_agents_as_tools (9_2_loop_agent)
 *   - 9_multi_agent_orchestration/parallel_execution (9_3_parallel_agent)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const ANALYSIS_DIR = path.join(PROJECT_ROOT, 'scripts/conversion/output/analysis');
const FUNCTIONS_DIR = path.join(PROJECT_ROOT, 'netlify/functions/generated');
const COMPONENTS_DIR = path.join(PROJECT_ROOT, 'src/pages/agents/generated');
const MANIFEST_OUTPUT = path.join(PROJECT_ROOT, 'scripts/conversion/output/remaining_manifest.json');

// ==================== APP DEFINITIONS ====================

const MCP_APPS = [
  {
    sourcePath: 'awesome-llm-apps-repo/mcp_ai_agents/ai_travel_planner_mcp_agent_team/app.py',
    appName: 'ai-travel-planner-mcp-agent-team',
    appSlug: 'ai-travel-planner-mcp-agent-team',
    componentName: 'AiTravelPlannerMcpAgentTeamPage',
    category: 'mcp_ai_agents',
    uiType: 'form',
    complexity: 'multi-agent',
    outputFormat: 'json',
    deploymentType: 'async-job-queue',
    providers: ['openai', 'agno'],
    requiresMCP: true,
    inputFields: [
      { name: 'destination', label: 'Destination', type: 'text', required: true },
      { name: 'duration_days', label: 'Duration (days)', type: 'number', required: true },
      { name: 'budget', label: 'Budget ($)', type: 'number', required: false },
      { name: 'preferences', label: 'Preferences', type: 'textarea', required: false }
    ],
    description: 'MCP-powered travel planner with Airbnb & Google Maps integration'
  },
  {
    sourcePath: 'awesome-llm-apps-repo/mcp_ai_agents/browser_mcp_agent/main.py',
    appName: 'browser-mcp-agent',
    appSlug: 'browser-mcp-agent',
    componentName: 'BrowserMcpAgentPage',
    category: 'mcp_ai_agents',
    uiType: 'form',
    complexity: 'simple',
    outputFormat: 'text',
    deploymentType: 'async-job-queue',
    providers: ['openai'],
    requiresMCP: true,
    inputFields: [
      { name: 'url', label: 'URL to Browse', type: 'text', required: true },
      { name: 'task', label: 'Task Description', type: 'textarea', required: true }
    ],
    description: 'Browser automation via MCP agent'
  },
  {
    sourcePath: 'awesome-llm-apps-repo/mcp_ai_agents/github_mcp_agent/github_agent.py',
    appName: 'github-mcp-agent',
    appSlug: 'github-mcp-agent',
    componentName: 'GithubMcpAgentPage',
    category: 'mcp_ai_agents',
    uiType: 'form',
    complexity: 'simple',
    outputFormat: 'text',
    deploymentType: 'async-job-queue',
    providers: ['openai', 'agno'],
    requiresMCP: true,
    inputFields: [
      { name: 'repo_url', label: 'Repository URL', type: 'text', required: true },
      { name: 'query', label: 'Question about repo', type: 'textarea', required: true }
    ],
    description: 'GitHub code analysis via MCP'
  },
  {
    sourcePath: 'awesome-llm-apps-repo/mcp_ai_agents/multi_mcp_agent_router/agent_forge.py',
    appName: 'multi-mcp-agent-router',
    appSlug: 'multi-mcp-agent-router',
    componentName: 'MultiMcpAgentRouterPage',
    category: 'mcp_ai_agents',
    uiType: 'form',
    complexity: 'multi-agent',
    outputFormat: 'json',
    deploymentType: 'async-job-queue',
    providers: ['openai', 'anthropic'],
    requiresMCP: true,
    inputFields: [
      { name: 'query', label: 'Agent Query', type: 'textarea', required: true },
      { name: 'routing_hint', label: 'Target Agent (optional)', type: 'text', required: false }
    ],
    description: 'Router coordinating multiple MCP agents'
  }
];

const CRASH_COURSE_APPS = [
  {
    sourcePath: 'awesome-llm-apps-repo/ai_agent_framework_crash_course/openai_sdk_crash_course/1_starter_agent/app.py',
    appName: '1-starter-agent',
    appSlug: '1-starter-agent',
    componentName: 'StarterAgentPage',
    category: 'ai_agent_framework_crash_course',
    uiType: 'chat',
    complexity: 'simple',
    outputFormat: 'text',
    deploymentType: 'netlify-function',
    providers: ['openai'],
    inputFields: [
      { name: 'message', label: 'Your Message', type: 'textarea', required: true }
    ],
    description: 'Basic OpenAI Agents SDK starter'
  },
  {
    sourcePath: 'awesome-llm-apps-repo/ai_agent_framework_crash_course/openai_sdk_crash_course/4_running_agents/agent_runner.py',
    appName: '4-running-agents',
    appSlug: '4-running-agents',
    componentName: 'RunningAgentsPage',
    category: 'ai_agent_framework_crash_course',
    uiType: 'form',
    complexity: 'simple',
    outputFormat: 'text',
    deploymentType: 'netlify-function',
    providers: ['openai'],
    inputFields: [
      { name: 'prompt', label: 'Prompt', type: 'textarea', required: true },
      { name: 'execution_mode', label: 'Execution Mode', type: 'select', options: ['sync', 'async', 'stream'], required: false }
    ],
    description: 'Agent execution patterns: sync, async, streaming'
  },
  {
    sourcePath: 'awesome-llm-apps-repo/ai_agent_framework_crash_course/openai_sdk_crash_course/7_sessions/7_1_basic_sessions/agent.py',
    appName: '7-1-basic-sessions',
    appSlug: '7-1-basic-sessions',
    componentName: 'BasicSessionsPage',
    category: 'ai_agent_framework_crash_course',
    uiType: 'chat',
    complexity: 'simple',
    outputFormat: 'text',
    deploymentType: 'netlify-function',
    providers: ['openai'],
    requiresSession: true,
    inputFields: [
      { name: 'message', label: 'Message', type: 'textarea', required: true },
      { name: 'session_id', label: 'Session ID', type: 'text', required: false }
    ],
    description: 'In-memory conversation sessions (5_1_in_memory_conversation_agent)'
  },
  {
    sourcePath: 'awesome-llm-apps-repo/ai_agent_framework_crash_course/openai_sdk_crash_course/7_sessions/7_2_memory_operations/agent.py',
    appName: '7-2-memory-operations',
    appSlug: '7-2-memory-operations',
    componentName: 'MemoryOperationsPage',
    category: 'ai_agent_framework_crash_course',
    uiType: 'chat',
    complexity: 'simple',
    outputFormat: 'text',
    deploymentType: 'netlify-function',
    providers: ['openai'],
    requiresSession: true,
    requiresSqlite: true,
    inputFields: [
      { name: 'message', label: 'Message', type: 'textarea', required: true },
      { name: 'user_id', label: 'User ID', type: 'text', required: false }
    ],
    description: 'Persistent conversation memory (5_2_persistent_conversation_agent)'
  },
  {
    sourcePath: 'awesome-llm-apps-repo/ai_agent_framework_crash_course/openai_sdk_crash_course/6_guardrails_validation/agent.py',
    appName: '6-1-agent-lifecycle-callbacks',
    appSlug: '6-1-agent-lifecycle-callbacks',
    componentName: 'AgentLifecycleCallbacksPage',
    category: 'ai_agent_framework_crash_course',
    uiType: 'form',
    complexity: 'simple',
    outputFormat: 'text',
    deploymentType: 'netlify-function',
    providers: ['openai'],
    inputFields: [
      { name: 'question', label: 'Question', type: 'textarea', required: true },
      { name: 'context', label: 'Context', type: 'textarea', required: false }
    ],
    description: 'Agent lifecycle & input guardrails (6_1_agent_lifecycle_callbacks)'
  },
  {
    sourcePath: 'awesome-llm-apps-repo/ai_agent_framework_crash_course/openai_sdk_crash_course/6_guardrails_validation/agent.py',
    appName: '6-2-llm-interaction-callbacks',
    appSlug: '6-2-llm-interaction-callbacks',
    componentName: 'LlmInteractionCallbacksPage',
    category: 'ai_agent_framework_crash_course',
    uiType: 'form',
    complexity: 'simple',
    outputFormat: 'text',
    deploymentType: 'netlify-function',
    providers: ['openai'],
    inputFields: [
      { name: 'prompt', label: 'Prompt', type: 'textarea', required: true },
      { name: 'enable_validation', label: 'Enable Validation', type: 'checkbox', required: false }
    ],
    description: 'LLM interaction callbacks (6_2_llm_interaction_callbacks)'
  },
  {
    sourcePath: 'awesome-llm-apps-repo/ai_agent_framework_crash_course/openai_sdk_crash_course/6_guardrails_validation/agent.py',
    appName: '6-3-tool-execution-callbacks',
    appSlug: '6-3-tool-execution-callbacks',
    componentName: 'ToolExecutionCallbacksPage',
    category: 'ai_agent_framework_crash_course',
    uiType: 'form',
    complexity: 'simple',
    outputFormat: 'text',
    deploymentType: 'netlify-function',
    providers: ['openai'],
    inputFields: [
      { name: 'tool_name', label: 'Tool Name', type: 'text', required: true },
      { name: 'arguments', label: 'Arguments (JSON)', type: 'textarea', required: true }
    ],
    description: 'Tool execution callbacks (6_3_tool_execution_callbacks)'
  },
  {
    sourcePath: 'awesome-llm-apps-repo/ai_agent_framework_crash_course/openai_sdk_crash_course/7_plugins/__init__.py',
    appName: '7-plugins',
    appSlug: '7-plugins',
    componentName: 'PluginsPage',
    category: 'ai_agent_framework_crash_course',
    uiType: 'form',
    complexity: 'simple',
    outputFormat: 'text',
    deploymentType: 'netlify-function',
    providers: ['openai', 'google-genai'],
    inputFields: [
      { name: 'provider', label: 'AI Provider', type: 'select', options: ['openai', 'google-genai'], required: true },
      { name: 'prompt', label: 'Prompt', type: 'textarea', required: true }
    ],
    description: 'Plugin system with multiple AI providers'
  },
  {
    sourcePath: 'awesome-llm-apps-repo/ai_agent_framework_crash_course/openai_sdk_crash_course/7_sessions/streamlit_sessions_app.py',
    appName: '7-sessions',
    appSlug: '7-sessions',
    componentName: 'SessionsPage',
    category: 'ai_agent_framework_crash_course',
    uiType: 'form',
    complexity: 'simple',
    outputFormat: 'text',
    deploymentType: 'netlify-function',
    providers: ['openai', 'openai-agents'],
    requiresSession: true,
    inputFields: [
      { name: 'message', label: 'Message', type: 'textarea', required: true },
      { name: 'session_id', label: 'Session ID', type: 'text', required: false }
    ],
    description: 'Session management with multi-session support'
  },
  {
    sourcePath: 'awesome-llm-apps-repo/ai_agent_framework_crash_course/openai_sdk_crash_course/9_multi_agent_orchestration/9_1_parallel_execution/agent.py',
    appName: '9-1-sequential-agent',
    appSlug: '9-1-sequential-agent',
    componentName: 'SequentialAgentPage',
    category: 'ai_agent_framework_crash_course',
    uiType: 'form',
    complexity: 'multi-agent',
    outputFormat: 'json',
    deploymentType: 'netlify-function',
    providers: ['google-adk'],
    inputFields: [
      { name: 'tasks', label: 'Tasks (one per line)', type: 'textarea', required: true }
    ],
    description: 'Sequential agent workflow (Google ADK)'
  },
  {
    sourcePath: 'awesome-llm-apps-repo/ai_agent_framework_crash_course/openai_sdk_crash_course/9_multi_agent_orchestration/9_2_agents_as_tools/agent.py',
    appName: '9-2-loop-agent',
    appSlug: '9-2-loop-agent',
    componentName: 'LoopAgentPage',
    category: 'ai_agent_framework_crash_course',
    uiType: 'form',
    complexity: 'multi-agent',
    outputFormat: 'json',
    deploymentType: 'netlify-function',
    providers: ['google-adk'],
    inputFields: [
      { name: 'agent_query', label: 'Query for agent loop', type: 'textarea', required: true },
      { name: 'max_iterations', label: 'Max Iterations', type: 'number', required: false }
    ],
    description: 'Agents-as-tools orchestration (9_2_agents_as_tools)'
  },
  {
    sourcePath: 'awesome-llm-apps-repo/ai_agent_framework_crash_course/openai_sdk_crash_course/9_multi_agent_orchestration/parallel_execution.py',
    appName: '9-3-parallel-agent',
    appSlug: '9-3-parallel-agent',
    componentName: 'ParallelAgentPage',
    category: 'ai_agent_framework_crash_course',
    uiType: 'form',
    complexity: 'multi-agent',
    outputFormat: 'json',
    deploymentType: 'netlify-function',
    providers: ['google-adk'],
    inputFields: [
      { name: 'parallel_tasks', label: 'Tasks (one per line)', type: 'textarea', required: true }
    ],
    description: 'Parallel execution of multiple agents'
  }
];

const ALL_APPS = [...MCP_APPS, ...CRASH_COURSE_APPS];

// ==================== HELPERS ====================

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function generateAnalysis(app: any): any {
  const sourcePath = path.join(PROJECT_ROOT, app.sourcePath);
  let linesOfCode = 100;
  let hasStreamlit = false;
  let hasChatInput = false;
  let hasForm = false;
  let widgetCounts = { textInput: 0, numberInput: 0, fileUpload: 0, selectBox: 0, button: 0, chat: 0, write: 0 };

  // Try to read source file for accurate analysis
  try {
    if (fs.existsSync(sourcePath)) {
      const content = fs.readFileSync(sourcePath, 'utf8');
      linesOfCode = content.split('\n').length;
      hasStreamlit = content.includes('streamlit') || content.includes('st.');

      // UI pattern detection
      hasChatInput = /st\.chat_input|st\.chat_message|chat_message\(/i.test(content);
      hasForm = /st\.form|st\.button|st\.submit/i.test(content);

      widgetCounts.textInput = (content.match(/st\.text_input|st\.text_area/gi) || []).length;
      widgetCounts.numberInput = (content.match(/st\.number_input|st\.slider/gi) || []).length;
      widgetCounts.fileUpload = (content.match(/st\.file_uploader/gi) || []).length;
      widgetCounts.selectBox = (content.match(/st\.selectbox|st\.multiselect/gi) || []).length;
      widgetCounts.button = (content.match(/st\.button|st\.download_button|st\.form_submit_button/gi) || []).length;
      widgetCounts.chat = (content.match(/st\.chat_message|st\.chat_input/gi) || []).length;
      widgetCounts.write = (content.match(/st\.write|st\.markdown|st\.code|st\.json|st\.dataframe/gi) || []).length;
    }
  } catch (e) {
    // use defaults
  }

  const providersObj: any = {};
  app.providers.forEach((p: string) => {
    providersObj[p] = { count: 1, imports: 1, clients: 0, models: [] };
  });

  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  if (app.requiresMCP) {
    requiredEnvVars.push('OPENAI_API_KEY');
  }
  if (app.providers.includes('openai') || app.providers.includes('openai-agents')) {
    requiredEnvVars.push('OPENAI_API_KEY');
  }
  if (app.category === 'mcp_ai_agents') {
    // MCP-specific env vars
    requiredEnvVars.push('MCP_SERVER_URL');
  }

  return {
    hasChatInput,
    hasForm: hasForm || app.uiType === 'form',
    hasTabs: false,
    hasFileUpload: widgetCounts.fileUpload > 0,
    hasColumns: true,
    hasButtons: widgetCounts.button > 0,
    widgetCounts,
    providers: providersObj,
    externalServices: app.requiresMCP ? { mcp: { count: 1 } } : {},
    usesSessionState: app.requiresSession || false,
    hasHistory: app.requiresSession || false,
    isAsync: app.deploymentType === 'async-job-queue',
    usesAsyncio: app.complexity === 'multi-agent',
    linesOfCode,
    hasMultiAgent: app.complexity === 'multi-agent',
    hasTools: app.category === 'mcp_ai_agents',
    hasRAG: false,
    hasWebSearch: false,
    uiType: app.uiType,
    inputFields: app.inputFields,
    outputFormat: app.outputFormat,
    primaryProvider: app.providers[0],
    filePath: app.sourcePath,
    appName: app.appName,
    category: app.category,
    complexity: app.complexity,
    requiresApiKey: app.providers.includes('openai') || app.providers.includes('anthropic'),
    requiredEnvVars,
    estimatedRuntime: app.complexity === 'multi-agent' ? 30 : 10,
    deploymentType: app.deploymentType,
    analyzedAt: new Date().toISOString(),
    analyzerVersion: '0.1.0',
    description: app.description
  };
}

function generateFunction(analysis: any): string {
  const { appName, componentName, uiType, inputFields, outputFormat, deploymentType, requiresMCP } = analysis;

  if (deploymentType === 'async-job-queue') {
    // Generate async job-handling function for MCP agents
    const inputParams = inputFields.map(f => `${f.name}${f.type === 'file' ? '?: string' : ': string'}`).join(', ');
    return `import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export interface ${componentName}Input {
  ${inputParams}
  userId?: string;
}

export interface ${componentName}Result {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  result?: any;
  error?: string;
  timestamp: string;
}

/**
 * NOTE: MCP tool calling is coming soon.
 * Currently this function is a stub that enqueues the job for processing.
 */
export async function handler(request: Request): Promise<Response> {
  try {
    const body: ${componentName}Input = await request.json();

    // Enqueue job - MCP integration pending
    const { data: job } = await supabase
      .from('agent_jobs')
      .insert({
        app_name: '${appName}',
        user_id: body.userId,
        input: body,
        status: 'queued',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    return new Response(JSON.stringify({
      id: job.id,
      status: 'queued',
      timestamp: job.created_at
    } as ${componentName}Result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      status: 'error',
      error: error.message
    }), { status: 500 });
  }
}`;
  } else {
    // Standard netlify function
    const inputParams = inputFields.map(f => `${f.name}${f.type === 'file' ? '?: string' : ': string'}`).join(', ');
    return `import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export interface ${componentName}Input {
  ${inputParams}
  userId?: string;
}

export interface ${componentName}Result {
  result: string;
  ${outputFormat === 'json' ? 'data?: any;' : ''}
  error?: string;
}

export async function handler(request: Request): Promise<Response> {
  try {
    const body: ${componentName}Input = await request.json();

    // Build prompt based on input
    const prompt = \`${app.description}
Input: \${JSON.stringify(body, null, 2)}\`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    const result = completion.choices[0].message.content || '';

    return new Response(JSON.stringify({ result } as ${componentName}Result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}`;
  }
}

function generateReactComponent(analysis: any): string {
  const { componentName, appName, inputFields, uiType } = analysis;
  const pascal = componentName;

  const fieldsInput = inputFields.map(f => {
    const fieldType = f.type === 'textarea' ? 'textarea' : f.type === 'select' ? 'select' : 'text';
    const fieldRender = f.type === 'select' && f.options
      ? `\n                  <select\n                    id="${f.name}"\n                    value={formData.${f.name}}\n                    onChange={(e) => setFormData({ ...formData, ${f.name}: e.target.value })}\n                    className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-white"\n                  >\n                    ${f.options.map(opt => `<option value="${opt}">${opt}</option>`).join('\n                    ')}\n                  </select>`
      : f.type === 'checkbox'
        ? `\n                  <input\n                    type="checkbox"\n                    id="${f.name}"\n                    checked={formData.${f.name} as boolean}\n                    onChange={(e) => setFormData({ ...formData, ${f.name}: e.target.checked })}\n                    className="h-4 w-4"\n                  />`
        : f.type === 'textarea'
          ? `\n                  <Textarea\n                    id="${f.name}"\n                    value={formData.${f.name}}\n                    onChange={(e) => setFormData({ ...formData, ${f.name}: e.target.value })}\n                    placeholder="${f.placeholder || ''}"\n                    className="bg-gray-900/50 border-gray-600 text-white min-h-[120px]"\n                  />`
          : `\n                  <Input\n                    id="${f.name}"\n                    type="${fieldType}"\n                    value={formData.${f.name}}\n                    onChange={(e) => setFormData({ ...formData, ${f.name}: e.target.value })}\n                    placeholder="${f.placeholder || ''}"\n                    className="bg-gray-900/50 border-gray-600 text-white"\n                  />`;

    return `              <div className="space-y-2">
                <Label htmlFor="${f.name}">${f.label}${f.required ? ' *' : ''}</Label>${fieldRender}
              </div>`;
  }).join('\n');

  const stateFields = inputFields.map(f => `${f.name}: ${f.type === 'checkbox' ? 'false' : '""'}`).join(', ');

  return `import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles } from "lucide-react";

const ${pascal}: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<{ ${stateFields} }>({ ${stateFields} });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generated/${appName}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <Helmet>
        <title>${pascal.replace(/([A-Z])/g, ' $1').trim()} - VideoRemix.vip</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <Card className="bg-gray-900/80 backdrop-blur-md border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-400" />
              ${pascal.replace(/([A-Z])/g, ' $1').trim()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
${fieldsInput}
              <Button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Run Agent'}
              </Button>
            </form>
            {error && <div className="mt-4 p-4 bg-red-900/50 border border-red-700 text-red-200 rounded">{error}</div>}
            {result && (
              <div className="mt-4 p-4 bg-green-900/50 border border-green-700 text-green-200 rounded">
                <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ${pascal};
`;
}

// ==================== MAIN ====================

async function main() {
  console.log('🚀 Batch Converter: Processing 16 remaining apps...\n');
  console.log(`MCP AI Agents: ${MCP_APPS.length}`);
  console.log(`OpenAI SDK Crash Course: ${CRASH_COURSE_APPS.length}`);
  console.log(`Total: ${ALL_APPS.length}\n`);

  // Ensure dirs
  [ANALYSIS_DIR, FUNCTIONS_DIR, COMPONENTS_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

  const analyses: any[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const app of ALL_APPS) {
    console.log(`Processing: ${app.appName}...`);

    try {
      // 1. Generate analysis
      const analysis = generateAnalysis(app);
      analysis.filePath = app.sourcePath;
      analyses.push(analysis);

      const analysisPath = path.join(ANALYSIS_DIR, `${app.appName}.json`);
      fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));

      // 2. Generate function
      const functionCode = generateFunction(analysis);
      const functionPath = path.join(FUNCTIONS_DIR, `${app.componentName}.ts`);
      fs.writeFileSync(functionPath, functionCode);

      // 3. Generate component
      const componentCode = generateReactComponent(analysis);
      const componentPath = path.join(COMPONENTS_DIR, `${app.componentName}.tsx`);
      fs.writeFileSync(componentPath, componentCode);

      successCount++;
      console.log(`  ✓ Generated ${app.appName}`);
    } catch (err: any) {
      console.error(`  ✗ Failed: ${app.appName} - ${err.message}`);
      failCount++;
    }
  }

  // Build manifest
  const manifest = analyses.map(a => ({
    appName: a.appName,
    appSlug: a.appSlug,
    componentName: a.componentName,
    category: a.category,
    uiType: a.uiType,
    complexity: a.complexity,
    template: a.uiType === 'form' ? 'form' : a.uiType === 'chat' ? 'chat' : 'simple-form',
    outputPath: `src/pages/agents/generated/${a.componentName}.tsx`
  }));

  fs.writeFileSync(MANIFEST_OUTPUT, JSON.stringify(manifest, null, 2));
  fs.writeFileSync(
    path.join(PROJECT_ROOT, 'scripts/conversion/output/generated-apps.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Conversion Complete!`);
  console.log(`   Successfully converted: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
  console.log(`   Manifest: ${MANIFEST_OUTPUT}`);
  console.log(`   Functions: ${FUNCTIONS_DIR}`);
  console.log(`   Components: ${COMPONENTS_DIR}`);
  console.log('='.repeat(60));
  console.log('\n⚠️  Special Notes:');
  console.log('   - MCP agents: Tool calls via direct API - marked as "coming soon" (async-job-queue)');
  console.log('   - Framework crash course: Direct conversion from simple tutorial examples');

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
