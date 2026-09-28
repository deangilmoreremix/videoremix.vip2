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
import { Pen, CheckCircle2, User } from "lucide-react";

const STORAGE_KEY = "ai-signature";

const STYLE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "creative", label: "Creative" },
  { value: "minimalist", label: "Minimalist" },
  { value: "formal", label: "Formal" },
];

const AiSignaturePage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    fullName: "",
    style: "professional",
    usageContext: "",
    additionalDetails: "",
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
    if (!formData.fullName.trim()) {
      setError("Please enter your full name");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-signature`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            full_name: formData.fullName,
            preferred_style: formData.style,
            usage_context: formData.usageContext,
            additional_details: formData.additionalDetails,
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
    setFormData({ openaiApiKey: "", fullName: "", style: "professional", usageContext: "", additionalDetails: "" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - AI Signature</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-600 to-blue-500 rounded-3xl mb-6">
                <Pen className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Signature Generated</h1>
              <p className="text-xl text-gray-400">AI-powered signature suggestions ready</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<User className="h-5 w-5" />}
                title="Name"
                value={result.name || formData.fullName}
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
                <h3 className="text-lg font-medium text-white mb-4">Signature Suggestions</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Generate Another
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
        <title>AI Signature - VideoRemix.vip</title>
        <meta name="description" content="Generate professional AI-powered email signatures and personal branding." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-600 to-blue-500 rounded-3xl mb-6">
              <Pen className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">AI Signature</h1>
            <p className="text-xl text-gray-400">Generate professional email signatures</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Generation failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Signature Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Personal Details" description="Tell us about yourself">
                  <SmartInput
                    label="Full Name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={(val) => updateField("fullName", val)}
                    placeholder="John Doe"
                    helperText="Your full name for the signature"
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectDropdown
                      label="Style"
                      value={formData.style}
                      onValueChange={(val) => updateField("style", val)}
                      options={STYLE_OPTIONS}
                      helperText="Signature style"
                    />
                    <SmartInput
                      label="Usage Context"
                      name="usageContext"
                      value={formData.usageContext}
                      onChange={(val) => updateField("usageContext", val)}
                      placeholder="email, LinkedIn, business cards..."
                      helperText="Where the signature will be used"
                    />
                  </div>

                  <SmartTextarea
                    label="Additional Details"
                    name="additionalDetails"
                    value={formData.additionalDetails}
                    onChange={(val) => updateField("additionalDetails", val)}
                    placeholder="Title, company, contact info, social links..."
                    helperText="Any other details to include"
                    rows={3}
                  />
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for AI-powered signature generation"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.fullName.trim()}
                  >
                    <Pen className="h-4 w-4" />
                    Generate Signature
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator message="Generating signature..." subtext="Creating professional signature options" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Pen className="h-16 w-16 text-gray-600" />}
              title="Ready to sign"
              description="Enter your name to generate professional signature suggestions"
              tips={[
                "Choose a style that matches your brand",
                "Include all relevant contact information",
                "Keep it concise but informative",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiSignaturePage;
