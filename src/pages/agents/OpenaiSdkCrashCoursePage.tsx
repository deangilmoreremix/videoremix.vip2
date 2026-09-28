import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { SelectDropdown } from "@/components/agent-ui/SelectDropdown";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { FormSection } from "@/components/agent-ui/FormSection";
import { GraduationCap, CheckCircle2, BookOpen } from "lucide-react";

const STORAGE_KEY = "openai-sdk-crash-course";

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const OpenaiSdkCrashCoursePage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    topic: "",
    level: "beginner",
    focusArea: "",
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
    if (!formData.topic.trim()) {
      setError("Please enter a topic");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openai-sdk-crash-course`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            topic_or_concept: formData.topic,
            difficulty_level: formData.level,
            focus_area: formData.focusArea,
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
    setFormData({ openaiApiKey: "", topic: "", level: "beginner", focusArea: "" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - OpenAI SDK Crash Course</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-3xl mb-6">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Crash Course Ready</h1>
              <p className="text-xl text-gray-400">OpenAI SDK learning module generated</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<BookOpen className="h-5 w-5" />}
                title="Level"
                value={result.level || formData.level}
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
                <h3 className="text-lg font-medium text-white mb-4">Crash Course</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Start Another Course
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
        <title>OpenAI SDK Crash Course - VideoRemix.vip</title>
        <meta name="description" content="Learn OpenAI SDK with AI-generated crash courses tailored to your level." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-3xl mb-6">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">OpenAI SDK Crash Course</h1>
            <p className="text-xl text-gray-400">Learn OpenAI SDK with AI-generated tutorials</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Generation failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Course Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Topic" description="What do you want to learn">
                  <SmartInput
                    label="Topic or Concept"
                    name="topic"
                    value={formData.topic}
                    onChange={(val) => updateField("topic", val)}
                    placeholder="e.g. Assistants API, Function Calling, Streaming..."
                    helperText="Specific OpenAI SDK concept to focus on"
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectDropdown
                      label="Difficulty Level"
                      value={formData.level}
                      onValueChange={(val) => updateField("level", val)}
                      options={LEVEL_OPTIONS}
                      helperText="Your experience level"
                    />
                    <SmartInput
                      label="Focus Area (Optional)"
                      name="focusArea"
                      value={formData.focusArea}
                      onChange={(val) => updateField("focusArea", val)}
                      placeholder="e.g. production deployment..."
                      helperText="Specific area to dive deeper into"
                    />
                  </div>
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for AI-generated crash course"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.topic.trim()}
                  >
                    <GraduationCap className="h-4 w-4" />
                    Generate Crash Course
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator message="Generating crash course..." subtext="Creating your personalized learning module" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<GraduationCap className="h-16 w-16 text-gray-600" />}
              title="Ready to learn"
              description="Enter an OpenAI SDK topic to generate a personalized crash course"
              tips={[
                "Start with fundamental concepts if you're new",
                "Focus on one topic at a time for better retention",
                "Practice along with the generated examples",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default OpenaiSdkCrashCoursePage;
