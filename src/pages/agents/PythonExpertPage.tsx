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
import { FileCode, CheckCircle2, Zap } from "lucide-react";

const STORAGE_KEY = "python-expert-agent";

const PythonExpertPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    taskDescription: "",
    codeSnippet: "",
    libraries: "",
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
    if (!formData.taskDescription.trim()) {
      setError("Please describe your Python task");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/python-expert`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            describe_your_python_task: formData.taskDescription,
            existing_code_if_any: formData.codeSnippet,
            preferred_libraries_or_frameworks: formData.libraries,
            userId: user?.id,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ openaiApiKey: "", taskDescription: "", codeSnippet: "", libraries: "" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - Python Expert</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-600 to-green-500 rounded-3xl mb-6">
                <FileCode className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Python Analysis Complete</h1>
              <p className="text-xl text-gray-400">AI-powered Python solution ready</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="Status"
                value="Complete"
                variant="success"
              />
              <ResultCard
                icon={<Zap className="h-5 w-5" />}
                title="Solution"
                value="Ready"
                variant="info"
              />
            </ResultGrid>

            {result.result && (
              <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Python Solution</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Solve Another Task
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
        <title>Python Expert - VideoRemix.vip</title>
        <meta name="description" content="AI-powered Python programming assistant for code generation, debugging, and optimization." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-600 to-green-500 rounded-3xl mb-6">
              <FileCode className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Python Expert</h1>
            <p className="text-xl text-gray-400">AI-powered Python programming assistant</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Analysis failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Python Task Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Task Details" description="Describe what you need help with">
                  <SmartTextarea
                    label="Task Description"
                    name="taskDescription"
                    value={formData.taskDescription}
                    onChange={(val) => updateField("taskDescription", val)}
                    placeholder="Describe your Python task or problem..."
                    helperText="Be specific about what you want to accomplish"
                    required
                    rows={4}
                  />

                  <SmartTextarea
                    label="Existing Code (Optional)"
                    name="codeSnippet"
                    value={formData.codeSnippet}
                    onChange={(val) => updateField("codeSnippet", val)}
                    placeholder="Paste your existing Python code if applicable..."
                    helperText="Include any code you already have"
                    rows={4}
                  />

                  <SmartInput
                    label="Preferred Libraries"
                    name="libraries"
                    value={formData.libraries}
                    onChange={(val) => updateField("libraries", val)}
                    placeholder="pandas, numpy, requests, etc."
                    helperText="Specific libraries you want to use or avoid"
                  />
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for AI-powered Python assistance"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.taskDescription.trim()}
                  >
                    <FileCode className="h-4 w-4" />
                    Get Python Solution
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator message="Analyzing Python task..." subtext="Generating optimized solution" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<FileCode className="h-16 w-16 text-gray-600" />}
              title="Ready to code"
              description="Describe your Python task and get AI-powered solutions and explanations"
              tips={[
                "Include expected input and output formats",
                "Mention performance requirements if relevant",
                "Specify Python version compatibility if needed",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default PythonExpertPage;
