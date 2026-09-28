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
import { Video, CheckCircle2, Clapperboard } from "lucide-react";

const STORAGE_KEY = "ai-screenrecorder";

const AiScreenrecorderPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    taskDescription: "",
    recordingContext: "",
    outputFormat: "mp4",
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
    if (!formData.taskDescription.trim() || !formData.recordingContext.trim()) {
      setError("Please provide task description and recording context");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-screenrecorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            task_description: formData.taskDescription,
            recording_context: formData.recordingContext,
            output_format: formData.outputFormat,
            userId: user?.id,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Processing failed");
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ openaiApiKey: "", taskDescription: "", recordingContext: "", outputFormat: "mp4" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - AI Screen Recorder</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-pink-500 rounded-3xl mb-6">
                <Video className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Recording Processed</h1>
              <p className="text-xl text-gray-400">AI-powered screen recording analysis complete</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<Clapperboard className="h-5 w-5" />}
                title="Format"
                value={result.format || formData.outputFormat}
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
                <h3 className="text-lg font-medium text-white mb-4">Processing Results</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Process Another Recording
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
        <title>AI Screen Recorder - VideoRemix.vip</title>
        <meta name="description" content="AI-powered screen recording analysis and processing assistant." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-pink-500 rounded-3xl mb-6">
              <Video className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">AI Screen Recorder</h1>
            <p className="text-xl text-gray-400">AI-powered screen recording analysis</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Processing failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Recording Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Task Details" description="Describe your recording needs">
                  <SmartTextarea
                    label="Task Description"
                    name="taskDescription"
                    value={formData.taskDescription}
                    onChange={(val) => updateField("taskDescription", val)}
                    placeholder="Describe what you want to record or analyze..."
                    helperText="Be specific about the workflow or process"
                    required
                    rows={4}
                  />

                  <SmartTextarea
                    label="Recording Context"
                    name="recordingContext"
                    value={formData.recordingContext}
                    onChange={(val) => updateField("recordingContext", val)}
                    placeholder="Context about the application, workflow, or demonstration..."
                    helperText="Include any relevant background information"
                    required
                    rows={3}
                  />

                  <SmartInput
                    label="Output Format"
                    name="outputFormat"
                    value={formData.outputFormat}
                    onChange={(val) => updateField("outputFormat", val)}
                    placeholder="mp4, webm, gif..."
                    helperText="Desired output format"
                  />
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for AI-powered recording analysis"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.taskDescription.trim() || !formData.recordingContext.trim()}
                  >
                    <Video className="h-4 w-4" />
                    Process Recording
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator message="Processing recording..." subtext="Analyzing screen content and generating output" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Video className="h-16 w-16 text-gray-600" />}
              title="Ready to record"
              description="Describe your recording task to get AI-powered analysis and processing"
              tips={[
                "Be specific about what you want to capture",
                "Include context about the application or workflow",
                "Specify the desired output format",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiScreenrecorderPage;
