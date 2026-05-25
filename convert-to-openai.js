#!/usr/bin/env node

/**
 * Automated OpenAI Conversion Script for Awesome-LLM-Apps
 *
 * Converts framework-based apps from Google/Anthropic/Groq to OpenAI
 * Handles common patterns automatically
 */

import fs from 'fs';
import path from 'path';

const repoPath = 'awesome-llm-apps';

// Conversion patterns for different frameworks
const CONVERSIONS = {
  // Agno framework
  agno: {
    googleImport: /from agno\.models\.google import Gemini/g,
    googleReplace: 'from agno.models.openai import OpenAIChat',
    modelPattern: /model=Gemini\([^)]+\)/g,
    modelReplace: 'model=OpenAIChat(id="gpt-4o")'
  },

  // LangChain
  langchain: {
    googleImport: /from langchain_google_genai import ChatGoogleGenerativeAI/g,
    googleReplace: 'from langchain_openai import ChatOpenAI',
    modelPattern: /ChatGoogleGenerativeAI\([^)]*\)/g,
    modelReplace: 'ChatOpenAI(model="gpt-4o")'
  },

  // Anthropic
  anthropic: {
    importPattern: /import anthropic|from anthropic import/g,
    importReplace: 'import openai',
    clientPattern: /anthropic\.Anthropic\([^)]*\)/g,
    clientReplace: 'openai.OpenAI()',
    modelPattern: /model=["']claude-[^"']*["']/g,
    modelReplace: 'model="gpt-4o"'
  },

  // Groq
  groq: {
    importPattern: /from groq import|import groq/g,
    importReplace: 'import openai',
    clientPattern: /groq\.Groq\([^)]*\)/g,
    clientReplace: 'openai.OpenAI()',
    modelPattern: /openai\/[^"']*["']/g,
    modelReplace: 'gpt-4o'
  }
};

// API key conversions
const API_KEY_CONVERSIONS = {
  // Input field conversions
  inputs: {
    'st.sidebar.text_input("Google API Key"': 'st.sidebar.text_input("OpenAI API Key"',
    'st.sidebar.text_input("Anthropic API Key"': 'st.sidebar.text_input("OpenAI API Key"',
    'st.sidebar.text_input("Groq API Key"': 'st.sidebar.text_input("OpenAI API Key"',
    'st.text_input("Google API Key"': 'st.text_input("OpenAI API Key"',
    'st.text_input("Anthropic API Key"': 'st.text_input("OpenAI API Key"',
    'st.text_input("Groq API Key"': 'st.text_input("OpenAI API Key"'
  },

  // Session state conversions
  sessionState: {
    'google_api_key': 'openai_api_key',
    'anthropic_api_key': 'openai_api_key',
    'groq_api_key': 'openai_api_key'
  },

  // Environment variable conversions
  envVars: {
    'GOOGLE_API_KEY': 'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY': 'OPENAI_API_KEY',
    'GROQ_API_KEY': 'OPENAI_API_KEY'
  }
};

function convertFile(filePath, framework) {
  console.log(`🔄 Converting ${filePath} (${framework})`);

  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Apply framework-specific conversions
  if (CONVERSIONS[framework]) {
    const conv = CONVERSIONS[framework];

    if (conv.googleImport && content.match(conv.googleImport)) {
      content = content.replace(conv.googleImport, conv.googleReplace);
      modified = true;
    }

    if (conv.modelPattern && content.match(conv.modelPattern)) {
      content = content.replace(conv.modelPattern, conv.modelReplace);
      modified = true;
    }

    // Apply other framework patterns
    Object.entries(conv).forEach(([key, pattern]) => {
      if (key.includes('Pattern') && content.match(pattern)) {
        const replaceKey = key.replace('Pattern', 'Replace');
        if (conv[replaceKey]) {
          content = content.replace(pattern, conv[replaceKey]);
          modified = true;
        }
      }
    });
  }

  // Apply API key conversions
  Object.entries(API_KEY_CONVERSIONS.inputs).forEach(([oldPattern, newPattern]) => {
    if (content.includes(oldPattern)) {
      content = content.replace(oldPattern, newPattern);
      modified = true;
    }
  });

  // Session state conversions
  Object.entries(API_KEY_CONVERSIONS.sessionState).forEach(([oldKey, newKey]) => {
    const oldPattern = new RegExp(`st\\.session_state\\.${oldKey}`, 'g');
    const newPattern = `st.session_state.${newKey}`;
    if (content.match(oldPattern)) {
      content = content.replace(oldPattern, newPattern);
      modified = true;
    }
  });

  // Environment variable conversions
  Object.entries(API_KEY_CONVERSIONS.envVars).forEach(([oldVar, newVar]) => {
    const oldPattern = new RegExp(`"${oldVar}"|'${oldVar}'`, 'g');
    const newPattern = `"${newVar}"`;
    if (content.match(oldPattern)) {
      content = content.replace(oldPattern, newPattern);
      modified = true;
    }
  });

  // Special handling for genai.configure (Google only)
  if (content.includes('genai.configure')) {
    content = content.replace(/genai\.configure\([^)]*\)/g, '// OpenAI configured via environment variable');
    modified = true;
  }

  // Update titles and descriptions
  if (content.includes('Gemini') && content.includes('st.title')) {
    content = content.replace(/Gemini/g, 'OpenAI');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Converted ${filePath}`);
    return true;
  } else {
    console.log(`⚪ No changes needed for ${filePath}`);
    return false;
  }
}

function findAppsToConvert() {
  const apps = [];

  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== '__pycache__') {
        scanDirectory(fullPath);
      } else if (item.endsWith('.py')) {
        // Check if this app needs conversion
        const content = fs.readFileSync(fullPath, 'utf-8');

        let framework = null;
        let needsConversion = false;

        // Check for framework usage
        if (content.includes('from agno') || content.includes('import agno')) {
          framework = 'agno';
        } else if (content.includes('from langchain') || content.includes('import langchain')) {
          framework = 'langchain';
        }

        // Check for provider usage that needs conversion
        if (content.includes('from agno.models.google') ||
            content.includes('ChatGoogleGenerativeAI') ||
            content.includes('anthropic.Anthropic') ||
            content.includes('groq.Groq') ||
            content.includes('genai.configure')) {
          needsConversion = true;
        }

        if (framework && needsConversion) {
          const appName = path.basename(path.dirname(fullPath));
          apps.push({
            filePath: fullPath,
            appName,
            framework
          });
        }
      }
    }
  }

  scanDirectory(repoPath);
  return apps;
}

function main() {
  console.log('🚀 AUTOMATED OPENAI CONVERSION SCRIPT\n');

  const appsToConvert = findAppsToConvert();

  console.log(`Found ${appsToConvert.length} apps that need conversion:\n`);

  appsToConvert.forEach(app => {
    console.log(`📁 ${app.appName} (${app.framework}) - ${app.filePath}`);
  });

  console.log('\n🔄 Starting conversions...\n');

  let converted = 0;
  let skipped = 0;

  appsToConvert.forEach(app => {
    try {
      if (convertFile(app.filePath, app.framework)) {
        converted++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`❌ Error converting ${app.filePath}:`, error.message);
    }
  });

  console.log('\n📊 CONVERSION COMPLETE');
  console.log(`✅ Successfully converted: ${converted}`);
  console.log(`⚪ No changes needed: ${skipped}`);
  console.log(`❌ Errors: ${appsToConvert.length - converted - skipped}`);

  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Test the converted apps manually');
  console.log('2. Update app_api_requirements table in Supabase');
  console.log('3. Add iframe integration to VideoRemix dashboard');
  console.log('4. Deploy updated apps');
}

main();