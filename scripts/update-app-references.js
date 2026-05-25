#!/usr/bin/env node

/**
 * Update App References Script - Update all files that reference old app names
 *
 * This script updates all files that reference the old app names with the new names.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapping of old names to new names
const nameMappings = {
  'AI Personalized Content': 'Smart Content Personalizer',
  'Video AI Editor': 'Professional Video Studio',
  'AI Video & Image': 'Expert Video & Image Engine',
  'AI Referral Maximizer': 'Customer Growth Multiplier',
  'AI Sales Maximizer': 'Revenue Acceleration Engine',
  'Smart CRM Closer': 'Deal Closing Intelligence',
  'FunnelCraft AI': 'Conversion Funnel Optimizer',
  'AI Proposal': 'Professional Proposal Generator',
  'Sales Assistant App': 'Sales Productivity Suite',
  'Sales Page Builder': 'High-Converting Landing Pages',
  'AI Screen Recorder': 'Professional Demo Recorder',
  'AI Skills Monetizer': 'Expertise Revenue Platform',
  'AI Signature': 'Professional Email Signature',
  'AI Template Generator': 'Professional Document Studio',
  'Personalizer AI Profile Generator': 'Personal Branding Studio',
  'Agentic RAG Embedding Gemma': 'Strategic Knowledge Navigator',
  'AI Deep Research Agent': 'Expert Research Intelligence',
  'AI Domain Deep Research Agent': 'Industry Intelligence Scanner',
  'Hybrid Search RAG': 'Advanced Knowledge Discovery',
  'Autonomous RAG': 'Self-Learning Research Engine',
  'Corrective RAG': 'Precision Research Corrector',
  'Contextualai RAG Agent': 'Contextual Intelligence Hub',
  'Gemini Agentic RAG': 'Multi-Modal Research Assistant',
  'Deepseek Local RAG Agent': 'Local Research Intelligence',
  'Knowledge Graph RAG Citations': 'Citation Intelligence Network',
  'AI Blog Search': 'Content Discovery Engine',
  'AI Blog To Podcast Agent': 'Content-to-Audio Converter Pro',
  'AI Meme Generator Agent Browseruse': 'Viral Social Media Creator',
  'AI Fraud Investigation Agent': 'Risk Detection Intelligence',
  'AI Competitor Intelligence Agent Team': 'Competitive Intelligence Hub',
  'AI Startup Insight Fire1 Agent': 'Startup Intelligence Scanner',
  'AI Startup Trend Analysis Agent': 'Market Trend Predictor',
  'AI Product Launch Intelligence Agent': 'Launch Intelligence Advisor',
  'AI Teaching Agent Team': 'Educational Intelligence Platform',
  'AI Journalist Agent': 'News Intelligence Reporter',
  'AI Legal Agent Team': 'Legal Intelligence Advisor',
  'AI Life Insurance Advisor Agent': 'Insurance Intelligence Guide',
  'AI Medical Imaging Agent': 'Medical Imaging Intelligence',
  'AI Mental Wellbeing Agent': 'Wellness Intelligence Companion',
  'AI Health Fitness Agent': 'Health Intelligence Coach',
  'AI Recipe Meal Planning Agent': 'Culinary Intelligence Chef',
  'AI Reasoning Agent': 'Expert Code Reasoning Assistant',
  'AI System Architect R1': 'Enterprise Architecture Designer',
  'AI Tic Tac Toe Agent': 'Strategic Game Intelligence',
  'AI 3dpygame R1': '3D Game Development Assistant',
  'AI Customer Support Agent': 'Customer Experience Intelligence',
  'AI Meeting Agent': 'Meeting Intelligence Recorder',
  'Chat With Github': 'Code Repository Assistant',
  'Chat With Gmail': 'Email Intelligence Assistant',
  'Chat With Pdf': 'Document Intelligence Reader',
  'Chat With Research Papers': 'Research Paper Analyst',
  'Chat With Substack': 'Newsletter Intelligence Hub',
  'Chat With Tarots': 'Spiritual Guidance Assistant',
  'AI Chess Agent': 'Strategic Chess Master',
  'AI Game Design Agent Team': 'Game Development Intelligence',
  'AI Breakup Recovery Agent': 'Emotional Support Companion',
  'AI Data Analysis Agent': 'Data Intelligence Analyst',
  'AI Data Visualisation Agent': 'Visual Data Storyteller',
  'AI Email Gtm Outreach Agent': 'Email Outreach Intelligence',
  'AI Email Gtm Reachout Agent': 'Email Reach Intelligence',
  'AI Financial Coach Agent': 'Financial Intelligence Advisor',
  'AI Real Estate Agent Team': 'Real Estate Intelligence Hub',
  'AI Recruitment Agent Team': 'Recruitment Intelligence Platform',
  'AI Services Agency': 'Business Services Intelligence',
  'AI Travel Agent': 'Travel Planning Intelligence',
  'AI Travel Agent Memory': 'Travel Memory Intelligence',
  'AI Travel Planner MCP Agent Team': 'Travel Planning Intelligence Hub',
  'AI Movie Production Agent': 'Film Production Intelligence',
  'AI Music Generator Agent': 'Music Creation Intelligence',
  'AI Personal Finance Agent': 'Financial Planning Intelligence',
  'AI Aqi Analysis Agent': 'Air Quality Intelligence',
  'AI Arxiv Agent Memory': 'Research Memory Intelligence',
  'AI Audio Tour Agent': 'Audio Experience Intelligence',
  'AI Breakup Recovery Agent': 'Emotional Support Intelligence',
  'AI Fraud Investigation Agent': 'Risk Detection Intelligence',
  'AI Game Design Agent Team': 'Game Development Intelligence',
  'AI Health Fitness Agent': 'Health Intelligence Coach',
  'AI Journalist Agent': 'News Intelligence Reporter',
  'AI Legal Agent Team': 'Legal Intelligence Advisor',
  'AI Life Insurance Advisor Agent': 'Insurance Intelligence Guide',
  'AI Medical Imaging Agent': 'Medical Imaging Intelligence',
  'AI Meeting Agent': 'Meeting Intelligence Recorder',
  'AI Meme Generator Agent Browseruse': 'Viral Content Creator',
  'AI Mental Wellbeing Agent': 'Wellness Intelligence Companion',
  'AI Movie Production Agent': 'Film Production Intelligence',
  'AI Music Generator Agent': 'Music Creation Intelligence',
  'AI Personal Finance Agent': 'Financial Planning Intelligence',
  'AI Real Estate Agent Team': 'Real Estate Intelligence Hub',
  'AI Reasoning Agent': 'Code Reasoning Intelligence',
  'AI Recruitment Agent Team': 'Recruitment Intelligence Platform',
  'AI Services Agency': 'Business Services Intelligence',
  'AI Startup Insight Fire1 Agent': 'Startup Intelligence Scanner',
  'AI Startup Trend Analysis Agent': 'Market Trend Intelligence',
  'AI System Architect R1': 'Architecture Intelligence',
  'AI Teaching Agent Team': 'Educational Intelligence Platform',
  'AI Tic Tac Toe Agent': 'Game Strategy Intelligence',
  'AI Travel Agent': 'Travel Intelligence',
  'AI Travel Agent Memory': 'Travel Memory Intelligence',
  'AI Travel Planner MCP Agent Team': 'Travel Planning Intelligence Hub',
  'Blog To Podcast Agent': 'Blog-to-Podcast Intelligence',
  'Browser MCP Agent': 'Web Browsing Intelligence',
  'Customer Support Voice Agent': 'Voice Support Intelligence',
  'Github MCP Agent': 'GitHub Integration Intelligence',
  'Local AI Reasoning Agent Py': 'Local Reasoning Intelligence',
  'Qwen Local RAG': 'Local Knowledge Intelligence',
  'RAG Agent Cohere': 'Document Intelligence Hub',
  'Vision RAG': 'Visual Intelligence Hub',
  'Voice RAG Openaisdk': 'Voice Intelligence Hub',
  'Multi Agent Researcher': 'Multi-Agent Research Intelligence',
  'Multi AI Memory': 'Multi-Memory Intelligence',
  'Multi MCP Agent Router': 'Multi-Agent Routing Intelligence',
  'Multimodal AI Agent': 'Multimodal Intelligence Agent'
};

// Files to update
const filesToUpdate = [
  'src/data/appSalesCopy.ts',
  'src/data/extendedSalesCopy.ts',
  'src/data/generatedThumbnails.ts',
  'src/data/enhancedAppsData.ts',
  'src/data/appThumbnailSpecsNew.ts'
];

console.log('Updating app name references in related files...\n');

let totalUpdates = 0;

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let updatesInFile = 0;

  // Apply each name mapping
  Object.entries(nameMappings).forEach(([oldName, newName]) => {
    // Escape special regex characters
    const escapedOldName = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Replace in content (case sensitive)
    const regex = new RegExp(escapedOldName, 'g');
    const matches = content.match(regex);

    if (matches) {
      content = content.replace(regex, newName);
      updatesInFile += matches.length;
      totalUpdates += matches.length;
    }
  });

  if (updatesInFile > 0) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ ${filePath}: ${updatesInFile} references updated`);
  } else {
    console.log(`ℹ️  ${filePath}: no changes needed`);
  }
});

console.log(`\n🎉 Total updates: ${totalUpdates} references updated across ${filesToUpdate.length} files`);

console.log('\nNext steps:');
console.log('1. Test that the app still works with renamed references');
console.log('2. Regenerate thumbnails if needed');
console.log('3. Update any hardcoded references in components');