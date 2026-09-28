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
import { Gift, CheckCircle2, Users } from "lucide-react";

const STORAGE_KEY = "referrals";

const PROGRAM_TYPE_OPTIONS = [
  { value: "customer", label: "Customer Referrals" },
  { value: "partner", label: "Partner Referrals" },
  { value: "employee", label: "Employee Referrals" },
  { value: "affiliate", label: "Affiliate Program" },
];

const ReferralsPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    programType: "customer",
    incentive: "",
    targetAudience: "",
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
    if (!formData.incentive.trim() || !formData.targetAudience.trim()) {
      setError("Please provide incentive and target audience");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/referrals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            program_type: formData.programType,
            incentive_details: formData.incentive,
            target_audience: formData.targetAudience,
            program_goal: formData.goal,
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
    setFormData({ openaiApiKey: "", programType: "customer", incentive: "", targetAudience: "", goal: "" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - Referrals</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-500 rounded-3xl mb-6">
                <Gift className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Referral Program Ready</h1>
              <p className="text-xl text-gray-400">AI-generated referral strategy and campaigns</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<Users className="h-5 w-5" />}
                title="Program Type"
                value={result.programType || formData.programType}
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
                <h3 className="text-lg font-medium text-white mb-4">Referral Strategy</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Create Another Program
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
        <title>Referrals - VideoRemix.vip</title>
        <meta name="description" content="AI-powered referral program strategy and campaign creation." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-500 rounded-3xl mb-6">
              <Gift className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Referrals</h1>
            <p className="text-xl text-gray-400">AI-powered referral program strategy</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Generation failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Referral Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Program Details" description="Configure your referral program">
                  <SelectDropdown
                    label="Program Type"
                    value={formData.programType}
                    onValueChange={(val) => updateField("programType", val)}
                    options={PROGRAM_TYPE_OPTIONS}
                    helperText="Type of referral program"
                  />

                  <SmartTextarea
                    label="Incentive Details"
                    name="incentive"
                    value={formData.incentive}
                    onChange={(val) => updateField("incentive", val)}
                    placeholder="Describe your referral incentives..."
                    helperText="What rewards or incentives will you offer"
                    required
                    rows={3}
                  />

                  <SmartInput
                    label="Target Audience"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={(val) => updateField("targetAudience", val)}
                    placeholder="e.g. existing customers, partners..."
                    helperText="Who can participate in the program"
                    required
                  />

                  <SmartInput
                    label="Program Goal"
                    name="goal"
                    value={formData.goal}
                    onChange={(val) => updateField("goal", val)}
                    placeholder="e.g. 100 new referrals per month..."
                    helperText="What you want to achieve"
                  />
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for AI-powered referral strategy"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.incentive.trim() || !formData.targetAudience.trim()}
                  >
                    <Gift className="h-4 w-4" />
                    Generate Referral Strategy
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator message="Creating referral strategy..." subtext="Designing your referral program" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Gift className="h-16 w-16 text-gray-600" />}
              title="Ready to refer"
              description="Configure your referral program to generate AI-powered strategies and campaigns"
              tips={[
                "Make incentives valuable and easy to claim",
                "Simplify the referral process",
                "Track and optimize based on results",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default ReferralsPage;
