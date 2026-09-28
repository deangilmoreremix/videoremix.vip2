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
import { TrendingUp, CheckCircle2, Target } from "lucide-react";

const STORAGE_KEY = "salesmax";

const SalesmaxPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    product: "",
    market: "",
    salesGoal: "",
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
    if (!formData.product.trim() || !formData.market.trim()) {
      setError("Please provide product and market details");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/salesmax`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            product_or_service: formData.product,
            target_market: formData.market,
            sales_goal: formData.salesGoal,
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
    setFormData({ openaiApiKey: "", product: "", market: "", salesGoal: "" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - SalesMax</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-600 to-red-500 rounded-3xl mb-6">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Sales Strategy Ready</h1>
              <p className="text-xl text-gray-400">AI-powered sales maximization plan</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<Target className="h-5 w-5" />}
                title="Market"
                value={result.market || formData.market}
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
                <h3 className="text-lg font-medium text-white mb-4">Sales Plan</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Maximize Another Product
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
        <title>SalesMax - VideoRemix.vip</title>
        <meta name="description" content="AI-powered sales maximization strategy and optimization for any product." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-600 to-red-500 rounded-3xl mb-6">
              <TrendingUp className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">SalesMax</h1>
            <p className="text-xl text-gray-400">AI-powered sales maximization strategy</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Analysis failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Sales Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Product & Market" description="What are you selling and to whom">
                  <SmartInput
                    label="Product or Service"
                    name="product"
                    value={formData.product}
                    onChange={(val) => updateField("product", val)}
                    placeholder="e.g. SaaS platform, consulting services..."
                    helperText="What you're selling"
                    required
                  />

                  <SmartInput
                    label="Target Market"
                    name="market"
                    value={formData.market}
                    onChange={(val) => updateField("market", val)}
                    placeholder="e.g. enterprise SaaS, SMB e-commerce..."
                    helperText="Your target market or segment"
                    required
                  />

                  <SmartInput
                    label="Sales Goal"
                    name="salesGoal"
                    value={formData.salesGoal}
                    onChange={(val) => updateField("salesGoal", val)}
                    placeholder="e.g. $100k MRR, 50 new customers..."
                    helperText="Your sales target or goal"
                  />
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for AI-powered sales strategy"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.product.trim() || !formData.market.trim()}
                  >
                    <TrendingUp className="h-4 w-4" />
                    Maximize Sales
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator message="Analyzing sales strategy..." subtext="Optimizing your sales approach" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<TrendingUp className="h-16 w-16 text-gray-600" />}
              title="Ready to maximize"
              description="Enter your product and market details to generate a sales maximization strategy"
              tips={[
                "Define clear, measurable sales goals",
                "Understand your ideal customer profile",
                "Focus on high-leverage activities first",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default SalesmaxPage;
