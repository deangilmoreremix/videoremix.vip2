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
import { Handshake, CheckCircle2, Users } from "lucide-react";

const STORAGE_KEY = "smartcrmcloser";

const DEAL_STAGE_OPTIONS = [
  { value: "discovery", label: "Discovery" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "closing", label: "Closing" },
];

const SmartcrmcloserPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    dealStage: "negotiation",
    customerInfo: "",
    objection: "",
    productDetails: "",
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
    if (!formData.customerInfo.trim() || !formData.productDetails.trim()) {
      setError("Please provide customer info and product details");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smartcrmcloser`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            deal_stage: formData.dealStage,
            customer_info: formData.customerInfo,
            objection: formData.objection,
            product_details: formData.productDetails,
            userId: user?.id,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ openaiApiKey: "", dealStage: "negotiation", customerInfo: "", objection: "", productDetails: "" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - Smart CRM Closer</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-3xl mb-6">
                <Handshake className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Deal Strategy Ready</h1>
              <p className="text-xl text-gray-400">AI-powered CRM closing strategy</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<Users className="h-5 w-5" />}
                title="Deal Stage"
                value={result.dealStage || formData.dealStage}
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
                <h3 className="text-lg font-medium text-white mb-4">Closing Strategy</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Close Another Deal
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
        <title>Smart CRM Closer - VideoRemix.vip</title>
        <meta name="description" content="AI-powered CRM deal closing strategy and objection handling." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-3xl mb-6">
              <Handshake className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Smart CRM Closer</h1>
            <p className="text-xl text-gray-400">AI-powered deal closing strategy</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Analysis failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Deal Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Deal Context" description="Tell us about the opportunity">
                  <SelectDropdown
                    label="Deal Stage"
                    value={formData.dealStage}
                    onValueChange={(val) => updateField("dealStage", val)}
                    options={DEAL_STAGE_OPTIONS}
                    helperText="Current stage in the sales pipeline"
                  />

                  <SmartTextarea
                    label="Customer Information"
                    name="customerInfo"
                    value={formData.customerInfo}
                    onChange={(val) => updateField("customerInfo", val)}
                    placeholder="Describe the customer: company, role, needs..."
                    helperText="Include relevant customer context"
                    required
                    rows={3}
                  />

                  <SmartInput
                    label="Objection (Optional)"
                    name="objection"
                    value={formData.objection}
                    onChange={(val) => updateField("objection", val)}
                    placeholder="e.g. price, timing, competitor..."
                    helperText="Known objection or concern"
                  />

                  <SmartTextarea
                    label="Product Details"
                    name="productDetails"
                    value={formData.productDetails}
                    onChange={(val) => updateField("productDetails", val)}
                    placeholder="Describe your product or service..."
                    helperText="Key features and value proposition"
                    required
                    rows={3}
                  />
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for AI-powered deal closing"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.customerInfo.trim() || !formData.productDetails.trim()}
                  >
                    <Handshake className="h-4 w-4" />
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
            <LoadingIndicator message="Analyzing deal..." subtext="Generating closing strategy" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Handshake className="h-16 w-16 text-gray-600" />}
              title="Ready to close"
              description="Enter deal details to generate an AI-powered closing strategy"
              tips={[
                "Be specific about the customer's situation",
                "Address objections proactively",
                "Focus on value, not just price",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default SmartcrmcloserPage;
