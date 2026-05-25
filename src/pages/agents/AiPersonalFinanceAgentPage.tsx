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
import { TrendingUp, Wallet, Target, Sparkles, CheckCircle2, DollarSign } from "lucide-react";

const STORAGE_KEY = 'ai-personal-finance-agent';

const AiPersonalFinanceAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: '',
    serpApiKey: '',
    financialGoals: '',
    currentSituation: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-personal-finance-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enter_openai_api_key_to_access_gpt4o: formData.openaiApiKey,
          enter_serp_api_key_for_search_functionality: formData.serpApiKey,
          what_are_your_financial_goals: formData.financialGoals,
          describe_your_current_financial_situation: formData.currentSituation,
          userId: user?.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (result && result.status === 'completed' && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - Personal Finance</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-3">Financial Analysis Complete</h1>
                <p className="text-gray-400">Your personalized financial plan is ready</p>
              </div>

              <ResultGrid columns={2}>
                <ResultCard
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  title="Status"
                  value="Analysis Complete"
                  variant="success"
                />
                <ResultCard
                  icon={<Target className="h-5 w-5" />}
                  title="Goals Identified"
                  value="Personalized"
                  subtext="Based on your inputs"
                />
              </ResultGrid>

              {result.recommendations && (
                <ResultCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  title="Financial Recommendations"
                  description={result.recommendations}
                  variant="info"
                />
              )}

              {result.analysis && (
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-400" />
                    Detailed Financial Plan
                  </h3>
                  <div className="text-gray-300 whitespace-pre-wrap">{result.analysis}</div>
                </div>
              )}

              <div className="flex justify-center">
                <ActionButton onClick={() => { setResult(null); }}>
                  Get New Analysis
                </ActionButton>
              </div>
            </motion.div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Personal Finance Agent - VideoRemix.vip</title>
        <meta name="description" content="AI-powered personal finance planning agent." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-500 rounded-3xl mb-6">
              <Wallet className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Personal Finance Agent</h1>
            <p className="text-xl text-gray-400">AI-powered financial planning and goal setting.</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Financial Planning</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="API Configuration" description="Required API keys">
                  <ApiKeyInput
                    label="OpenAI API Key (GPT-4o)"
                    value={formData.openaiApiKey}
                    onChange={(v) => updateField('openaiApiKey', v)}
                    helperText="Required for AI-powered financial analysis"
                    required
                  />
                  <ApiKeyInput
                    label="Serp API Key"
                    value={formData.serpApiKey}
                    onChange={(v) => updateField('serpApiKey', v)}
                    helperText="Required for market research and trend data"
                    required
                  />
                </FormSection>

                <FormSection title="Your Financial Goals" description="What do you want to achieve?">
                  <SmartInput
                    label="Financial Goals"
                    name="financialGoals"
                    value={formData.financialGoals}
                    onChange={(v) => updateField('financialGoals', v)}
                    placeholder="Retire by 55, buy a house, build emergency fund, children's education..."
                    helperText="Describe your short-term and long-term financial goals"
                    required
                  />
                </FormSection>

                <FormSection title="Current Financial Situation" description="Tell us about your current state">
                  <SmartTextarea
                    label="Current Financial Situation"
                    name="currentSituation"
                    value={formData.currentSituation}
                    onChange={(v) => updateField('currentSituation', v)}
                    placeholder="I earn $85,000/year, have $15,000 in savings, $5,000 in credit card debt, contributing 5% to 401k..."
                    helperText="Include income, savings, debts, investments, and monthly expenses. More detail = better recommendations."
                    example={"Annual income: $85,000\nSavings: $15,000\nDebts: $5,000 credit card, $200,000 mortgage\nMonthly expenses: $3,500\nRetirement: 5% to 401k"}
                    rows={5}
                    required
                  />
                </FormSection>

                {error && (
                  <ErrorMessage
                    title="Financial analysis failed"
                    message={error}
                    onRetry={handleSubmit}
                    retryLoading={loading}
                  />
                )}

                <ActionButton
                  type="submit"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={loading || !formData.financialGoals.trim() || !formData.currentSituation.trim()}
                  size="lg"
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4" />
                  Get Financial Analysis
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator
              message="Analyzing your finances..."
              subtext="Creating personalized recommendations based on your goals and situation"
            />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Wallet className="h-16 w-16 text-gray-600" />}
              title="Plan your financial future"
              description="Share your financial goals and current situation for AI-powered personalized advice"
              tips={[
                "Include your income, debts, and monthly expenses",
                "List both short-term and long-term financial goals",
                "The more detail you provide, the better your recommendations",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiPersonalFinanceAgentPage;
