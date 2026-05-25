import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput, SmartTextarea, ActionButton, ResultCard, ResultGrid, EmptyState, LoadingIndicator, ErrorMessage, FormSection } from "@/components/agent-ui";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { Sparkles, Search } from "lucide-react";

const STORAGE_KEY = "research-agent-gemini-form";

const ResearchAgentGeminiInteractionApiPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ _google_api_key: "", _research_goal: "" });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/research-agent-gemini-interaction-api`, {
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
        <title>ResearchAgentGeminiInteractionApi - VideoRemix.vip</title>
        <meta name="description" content="Use research-agent-gemini-interaction-api to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Research Agent Gemini Interaction Api</h1>
            <p className="text-xl text-gray-400">AI-powered research agent gemini interaction api.</p>
          </motion.div>

          {error && (
            <ErrorMessage
              message={error}
              onRetry={() => {
                setError(null);
                handleSubmit(new Event('submit') as any);
              }}
            />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Input</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="API Configuration" description="Enter your Google API key for authentication">
                  <div className="space-y-2">
                    <Label htmlFor="_google_api_key">Google API Key *</Label>
                    <ApiKeyInput
                      id="_google_api_key"
                      value={formData._google_api_key}
                      onChange={(e) => setFormData({ ...formData, _google_api_key: e.target.value })}
                      placeholder="Enter your Google API key"
                    />
                    <p className="text-sm text-gray-400">Your Google API key is stored locally and never sent to our servers.</p>
                  </div>
                </FormSection>

                <FormSection title="Research Parameters" description="Define what you want to research">
                  <div className="space-y-2">
                    <Label htmlFor="_research_goal">Research Goal *</Label>
                    <SmartTextarea
                      id="_research_goal"
                      value={formData._research_goal}
                      onChange={(e) => setFormData({ ...formData, _research_goal: e.target.value })}
                      placeholder="e.g., 'Research the latest developments in quantum computing and their market implications'"
                      className="min-h-[120px]"
                    />
                    <p className="text-sm text-gray-400">Describe your research objective in detail for best results.</p>
                  </div>
                </FormSection>

                <ActionButton
                  type="submit"
                  loading={loading}
                  disabled={loading || !formData._google_api_key || !formData._research_goal}
                  className="w-full"
                >
                  {loading ? 'Processing...' : 'Generate Results'}
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && <LoadingIndicator text="Processing your research request..." />}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <ResultGrid columns={1}>
                <ResultCard
                  title="Research Results"
                  description={result.result}
                  timestamp={new Date().toISOString()}
                  icon={<Sparkles className="h-5 w-5" />}
                  variant="success"
                />
              </ResultGrid>
            </motion.div>
          )}

          {!loading && !result && !error && (
            <EmptyState
              title="No Results Yet"
              description="Submit the form above to generate research results."
              icon={<Search className="h-12 w-12 text-gray-400" />}
              tips={[
                "Enter your Google API key for authentication",
                "Describe your research goal in detail",
                "Be specific about what you want to discover",
                "Include any constraints or parameters"
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default ResearchAgentGeminiInteractionApiPage;