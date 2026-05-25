import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { TrendingUp, Rocket, Sparkles, CheckCircle2, Lightbulb, Target } from "lucide-react";

const STORAGE_KEY = 'ai-startup-trend-analysis-agent';

const AiStartupTrendAnalysisAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    areaOfInterest: ''
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
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-startup-trend-analysis-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enter_the_area_of_interest_for_your_startup: formData.areaOfInterest,
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

  if (result && result.status === 'completed' && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - Startup Trend Analysis</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-3">Trend Analysis Complete</h1>
                <p className="text-gray-400">Insights for your startup in {formData.areaOfInterest}</p>
              </div>

              <ResultGrid columns={2}>
                <ResultCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  title="Industry"
                  value={formData.areaOfInterest}
                />
                <ResultCard
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  title="Status"
                  value="Analysis Complete"
                  variant="success"
                />
              </ResultGrid>

              {result.trends && (
                <ResultCard
                  icon={<Lightbulb className="h-5 w-5" />}
                  title="Key Trends"
                  description={result.trends}
                  variant="info"
                />
              )}

              {result.opportunities && (
                <ResultCard
                  icon={<Rocket className="h-5 w-5" />}
                  title="Market Opportunities"
                  description={result.opportunities}
                  variant="success"
                />
              )}

              {result.result && (
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-violet-400" />
                    Full Analysis
                  </h3>
                  <div className="text-gray-300 whitespace-pre-wrap">{result.result}</div>
                </div>
              )}

              <div className="flex justify-center">
                <ActionButton onClick={() => { setResult(null); }}>
                  Analyze Another Area
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
        <title>Startup Trend Analysis Agent - VideoRemix.vip</title>
        <meta name="description" content="AI-powered startup trend analysis and market research." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-cyan-500 rounded-3xl mb-6">
              <TrendingUp className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Startup Trend Analysis Agent</h1>
            <p className="text-xl text-gray-400">AI-powered market trend analysis for your startup ideas.</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Trend Analysis</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <SmartInput
                  label="Area of Interest for Your Startup"
                  name="areaOfInterest"
                  value={formData.areaOfInterest}
                  onChange={(v) => setFormData({ areaOfInterest: v })}
                  placeholder="AI-powered healthcare, sustainable fashion, fintech, edtech..."
                  helperText="Enter your startup domain or industry. Examples: 'AI in healthcare', 'electric vehicles', 'remote work tools'"
                  required
                />

                {error && (
                  <ErrorMessage
                    title="Trend analysis failed"
                    message={error}
                    onRetry={handleSubmit}
                    retryLoading={loading}
                  />
                )}

                <ActionButton
                  type="submit"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={loading || !formData.areaOfInterest.trim()}
                  size="lg"
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4" />
                  Analyze Trends
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator
              message="Analyzing market trends..."
              subtext="Researching industry data, competitors, and opportunities"
            />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<TrendingUp className="h-16 w-16 text-gray-600" />}
              title="Discover market trends"
              description="Enter your startup idea or industry to get AI-powered trend analysis and opportunities"
              tips={[
                "Be specific about your industry or niche",
                "Consider including a geographic focus (e.g., 'fintech in Southeast Asia')",
                "The more focused your area, the more actionable the insights",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiStartupTrendAnalysisAgentPage;
