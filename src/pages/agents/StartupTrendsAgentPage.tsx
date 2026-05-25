import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Sparkles } from "lucide-react";
import { SmartInput } from "../../components/agent-ui/SmartInput";
import { ActionButton } from "../../components/agent-ui/ActionButton";
import { ResultCard } from "../../components/agent-ui/ResultCard";
import { EmptyState } from "../../components/agent-ui/EmptyState";
import { LoadingIndicator } from "../../components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "../../components/agent-ui/ErrorMessage";
import { FormSection } from "../../components/agent-ui/FormSection";
import { ExamplePrompt } from "../../components/agent-ui/ExamplePrompt";
import { Label } from "../../components/ui/label";

const STORAGE_KEY = "startupTrendsAgentForm";

const EXAMPLE_PROMPTS = [
  "AI healthcare startups in 2026",
  "Sustainable energy solutions for emerging markets",
  "Fintech innovations in Southeast Asia",
  "Climate tech ventures focusing on carbon capture",
];

const StartupTrendsAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ enter_the_area_of_interest_for_your_startup: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleExampleSelect = (example: string) => {
    setFormData({ enter_the_area_of_interest_for_your_startup: example });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/startup-trends-agent-`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>StartupTrendsAgent - VideoRemix.vip</title>
        <meta name="description" content="Use startup-trends-agent- to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Startup Trends Agent</h1>
            <p className="text-xl text-gray-400">AI-powered startup trends agent.</p>
          </motion.div>

          {error && <ErrorMessage message={error} className="mb-6" />}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Input</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection
                  title="Enter the area of interest for your Startup"
                  helperText="Describe the industry, technology, or market segment you want to research. For example: 'AI healthcare startups in 2026' or 'Sustainable energy solutions for emerging markets'. A well-defined research topic helps generate more actionable insights."
                >
                  <SmartInput
                    id="enter_the_area_of_interest_for_your_startup"
                    type="text"
                    value={formData.enter_the_area_of_interest_for_your_startup}
                    onChange={(e) => setFormData({ ...formData, enter_the_area_of_interest_for_your_startup: e.target.value })}
                    placeholder="e.g., 'AI healthcare startups in 2026' or 'Sustainable energy solutions for emerging markets'"
                    className="bg-gray-900/50 border-gray-600 text-white"
                  />
                </FormSection>

                <ActionButton
                  type="submit"
                  loading={loading}
                  disabled={loading || !formData.enter_the_area_of_interest_for_your_startup.trim()}
                  className="w-full"
                >
                  {loading ? 'Processing...' : 'Generate Results'}
                </ActionButton>
              </form>

              <ExamplePrompt
                examples={EXAMPLE_PROMPTS}
                onSelect={handleExampleSelect}
                className="mt-6"
              />
            </CardContent>
          </Card>

          {loading && <LoadingIndicator message="Analyzing startup trends..." />}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <ResultCard
                title="Research Results"
                timestamp={result.created_at}
              >
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-300 mb-2 block">Transcript</Label>
                    <div className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans">
                      {result.result}
                    </div>
                  </div>
                </div>
              </ResultCard>
            </motion.div>
          )}

          {!result && !loading && !error && (
            <EmptyState
              title="No Results Yet"
              description="Enter a research topic above and click 'Generate Results' to discover startup trends."
              icon={Sparkles}
              tips={[
                "Try 'AI healthcare startups in 2026'",
                "Explore 'Sustainable energy solutions'",
                "Research 'Fintech innovations in Southeast Asia'",
                "Discover 'Climate tech ventures focusing on carbon capture'"
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default StartupTrendsAgentPage;