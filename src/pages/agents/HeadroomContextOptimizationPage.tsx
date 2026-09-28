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
import { Sliders, CheckCircle2, Zap } from "lucide-react";

const STORAGE_KEY = "headroom-context-optimization";

const HeadroomContextOptimizationPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    contextText: "",
    optimizationGoal: "",
    maxTokens: "4096",
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
    if (!formData.contextText.trim()) {
      setError("Please provide context text to optimize");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/headroom-context-optimization`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            context_text: formData.contextText,
            optimization_goal: formData.optimizationGoal,
            max_context_tokens: formData.maxTokens,
            userId: user?.id,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Optimization failed");
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ openaiApiKey: "", contextText: "", optimizationGoal: "", maxTokens: "4096" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - Headroom Context Optimization</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-600 to-emerald-500 rounded-3xl mb-6">
                <Sliders className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Context Optimized</h1>
              <p className="text-xl text-gray-400">Headroom optimization complete</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<Zap className="h-5 w-5" />}
                title="Tokens Saved"
                value={result.tokensSaved || result.savings || "—"}
                variant="success"
              />
              <ResultCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="Status"
                value="Optimized"
                variant="info"
              />
            </ResultGrid>

            {result.result && (
              <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Optimized Context</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Optimize Another
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
        <title>Headroom Context Optimization - VideoRemix.vip</title>
        <meta name="description" content="Optimize LLM context usage for better performance and lower costs." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-600 to-emerald-500 rounded-3xl mb-6">
              <Sliders className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Headroom Context Optimization</h1>
            <p className="text-xl text-gray-400">Optimize LLM context for performance and cost</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Optimization failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Optimization Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Context Input" description="Provide the context to optimize">
                  <SmartTextarea
                    label="Context Text"
                    name="contextText"
                    value={formData.contextText}
                    onChange={(val) => updateField("contextText", val)}
                    placeholder="Paste the context, prompt, or conversation history..."
                    helperText="The text you want to optimize for token usage"
                    required
                    rows={6}
                  />

                  <SmartInput
                    label="Optimization Goal"
                    name="optimizationGoal"
                    value={formData.optimizationGoal}
                    onChange={(val) => updateField("optimizationGoal", val)}
                    placeholder="reduce tokens, preserve meaning, summarize..."
                    helperText="What should the optimization prioritize"
                  />

                  <SmartInput
                    label="Max Context Tokens"
                    name="maxTokens"
                    value={formData.maxTokens}
                    onChange={(val) => updateField("maxTokens", val)}
                    type="number"
                    placeholder="4096"
                    helperText="Target maximum token count"
                  />
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for context optimization"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.contextText.trim()}
                  >
                    <Sliders className="h-4 w-4" />
                    Optimize Context
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator message="Optimizing context..." subtext="Reducing tokens while preserving meaning" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Sliders className="h-16 w-16 text-gray-600" />}
              title="Ready to optimize"
              description="Paste your context to optimize token usage and improve LLM performance"
              tips={[
                "Longer contexts benefit more from optimization",
                "Specify if you need to preserve specific information",
                "Consider the model's context window limit",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default HeadroomContextOptimizationPage;
