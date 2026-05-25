#!/usr/bin/env node

/**
 * Streamlit App Analyzer
 *
 * Parses Streamlit Python files and extracts structured metadata about:
 * - UI layout (forms, chat, tabs, file uploads)
 * - AI providers and models used
 * - Input/output structure
 * - Dependencies and frameworks
 * - Complexity classification
 *
 * Usage: node analyze-streamlit-app.js <path-to-app.py> [output.json]
 *        node analyze-streamlit-app.js --all <catalog-output-dir>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============ Pattern Definitions ============

const STREAMLIT_UI_PATTERNS = {
  // Input widgets
  textInput: /st\.(?:text_input|text_area)\(/g,
  numberInput: /st\.(?:number_input|slider)\(/g,
  fileUpload: /st\.(?:file_uploader)\(/g,
  selectBox: /st\.(?:selectbox|multiselect)\(/g,
  dateInput: /st\.(?:date_input|time_input)\(/g,
  checkbox: /st\.checkbox\(/g,
  radio: /st\.radio\(/g,
  colorPicker: /st\.color_picker\(/g,

  // Buttons & actions
  button: /st\.(?:button|download_button|form_submit_button)\(/g,
  
  // Layout
  columns: /st\.columns?\(/g,
  tabs: /st\.tabs?\(/g,
  expander: /st\.expander\(/g,
  container: /st\.(?:container|empty)\(/g,
  
  // Display
  write: /st\.(?:write|markdown|code|json|dataframe|table|metric)\(/g,
  chat: /st\.(?:chat_message|chat_input)\(/g,
  image: /st\.(?:image)\(/g,
  audio: /st\.(?:audio)\(/g,
  video: /st\.(?:video)\(/g,
  
  // State & caching
  sessionState: /st\.session_state\[/g,
  cacheResource: /@st\.cache_resource/g,
  cacheData: /@st\.cache_data/g,
  
  // Forms
  form: /st\.form\(/g,
};

const AI_PROVIDER_PATTERNS = {
  openai: {
    import: /from openai import OpenAI|import openai|OpenAI\(/g,
    client: /OpenAI\(/g,
    models: [/gpt-4o-mini/g, /gpt-4o/g, /gpt-4-turbo/g, /gpt-3.5-turbo/g, /o1-preview/g, /o1-mini/g],
    usage: 'openai'
  },
  anthropic: {
    import: /from anthropic import Anthropic|import anthropic|Anthropic\(/g,
    client: /Anthropic\(/g,
    models: [/claude-3-opus/g, /claude-3-sonnet/g, /claude-3-haiku/g, /claude-3.5-sonnet/g],
    usage: 'anthropic'
  },
  google: {
    import: /from google.generativeai|import google.generativeai|genai\.configure/g,
    client: /genai\.|GoogleGenerativeAI\(/g,
    models: [/gemini-pro/g, /gemini-1.5/g, /gemini-2.0/g],
    usage: 'google'
  },
  agno: {
    import: /from agno import Agent|import agno|Agent\(/g,
    client: /Agent\(/g,
    models: [/gpt-4/g, /claude-3/g],  // agno wraps other providers
    usage: 'agno'
  },
  langchain: {
    import: /from langchain|import langchain/g,
    client: /ChatOpenAI\(|ChatAnthropic\(/g,
    models: [],
    usage: 'langchain'
  },
  crewai: {
    import: /from crewai|import crewai|Crew\(|Agent\(/g,
    client: /Crew\(/g,
    models: [],
    usage: 'crewai'
  },
  autogen: {
    import: /from autogen|import autogen|AssistantAgent\(/g,
    client: /AssistantAgent\(/g,
    models: [],
    usage: 'autogen'
  },
  together: {
    import: /from together import Together|import together/g,
    client: /Together\(/g,
    models: [],
    usage: 'together'
  },
  ollama: {
    import: /import ollama|from ollama/g,
    client: /ollama\.|Ollama\(/g,
    models: [/llama3\./g, /mistral/g, /codellama/g],
    usage: 'ollama'
  },
  openai_agents: {
    import: /from openai import agents|import agents|Agent\(|Runner\(/g,
    client: /Runner\(/g,
    models: [],
    usage: 'openai-agents'
  }
};

const EXTERNAL_SERVICE_PATTERNS = {
  firecrawl: /from firecrawl|import firecrawl|FirecrawlApp\(/g,
  exa: /from exa_py|import exa|Exa\(/g,
  qdrant: /from qdrant_client|import qdrant|QdrantClient\(/g,
  pinecone: /from pinecone|import pinecone/g,
  weaviate: /from weaviate|import weaviate/g,
  playwright: /from playwright|import playwright|async_playwright\(/g,
  selenium: /from selenium|import selenium/g,
  beautifulsoup: /from bs4|import bs4|BeautifulSoup\(/g,
  scrapegraph: /from scrapegraphai|import scrapegraphai|SmartScraperGraph\(/g,
  elevenlabs: /from elevenlabs|import elevenlabs/g,
  tiktoken: /import tiktoken|from tiktoken/g,
  mem0: /from mem0ai|import mem0|Memory\(/g,
  e2b: /from e2b|import e2b|Sandbox\(/g,
  composio: /from composio|import composio/g,
};

// ============ Analyzer Functions ============

function analyzeStreamlitApp(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const stats = {
    // UI type detection
    hasChatInput: /st\.chat_input\(/.test(content),
    hasForm: /st\.form\(/.test(content),
    hasTabs: /st\.tabs?\(/.test(content),
    hasFileUpload: /st\.file_uploader\(/.test(content),
    hasColumns: /st\.columns?\(/.test(content),
    hasButtons: /st\.(?:button|download_button|form_submit_button)\(/.test(content),
    
    // Count widgets
    widgetCounts: {
      textInput: (content.match(STREAMLIT_UI_PATTERNS.textInput) || []).length,
      numberInput: (content.match(STREAMLIT_UI_PATTERNS.numberInput) || []).length,
      fileUpload: (content.match(STREAMLIT_UI_PATTERNS.fileUpload) || []).length,
      selectBox: (content.match(STREAMLIT_UI_PATTERNS.selectBox) || []).length,
      button: (content.match(STREAMLIT_UI_PATTERNS.button) || []).length,
      chat: (content.match(STREAMLIT_UI_PATTERNS.chat) || []).length,
      write: (content.match(STREAMLIT_UI_PATTERNS.write) || []).length,
    },
    
    // AI provider detection
    providers: detectProviders(content),
    externalServices: detectExternalServices(content),
    
    // Session state
    usesSessionState: /st\.session_state\[/.test(content),
    hasHistory: /messages.*=.*\[\]|history.*=.*\[\]/.test(content),
    
    // Async
    isAsync: /async def |await /g.test(content),
    usesAsyncio: /import asyncio|from asyncio/.test(content),
    
    // Complexity hints
    linesOfCode: content.split('\n').length,
    hasMultiAgent: /Crew\(|Agent\(|Team\(|Orchestrator\(/.test(content),
    hasTools: /from.*tools|import.*tools/.test(content),
    hasRAG: /vector|retriever|embeddings|qdrant|pinecone/.test(content),
    hasWebSearch: /duckduckgo|exa|tavily|firecrawl/.test(content),
  };

  // Determine UI type
  if (stats.hasChatInput && stats.widgetCounts.chat > 0) {
    stats.uiType = 'chat';
  } else if (stats.hasTabs) {
    stats.uiType = 'multi-tab';
  } else if (stats.hasFileUpload) {
    stats.uiType = 'file-upload';
  } else if (stats.widgetCounts.textInput > 0 || stats.widgetCounts.button > 0) {
    stats.uiType = 'form';
  } else {
    stats.uiType = 'dashboard';
  }

  // Extract input fields (basic heuristic)
  stats.inputFields = extractInputFields(content);
  
  // Extract output format
  stats.outputFormat = detectOutputFormat(content);
  
  // Primary AI provider (most prominent)
  stats.primaryProvider = Object.keys(stats.providers).length > 0 
    ? Object.keys(stats.providers).sort((a, b) => stats.providers[b].count - stats.providers[a].count)[0]
    : 'unknown';

  return stats;
}

function detectProviders(content) {
  const providers = {};
  
  for (const [name, pattern] of Object.entries(AI_PROVIDER_PATTERNS)) {
    const imports = (content.match(pattern.import) || []);
    const clients = (content.match(pattern.client) || []);
    const count = imports.length + clients.length;
    
    if (count > 0) {
      providers[name] = {
        count,
        imports: imports.length,
        clients: clients.length,
        models: pattern.models.map(m => {
          const matches = content.match(new RegExp(m.source, 'g')) || [];
          return { pattern: m.source, count: matches.length };
        }).filter(m => m.count > 0)
      };
    }
  }
  
  return providers;
}

function detectExternalServices(content) {
  const services = {};
  
  for (const [name, pattern] of Object.entries(EXTERNAL_SERVICE_PATTERNS)) {
    const matches = content.match(pattern) || [];
    if (matches.length > 0) {
      services[name] = {
        count: matches.length,
        usage: inferServiceUsage(content, name)
      };
    }
  }
  
  return services;
}

function inferServiceUsage(content, service) {
  // Simple heuristic: look for common usage patterns
  const usageHints = {
    firecrawl: content.includes('FirecrawlApp') ? 'scraping' : 'unknown',
    exa: content.includes('Exa(') ? 'search' : 'unknown',
    qdrant: content.includes('QdrantClient') ? 'vector-store' : 'unknown',
    playwright: content.includes('async_playwright') ? 'browser-automation' : 'unknown',
  };
  return usageHints[service] || 'integration';
}

function extractInputFields(content) {
  const fields = [];
  const widgetPattern = /st\.(text_input|text_area|number_input|slider|selectbox|multiselect|file_uploader|date_input|time_input|checkbox|radio|color_picker)\(\s*["']([^"']+)["']/g;
  
  let match;
  while ((match = widgetPattern.exec(content)) !== null) {
    const widgetType = match[1];
    const label = match[2];
    
    // Determine if required (check for key parameter)
    const widgetCall = content.substring(match.index, content.indexOf(')', match.index));
    const hasKey = /key\s*=\s*["']([^"']+)["']/.test(widgetCall);
    
    fields.push({
      name: label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      label,
      type: mapWidgetType(widgetType),
      required: !/default\s*=/.test(widgetCall) || hasKey
    });
  }
  
  return fields;
}

function mapWidgetType(widgetType) {
  const mapping = {
    text_input: 'text',
    text_area: 'textarea',
    number_input: 'number',
    slider: 'range',
    selectbox: 'select',
    multiselect: 'multiselect',
    file_uploader: 'file',
    date_input: 'date',
    time_input: 'time',
    checkbox: 'checkbox',
    radio: 'radio',
    color_picker: 'color',
  };
  return mapping[widgetType] || 'text';
}

function detectOutputFormat(content) {
  if (content.includes('st.json') || content.includes('st.write(json')) return 'json';
  if (content.includes('st.code') || content.includes('st.write(code')) return 'code';
  if (content.includes('st.dataframe') || content.includes('st.table')) return 'table';
  if (content.includes('st.image') || /PIL|Image|pillow/i.test(content)) return 'image';
  if (content.includes('st.audio')) return 'audio';
  if (content.includes('st.video')) return 'video';
  if (content.includes('st.markdown')) return 'markdown';
  if (content.includes('st.plotly_chart') || content.includes('st.line_chart')) return 'chart';
  return 'markdown'; // default
}

function classifyComplexity(stats) {
  if (stats.hasMultiAgent && stats.externalServices && Object.keys(stats.externalServices).length > 2) return 'complex';
  if (stats.hasMultiAgent) return 'multi-agent';
  if (stats.hasRAG) return 'rag';
  if (stats.externalServices && Object.keys(stats.externalServices).length > 0) return 'tool-using';
  if (stats.widgetCounts.fileUpload > 0) return 'file-processing';
  return 'simple';
}

function generateAppName(filePath) {
  const parts = filePath.split(path.sep);
  for (let i = parts.length - 1; i >= 0; i--) {
    // Skip common subdirectory names
    if (['frontend', 'backend', 'app', 'local', 'main', 'starter_ai_agents', 'advanced_ai_agents', 'voice_ai_agents', 'rag_tutorials', 'mcp_ai_agents'].includes(parts[i])) {
      continue;
}
    // Find part with .py or adjacent to .py
    const next = parts[i + 1];
    if (next && next.endsWith('.py')) {
      // Current dir name is the agent name
      let name = parts[i].toLowerCase();
      name = name.replace(/[^a-z0-9]/g, '-');
      return name.replace(/-+/g, '-').trim();
    }
    // If this part itself ends with .py, use parent directory
    if (parts[i].endsWith('.py')) {
      const parent = parts[i - 1];
      if (parent) {
        let name = parent.toLowerCase();
        name = name.replace(/[^a-z0-9]/g, '-');
        return name.replace(/-+/g, '-').trim();
      }
    }
  }
  // Fallback: filename without extension
  const base = path.basename(filePath);
  return base.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '-');
}

// ============ Main Execution ============

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node analyze-streamlit-app.js <path-to-app.py> [output.json]');
    console.error('       node analyze-streamlit-app.js --all <catalog-output-dir>');
    process.exit(1);
  }

  if (args[0] === '--all') {
    if (!args[1]) {
      console.error('Please specify output directory for --all mode');
      process.exit(1);
    }
    await analyzeAllApps(args[1]);
    return;
  }

  const appPath = args[0];
  const outputPath = args[1] || null;
  
  if (!fs.existsSync(appPath)) {
    console.error(`File not found: ${appPath}`);
    process.exit(1);
  }

  const stats = analyzeStreamlitApp(appPath);
  stats.filePath = appPath;
  stats.appName = generateAppName(appPath);
  stats.category = path.dirname(appPath).split(path.sep)[0]; // e.g., "starter_ai_agents"
  stats.complexity = classifyComplexity(stats);
  
  // Add derived fields
  stats.requiresApiKey = stats.primaryProvider !== 'unknown' || Object.keys(stats.externalServices).length > 0;
  stats.requiredEnvVars = collectRequiredEnvVars(stats);
  stats.estimatedRuntime = estimateRuntime(stats);
  stats.deploymentType = suggestDeploymentType(stats);

  const result = {
    ...stats,
    analyzedAt: new Date().toISOString(),
    analyzerVersion: '0.1.0'
  };

  const output = JSON.stringify(result, null, 2);
  
  if (outputPath) {
    // Ensure directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, output);
    console.log(`✅ Analyzed: ${appPath} → ${outputPath}`);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

async function analyzeAllApps(outputDir) {
  const catalogPath = './streamlit_apps_catalog.json';
  if (!fs.existsSync(catalogPath)) {
    console.error(`Catalog not found: ${catalogPath}`);
    console.log('Please run from project root with streamlit_apps_catalog.json present.');
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const outputMetadata = {};
  
  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });
  
  let total = 0;
  let completed = 0;
  let errors = 0;
  
  for (const [category, apps] of Object.entries(catalog)) {
    for (const [appName, appInfo] of Object.entries(apps)) {
      total++;
      const mainFile = appInfo.main_file || appInfo.mainFile;
      if (!mainFile) {
        console.warn(`⚠️  No main file for ${category}/${appName}, skipping`);
        errors++;
        continue;
      }
      
      const fullPath = path.resolve(mainFile);
      const outputFile = path.resolve(outputDir, `${category}-${appName}.json`);
      
      try {
        const stats = analyzeStreamlitApp(fullPath);
        stats.filePath = fullPath;
        stats.appName = appName;
        stats.category = category;
        stats.complexity = classifyComplexity(stats);
        stats.requiresApiKey = stats.primaryProvider !== 'unknown' || Object.keys(stats.externalServices).length > 0;
        stats.requiredEnvVars = collectRequiredEnvVars(stats);
        stats.estimatedRuntime = estimateRuntime(stats);
        stats.deploymentType = suggestDeploymentType(stats);
        
        const result = {
          ...stats,
          analyzedAt: new Date().toISOString(),
          analyzerVersion: '0.1.0'
        };
        
        fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
        console.log(`✅ ${category}/${appName}`);
        completed++;
        outputMetadata[`${category}/${appName}`] = result;
      } catch (err) {
        console.error(`❌ ${category}/${appName}: ${err.message}`);
        errors++;
      }
    }
  }
  
  // Write summary
  const summaryPath = path.resolve(outputDir, '_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    total,
    completed,
    errors,
    generatedAt: new Date().toISOString(),
    apps: outputMetadata
  }, null, 2));
  
  console.log(`\n📊 Summary: ${completed}/${total} analyzed, ${errors} errors`);
  console.log(`📁 Output: ${outputDir}/`);
}

function collectRequiredEnvVars(stats) {
  const envVars = [];
  
  // AI provider keys
  if (stats.providers.openai) envVars.push('OPENAI_API_KEY');
  if (stats.providers.anthropic) envVars.push('ANTHROPIC_API_KEY');
  if (stats.providers.google) envVars.push('GOOGLE_GENERATIVE_AI_KEY');
  if (stats.providers.together) envVars.push('TOGETHER_API_KEY');
  
  // External services
  if (stats.externalServices.firecrawl) envVars.push('FIRECRAWL_API_KEY');
  if (stats.externalServices.exa) envVars.push('EXA_API_KEY');
  
  // Supabase (always needed)
  envVars.push('SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY');
  
  return [...new Set(envVars)];
}

function estimateRuntime(stats) {
  // Very rough heuristic based on complexity and external calls
  let base = 2; // seconds
  
  if (stats.complexity === 'simple') base = 2;
  else if (stats.complexity === 'tool-using') base = 5;
  else if (stats.complexity === 'rag') base = 8;
  else if (stats.complexity === 'multi-agent') base = 15;
  else if (stats.complexity === 'complex') base = 30;
  
  // Add for external API calls
  const serviceCount = Object.keys(stats.externalServices).length;
  base += serviceCount * 3;
  
  // Add for async operations
  if (stats.isAsync) base *= 1.5;
  
  return Math.min(Math.round(base), 55); // cap at 55s (under timeout)
}

function suggestDeploymentType(stats) {
  if (stats.estimatedRuntime > 50) return 'async-job-queue';
  if (stats.hasMultiAgent) return 'async-job-queue';
  if (stats.complexity === 'complex') return 'async-job-queue';
  return 'synchronous';
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
