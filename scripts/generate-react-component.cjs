#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Generate React component from Streamlit metadata
 * Usage: node scripts/generate-react-component.ts <metadata-json> <function-name>
 */

function generateReactComponent(metadata, functionName) {
  const { appName, uiType, inputFields, outputFormat } = metadata;

  const componentName = appName.replace(/[^a-zA-Z0-9]/g, '') + 'App';
  const componentFile = `${componentName}.tsx`;

  // Generate form inputs
  const formInputs = inputFields.map(field => {
    const inputType = field.type.replace('st.', '');
    let jsx = '';

    switch (inputType) {
      case 'text_input':
        jsx = `<Input
          label="${field.label}"
          value={${field.name}}
          onChange={(e) => set${field.name}(e.target.value)}
          placeholder="Enter ${field.label.toLowerCase()}"
        />`;
        break;
      case 'number_input':
        jsx = `<Input
          type="number"
          label="${field.label}"
          value={${field.name}}
          onChange={(e) => set${field.name}(Number(e.target.value))}
          placeholder="Enter ${field.label.toLowerCase()}"
        />`;
        break;
      case 'selectbox':
        jsx = `<Select
          label="${field.label}"
          value={${field.name}}
          onChange={set${field.name}}
          options={[]} // TODO: Add options
        />`;
        break;
      default:
        jsx = `<Input
          label="${field.label}"
          value={${field.name}}
          onChange={(e) => set${field.name}(e.target.value)}
        />`;
    }

    return jsx;
  }).join('\n      ');

  // Generate state variables
  const stateVars = inputFields.map(field =>
    `  const [${field.name}, set${field.name}] = useState(${field.type === 'number_input' ? '0' : "''"});`
  ).join('\n');

  // Generate submit handler
  const submitData = `{ ${inputFields.map(f => `${f.name}`).join(', ')} }`;

  // Generate component
  const component = `import React, { useState } from 'react';
import { Input, Button, Select, ProgressIndicator } from '../components/ui';

interface ${componentName}Props {}

export const ${componentName}: React.FC<${componentName}Props> = () => {
${stateVars}
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/.netlify/functions/${functionName}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(${submitData})
      });

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">${appName}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        ${formInputs}

        <Button type="submit" disabled={loading}>
          {loading ? <ProgressIndicator /> : 'Generate'}
        </Button>
      </form>

      {result && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Result</h2>
          <div className="bg-gray-50 p-4 rounded">
            <pre className="whitespace-pre-wrap">{result}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ${componentName};
`;

  // Write component
  const componentsDir = 'src/components/apps';
  if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir, { recursive: true });
  }

  fs.writeFileSync(path.join(componentsDir, componentFile), component);
  console.log(`Generated React component: ${componentFile}`);
}

// Main execution
const metadataJson = process.argv[2];
const functionName = process.argv[3];

if (!metadataJson || !functionName) {
  console.error('Usage: node scripts/generate-react-component.ts <metadata-json> <function-name>');
  process.exit(1);
}

const metadata = JSON.parse(metadataJson);
generateReactComponent(metadata, functionName);