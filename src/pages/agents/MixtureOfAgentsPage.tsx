import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, Brain, Key } from "lucide-react";

const MixtureOfAgentsPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ enter_your_together_api_key: "", enter_your_question: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('mixture-of-agents-data');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mixture-of-agents-data', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.enter_your_together_api_key.trim()) {
      setError("Together API key is required");
      return;
    }
    if (!formData.enter_your_question.trim()) {
      setError("Please enter your question");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mixture-of-agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem('mixture-of-agents-data');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ enter_your_together_api_key: "", enter_your_question: "" });
    setResult(null);
  };

  return (
    <>
      <Helmet>
        <title>MixtureOfAgents - VideoRemix.vip</title>
        <meta name="description" content="Use mixture-of-agents to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-pink-500 rounded-3xl mb-6">
              <Brain className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Mixture of Agents</h1>
            <p className="text-xl text-gray-400">Leverage multiple AI agents for enhanced reasoning and answers.</p>
          </motion.div>

          {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

          {!result ? (
            <Card className="bg-gray-800/50 border-gray-700 mb-8">
              <CardHeader><CardTitle>Agent Configuration</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <FormSection title="API Configuration" description="Enter your Together API key">
                    <ApiKeyInput
                      label="Together API Key"
                      name="enter_your_together_api_key"
                      value={formData.enter_your_together_api_key}
                      onChange={(val) => setFormData({ ...formData, enter_your_together_api_key: val })}
                      helperText="Your key is stored locally and never sent to our servers"
                      required
                    />
                  </FormSection>

                  <FormSection title="Your Question" description="Ask anything and let multiple agents collaborate on the answer">
                    <SmartTextarea
                      label="Your Question"
                      name="enter_your_question"
                      value={formData.enter_your_question}
                      onChange={(val) => setFormData({ ...formData, enter_your_question: val })}
                      placeholder="What are the pros and cons of remote work vs office work for software engineers?"
                      helperText="Complex questions work best. Multiple agents will analyze from different angles."
                      rows={5}
                      required
                    />
                  </FormSection>

                  <div className="flex gap-3 pt-4">
                    <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={!formData.enter_your_question.trim()}>
                      <Sparkles className="h-4 w-4" />
                      Get Multi-Agent Answer
                    </ActionButton>
                    <ActionButton variant="ghost" onClick={handleClear} disabled={loading}>
                      Clear
                    </ActionButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : loading ? (
            <LoadingIndicator message="Running multi-agent analysis..." subtext="Multiple agents are collaborating on your question" />
          ) : null}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultGrid columns={2}>
                <ResultCard
                  icon={<Brain className="h-5 w-5" />}
                  title="Agents Used"
                  value={result.agent_count || "Multiple"}
                  subtext="Collaborative analysis"
                />
                <ResultCard
                  icon={<Sparkles className="h-5 w-5" />}
                  title="Status"
                  value="Completed"
                  variant="success"
                />
              </ResultGrid>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>Multi-Agent Response</CardTitle></CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans text-gray-200">{result.result}</pre>
                  </div>
                </CardContent>
              </Card>

              <ActionButton onClick={() => { setResult(null); setFormData({ enter_your_together_api_key: formData.enter_your_together_api_key, enter_your_question: "" }); }} variant="secondary" className="w-full">
                Ask Another Question
              </ActionButton>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
};

export default MixtureOfAgentsPage;
