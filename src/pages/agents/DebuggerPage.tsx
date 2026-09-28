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
import { Bug, CheckCircle2, AlertTriangle } from "lucide-react";

const STORAGE_KEY = "debugger-agent";

const DebuggerPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    codeSnippet: "",
    errorDescription: "",
    language: "",
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
    if (!formData.codeSnippet.trim() || !formData.errorDescription.trim()) {
      setError("Please provide both a code snippet and error description");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/debugger`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            paste_your_code_snippet: formData.codeSnippet,
            describe_the_error_or_issue: formData.errorDescription,
            programming_language: formData.language,
            userId: user?.id,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Debugging failed");
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ openaiApiKey: "", codeSnippet: "", errorDescription: "", language: "" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Debug Results - Debugger</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-orange-500 rounded-3xl mb-6">
                <Bug className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Debug Analysis Complete</h1>
              <p className="text-xl text-gray-400">AI-powered debugging insights ready</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="Status"
                value="Completed"
                variant="success"
              />
              <ResultCard
                icon={<AlertTriangle className="h-5 w-5" />}
                title="Issues Found"
                value={result.issues?.length || result.count || 1}
                variant="warning"
              />
            </ResultGrid>

            {result.result && (
              <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Debug Analysis</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Debug Another
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
        <title>Debugger - VideoRemix.vip</title>
        <meta name="description" content="AI-powered code debugging assistant that analyzes errors and suggests fixes." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-orange-500 rounded-3xl mb-6">
              <Bug className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Debugger</h1>
            <p className="text-xl text-gray-400">AI-powered code debugging and error analysis</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Debugging failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Debug Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Code Input" description="Paste your code and error details">
                  <SmartTextarea
                    label="Code Snippet"
                    name="codeSnippet"
                    value={formData.codeSnippet}
                    onChange={(val) => updateField("codeSnippet", val)}
                    placeholder="Paste the code that is causing the issue..."
                    helperText="Include the relevant code section with the error"
                    required
                    rows={6}
                  />

                  <SmartInput
                    label="Programming Language"
                    name="language"
                    value={formData.language}
                    onChange={(val) => updateField("language", val)}
                    placeholder="javascript, python, java, etc."
                    helperText="Specify the programming language for accurate analysis"
                  />

                  <SmartTextarea
                    label="Error Description"
                    name="errorDescription"
                    value={formData.errorDescription}
                    onChange={(val) => updateField("errorDescription", val)}
                    placeholder="Describe the error or unexpected behavior..."
                    helperText="Include error messages, stack traces, or describe what went wrong"
                    required
                    rows={4}
                  />
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for AI-powered code analysis"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.codeSnippet.trim() || !formData.errorDescription.trim()}
                  >
                    <Bug className="h-4 w-4" />
                    Debug Code
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator message="Analyzing code..." subtext="Identifying issues and suggesting fixes" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Bug className="h-16 w-16 text-gray-600" />}
              title="Ready to debug"
              description="Paste your code and describe the error to get AI-powered debugging insights"
              tips={[
                "Include the full error message or stack trace",
                "Paste the minimum code needed to reproduce the issue",
                "Specify the programming language for better analysis",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default DebuggerPage;
