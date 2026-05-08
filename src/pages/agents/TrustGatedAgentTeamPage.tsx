import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2 } from "lucide-react";
import {
  SmartInput,
  SmartTextarea,
  ActionButton,
  ResultCard,
  ResultGrid,
  EmptyState,
  LoadingIndicator,
  ErrorMessage,
  FormSection,
  ApiKeyInput,
  SelectDropdown,
} from "@/components/agent-ui";

const STORAGE_KEY = "trust-gated-agent-team-form";

const TrustGatedAgentTeamPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { openai_api_key: "", minimum_trust_score: "", _researcher: "", _analyst: "", _writer: "", _research_topic: "" };
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trust-gated-agent-team`, {
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
        <title>TrustGatedAgentTeam - VideoRemix.vip</title>
        <meta name="description" content="Use trust-gated-agent-team to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Trust Gated Agent Team</h1>
            <p className="text-xl text-gray-400">AI-powered trust gated agent team.</p>
          </motion.div>

          {error && <ErrorMessage message={error} className="mb-6" />}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Input</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection>
                  <div className="space-y-2">
                    <Label htmlFor="openai_api_key">OpenAI API Key *</Label>
                    <ApiKeyInput
                      id="openai_api_key"
                      value={formData.openai_api_key}
                      onChange={(value) => setFormData({ ...formData, openai_api_key: value })}
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                    <p className="text-sm text-gray-400">Enter your OpenAI API key to enable AI-powered processing.</p>
                  </div>
                </FormSection>

                <FormSection>
                  <div className="space-y-2">
                    <Label htmlFor="minimum_trust_score">Minimum Trust Score *</Label>
                    <SmartInput
                      id="minimum_trust_score"
                      type="number"
                      value={formData.minimum_trust_score}
                      onChange={(e) => setFormData({ ...formData, minimum_trust_score: e.target.value })}
                      placeholder="0-100, e.g., '75'"
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                    <p className="text-sm text-gray-400">Set the minimum trust score threshold (0-100) for agent selection.</p>
                  </div>
                </FormSection>

                <FormSection>
                  <div className="space-y-2">
                    <Label htmlFor="_researcher">🔍 Researcher *</Label>
                    <SelectDropdown
                      id="_researcher"
                      value={formData._researcher}
                      onChange={(value) => setFormData({ ...formData, _researcher: value })}
                      options={[{ value: "", label: "Select a researcher" }]}
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                    <p className="text-sm text-gray-400">Choose the researcher agent for information gathering.</p>
                  </div>
                </FormSection>

                <FormSection>
                  <div className="space-y-2">
                    <Label htmlFor="_analyst">📊 Analyst *</Label>
                    <SelectDropdown
                      id="_analyst"
                      value={formData._analyst}
                      onChange={(value) => setFormData({ ...formData, _analyst: value })}
                      options={[{ value: "", label: "Select an analyst" }]}
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                    <p className="text-sm text-gray-400">Choose the analyst agent for data analysis.</p>
                  </div>
                </FormSection>

                <FormSection>
                  <div className="space-y-2">
                    <Label htmlFor="_writer">✍️ Writer *</Label>
                    <SelectDropdown
                      id="_writer"
                      value={formData._writer}
                      onChange={(value) => setFormData({ ...formData, _writer: value })}
                      options={[{ value: "", label: "Select a writer" }]}
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                    <p className="text-sm text-gray-400">Choose the writer agent for content creation.</p>
                  </div>
                </FormSection>

                <FormSection>
                  <div className="space-y-2">
                    <Label htmlFor="_research_topic">🔎 Research topic *</Label>
                    <SmartInput
                      id="_research_topic"
                      type="text"
                      value={formData._research_topic}
                      onChange={(e) => setFormData({ ...formData, _research_topic: e.target.value })}
                      placeholder="Enter your research topic"
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                    <p className="text-sm text-gray-400">Specify the topic you want the agent team to research.</p>
                  </div>
                </FormSection>

                <ActionButton type="submit" loading={loading} className="w-full">
                  {loading ? 'Processing...' : 'Generate Results'}
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator text="Processing..." />
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <ResultGrid>
                <ResultCard title="Transcript" content={result.result} />
              </ResultGrid>
            </motion.div>
          )}

          {!result && !loading && !error && (
            <EmptyState message="No results yet. Submit the form to generate results." />
          )}
        </div>
      </main>
    </>
  );
};

export default TrustGatedAgentTeamPage;
