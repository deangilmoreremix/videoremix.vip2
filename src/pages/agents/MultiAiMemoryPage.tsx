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
import { Loader2, Sparkles, Brain, MessageSquare, Key } from "lucide-react";

const MultiAiMemoryPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ enter_openai_api_key: "", enter_anthropic_api_key: "", ask_the_ai: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('multi-ai-memory-data');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('multi-ai-memory-data', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.enter_openai_api_key.trim()) {
      setError("OpenAI API key is required");
      return;
    }
    if (!formData.enter_anthropic_api_key.trim()) {
      setError("Anthropic API key is required");
      return;
    }
    if (!formData.ask_the_ai.trim()) {
      setError("Please enter your question");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/multi-ai-memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem('multi-ai-memory-data');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ enter_openai_api_key: "", enter_anthropic_api_key: "", ask_the_ai: "" });
    setResult(null);
  };

  return (
    <>
      <Helmet>
        <title>MultiAiMemory - VideoRemix.vip</title>
        <meta name="description" content="Use multi-ai-memory to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-500 rounded-3xl mb-6">
              <Brain className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Multi AI Memory</h1>
            <p className="text-xl text-gray-400">Leverage multiple AI models with shared memory for complex reasoning.</p>
          </motion.div>

          {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

          {!result ? (
            <Card className="bg-gray-800/50 border-gray-700 mb-8">
              <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <FormSection title="API Keys" description="Enter your API keys for OpenAI and Anthropic">
                    <ApiKeyInput
                      label="OpenAI API Key"
                      name="enter_openai_api_key"
                      value={formData.enter_openai_api_key}
                      onChange={(val) => setFormData({ ...formData, enter_openai_api_key: val })}
                      helperText="Your key is stored locally and never sent to our servers"
                      required
                    />
                    
                    <ApiKeyInput
                      label="Anthropic API Key"
                      name="enter_anthropic_api_key"
                      value={formData.enter_anthropic_api_key}
                      onChange={(val) => setFormData({ ...formData, enter_anthropic_api_key: val })}
                      helperText="Your key is stored locally and never sent to our servers"
                      required
                    />
                  </FormSection>

                  <FormSection title="Your Question" description="Ask a question that benefits from multi-model analysis">
                    <SmartTextarea
                      label="Ask the AI"
                      name="ask_the_ai"
                      value={formData.ask_the_ai}
                      onChange={(val) => setFormData({ ...formData, ask_the_ai: val })}
                      placeholder="Compare and contrast the approaches of GPT-4 and Claude to reasoning about complex mathematical problems"
                      helperText="Questions that benefit from multiple perspectives work best. The agents will collaborate for a comprehensive answer."
                      rows={5}
                      required
                    />
                  </FormSection>

                  <div className="flex gap-3 pt-4">
                    <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={!formData.ask_the_ai.trim()}>
                      <Sparkles className="h-4 w-4" />
                      Get Multi-Model Answer
                    </ActionButton>
                    <ActionButton variant="ghost" onClick={handleClear} disabled={loading}>
                      Clear
                    </ActionButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : loading ? (
            <LoadingIndicator message="Running multi-AI analysis..." subtext="Multiple models are processing your question" />
          ) : null}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultGrid columns={2}>
                <ResultCard
                  icon={<Brain className="h-5 w-5" />}
                  title="Models Used"
                  value={result.model_count || "Multiple"}
                  subtext="Collaborative reasoning"
                />
                <ResultCard
                  icon={<MessageSquare className="h-5 w-5" />}
                  title="Status"
                  value="Completed"
                  variant="success"
                />
              </ResultGrid>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>Multi-AI Response</CardTitle></CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans text-gray-200">{result.result}</pre>
                  </div>
                </CardContent>
              </Card>

              <ActionButton onClick={() => { setResult(null); setFormData({ enter_openai_api_key: formData.enter_openai_api_key, enter_anthropic_api_key: formData.enter_anthropic_api_key, ask_the_ai: "" }); }} variant="secondary" className="w-full">
                Ask Another Question
              </ActionButton>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
};

export default MultiAiMemoryPage;
