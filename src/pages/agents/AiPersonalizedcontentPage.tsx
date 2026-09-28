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
import { Wand2, CheckCircle2, Users } from "lucide-react";

const STORAGE_KEY = "ai-personalizedcontent";

const CONTENT_TYPE_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "social", label: "Social Media" },
  { value: "blog", label: "Blog Post" },
  { value: "ad", label: "Ad Copy" },
  { value: "landing", label: "Landing Page" },
];

const AiPersonalizedcontentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    contentType: "email",
    audience: "",
    keyMessage: "",
    tone: "professional",
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
    if (!formData.audience.trim() || !formData.keyMessage.trim()) {
      setError("Please provide audience and key message");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-personalizedcontent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            content_type: formData.contentType,
            target_audience: formData.audience,
            key_message_or_offer: formData.keyMessage,
            tone_and_style: formData.tone,
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
    setFormData({ openaiApiKey: "", contentType: "email", audience: "", keyMessage: "", tone: "professional" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - AI Personalized Content</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-600 to-rose-500 rounded-3xl mb-6">
                <Wand2 className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Content Generated</h1>
              <p className="text-xl text-gray-400">AI-personalized content ready to use</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<Users className="h-5 w-5" />}
                title="Audience"
                value={result.audience || formData.audience}
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
                <h3 className="text-lg font-medium text-white mb-4">Generated Content</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Generate More Content
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
        <title>AI Personalized Content - VideoRemix.vip</title>
        <meta name="description" content="Generate AI-personalized content for any audience and channel." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-600 to-rose-500 rounded-3xl mb-6">
              <Wand2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">AI Personalized Content</h1>
            <p className="text-xl text-gray-400">Generate personalized content for any audience</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Generation failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Content Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Content Details" description="What content do you need">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectDropdown
                      label="Content Type"
                      value={formData.contentType}
                      onValueChange={(val) => updateField("contentType", val)}
                      options={CONTENT_TYPE_OPTIONS}
                      helperText="Type of content to generate"
                    />
                    <SmartInput
                      label="Tone"
                      name="tone"
                      value={formData.tone}
                      onChange={(val) => updateField("tone", val)}
                      placeholder="professional, casual, persuasive..."
                      helperText="Desired tone and style"
                    />
                  </div>

                  <SmartInput
                    label="Target Audience"
                    name="audience"
                    value={formData.audience}
                    onChange={(val) => updateField("audience", val)}
                    placeholder="e.g. SaaS founders, marketing managers..."
                    helperText="Who is this content for"
                    required
                  />

                  <SmartTextarea
                    label="Key Message or Offer"
                    name="keyMessage"
                    value={formData.keyMessage}
                    onChange={(val) => updateField("keyMessage", val)}
                    placeholder="What is the main message or value proposition..."
                    helperText="The core message to communicate"
                    required
                    rows={4}
                  />
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for AI-powered content generation"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.audience.trim() || !formData.keyMessage.trim()}
                  >
                    <Wand2 className="h-4 w-4" />
                    Generate Content
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator message="Generating personalized content..." subtext="Tailoring content to your audience" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Wand2 className="h-16 w-16 text-gray-600" />}
              title="Ready to create"
              description="Enter your audience and message to generate personalized content"
              tips={[
                "Be specific about your target audience",
                "Focus on benefits, not just features",
                "Choose the right tone for your channel",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiPersonalizedcontentPage;
