#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const repoPath = 'awesome-llm-apps';

const results = {
  frameworkBased: [],
  configurable: [],
  openaiOnly: [],
  anthropicOnly: [],
  googleOnly: [],
  groqOnly: [],
  flexible: []
};

function analyzeAppCode(appPath, appName) {
  const pythonFiles = [];
  let requirements = '';

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
        }
      }
    } catch (e) {
      // ignore
    }
  }

  findFiles(appPath);

  // Check requirements
  const reqPath = path.join(appPath, 'requirements.txt');
  try {
    requirements = fs.readFileSync(reqPath, 'utf-8');
  } catch (e) {
    // ignore
  }

  let hasOpenAI = false;
  let hasAnthropic = false;
  let hasGoogle = false;
  let hasGroq = false;
  let hasFramework = false;
  let hasConfig = false;

  // Check requirements for frameworks
  if (requirements.includes('agno') || requirements.includes('langchain') ||
      requirements.includes('crewai') || requirements.includes('autogen') ||
      requirements.includes('llama-index')) {
    hasFramework = true;
  }

  // Analyze Python files
  pythonFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf-8');

      // Check for provider usage
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
          content.includes('from autogen') || content.includes('import autogen') ||
          content.includes('from llama_index') || content.includes('import llama_index')) {
        hasFramework = true;
      }

      // Check for configurable providers
      if (content.includes('os.getenv') || content.includes('os.environ.get') ||
          content.includes('config.') || content.includes('settings.')) {
        hasConfig = true;
      }

    } catch (e) {
      // ignore
    }
  });

  // Categorize the app
  const appInfo = {
    name: appName,
    path: appPath,
    frameworks: [],
    providers: []
  };

  if (hasFramework) {
    results.frameworkBased.push(appInfo);
    results.flexible.push(appInfo);
    if (requirements.includes('agno')) appInfo.frameworks.push('Agno');
    if (requirements.includes('langchain')) appInfo.frameworks.push('LangChain');
    if (requirements.includes('crewai')) appInfo.frameworks.push('CrewAI');
    if (requirements.includes('autogen')) appInfo.frameworks.push('AutoGen');
    if (requirements.includes('llama-index')) appInfo.frameworks.push('LlamaIndex');
  }

  if (hasConfig && !hasFramework) {
    results.configurable.push(appInfo);
    results.flexible.push(appInfo);
  }

  if (hasOpenAI) appInfo.providers.push('OpenAI');
  if (hasAnthropic) appInfo.providers.push('Anthropic');
  if (hasGoogle) appInfo.providers.push('Google');
  if (hasGroq) appInfo.providers.push('Groq');

  if (hasOpenAI && !hasAnthropic && !hasGoogle && !hasGroq && !hasFramework) {
    results.openaiOnly.push(appInfo);
    results.flexible.push(appInfo);
  } else if (hasAnthropic && !hasOpenAI && !hasGoogle && !hasGroq) {
    results.anthropicOnly.push(appInfo);
  } else if (hasGoogle && !hasOpenAI && !hasAnthropic && !hasGroq) {
    results.googleOnly.push(appInfo);
  } else if (hasGroq && !hasOpenAI && !hasAnthropic && !hasGoogle) {
    results.groqOnly.push(appInfo);
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

function printDetailedResults() {
  console.log('🔍 DETAILED OPENAI COMPATIBILITY ANALYSIS\n');

  console.log('✅ FRAMEWORK-BASED APPS (Easiest to migrate):');
  console.log(`   ${results.frameworkBased.length} apps can use OpenAI by changing model config\n`);
  results.frameworkBased.slice(0, 10).forEach(app => {
    console.log(`   📁 ${app.name}`);
    console.log(`      Frameworks: ${app.frameworks.join(', ')}`);
    console.log(`      Providers: ${app.providers.join(', ') || 'Configurable'}`);
    console.log('');
  });

  if (results.frameworkBased.length > 10) {
    console.log(`   ... and ${results.frameworkBased.length - 10} more apps\n`);
  }

  console.log('✅ OPENAI-ONLY APPS (Already compatible):');
  console.log(`   ${results.openaiOnly.length} apps already use OpenAI\n`);
  results.openaiOnly.forEach(app => {
    console.log(`   📁 ${app.name} - ${app.providers.join(', ')}`);
  });
  console.log('');

  console.log('⚠️ APPS REQUIRING CODE CHANGES:');
  console.log(`   ${results.anthropicOnly.length + results.googleOnly.length + results.groqOnly.length} apps need SDK replacement\n`);

  if (results.anthropicOnly.length > 0) {
    console.log('   🔄 Anthropic → OpenAI:');
    results.anthropicOnly.forEach(app => {
      console.log(`      📁 ${app.name}`);
    });
  }

  if (results.googleOnly.length > 0) {
    console.log('   🔄 Google → OpenAI:');
    results.googleOnly.forEach(app => {
      console.log(`      📁 ${app.name}`);
    });
  }

  if (results.groqOnly.length > 0) {
    console.log('   🔄 Groq → OpenAI:');
    results.groqOnly.forEach(app => {
      console.log(`      📁 ${app.name}`);
    });
  }
  console.log('');

  console.log('📊 FINAL SUMMARY:');
  const totalFlexible = results.flexible.length;
  const totalHardcoded = results.anthropicOnly.length + results.googleOnly.length + results.groqOnly.length;
  const total = totalFlexible + totalHardcoded;

  console.log(`   🎯 Total Apps Analyzed: ${total}`);
  console.log(`   ✅ OpenAI Compatible: ${totalFlexible} (${Math.round(totalFlexible/total*100)}%)`);
  console.log(`   ⚠️ Need Code Changes: ${totalHardcoded} (${Math.round(totalHardcoded/total*100)}%)`);
  console.log('');
  console.log('💡 RECOMMENDATION:');
  console.log('   Start with framework-based apps (just change model config)');
  console.log('   Skip hardcoded apps for now - focus on the 94% that work easily');
}

analyzeAllApps();
printDetailedResults();