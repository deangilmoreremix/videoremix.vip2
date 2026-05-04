#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const repoPath = 'awesome-llm-apps';

// Get all requirements.txt files and extract dependencies
const allDeps = new Set();
const allApis = new Set();
const apiUsage = {};
const depUsage = {};

function processRequirements(file) {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

    lines.forEach(line => {
      const pkg = line.split(/[=<>!~]/)[0].trim();
      if (pkg) {
        allDeps.add(pkg);
        depUsage[pkg] = (depUsage[pkg] || 0) + 1;
      }
    });
  } catch (e) {
    // ignore
  }
}

function findPythonFiles(dir) {
  const files = [];
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== '__pycache__') {
        files.push(...findPythonFiles(fullPath));
      } else if (item.endsWith('.py')) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // ignore
  }
  return files;
}

function scanForAPIs(files) {
  const apiPatterns = {
    openai: ['openai', 'OPENAI_API_KEY'],
    anthropic: ['anthropic', 'ANTHROPIC_API_KEY'],
    google: ['google-generativeai', 'GOOGLE_API_KEY'],
    groq: ['groq', 'GROQ_API_KEY'],
    together: ['together', 'TOGETHER_API_KEY'],
    cohere: ['cohere', 'COHERE_API_KEY'],
    firecrawl: ['firecrawl', 'FIRECRAWL_API_KEY'],
    elevenlabs: ['elevenlabs', 'ELEVENLABS_API_KEY'],
    serpapi: ['serpapi', 'SERPAPI_KEY'],
    tavily: ['tavily', 'TAVILY_API_KEY'],
    exa: ['exa', 'EXA_API_KEY'],
    pinecone: ['pinecone', 'PINECONE_API_KEY'],
    qdrant: ['qdrant', 'qdrant-client'],
    chroma: ['chromadb', 'chroma'],
    lancedb: ['lancedb', 'lance'],
    aws: ['boto3'],
    azure: ['azure', 'AZURE_API_KEY'],
    github: ['pygithub'],
    stripe: ['stripe'],
    twilio: ['twilio'],
    replicate: ['replicate'],
    huggingface: ['transformers', 'huggingface'],
  };

  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf-8');

      Object.entries(apiPatterns).forEach(([api, patterns]) => {
        patterns.forEach(pattern => {
          if (content.includes(pattern)) {
            allApis.add(api);
            apiUsage[api] = (apiUsage[api] || 0) + 1;
          }
        });
      });

      // Check for API key environment variables
      const envMatches = content.match(/\b[A-Z_]+_API_KEY\b/g) || [];
      envMatches.forEach(match => {
        let api = 'other';
        if (match.includes('OPENAI')) api = 'openai';
        else if (match.includes('ANTHROPIC')) api = 'anthropic';
        else if (match.includes('GOOGLE')) api = 'google';
        else if (match.includes('GROQ')) api = 'groq';
        else if (match.includes('FIRECRAWL')) api = 'firecrawl';
        else if (match.includes('ELEVENLABS')) api = 'elevenlabs';
        else if (match.includes('SERPAPI')) api = 'serpapi';
        else if (match.includes('TAVILY')) api = 'tavily';
        else if (match.includes('COHERE')) api = 'cohere';
        else if (match.includes('TOGETHER')) api = 'together';
        else if (match.includes('PINECONE')) api = 'pinecone';
        else if (match.includes('AZURE')) api = 'azure';
        else if (match.includes('AWS')) api = 'aws';

        allApis.add(api);
        apiUsage[api] = (apiUsage[api] || 0) + 1;
      });

    } catch (e) {
      // ignore
    }
  });
}

// Process all requirements.txt files
const reqFiles = [];
function findReqFiles(dir) {
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.')) {
        findReqFiles(fullPath);
      } else if (item === 'requirements.txt') {
        reqFiles.push(fullPath);
      }
    }
  } catch (e) {
    // ignore
  }
}

findReqFiles(repoPath);
reqFiles.forEach(processRequirements);

// Find and scan Python files for API usage
const pythonFiles = findPythonFiles(repoPath);
scanForAPIs(pythonFiles);

console.log('🔍 COMPREHENSIVE API ANALYSIS FOR AWESOME-LLM-APPS\n');

console.log(`📊 Summary:`);
console.log(`   Apps with requirements: ${reqFiles.length}`);
console.log(`   Python files scanned: ${pythonFiles.length}`);
console.log(`   Total dependencies: ${allDeps.size}`);
console.log(`   API providers identified: ${allApis.size}\n`);

console.log('🔑 REQUIRED API PROVIDERS (with usage counts):');
Array.from(allApis).sort().forEach(api => {
  const count = apiUsage[api] || 0;
  console.log(`   ${count.toString().padStart(3)} apps | ${api}`);
});

console.log('\n📦 TOP 20 DEPENDENCIES (by usage):');
Object.entries(depUsage)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 20)
  .forEach(([dep, count]) => {
    console.log(`   ${count.toString().padStart(3)} apps | ${dep}`);
  });

console.log('\n📋 IMPLEMENTATION PRIORITIES:');

const priorityApis = [
  { name: 'openai', priority: 'HIGH', reason: 'Most used LLM provider, already integrated' },
  { name: 'anthropic', priority: 'HIGH', reason: 'Major LLM provider, high usage' },
  { name: 'google', priority: 'HIGH', reason: 'Google Gemini/Gemini AI, major provider' },
  { name: 'firecrawl', priority: 'HIGH', reason: 'Web scraping, essential for many apps' },
  { name: 'elevenlabs', priority: 'MEDIUM', reason: 'Voice synthesis, specialized use' },
  { name: 'serpapi', priority: 'MEDIUM', reason: 'Search API, useful for research apps' },
  { name: 'tavily', priority: 'MEDIUM', reason: 'Alternative search API' },
  { name: 'groq', priority: 'LOW', reason: 'Fast inference, but can be replaced with OpenAI' },
  { name: 'cohere', priority: 'LOW', reason: 'Alternative LLM, lower usage' },
  { name: 'together', priority: 'LOW', reason: 'Model aggregation, niche use' },
  { name: 'exa', priority: 'LOW', reason: 'Search API, limited usage' },
];

priorityApis.forEach(item => {
  const count = apiUsage[item.name] || 0;
  console.log(`   ${item.priority.padEnd(6)} | ${count.toString().padStart(3)} apps | ${item.name.padEnd(12)} | ${item.reason}`);
});

console.log('\n💾 Analysis complete!');