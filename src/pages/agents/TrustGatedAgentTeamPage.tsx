import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";
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
                      placeholder="sk-..."
                      helperText="Your OpenAI API key enables the agent team. Stored locally only."
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
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
                      placeholder="0-100, e.g., '75', '80', '90'"
                      helperText="Agents below this threshold won't be selected. Range: 0-100"
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                  </div>
                </FormSection>

                <FormSection>
                  <div className="space-y-2">
                    <Label htmlFor="_researcher">Researcher Agent *</Label>
                    <SelectDropdown
                      id="_researcher"
                      value={formData._researcher}
                      onChange={(value) => setFormData({ ...formData, _researcher: value })}
                      options={[
                        { value: "researcher-gpt4", label: "GPT-4 Researcher" },
                        { value: "researcher-claude", label: "Claude Researcher" },
                        { value: "researcher-gemini", label: "Gemini Researcher" }
                      ]}
                      placeholder="Select a researcher agent"
                      helperText="The researcher gathers information and facts about your topic"
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                  </div>
                </FormSection>

                <FormSection>
                  <div className="space-y-2">
                    <Label htmlFor="_analyst">Analyst Agent *</Label>
                    <SelectDropdown
                      id="_analyst"
                      value={formData._analyst}
                      onChange={(value) => setFormData({ ...formData, _analyst: value })}
                      options={[
                        { value: "analyst-gpt4", label: "GPT-4 Analyst" },
                        { value: "analyst-claude", label: "Claude Analyst" },
                        { value: "analyst-gemini", label: "Gemini Analyst" }
                      ]}
                      placeholder="Select an analyst agent"
                      helperText="The analyst evaluates data quality and provides insights"
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                  </div>
                </FormSection>

                <FormSection>
                  <div className="space-y-2">
                    <Label htmlFor="_writer">Writer Agent *</Label>
                    <SelectDropdown
                      id="_writer"
                      value={formData._writer}
                      onChange={(value) => setFormData({ ...formData, _writer: value })}
                      options={[
                        { value: "writer-gpt4", label: "GPT-4 Writer" },
                        { value: "writer-claude", label: "Claude Writer" },
                        { value: "writer-gemini", label: "Gemini Writer" }
                      ]}
                      placeholder="Select a writer agent"
                      helperText="The writer creates the final report from research and analysis"
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
                  </div>
                </FormSection>

                <FormSection>
                  <div className="space-y-2">
                    <Label htmlFor="_research_topic">Research Topic *</Label>
                    <SmartInput
                      id="_research_topic"
                      type="text"
                      value={formData._research_topic}
                      onChange={(e) => setFormData({ ...formData, _research_topic: e.target.value })}
                      placeholder="e.g., 'Impact of AI on healthcare in 2026' or 'Climate change solutions'"
                      helperText="The topic the agent team will research, analyze, and report on"
                      className="bg-gray-900/50 border-gray-600 text-white"
                    />
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
                <ResultCard
                  title="Research Transcript"
                  description="The complete agent team research output"
                  icon={<CheckCircle className="h-5 w-5" />}
                  variant="success"
                >
                  <div className="mt-4 p-4 bg-gray-900/50 rounded border border-gray-700">
                    <p className="whitespace-pre-wrap text-sm text-gray-300">{result.result}</p>
                  </div>
                </ResultCard>
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
