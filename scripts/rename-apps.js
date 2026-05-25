#!/usr/bin/env node

/**
 * App Renaming Script - Convert Technical Names to Compelling Business Names
 *
 * This script reads the current appsData.ts file and renames all apps
 * to use benefit-focused, compelling names that appeal to business users.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the appsData.ts file
const appsDataPath = path.join(__dirname, '..', 'src', 'data', 'appsData.ts');
let appsDataContent = fs.readFileSync(appsDataPath, 'utf8');

// Extract app definitions using regex
const appRegex = /{\s*id:\s*["']([^"']+)["'],\s*name:\s*["']([^"']+)["']/g;
const apps = [];
let match;

while ((match = appRegex.exec(appsDataContent)) !== null) {
  apps.push({
    id: match[1],
    oldName: match[2],
    newName: generateNewName(match[2], match[1])
  });
}

console.log(`Found ${apps.length} apps to rename\n`);

// Display first 20 renames as examples
console.log('Sample Renames (first 20):');
console.log('='.repeat(80));
apps.slice(0, 20).forEach((app, index) => {
  console.log(`${(index + 1).toString().padStart(2)}. ${app.oldName.padEnd(35)} → ${app.newName}`);
});
console.log('='.repeat(80));

// Apply renames to the content (only if the name hasn't been changed already)
let updatedContent = appsDataContent;
apps.forEach(app => {
  // Skip if the new name is already in the content (avoid double processing)
  if (updatedContent.includes(`"${app.newName}"`)) {
    return;
  }

  // Escape special regex characters
  const escapedOldName = app.oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nameRegex = new RegExp(`(name:\\s*["'])(${escapedOldName})(["'])`, 'g');
  updatedContent = updatedContent.replace(nameRegex, `$1${app.newName}$3`);
});

// Write back to file
fs.writeFileSync(appsDataPath, updatedContent);

console.log(`\n✅ Successfully renamed ${apps.length} apps in appsData.ts`);
console.log('\nNext steps:');
console.log('1. Check other files that might reference app names:');
console.log('   - src/data/appSalesCopy.ts');
console.log('   - src/data/extendedSalesCopy.ts');
console.log('   - src/components/ProductDetailModal.tsx (if any)');
console.log('   - GTM modal components');
console.log('2. Regenerate thumbnails with new names');
console.log('3. Test that all app pages still work');

function generateNewName(oldName, appId) {
  // Convert to lowercase for easier matching
  const lowerName = oldName.toLowerCase();

  // Direct mappings for specific apps (highest priority)
  const directMappings = {
    // Research & RAG
    'agentic rag embedding gemma': 'Strategic Knowledge Navigator',
    'ai deep research agent': 'Expert Research Intelligence',
    'ai domain deep research agent': 'Industry Intelligence Scanner',
    'hybrid search rag': 'Advanced Knowledge Discovery',
    'autonomous rag': 'Self-Learning Research Engine',
    'corrective rag': 'Precision Research Corrector',
    'contextualai rag agent': 'Contextual Intelligence Hub',
    'gemini agentic rag': 'Multi-Modal Research Assistant',
    'deepseek local rag agent': 'Local Research Intelligence',
    'knowledge graph rag citations': 'Citation Intelligence Network',
    'ag2 adaptive research team': 'Adaptive Research Intelligence',
    'agentic rag gpt5': 'Advanced GPT Research Engine',
    'agentic rag with reasoning': 'Reasoning Research Intelligence',

    // Content Creation
    'ai personalized content': 'Smart Content Personalizer',
    'ai blog to podcast agent': 'Content-to-Audio Converter Pro',
    'ai meme generator agent browseruse': 'Viral Social Media Creator',
    'ai template generator': 'Professional Document Studio',
    'ai blog search': 'Content Discovery Engine',

    // Business & Sales
    'ai sales maximizer': 'Revenue Acceleration Engine',
    'smart crm closer': 'Deal Closing Intelligence',
    'ai referral maximizer': 'Customer Growth Multiplier',
    'funnelcraft ai': 'Conversion Funnel Optimizer',
    'ai proposal': 'Professional Proposal Generator',
    'sales assistant app': 'Sales Productivity Suite',
    'sales page builder': 'High-Converting Landing Pages',
    'ai skills monetizer': 'Expertise Revenue Platform',

    // Developer Tools
    'ai reasoning agent': 'Expert Code Reasoning Assistant',
    'ai system architect r1': 'Enterprise Architecture Designer',
    'ai tic tac toe agent': 'Strategic Game Intelligence',
    'ai 3dpygame r1': '3D Game Development Assistant',

    // Communication
    'ai customer support agent': 'Customer Experience Intelligence',
    'ai meeting agent': 'Meeting Intelligence Recorder',
    'chat with github': 'Code Repository Assistant',
    'chat with gmail': 'Email Intelligence Assistant',
    'chat with pdf': 'Document Intelligence Reader',
    'chat with research papers': 'Research Paper Analyst',
    'chat with substack': 'Newsletter Intelligence Hub',
    'chat with tarots': 'Spiritual Guidance Assistant',

    // Analytics
    'ai fraud investigation agent': 'Risk Detection Intelligence',
    'ai competitor intelligence agent team': 'Competitive Intelligence Hub',
    'ai startup insight fire1 agent': 'Startup Intelligence Scanner',
    'ai startup trend analysis agent': 'Market Trend Predictor',
    'ai product launch intelligence agent': 'Launch Intelligence Advisor',

    // Education & Specialized
    'ai teaching agent team': 'Educational Intelligence Platform',
    'ai journalist agent': 'News Intelligence Reporter',
    'ai legal agent team': 'Legal Intelligence Advisor',
    'ai life insurance advisor agent': 'Insurance Intelligence Guide',
    'ai medical imaging agent': 'Medical Imaging Intelligence',
    'ai mental wellbeing agent': 'Wellness Intelligence Companion',
    'ai health fitness agent': 'Health Intelligence Coach',
    'ai recipe meal planning agent': 'Culinary Intelligence Chef',

    // Creative & Media
    'video ai editor': 'Professional Video Studio',
    'ai video & image': 'Visual Content Generator Pro',
    'personalizer ai profile generator': 'Personal Branding Studio',
    'ai audio tour agent': 'Immersive Audio Experience Creator',

    // Productivity
    'ai screen recorder': 'Professional Demo Recorder',
    'ai signature': 'Professional Email Signature',
    '1 starter agent': 'AI Assistant Starter Kit',
    '4 running agents': 'Multi-Agent Workflow Hub'
  };

  // Check direct mappings first
  const normalizedKey = oldName.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  if (directMappings[normalizedKey]) {
    return directMappings[normalizedKey];
  }

  // Pattern-based fallbacks for remaining apps
  const patterns = [
    // RAG & Research
    { pattern: /rag|research|arxiv/i, template: () => `Research Intelligence ${oldName.replace(/^(ai|rag)/i, '').trim()}` },
    // Content & Media
    { pattern: /content|blog|podcast|social|media/i, template: () => `Content Intelligence ${oldName.replace(/^(ai)/i, '').trim()}` },
    // Business
    { pattern: /sales|business|revenue|crm|marketing/i, template: () => `Business Intelligence ${oldName.replace(/^(ai)/i, '').trim()}` },
    // Developer
    { pattern: /code|developer|system|architect/i, template: () => `Developer Intelligence ${oldName.replace(/^(ai)/i, '').trim()}` },
    // Communication
    { pattern: /chat|communication|support/i, template: () => `Communication Intelligence ${oldName.replace(/^(ai|chat)/i, '').trim()}` }
  ];

  // Apply pattern-based template
  for (const { pattern, template } of patterns) {
    if (pattern.test(lowerName)) {
      return template();
    }
  }

  // Final fallback - make it sound professional
  const prefixes = ['Smart', 'Expert', 'Professional', 'Advanced', 'Intelligent'];
  const suffixes = ['Assistant', 'Studio', 'Engine', 'Platform', 'Hub'];

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const cleanName = oldName.replace(/^(ai|agent|app)/i, '').trim();

  return `${prefix} ${cleanName} ${suffix}`;
}

// Template functions for different categories
function researchTemplate(name) {
  const mappings = {
    'agentic rag embedding gemma': 'Strategic Knowledge Navigator',
    'ai deep research agent': 'Expert Research Intelligence',
    'ai domain deep research agent': 'Industry Intelligence Scanner',
    'hybrid search rag': 'Advanced Knowledge Discovery',
    'autonomous rag': 'Self-Learning Research Engine',
    'corrective rag': 'Precision Research Corrector',
    'contextualai rag agent': 'Contextual Intelligence Hub',
    'gemini agentic rag': 'Multi-Modal Research Assistant',
    'deepseek local rag agent': 'Local Research Intelligence',
    'knowledge graph rag citations': 'Citation Intelligence Network',
    'ag2 adaptive research team': 'Adaptive Research Intelligence',
    'agentic rag gpt5': 'Advanced GPT Research Engine',
    'agentic rag with reasoning': 'Reasoning Research Intelligence',
    'chat with research papers': 'Research Paper Intelligence',
    'local ai reasoning agent py': 'Local Reasoning Intelligence',
    'rag agent cohere': 'Smart Document Intelligence'
  };

  const lowerName = name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  return mappings[lowerName] || `Research Intelligence ${name.replace(/^(ai|rag|agent)/i, '').trim()}`;
}

function contentTemplate(name) {
  const mappings = {
    'ai personalized content': 'Smart Content Personalizer',
    'ai blog to podcast agent': 'Content-to-Audio Converter Pro',
    'ai meme generator agent browseruse': 'Viral Social Media Creator',
    'ai template generator': 'Professional Document Studio',
    'ai blog search': 'Content Discovery Engine',
    'chat with blog': 'Blog Intelligence Assistant',
    'chat with podcast': 'Podcast Insight Analyzer',
    'chat with youtube videos': 'Video Content Intelligence',
    'blog to podcast agent': 'Blog-to-Podcast Converter',
    'cursor ai experiments': 'AI Experimentation Studio',
    'devpulse ai': 'Developer Productivity Hub'
  };

  const lowerName = name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  return mappings[lowerName] || `Content Intelligence ${name.replace(/^(ai|chat)/i, '').trim()}`;
}

function businessTemplate(name) {
  const mappings = {
    'ai sales maximizer': 'Revenue Acceleration Engine',
    'smart crm closer': 'Deal Closing Intelligence',
    'ai referral maximizer': 'Customer Growth Multiplier',
    'funnelcraft ai': 'Conversion Funnel Optimizer',
    'ai proposal': 'Professional Proposal Generator',
    'sales assistant app': 'Sales Productivity Suite',
    'sales page builder': 'High-Converting Landing Pages',
    'ai skills monetizer': 'Expertise Revenue Platform',
    'ai services agency': 'Business Services Intelligence'
  };

  const lowerName = name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  return mappings[lowerName] || `Business Intelligence ${name.replace(/^(ai)/i, '').trim()}`;
}

function developerTemplate(name) {
  const mappings = {
    'ai reasoning agent': 'Expert Code Reasoning Assistant',
    'ai system architect r1': 'Enterprise Architecture Designer',
    'ai tic tac toe agent': 'Strategic Game Intelligence',
    'ai 3dpygame r1': '3D Game Development Assistant',
    'ai data analysis agent': 'Data Intelligence Analyst',
    'ai data visualisation agent': 'Visual Data Storyteller',
    'local ai scrapper py': 'Web Scraping Intelligence',
    'local chatgpt clone': 'AI Chat Intelligence',
    'local chatgpt with memory': 'Conversational Memory Intelligence',
    'local travel agent': 'Travel Planning Intelligence',
    'qwen local rag': 'Local Knowledge Intelligence',
    'frontend': 'Frontend Development Intelligence'
  };

  const lowerName = name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  return mappings[lowerName] || `Developer Intelligence ${name.replace(/^(ai|local)/i, '').trim()}`;
}

function productivityTemplate(name) {
  const mappings = {
    'personalizer profile': 'Personal Branding Studio',
    'ai screen recorder': 'Professional Demo Recorder',
    'ai signature': 'Professional Email Signature',
    '1 starter agent': 'AI Assistant Starter Kit',
    '4 running agents': 'Multi-Agent Workflow Hub',
    '5 1 in memory conversation agent': 'Smart Conversation Manager',
    '5 2 persistent conversation agent': 'Intelligent Memory Assistant',
    '6 1 agent lifecycle callbacks': 'Agent Lifecycle Manager',
    '6 2 ai interaction callbacks': 'Interaction Intelligence Monitor',
    '6 3 tool execution callbacks': 'Tool Execution Optimizer'
  };

  const lowerName = name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  return mappings[lowerName] || `Productivity ${name.replace(/^(ai)/i, '').trim()}`;
}

function creativeTemplate(name) {
  const mappings = {
    'video ai editor': 'Professional Video Studio',
    'ai video & image': 'Visual Content Generator Pro',
    'personalizer video image transformer': 'Visual Content Transformer',
    'personalizer url video generation': 'URL-to-Video Content Studio',
    'ai movie production agent': 'Film Production Intelligence',
    'ai music generator agent': 'AI Music Composer Pro',
    'ai audio tour agent': 'Immersive Audio Experience Creator'
  };

  const lowerName = name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  return mappings[lowerName] || `Creative ${name.replace(/^(ai)/i, '').trim()}`;
}

function communicationTemplate(name) {
  const mappings = {
    'ai customer support agent': 'Customer Experience Intelligence',
    'ai meeting agent': 'Meeting Intelligence Recorder',
    'chat with github': 'Code Repository Assistant',
    'chat with gmail': 'Email Intelligence Assistant',
    'chat with pdf': 'Document Intelligence Reader',
    'chat with research papers': 'Research Paper Analyst',
    'chat with substack': 'Newsletter Intelligence Hub',
    'chat with tarots': 'Spiritual Guidance Assistant',
    'customer support voice agent': 'Voice Support Intelligence',
    'github mcp agent': 'GitHub Integration Intelligence',
    'browser mcp agent': 'Web Browsing Intelligence'
  };

  const lowerName = name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  return mappings[lowerName] || `Communication Intelligence ${name.replace(/^(ai|chat)/i, '').trim()}`;
}

function analyticsTemplate(name) {
  const mappings = {
    'ai fraud investigation agent': 'Risk Detection Intelligence',
    'ai competitor intelligence agent team': 'Competitive Intelligence Hub',
    'ai startup insight fire1 agent': 'Startup Intelligence Scanner',
    'ai startup trend analysis agent': 'Market Trend Predictor',
    'ai product launch intelligence agent': 'Launch Intelligence Advisor',
    'ai aqi analysis agent': 'Air Quality Intelligence',
    'ai arxiv agent memory': 'Research Memory Intelligence',
    'vision rag': 'Visual Intelligence Hub'
  };

  const lowerName = name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  return mappings[lowerName] || `Analytics Intelligence ${name.replace(/^(ai)/i, '').trim()}`;
}

function educationTemplate(name) {
  const mappings = {
    'ai teaching agent team': 'Educational Intelligence Platform',
    'ai journalist agent': 'News Intelligence Reporter',
    'ai legal agent team': 'Legal Intelligence Advisor',
    'ai life insurance advisor agent': 'Insurance Intelligence Guide',
    'ai medical imaging agent': 'Medical Imaging Intelligence',
    'ai mental wellbeing agent': 'Wellness Intelligence Companion',
    'ai health fitness agent': 'Health Intelligence Coach',
    'ai recipe meal planning agent': 'Culinary Intelligence Chef',
    'ai email gtm outreach agent': 'Email Outreach Intelligence',
    'ai email gtm reachout agent': 'Email Reach Intelligence'
  };

  const lowerName = name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  return mappings[lowerName] || `Intelligence ${name.replace(/^(ai)/i, '').trim()}`;
}

function entertainmentTemplate(name) {
  const mappings = {
    'ai chess agent': 'Strategic Chess Master',
    'ai game design agent team': 'Game Development Intelligence',
    'ai break up recovery agent': 'Emotional Support Companion',
    'ai meme generator agent': 'Viral Content Creator'
  };

  const lowerName = name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  return mappings[lowerName] || `Entertainment ${name.replace(/^(ai)/i, '').trim()}`;
}

function defaultTemplate(name) {
  // Generic fallback that makes any app sound more appealing
  const prefixes = ['Smart', 'Expert', 'Professional', 'Advanced', 'Intelligent', 'Strategic'];
  const suffixes = ['Assistant', 'Studio', 'Engine', 'Platform', 'Hub', 'Suite'];

  // Remove technical prefixes
  let cleanName = name.replace(/^(ai|rag|agent|app)/i, '').trim();

  // Add compelling prefix and suffix
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  return `${prefix} ${cleanName} ${suffix}`;
}