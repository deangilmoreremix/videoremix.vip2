import React, { useState } from 'react';
import { Input, Button, Select, ProgressIndicator } from '../components/ui';

interface aitravelplannermcpagentteamAppProps {}

export const aitravelplannermcpagentteamApp: React.FC<aitravelplannermcpagentteamAppProps> = () => {
  const [input_1, setinput_1] = useState('');
  const [input_2, setinput_2] = useState('');
  const [input_3, setinput_3] = useState('');
  const [input_4, setinput_4] = useState(0);
  const [input_5, setinput_5] = useState(0);
  const [input_6, setinput_6] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/.netlify/functions/Generated Netlify function: ai_travel_planner_mcp_agent_team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_1, input_2, input_3, input_4, input_5, input_6 })
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
      <h1 className="text-2xl font-bold mb-6">ai_travel_planner_mcp_agent_team</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Auto-detected input"
          value={input_1}
          onChange={(e) => setinput_1(e.target.value)}
          placeholder="Enter auto-detected input"
        />
      <Input
          label="Auto-detected input"
          value={input_2}
          onChange={(e) => setinput_2(e.target.value)}
          placeholder="Enter auto-detected input"
        />
      <Input
          label="Auto-detected input"
          value={input_3}
          onChange={(e) => setinput_3(e.target.value)}
          placeholder="Enter auto-detected input"
        />
      <Input
          type="number"
          label="Auto-detected input"
          value={input_4}
          onChange={(e) => setinput_4(Number(e.target.value))}
          placeholder="Enter auto-detected input"
        />
      <Input
          type="number"
          label="Auto-detected input"
          value={input_5}
          onChange={(e) => setinput_5(Number(e.target.value))}
          placeholder="Enter auto-detected input"
        />
      <Input
          label="Auto-detected input"
          value={input_6}
          onChange={(e) => setinput_6(e.target.value)}
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

export default aitravelplannermcpagentteamApp;
