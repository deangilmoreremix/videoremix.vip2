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
import { GitBranch, CheckCircle2, Users } from "lucide-react";

const STORAGE_KEY = "ai-funnelcraft";

const FUNNEL_STAGE_OPTIONS = [
  { value: "awareness", label: "Awareness" },
  { value: "interest", label: "Interest" },
  { value: "consideration", label: "Consideration" },
  { value: "decision", label: "Decision" },
  { value: "retention", label: "Retention" },
];

const AiFunnelcraftPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    productDescription: "",
    targetAudience: "",
    funnelStage: "awareness",
    goal: "",
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
    if (!formData.productDescription.trim() || !formData.targetAudience.trim()) {
      setError("Please provide product description and target audience");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-funnelcraft`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            product_or_service_description: formData.productDescription,
            target_audience: formData.targetAudience,
            funnel_stage: formData.funnelStage,
            campaign_goal: formData.goal,
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
    setFormData({ openaiApiKey: "", productDescription: "", targetAudience: "", funnelStage: "awareness", goal: "" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - AI FunnelCraft</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-600 to-amber-500 rounded-3xl mb-6">
                <GitBranch className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Funnel Strategy Ready</h1>
              <p className="text-xl text-gray-400">AI-generated funnel campaign plan</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<Users className="h-5 w-5" />}
                title="Audience"
                value={result.audience || formData.targetAudience}
              />
              <ResultCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="Stage"
                value={result.stage || formData.funnelStage}
                variant="success"
              />
            </ResultGrid>

            {result.result && (
              <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Funnel Strategy</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Create Another Funnel
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
        <title>AI FunnelCraft - VideoRemix.vip</title>
        <meta name="description" content="AI-powered funnel strategy and campaign creation for any stage." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-600 to-amber-500 rounded-3xl mb-6">
              <GitBranch className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">AI FunnelCraft</h1>
            <p className="text-xl text-gray-400">AI-powered funnel strategy and campaign creation</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Generation failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Funnel Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Product & Audience" description="What are you promoting">
                  <SmartTextarea
                    label="Product Description"
                    name="productDescription"
                    value={formData.productDescription}
                    onChange={(val) => updateField("productDescription", val)}
                    placeholder="Describe your product or service..."
                    helperText="Include key features and value proposition"
                    required
                    rows={4}
                  />

                  <SmartInput
                    label="Target Audience"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={(val) => updateField("targetAudience", val)}
                    placeholder="e.g. small business owners, developers..."
                    helperText="Who you want to reach"
                    required
                  />
                </FormSection>

                <FormSection title="Campaign Settings" description="Funnel parameters">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectDropdown
                      label="Funnel Stage"
                      value={formData.funnelStage}
                      onValueChange={(val) => updateField("funnelStage", val)}
                      options={FUNNEL_STAGE_OPTIONS}
                      helperText="Current stage of your funnel"
                    />
                    <SmartInput
                      label="Campaign Goal"
                      name="goal"
                      value={formData.goal}
                      onChange={(val) => updateField("goal", val)}
                      placeholder="e.g. increase conversions by 20%..."
                      helperText="What you want to achieve"
                    />
                  </div>
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for AI-powered funnel generation"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.productDescription.trim() || !formData.targetAudience.trim()}
                  >
                    <GitBranch className="h-4 w-4" />
                    Generate Funnel
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator message="Creating funnel strategy..." subtext="Designing your campaign flow" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<GitBranch className="h-16 w-16 text-gray-600" />}
              title="Ready to craft"
              description="Enter your product details to generate a personalized funnel strategy"
              tips={[
                "Define your audience clearly for better targeting",
                "Choose the funnel stage that matches your current needs",
                "Set measurable goals for your campaign",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiFunnelcraftPage;
