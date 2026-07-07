import React, { useState } from 'react';
import { Input, Button, Select, ProgressIndicator } from '../components/ui';

interface PluginsAppProps {}

const TEST_SCENARIOS = [
  { value: 'code_review', label: 'Code Review - Analyze a code snippet for bugs and improvements' },
  { value: 'email_response', label: 'Email Response - Generate a professional reply to a customer email' },
  { value: 'data_analysis', label: 'Data Analysis - Analyze a dataset and extract key insights' },
  { value: 'content_summary', label: 'Content Summary - Summarize a long article or document' },
  { value: 'meeting_notes', label: 'Meeting Notes - Convert meeting transcript into actionable items' },
];

export const PluginsApp: React.FC<PluginsAppProps> = () => {
  const [scenario, setScenario] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const isValid = scenario || message.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutorial-plugins`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ choose_a_test_scenario: scenario, or_enter_your_own_message: message, userId: null }),
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
      <h1 className="text-2xl font-bold mb-6">7 Plugins</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Choose a test scenario"
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          options={[{ value: '', label: 'Select a scenario...' }, ...TEST_SCENARIOS.map((s) => ({ value: s.value, label: s.label }))]}
        />

        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-medium text-gray-200">
            Or enter your own message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your task... e.g., Help me draft a response to a customer complaint about delayed shipping"
            rows={4}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white"
          />
        </div>

        <Button type="submit" disabled={loading || !isValid}>
          {loading ? <ProgressIndicator /> : 'Generate Results'}
        </Button>
      </form>

      {result && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Results</h2>
          <div className="bg-gray-50 p-4 rounded">
            <pre className="whitespace-pre-wrap">{result}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default PluginsApp;
