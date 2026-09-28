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
import { MessageSquare, CheckCircle2, Users } from "lucide-react";

const STORAGE_KEY = "ai-salesassistant";

const OBJECTION_OPTIONS = [
  { value: "price", label: "Price Too High" },
  { value: "timing", label: "Not the Right Time" },
  { value: "trust", label: "Trust / Credibility" },
  { value: "need", label: "Don't See the Need" },
  { value: "competitor", label: "Using a Competitor" },
];

const AiSalesassistantPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    customerProfile: "",
    objection: "price",
    product: "",
    context: "",
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
    if (!formData.customerProfile.trim() || !formData.product.trim()) {
      setError("Please provide customer profile and product");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-salesassistant`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            customer_profile: formData.customerProfile,
            objection_type: formData.objection,
            product_or_service: formData.product,
            additional_context: formData.context,
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
    setFormData({ openaiApiKey: "", customerProfile: "", objection: "price", product: "", context: "" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - AI Sales Assistant</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-500 rounded-3xl mb-6">
                <MessageSquare className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Sales Response Ready</h1>
              <p className="text-xl text-gray-400">AI-powered sales assistance and objection handling</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<Users className="h-5 w-5" />}
                title="Customer"
                value={result.customer || formData.customerProfile}
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
                <h3 className="text-lg font-medium text-white mb-4">Sales Response</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Handle Another Objection
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
        <title>AI Sales Assistant - VideoRemix.vip</title>
        <meta name="description" content="AI-powered sales assistant for objection handling and closing deals." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-500 rounded-3xl mb-6">
              <MessageSquare className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">AI Sales Assistant</h1>
            <p className="text-xl text-gray-400">AI-powered objection handling and deal closing</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Generation failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Sales Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Customer Context" description="Who are you selling to">
                  <SmartTextarea
                    label="Customer Profile"
                    name="customerProfile"
                    value={formData.customerProfile}
                    onChange={(val) => updateField("customerProfile", val)}
                    placeholder="Describe the customer: industry, role, pain points..."
                    helperText="Include relevant context about the prospect"
                    required
                    rows={3}
                  />

                  <SelectDropdown
                    label="Objection Type"
                    value={formData.objection}
                    onValueChange={(val) => updateField("objection", val)}
                    options={OBJECTION_OPTIONS}
                    helperText="Primary objection to address"
                  />

                  <SmartInput
                    label="Product or Service"
                    name="product"
                    value={formData.product}
                    onChange={(val) => updateField("product", val)}
                    placeholder="What you're selling"
                    required
                  />

                  <SmartTextarea
                    label="Additional Context"
                    name="context"
                    value={formData.context}
                    onChange={(val) => updateField("context", val)}
                    placeholder="Any other relevant details..."
                    helperText="Previous conversations, special offers, etc."
                    rows={2}
                  />
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for AI-powered sales assistance"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.customerProfile.trim() || !formData.product.trim()}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Get Sales Response
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator message="Generating sales response..." subtext="Crafting persuasive objection handling" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<MessageSquare className="h-16 w-16 text-gray-600" />}
              title="Ready to assist"
              description="Enter customer details to get AI-powered sales responses"
              tips={[
                "Be specific about the customer's situation",
                "Choose the most relevant objection type",
                "Include any previous conversation context",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiSalesassistantPage;
