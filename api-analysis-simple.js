#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const repoPath = 'awesome-llm-apps';

// Get all requirements.txt files and extract dependencies
const allDeps = new Set();
const allApis = new Set();

function processRequirements(file) {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

    lines.forEach(line => {
      const pkg = line.split(/[=<>!~]/)[0].trim();
      if (pkg) allDeps.add(pkg);
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
          }
        });
      });

      // Check for API key environment variables
      const envMatches = content.match(/\b[A-Z_]+_API_KEY\b/g) || [];
      envMatches.forEach(match => {
        if (match.includes('OPENAI')) allApis.add('openai');
        else if (match.includes('ANTHROPIC')) allApis.add('anthropic');
        else if (match.includes('GOOGLE')) allApis.add('google');
        else if (match.includes('GROQ')) allApis.add('groq');
        else if (match.includes('FIRECRAWL')) allApis.add('firecrawl');
        else if (match.includes('ELEVENLABS')) allApis.add('elevenlabs');
        else if (match.includes('SERPAPI')) allApis.add('serpapi');
        else if (match.includes('TAVILY')) allApis.add('tavily');
        else if (match.includes('COHERE')) allApis.add('cohere');
        else if (match.includes('TOGETHER')) allApis.add('together');
        else if (match.includes('PINECONE')) allApis.add('pinecone');
        else if (match.includes('AZURE')) allApis.add('azure');
        else if (match.includes('AWS')) allApis.add('aws');
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

console.log('🔑 REQUIRED API PROVIDERS:');
Array.from(allApis).sort().forEach(api => {
  console.log(`   • ${api}`);
});

console.log('\n📦 TOP DEPENDENCIES:');
const depCount = {};
Array.from(allDeps).forEach(dep => {
  depCount[dep] = (depCount[dep] || 0) + 1;
});

Object.entries(depCount)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 20)
  .forEach(([dep, count]) => {
    console.log(`   ${count.toString().padStart(3)} apps | ${dep}`);
  });

console.log('\n💾 Analysis complete!');