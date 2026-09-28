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
import { Sparkles, CheckCircle2, Users } from "lucide-react";

const STORAGE_KEY = "ai-personalizationstudio";

const PERSONALIZATION_TYPE_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "website", label: "Website Experience" },
  { value: "content", label: "Content Recommendations" },
  { value: "product", label: "Product Suggestions" },
];

const AiPersonalizationstudioPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    contentType: "email",
    audience: "",
    personalizationGoal: "",
    dataPoints: "",
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
    if (!formData.audience.trim() || !formData.personalizationGoal.trim()) {
      setError("Please provide audience and personalization goal");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-personalizationstudio`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            personalization_type: formData.contentType,
            target_audience: formData.audience,
            personalization_goal: formData.personalizationGoal,
            available_data_points: formData.dataPoints,
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
    setFormData({ openaiApiKey: "", contentType: "email", audience: "", personalizationGoal: "", dataPoints: "" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - AI Personalization Studio</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-500 rounded-3xl mb-6">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Personalization Strategy Ready</h1>
              <p className="text-xl text-gray-400">AI-generated personalization plan</p>
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
                <h3 className="text-lg font-medium text-white mb-4">Personalization Strategy</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Create Another Strategy
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
        <title>AI Personalization Studio - VideoRemix.vip</title>
        <meta name="description" content="AI-powered personalization strategy and experience design." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-500 rounded-3xl mb-6">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">AI Personalization Studio</h1>
            <p className="text-xl text-gray-400">AI-powered personalization strategy and experience design</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Generation failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Personalization Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Strategy" description="What do you want to personalize">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectDropdown
                      label="Personalization Type"
                      value={formData.contentType}
                      onValueChange={(val) => updateField("contentType", val)}
                      options={PERSONALIZATION_TYPE_OPTIONS}
                      helperText="Type of personalization"
                    />
                    <SmartInput
                      label="Target Audience"
                      name="audience"
                      value={formData.audience}
                      onChange={(val) => updateField("audience", val)}
                      placeholder="e.g. enterprise customers..."
                      helperText="Who to personalize for"
                      required
                    />
                  </div>

                  <SmartTextarea
                    label="Personalization Goal"
                    name="personalizationGoal"
                    value={formData.personalizationGoal}
                    onChange={(val) => updateField("personalizationGoal", val)}
                    placeholder="e.g. increase engagement by 30%..."
                    helperText="What you want to achieve with personalization"
                    required
                    rows={3}
                  />

                  <SmartTextarea
                    label="Available Data Points"
                    name="dataPoints"
                    value={formData.dataPoints}
                    onChange={(val) => updateField("dataPoints", val)}
                    placeholder="e.g. past purchases, browsing history, demographics..."
                    helperText="What data you have available for personalization"
                    rows={3}
                  />
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for AI-powered personalization"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.audience.trim() || !formData.personalizationGoal.trim()}
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Strategy
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator message="Designing personalization strategy..." subtext="Creating tailored experiences" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Sparkles className="h-16 w-16 text-gray-600" />}
              title="Ready to personalize"
              description="Enter your audience and goals to generate a personalization strategy"
              tips={[
                "Leverage all available data points",
                "Test personalization rules iteratively",
                "Focus on high-impact segments first",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiPersonalizationstudioPage;
