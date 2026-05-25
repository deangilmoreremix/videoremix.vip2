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
import { Loader2, Sparkles, RefreshCw, Zap, MessageSquare } from "lucide-react";

const GptOssCritiqueImprovementLoopPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ groq_api_key: "", max_improvement_iterations: "3", your_prompt: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('gpt-oss-critique-data');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('gpt-oss-critique-data', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.groq_api_key.trim()) {
      setError("Groq API key is required");
      return;
    }
    if (!formData.your_prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gpt-oss-critique-improvement-loop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem('gpt-oss-critique-data');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ groq_api_key: "", max_improvement_iterations: "3", your_prompt: "" });
    setResult(null);
  };

  return (
    <>
      <Helmet>
        <title>GptOssCritiqueImprovementLoop - VideoRemix.vip</title>
        <meta name="description" content="Use gpt-oss-critique-improvement-loop to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-500 rounded-3xl mb-6">
              <RefreshCw className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Gpt Oss Critique Improvement Loop</h1>
            <p className="text-xl text-gray-400">Iteratively improve your prompts with AI-powered critique and refinement.</p>
          </motion.div>

          {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

          {!result ? (
            <Card className="bg-gray-800/50 border-gray-700 mb-8">
              <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <FormSection title="API Configuration" description="Enter your Groq API key to enable the critique loop">
                    <ApiKeyInput
                      label="Groq API Key"
                      name="groq_api_key"
                      value={formData.groq_api_key}
                      onChange={(val) => setFormData({ ...formData, groq_api_key: val })}
                      helperText="Your key is stored locally and never sent to our servers"
                      required
                    />
                  </FormSection>

                  <FormSection title="Iteration Settings" description="Configure how many improvement cycles to run">
                    <SmartInput
                      label="Max Improvement Iterations"
                      name="max_improvement_iterations"
                      type="number"
                      value={formData.max_improvement_iterations}
                      onChange={(val) => setFormData({ ...formData, max_improvement_iterations: val })}
                      placeholder="3"
                      helperText="More iterations = potentially better results, but takes longer. Range: 1-10"
                      min={1}
                      max={10}
                    />
                  </FormSection>

                  <FormSection title="Your Prompt" description="Enter the prompt you want to improve">
                    <SmartTextarea
                      label="Your Prompt"
                      name="your_prompt"
                      value={formData.your_prompt}
                      onChange={(val) => setFormData({ ...formData, your_prompt: val })}
                      placeholder="Write a Python function that calculates the factorial of a number with error handling"
                      helperText="Be specific about what you want. Include context, constraints, and expected output format."
                      rows={5}
                      required
                    />
                  </FormSection>

                  <div className="flex gap-3 pt-4">
                    <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={!formData.your_prompt.trim()}>
                      <Zap className="h-4 w-4" />
                      Generate Results
                    </ActionButton>
                    <ActionButton variant="ghost" onClick={handleClear} disabled={loading}>
                      Clear
                    </ActionButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : loading ? (
            <LoadingIndicator message="Running critique improvement loop..." subtext="Analyzing and refining your prompt" />
          ) : null}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultGrid columns={2}>
                <ResultCard
                  icon={<Sparkles className="h-5 w-5" />}
                  title="Iterations Completed"
                  value={result.iterations || result.iteration_count || formData.max_improvement_iterations}
                  variant="success"
                />
                <ResultCard
                  icon={<MessageSquare className="h-5 w-5" />}
                  title="Status"
                  value="Completed"
                  variant="success"
                />
              </ResultGrid>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>Improved Result</CardTitle></CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans text-gray-200">{result.result}</pre>
                  </div>
                </CardContent>
              </Card>

              <ActionButton onClick={() => { setResult(null); setFormData({ groq_api_key: formData.groq_api_key, max_improvement_iterations: "3", your_prompt: "" }); }} variant="secondary" className="w-full">
                Start New Analysis
              </ActionButton>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
};

export default GptOssCritiqueImprovementLoopPage;
