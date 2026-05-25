import React, { useState } from 'react';
import { Input, Button, Select, ProgressIndicator } from '../components/ui';

interface chatwithtarotsAppProps {}

export const chatwithtarotsApp: React.FC<chatwithtarotsAppProps> = () => {
  const [input_1, setinput_1] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/.netlify/functions/Generated Netlify function: chat_with_tarots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_1 })
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
      <h1 className="text-2xl font-bold mb-6">chat-with-tarots</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Auto-detected input"
          value={input_1}
          onChange={setinput_1}
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

export default chatwithtarotsApp;
