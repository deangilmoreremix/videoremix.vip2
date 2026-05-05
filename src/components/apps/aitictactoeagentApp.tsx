import React, { useState } from 'react';
import { Input, Button, Select, ProgressIndicator } from '../components/ui';

interface aitictactoeagentAppProps {}

export const aitictactoeagentApp: React.FC<aitictactoeagentAppProps> = () => {
  const [input_1, setinput_1] = useState('');
  const [input_2, setinput_2] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/.netlify/functions/Generated Netlify function: ai_tic_tac_toe_agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_1, input_2 })
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
      <h1 className="text-2xl font-bold mb-6">ai_tic_tac_toe_agent</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Auto-detected input"
          value={input_1}
          onChange={setinput_1}
          options={[]} // TODO: Add options
        />
      <Select
          label="Auto-detected input"
          value={input_2}
          onChange={setinput_2}
          options={[]} // TODO: Add options
        />

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

export default aitictactoeagentApp;
