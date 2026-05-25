#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const repoPath = 'awesome-llm-apps';

// Track provider flexibility
const providerAnalysis = {
  openaiOnly: new Set(),
  anthropicOnly: new Set(),
  googleOnly: new Set(),
  groqOnly: new Set(),
  flexible: new Set(), // Can use multiple providers
  frameworkBased: new Set(), // Uses Agno, LangChain, CrewAI, etc.
  configurable: new Set(), // Uses environment variables or config
};

function analyzeAppCode(appPath, appName) {
  const pythonFiles = [];
  const configFiles = [];

  function findFiles(dir) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== '__pycache__') {
          findFiles(fullPath);
        } else if (item.endsWith('.py')) {
          pythonFiles.push(fullPath);
        } else if (item.includes('config') || item.includes('env') || item.endsWith('.yaml') || item.endsWith('.yml')) {
          configFiles.push(fullPath);
        }
      }
    } catch (e) {
      // ignore
    }
  }

  findFiles(appPath);

  let hasOpenAI = false;
  let hasAnthropic = false;
  let hasGoogle = false;
  let hasGroq = false;
  let hasFramework = false;
  let hasConfig = false;
  let hasMultipleProviders = false;

  // Check requirements.txt for framework indicators
  const reqPath = path.join(appPath, 'requirements.txt');
  let requirements = '';
  try {
    requirements = fs.readFileSync(reqPath, 'utf-8');
    if (requirements.includes('agno') || requirements.includes('langchain') ||
        requirements.includes('crewai') || requirements.includes('autogen')) {
      hasFramework = true;
    }
  } catch (e) {
    // ignore
  }

  // Analyze Python files
  pythonFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf-8');

      // Check for hardcoded provider usage
      if (content.includes('openai') || content.includes('OpenAI') || content.includes('OPENAI_API_KEY')) {
        hasOpenAI = true;
      }
      if (content.includes('anthropic') || content.includes('claude') || content.includes('ANTHROPIC_API_KEY')) {
        hasAnthropic = true;
      }
      if (content.includes('google-generativeai') || content.includes('google-genai') ||
          content.includes('vertexai') || content.includes('GOOGLE_API_KEY') ||
          content.includes('gemini') || content.includes('Gemini')) {
        hasGoogle = true;
      }
      if (content.includes('groq') || content.includes('GROQ_API_KEY')) {
        hasGroq = true;
      }

      // Check for framework usage
      if (content.includes('from agno') || content.includes('import agno') ||
          content.includes('from langchain') || content.includes('import langchain') ||
          content.includes('from crewai') || content.includes('import crewai') ||
          content.includes('from autogen') || content.includes('import autogen')) {
        hasFramework = true;
      }

      // Check for configurable providers
      if (content.includes('os.getenv') || content.includes('os.environ.get') ||
          content.includes('config.') || content.includes('settings.')) {
        hasConfig = true;
      }

      // Check for multiple provider support
      const providerCount = [hasOpenAI, hasAnthropic, hasGoogle, hasGroq].filter(Boolean).length;
      if (providerCount > 1) {
        hasMultipleProviders = true;
      }

    } catch (e) {
      // ignore
    }
  });

  // Determine flexibility category
  if (hasFramework) {
    providerAnalysis.frameworkBased.add(appName);
    providerAnalysis.flexible.add(appName);
  } else if (hasConfig && hasMultipleProviders) {
    providerAnalysis.configurable.add(appName);
    providerAnalysis.flexible.add(appName);
  } else if (hasMultipleProviders) {
    providerAnalysis.flexible.add(appName);
  } else if (hasOpenAI && !hasAnthropic && !hasGoogle && !hasGroq) {
    providerAnalysis.openaiOnly.add(appName);
    providerAnalysis.flexible.add(appName);
  } else if (hasAnthropic && !hasOpenAI && !hasGoogle && !hasGroq) {
    providerAnalysis.anthropicOnly.add(appName);
  } else if (hasGoogle && !hasOpenAI && !hasAnthropic && !hasGroq) {
    providerAnalysis.googleOnly.add(appName);
  } else if (hasGroq && !hasOpenAI && !hasAnthropic && !hasGoogle) {
    providerAnalysis.groqOnly.add(appName);
  } else if (hasMultipleProviders) {
    providerAnalysis.flexible.add(appName);
  }
}

function analyzeAllApps() {
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
            analyzeAppCode(itemPath, item);
          }
        } catch (error) {
          // skip
        }
      }
    } catch (error) {
      console.log(`Warning: Could not read category ${category}: ${error.message}`);
    }
  }
}

function printResults() {
  console.log('🔍 OPENAI COMPATIBILITY ANALYSIS FOR AWESOME-LLM-APPS\n');

  console.log('📊 SUMMARY:');
  console.log(`   Framework-based (flexible): ${providerAnalysis.frameworkBased.size}`);
  console.log(`   Configurable (flexible): ${providerAnalysis.configurable.size}`);
  console.log(`   OpenAI-only: ${providerAnalysis.openaiOnly.size}`);
  console.log(`   Anthropic-only: ${providerAnalysis.anthropicOnly.size}`);
  console.log(`   Google-only: ${providerAnalysis.googleOnly.size}`);
  console.log(`   Groq-only: ${providerAnalysis.groqOnly.size}`);
  console.log(`   Total flexible: ${providerAnalysis.flexible.size}`);
  console.log('');

  const totalAnalyzed = providerAnalysis.frameworkBased.size + providerAnalysis.configurable.size +
                       providerAnalysis.openaiOnly.size + providerAnalysis.anthropicOnly.size +
                       providerAnalysis.googleOnly.size + providerAnalysis.groqOnly.size;

  console.log('🎯 COMPATIBILITY BREAKDOWN:\n');

  console.log('✅ CAN USE OPENAI (Easily):');
  console.log(`   ${providerAnalysis.flexible.size} apps (${Math.round(providerAnalysis.flexible.size / totalAnalyzed * 100)}%)`);
  console.log('   ├── Framework-based: Agno, LangChain, CrewAI, AutoGen');
  console.log('   ├── Configurable: Environment variables or settings');
  console.log('   └── Multiple provider support');
  console.log('');

  console.log('✅ CAN USE OPENAI (Already do):');
  console.log(`   ${providerAnalysis.openaiOnly.size} apps (${Math.round(providerAnalysis.openaiOnly.size / totalAnalyzed * 100)}%)`);
  console.log('   └── Already OpenAI-compatible');
  console.log('');

  console.log('⚠️ REQUIRE CODE CHANGES:');
  console.log(`   ${providerAnalysis.anthropicOnly.size + providerAnalysis.googleOnly.size + providerAnalysis.groqOnly.size} apps (${Math.round((providerAnalysis.anthropicOnly.size + providerAnalysis.googleOnly.size + providerAnalysis.groqOnly.size) / totalAnalyzed * 100)}%)`);
  console.log(`   ├── Anthropic-only: ${providerAnalysis.anthropicOnly.size} apps`);
  console.log(`   ├── Google-only: ${providerAnalysis.googleOnly.size} apps`);
  console.log(`   └── Groq-only: ${providerAnalysis.groqOnly.size} apps`);
  console.log('');

  console.log('📈 TOTAL COMPATIBLE WITH OPENAI:');
  const totalCompatible = providerAnalysis.flexible.size + providerAnalysis.openaiOnly.size;
  console.log(`   ${totalCompatible} apps (${Math.round(totalCompatible / totalAnalyzed * 100)}%)`);
  console.log('');

  console.log('🛠️ MIGRATION EFFORT:\n');

  console.log('🚀 EASY (Framework-based):');
  console.log('   • Change model configuration in framework');
  console.log('   • No code changes needed');
  console.log(`   • ${providerAnalysis.frameworkBased.size} apps`);
  console.log('');

  console.log('🔧 MEDIUM (Configurable):');
  console.log('   • Update environment variables');
  console.log('   • Change provider settings');
  console.log(`   • ${providerAnalysis.configurable.size} apps`);
  console.log('');

  console.log('⚙️ HARD (Hardcoded):');
  console.log('   • Replace provider SDK calls');
  console.log('   • Update imports and API calls');
  console.log(`   • ${providerAnalysis.anthropicOnly.size + providerAnalysis.googleOnly.size + providerAnalysis.groqOnly.size} apps`);
  console.log('');

  console.log('💡 STRATEGY RECOMMENDATION:');
  console.log(`   Start with ${providerAnalysis.flexible.size} flexible apps (framework-based)`);
  console.log(`   Then add ${providerAnalysis.openaiOnly.size} OpenAI apps (already compatible)`);
  console.log('   Finally migrate hardcoded apps as needed');
  console.log('');

  console.log('🎯 BOTTOM LINE:');
  console.log(`   ${Math.round(totalCompatible / totalAnalyzed * 100)}% of apps can use OpenAI with minimal changes!`);
}

analyzeAllApps();
printResults();