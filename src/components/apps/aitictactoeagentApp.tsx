import React, { useState } from 'react';
import { Input, Button, Select, ProgressIndicator } from '../components/ui';

interface AiTicTacToeAgentAppProps {}

const STRATEGY_OPTIONS = [
  { value: 'balanced', label: 'Balanced - Mix of offense and defense' },
  { value: 'aggressive', label: 'Aggressive - Prioritize winning moves' },
  { value: 'defensive', label: 'Defensive - Block your moves first' },
];

export const aitictactoeagentApp: React.FC<AiTicTacToeAgentAppProps> = () => {
  const [strategy, setStrategy] = useState('balanced');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tic-tac-toe-agent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ strategy, difficulty, userId: null }),
        }
      );

      const data = await response.json();
      setResult(data.result || '');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">AI Tic Tac Toe Agent</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="AI Strategy"
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          options={STRATEGY_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
        />

        <Select
          label="Difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          options={[
            { value: 'easy', label: 'Easy - Make occasional mistakes' },
            { value: 'medium', label: 'Medium - Challenging but beatable' },
            { value: 'hard', label: 'Hard - Nearly unbeatable' },
          ]}
        />

        <Button type="submit" disabled={loading}>
          {loading ? <ProgressIndicator /> : 'Start Game'}
        </Button>
      </form>

      {result && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Game Result</h2>
          <div className="bg-gray-50 p-4 rounded">
            <pre className="whitespace-pre-wrap">{result}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default aitictactoeagentApp;
