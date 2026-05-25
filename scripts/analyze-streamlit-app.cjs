#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Analyze a Streamlit app to extract metadata for conversion
 * Usage: node scripts/analyze-streamlit-app.js <streamlit-app-path>
 */

function analyzeStreamlitApp(appPath) {
  const appName = path.basename(appPath);
  const mainFile = path.join(appPath, 'app.py');

  if (!fs.existsSync(mainFile)) {
    console.error(`Main app.py not found in ${appPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(mainFile, 'utf8');

  // Detect UI type
  let uiType = 'form'; // default
  if (content.includes('st.chat_message') || content.includes('st.chat_input')) {
    uiType = 'chat';
  } else if (content.includes('st.tabs')) {
    uiType = 'tabs';
  }

  // Extract input fields
  const inputFields = [];
  const inputRegex = /st\.(\w+)\([^)]*\)/g;
  let match;
  while ((match = inputRegex.exec(content)) !== null) {
    const inputType = match[1];
    if (['text_input', 'number_input', 'selectbox', 'multiselect', 'slider', 'checkbox', 'radio', 'file_uploader'].includes(inputType)) {
      inputFields.push({
        type: inputType,
        name: `input_${inputFields.length + 1}`,
        label: 'Auto-detected input'
      });
    }
  }

  // Detect AI provider
  let aiProvider = 'openai'; // default
  if (content.includes('import anthropic') || content.includes('Anthropic')) {
    aiProvider = 'anthropic';
  } else if (content.includes('import google') || content.includes('Gemini') || content.includes('palm')) {
    aiProvider = 'google';
  } else if (content.includes('groq')) {
    aiProvider = 'groq';
  }

  // Extract model config (simplified)
  const modelRegex = /(gpt-|claude-|gemini-)/i;
  const modelMatch = content.match(modelRegex);
  const model = modelMatch ? modelMatch[1].toLowerCase() : 'gpt-3.5-turbo';

  // Estimate complexity
  const lines = content.split('\n').length;
  let complexity = 'simple';
  if (lines > 200 || inputFields.length > 5) {
    complexity = 'medium';
  }
  if (content.includes('class ') || content.includes('def ') && lines > 500) {
    complexity = 'complex';
  }

  // Output JSON
  const metadata = {
    appName,
    uiType,
    inputFields,
    outputFormat: uiType === 'chat' ? 'streaming' : 'static',
    aiProvider,
    model,
    complexity,
    sourcePath: appPath
  };

  console.log(JSON.stringify(metadata, null, 2));
}

// Main execution
const appPath = process.argv[2];
if (!appPath) {
  console.error('Usage: node scripts/analyze-streamlit-app.js <streamlit-app-path>');
  process.exit(1);
}

analyzeStreamlitApp(appPath);