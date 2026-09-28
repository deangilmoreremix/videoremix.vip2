import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { FormSection } from "@/components/agent-ui/FormSection";
import { Network, MessageSquare, CheckCircle2 } from "lucide-react";

const STORAGE_KEY = "multi-llm-memory";

const MultiLlmMemoryPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    query: "",
    models: "",
    comparisonFocus: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.query.trim()) {
      setError("Please enter a query");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/multi-llm-memory`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            your_query: formData.query,
            models_to_compare: formData.models,
            comparison_focus: formData.comparisonFocus,
            userId: user?.id,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Comparison failed");
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ openaiApiKey: "", query: "", models: "", comparisonFocus: "" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - Multi LLM Memory</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-500 rounded-3xl mb-6">
                <Network className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Multi-LLM Comparison Complete</h1>
              <p className="text-xl text-gray-400">Cross-model memory and response analysis ready</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<MessageSquare className="h-5 w-5" />}
                title="Models Compared"
                value={result.modelsCompared || result.models?.length || "Multiple"}
              />
              <ResultCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="Status"
                value="Complete"
                variant="success"
              />
            </ResultGrid>

            {result.result && (
              <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Comparison Results</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Run Another Comparison
              </ActionButton>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Multi LLM Memory - VideoRemix.vip</title>
        <meta name="description" content="Compare multiple LLM responses with memory-aware context." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-500 rounded-3xl mb-6">
              <Network className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Multi LLM Memory</h1>
            <p className="text-xl text-gray-400">Compare multiple LLMs with memory-aware context</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Comparison failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Multi-LLM Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Query" description="What do you want to compare">
                  <SmartTextarea
                    label="Your Query"
                    name="query"
                    value={formData.query}
                    onChange={(val) => updateField("query", val)}
                    placeholder="Enter a question or task to compare across LLMs..."
                    helperText="Be specific for meaningful cross-model comparison"
                    required
                    rows={4}
                  />

                  <SmartInput
                    label="Models to Compare"
                    name="models"
                    value={formData.models}
                    onChange={(val) => updateField("models", val)}
                    placeholder="gpt-4o, claude-3.5-sonnet, gemini-pro..."
                    helperText="Comma-separated model identifiers"
                  />

                  <SmartInput
                    label="Comparison Focus"
                    name="comparisonFocus"
                    value={formData.comparisonFocus}
                    onChange={(val) => updateField("comparisonFocus", val)}
                    placeholder="accuracy, creativity, reasoning..."
                    helperText="What aspect to focus the comparison on"
                  />
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for multi-LLM memory comparison"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.query.trim()}
                  >
                    <Network className="h-4 w-4" />
                    Compare Models
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator message="Comparing LLMs..." subtext="Running memory-aware comparisons across models" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Network className="h-16 w-16 text-gray-600" />}
              title="Ready to compare"
              description="Enter a query to compare responses across multiple LLMs with memory context"
              tips={[
                "Use the same query across different models",
                "Compare responses for accuracy and relevance",
                "Memory context helps personalize each model's response",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default MultiLlmMemoryPage;
