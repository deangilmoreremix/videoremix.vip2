#!/usr/bin/env node

/**
 * Comprehensive API Analysis for awesome-llm-apps repository
 * Identifies all API providers and services used across all apps
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoPath = path.join(__dirname, 'awesome-llm-apps');

// Known API patterns to look for
const API_PATTERNS = {
  // LLM Providers
  openai: ['openai', 'OpenAI', 'OPENAI_API_KEY'],
  anthropic: ['anthropic', 'claude', 'ANTHROPIC_API_KEY'],
  google: ['google-generativeai', 'google-genai', 'vertexai', 'GOOGLE_API_KEY'],
  groq: ['groq', 'GROQ_API_KEY'],
  together: ['together', 'together-ai', 'TOGETHER_API_KEY'],
  xai: ['x.ai', 'xai', 'XAI_API_KEY'],
  cohere: ['cohere', 'COHERE_API_KEY'],
  huggingface: ['huggingface', 'transformers'],
  replicate: ['replicate', 'REPLICATE_API_KEY'],

  // Web Scraping & Search
  firecrawl: ['firecrawl', 'firecrawl-py', 'FIRECRAWL_API_KEY'],
  serpapi: ['serpapi', 'google-search-results', 'SERPAPI_KEY'],
  tavily: ['tavily', 'tavily-python', 'TAVILY_API_KEY'],
  exa: ['exa', 'exa_py', 'EXA_API_KEY'],
  browserless: ['browserless', 'browserless.io'],
  playwright: ['playwright', 'browser-use'],

  // Voice & Audio
  elevenlabs: ['elevenlabs', 'ELEVENLABS_API_KEY'],
  assemblyai: ['assemblyai', 'ASSEMBLYAI_API_KEY'],
  deepgram: ['deepgram', 'DEEPGRAM_API_KEY'],

  // Image & Video
  stability: ['stability', 'stability-ai'],
  midjourney: ['midjourney'],
  dalle: ['dall-e', 'dalle'],
  unsplash: ['unsplash'],
  pexels: ['pexels'],

  // Data & Analytics
  langsmith: ['langsmith', 'langchain-core'],
  helius: ['helius'],
  moralis: ['moralis'],

  // Specialized Services
  pinecone: ['pinecone', 'PINECONE_API_KEY'],
  weaviate: ['weaviate'],
  qdrant: ['qdrant', 'qdrant-client'],
  chroma: ['chromadb', 'chroma'],
  lancedb: ['lancedb', 'lance'],
  supabase: ['supabase'],
  postgres: ['psycopg2', 'pgvector'],
  redis: ['redis'],
  mongodb: ['pymongo', 'motor'],

  // Cloud Platforms
  aws: ['boto3', 'aws'],
  azure: ['azure', 'AZURE_API_KEY'],
  gcp: ['google-cloud', 'gcp'],

  // Development Tools
  github: ['pygithub', 'github'],
  gitlab: ['python-gitlab'],
  slack: ['slack-sdk'],
  discord: ['discord.py'],
  notion: ['notion-client'],
  airtable: ['pyairtable'],

  // Other APIs
  stripe: ['stripe'],
  paypal: ['paypal'],
  twilio: ['twilio'],
  sendgrid: ['sendgrid'],
  mailgun: ['mailgun'],
  weather: ['openweather', 'weather-api'],
  maps: ['google-maps', 'mapbox'],
  translation: ['googletrans', 'deepl'],
};

function analyzeRequirementsFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const dependencies = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        // Extract package name from pip format
        const match = line.match(/^([a-zA-Z0-9\-_.]+)([=<>!~]+)/);
        return match ? match[1] : line.split('==')[0].split('>=')[0].split('<=')[0].trim();
      })
      .filter(pkg => pkg);

    return dependencies;
  } catch (error) {
    return [];
  }
}

function findApiUsages(codeFiles) {
  const usages = new Set();

  for (const file of codeFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');

      // Check for API key patterns
      Object.entries(API_PATTERNS).forEach(([api, patterns]) => {
        patterns.forEach(pattern => {
          if (content.includes(pattern)) {
            usages.add(api);
          }
        });
      });

      // Check for common API key environment variables
      const envVars = content.match(/\b[A-Z_]+_API_KEY\b/g) || [];
      envVars.forEach(envVar => {
        // Map common env vars to APIs
        if (envVar.includes('OPENAI')) usages.add('openai');
        else if (envVar.includes('ANTHROPIC')) usages.add('anthropic');
        else if (envVar.includes('GOOGLE')) usages.add('google');
        else if (envVar.includes('GROQ')) usages.add('groq');
        else if (envVar.includes('FIRECRAWL')) usages.add('firecrawl');
        else if (envVar.includes('ELEVENLABS')) usages.add('elevenlabs');
        else if (envVar.includes('SERPAPI')) usages.add('serpapi');
        else if (envVar.includes('TAVILY')) usages.add('tavily');
        else if (envVar.includes('EXA')) usages.add('exa');
        else if (envVar.includes('COHERE')) usages.add('cohere');
        else if (envVar.includes('TOGETHER')) usages.add('together');
        else if (envVar.includes('PINECONE')) usages.add('pinecone');
        else if (envVar.includes('QDRANT')) usages.add('qdrant');
        else if (envVar.includes('CHROMA')) usages.add('chroma');
        else if (envVar.includes('LANCE')) usages.add('lancedb');
        else if (envVar.includes('AZURE')) usages.add('azure');
        else if (envVar.includes('AWS') || envVar.includes('AMAZON')) usages.add('aws');
      });

    } catch (error) {
      // Skip files that can't be read
    }
  }

  return Array.from(usages);
}

function analyzeApp(appPath) {
  const appName = path.basename(appPath);
  const requirementsPath = path.join(appPath, 'requirements.txt');
  const pyFiles = [];

  // Find all Python files
  function findPyFiles(dir) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== '__pycache__') {
          findPyFiles(fullPath);
        } else if (item.endsWith('.py')) {
          pyFiles.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  findPyFiles(appPath);

  // Analyze requirements
  const dependencies = analyzeRequirementsFile(requirementsPath);

  // Analyze code for API usage
  const apiUsages = findApiUsages(pyFiles);

  return {
    appName,
    path: appPath,
    dependencies,
    apiUsages,
    hasRequirements: fs.existsSync(requirementsPath),
    pythonFiles: pyFiles.length
  };
}

function main() {
  console.log('🔍 Analyzing awesome-llm-apps repository for API dependencies...\n');

  const apps = [];
  const allDependencies = new Set();
  const allApis = new Set();

  // Find all app directories
  const categories = fs.readdirSync(repoPath).filter(item => {
    const fullPath = path.join(repoPath, item);
    try {
      return fs.statSync(fullPath).isDirectory() && !item.startsWith('.');
    } catch (error) {
      return false;
    }
  });

  for (const category of categories) {
    const categoryPath = path.join(repoPath, category);

    try {
      const categoryItems = fs.readdirSync(categoryPath);

      for (const item of categoryItems) {
        const itemPath = path.join(categoryPath, item);

        try {
          if (fs.statSync(itemPath).isDirectory()) {
            const app = analyzeApp(itemPath);
            apps.push(app);

            // Collect all dependencies and APIs
            app.dependencies.forEach(dep => allDependencies.add(dep));
            app.apiUsages.forEach(api => allApis.add(api));
          }
        } catch (error) {
          // Skip items that can't be analyzed
        }
      }
    } catch (error) {
      console.log(`Warning: Could not read category ${category}: ${error.message}`);
    }
  }

  // Generate comprehensive report
  console.log('📊 ANALYSIS RESULTS\n');

  console.log(`Total Apps Analyzed: ${apps.length}`);
  console.log(`Categories Found: ${categories.length}`);
  console.log(`Total Dependencies: ${allDependencies.size}`);
  console.log(`API Providers Identified: ${allApis.size}\n`);

  console.log('🔑 API PROVIDERS REQUIRED:\n');
  Array.from(allApis).sort().forEach(api => {
    console.log(`• ${api}`);
  });

  console.log('\n📦 TOP 20 MOST USED DEPENDENCIES:\n');
  const depCounts = {};
  apps.forEach(app => {
    app.dependencies.forEach(dep => {
      depCounts[dep] = (depCounts[dep] || 0) + 1;
    });
  });

  Object.entries(depCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20)
    .forEach(([dep, count]) => {
      console.log(`${count.toString().padStart(3)} apps | ${dep}`);
    });

  console.log('\n🗂️  APPS BY CATEGORY:\n');
  const categoryCounts = {};
  apps.forEach(app => {
    const category = path.basename(path.dirname(app.path));
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  Object.entries(categoryCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`${count.toString().padStart(3)} apps | ${category}`);
    });

  console.log('\n📋 SAMPLE APP BREAKDOWN (first 10):\n');
  apps.slice(0, 10).forEach(app => {
    console.log(`📁 ${app.appName}`);
    console.log(`   Path: ${app.path.replace(repoPath + '/', '')}`);
    console.log(`   APIs: ${app.apiUsages.join(', ') || 'None detected'}`);
    console.log(`   Dependencies: ${app.dependencies.length}`);
    console.log('');
  });

  // Save detailed JSON report
  const report = {
    summary: {
      totalApps: apps.length,
      totalDependencies: allDependencies.size,
      totalApis: allApis.size,
      categories: categories.length
    },
    apis: Array.from(allApis).sort(),
    topDependencies: Object.entries(depCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 50)
      .map(([dep, count]) => ({ dependency: dep, usageCount: count })),
    appsByCategory: categoryCounts,
    sampleApps: apps.slice(0, 20)
  };

  fs.writeFileSync('awesome-llm-apps-api-analysis.json', JSON.stringify(report, null, 2));
  console.log('💾 Detailed analysis saved to: awesome-llm-apps-api-analysis.json');
}

main();</content>
<parameter name="filePath">analyze-apis.js