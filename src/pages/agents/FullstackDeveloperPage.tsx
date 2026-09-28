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
import { Code2, Layers, CheckCircle2 } from "lucide-react";

const STORAGE_KEY = "fullstack-developer-agent";

const FullstackDeveloperPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    projectDescription: "",
    techStack: "",
    requirements: "",
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
    if (!formData.projectDescription.trim() || !formData.requirements.trim()) {
      setError("Please provide project description and requirements");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fullstack-developer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            describe_your_project: formData.projectDescription,
            preferred_tech_stack: formData.techStack,
            key_requirements_and_features: formData.requirements,
            userId: user?.id,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ openaiApiKey: "", projectDescription: "", techStack: "", requirements: "" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - Fullstack Developer</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl mb-6">
                <Code2 className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Fullstack Architecture Ready</h1>
              <p className="text-xl text-gray-400">AI-generated fullstack implementation plan</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<Layers className="h-5 w-5" />}
                title="Architecture"
                value="Generated"
                variant="success"
              />
              <ResultCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="Status"
                value="Complete"
                variant="info"
              />
            </ResultGrid>

            {result.result && (
              <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Implementation Plan</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Start New Project
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
        <title>Fullstack Developer - VideoRemix.vip</title>
        <meta name="description" content="AI-powered fullstack development assistant for building complete applications." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl mb-6">
              <Code2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Fullstack Developer</h1>
            <p className="text-xl text-gray-400">AI-powered fullstack application development</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Generation failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Project Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Project Details" description="Describe your application">
                  <SmartTextarea
                    label="Project Description"
                    name="projectDescription"
                    value={formData.projectDescription}
                    onChange={(val) => updateField("projectDescription", val)}
                    placeholder="Describe your fullstack application idea..."
                    helperText="What problem does your app solve? Who is it for?"
                    required
                    rows={4}
                  />

                  <SmartInput
                    label="Tech Stack"
                    name="techStack"
                    value={formData.techStack}
                    onChange={(val) => updateField("techStack", val)}
                    placeholder="React, Node.js, PostgreSQL, etc."
                    helperText="Preferred technologies or leave blank for recommendations"
                  />

                  <SmartTextarea
                    label="Key Requirements"
                    name="requirements"
                    value={formData.requirements}
                    onChange={(val) => updateField("requirements", val)}
                    placeholder="List key features and requirements..."
                    helperText="Authentication, database, API endpoints, UI components, etc."
                    required
                    rows={4}
                  />
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for AI-powered code generation"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.projectDescription.trim() || !formData.requirements.trim()}
                  >
                    <Code2 className="h-4 w-4" />
                    Generate Architecture
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator message="Building fullstack architecture..." subtext="Designing your application structure" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Code2 className="h-16 w-16 text-gray-600" />}
              title="Ready to build"
              description="Describe your project and get an AI-generated fullstack implementation plan"
              tips={[
                "Be specific about your app's purpose and target users",
                "Mention any preferred technologies",
                "List must-have features and nice-to-have features separately",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default FullstackDeveloperPage;
