import React, { useState, useEffect } from 'react';
import { Input, Button, Select, ProgressIndicator } from '../components/ui';

interface ChatWithTarotsAppProps {}

const CARD_OPTIONS = [
  { value: '3', label: '3 Cards - Celtic Cross (focused insight)' },
  { value: '7', label: '7 Cards - General Overview' },
  { value: '1', label: '1 Card - Daily Quick Read' },
];

export const chatwithtarotsApp: React.FC<ChatWithTarotsAppProps> = () => {
  const [cardCount, setCardCount] = useState('3');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!context.trim()) return;
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-tarots`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ card_count: cardCount, context, userId: null }),
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
      <h1 className="text-2xl font-bold mb-6">Chat With Tarots</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Number of Cards"
          value={cardCount}
          onChange={(e) => setCardCount(e.target.value)}
          options={CARD_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
        />

        <div className="space-y-2">
          <label htmlFor="context" className="text-sm font-medium text-gray-200">
            Your Question or Context
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g., What does the universe have in store for me regarding my career?"
            rows={5}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white"
          />
        </div>

        <Button type="submit" disabled={loading || !context.trim()}>
          {loading ? <ProgressIndicator /> : 'Draw the Cards'}
        </Button>
      </form>

      {result && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Tarot Reading</h2>
          <div className="bg-gray-50 p-4 rounded">
            <pre className="whitespace-pre-wrap">{result}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default chatwithtarotsApp;
