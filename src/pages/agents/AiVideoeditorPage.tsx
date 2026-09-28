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
import { Video, CheckCircle2, Clapperboard } from "lucide-react";

const STORAGE_KEY = "ai-videoeditor";

const EDIT_TYPE_OPTIONS = [
  { value: "trim", label: "Trim & Cut" },
  { value: "effects", label: "Effects & Transitions" },
  { value: "audio", label: "Audio Enhancement" },
  { value: "color", label: "Color Correction" },
  { value: "text", label: "Text & Overlays" },
];

const AiVideoeditorPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    videoDescription: "",
    editType: "trim",
    editsNeeded: "",
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
    if (!formData.videoDescription.trim() || !formData.editsNeeded.trim()) {
      setError("Please provide video description and edits needed");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-videoeditor`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            video_description: formData.videoDescription,
            edit_type: formData.editType,
            specific_edits_needed: formData.editsNeeded,
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
    setFormData({ openaiApiKey: "", videoDescription: "", editType: "trim", editsNeeded: "", outputFormat: "mp4" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - AI Video Editor</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-500 rounded-3xl mb-6">
                <Video className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Video Edit Ready</h1>
              <p className="text-xl text-gray-400">AI-powered video editing plan and output</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<Clapperboard className="h-5 w-5" />}
                title="Edit Type"
                value={result.editType || formData.editType}
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
                <h3 className="text-lg font-medium text-white mb-4">Editing Plan</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Edit Another Video
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
        <title>AI Video Editor - VideoRemix.vip</title>
        <meta name="description" content="AI-powered video editing assistant for cuts, effects, and enhancements." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-500 rounded-3xl mb-6">
              <Video className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">AI Video Editor</h1>
            <p className="text-xl text-gray-400">AI-powered video editing assistant</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Processing failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Video Editing Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Video Details" description="Describe your video and editing needs">
                  <SmartTextarea
                    label="Video Description"
                    name="videoDescription"
                    value={formData.videoDescription}
                    onChange={(val) => updateField("videoDescription", val)}
                    placeholder="Describe your video: length, content, current issues..."
                    helperText="Include current state and desired outcome"
                    required
                    rows={4}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectDropdown
                      label="Edit Type"
                      value={formData.editType}
                      onValueChange={(val) => updateField("editType", val)}
                      options={EDIT_TYPE_OPTIONS}
                      helperText="Primary type of editing needed"
                    />
                    <SmartInput
                      label="Output Format"
                      name="outputFormat"
                      value={formData.outputFormat}
                      onChange={(val) => updateField("outputFormat", val)}
                      placeholder="mp4, webm, mov..."
                      helperText="Desired output format"
                    />
                  </div>

                  <SmartTextarea
                    label="Specific Edits Needed"
                    name="editsNeeded"
                    value={formData.editsNeeded}
                    onChange={(val) => updateField("editsNeeded", val)}
                    placeholder="Describe specific edits: cuts, transitions, effects..."
                    helperText="Be as specific as possible about desired changes"
                    required
                    rows={4}
                  />
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for AI-powered video editing"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.videoDescription.trim() || !formData.editsNeeded.trim()}
                  >
                    <Video className="h-4 w-4" />
                    Generate Edit Plan
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator message="Planning video edits..." subtext="Analyzing video and generating edit plan" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Video className="h-16 w-16 text-gray-600" />}
              title="Ready to edit"
              description="Describe your video and editing needs to generate an AI-powered editing plan"
              tips={[
                "Be specific about timing and sequence",
                "Mention any reference videos or styles",
                "Consider the final platform or use case",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiVideoeditorPage;
