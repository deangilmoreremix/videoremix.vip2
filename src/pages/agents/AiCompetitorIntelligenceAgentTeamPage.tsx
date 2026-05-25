import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ResultCard } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { Loader2, Sparkles, Globe, Building2, Search } from "lucide-react";

const AiCompetitorIntelligenceAgentTeamPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ 
    enter_your_company_url_: "", 
    enter_a_description_of_your_company_if_url_is_not_available: "" 
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ai-competitor-intel-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ai-competitor-intel-state', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.enter_your_company_url_.trim() && !formData.enter_a_description_of_your_company_if_url_is_not_available.trim()) {
      setError('Please enter either a company URL or a description');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-competitor-intelligence-agent-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem('ai-competitor-intel-state');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>AiCompetitorIntelligenceAgentTeam - VideoRemix.vip</title>
        <meta name="description" content="Use ai-competitor-intelligence-agent-team to analyze competitors with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Ai Competitor Intelligence Agent Team</h1>
            <p className="text-xl text-gray-400">AI-powered competitor analysis and market intelligence.</p>
          </motion.div>

          {error && <ErrorMessage title="Request Failed" message={error} onRetry={handleSubmit} retryLoading={loading} />}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Your Company" description="Enter your company details for competitor comparison">
                  <SmartInput
                    label="Company URL"
                    name="enter_your_company_url_"
                    type="url"
                    value={formData.enter_your_company_url_}
                    onChange={(val) => setFormData({ ...formData, enter_your_company_url_: val })}
                    placeholder="https://www.yourcompany.com"
                    helperText="Enter your company website URL (optional if description provided)"
                  />

                  <SmartTextarea
                    label="Company Description (if URL not available)"
                    name="enter_a_description_of_your_company_if_url_is_not_available"
                    value={formData.enter_a_description_of_your_company_if_url_is_not_available}
                    onChange={(val) => setFormData({ ...formData, enter_a_description_of_your_company_if_url_is_not_available: val })}
                    placeholder="We are a B2B SaaS company offering project management solutions to enterprise clients. Our key differentiators are AI-powered automation and seamless integrations."
                    helperText="Describe your company, products, and target market"
                    rows={4}
                  />
                </FormSection>

                <ActionButton type="submit" loading={loading} disabled={loading} size="lg" className="w-full">
                  <Search className="h-4 w-4" />
                  Analyze Competitors
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator 
              message="Analyzing competitors..." 
              subtext="Gathering market intelligence"
            />
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultCard
                icon={<Building2 className="h-5 w-5" />}
                title="Competitor Analysis"
                description={result.result}
                variant="success"
              />

              <EmptyState
                icon={<Globe className="h-16 w-16 text-gray-600" />}
                title="Analysis Complete"
                description="Your competitor intelligence report is ready above."
                action={
                  <ActionButton onClick={() => { setResult(null); setFormData({ enter_your_company_url_: "", enter_a_description_of_your_company_if_url_is_not_available: "" }); }}>
                    Analyze Again
                  </ActionButton>
                }
              />
            </motion.div>
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Globe className="h-16 w-16 text-gray-600" />}
              title="Ready to Analyze"
              description="Enter your company URL or description to get AI-powered competitor intelligence."
              tips={[
                "Provide your company URL for automatic analysis",
                "Or describe your company if URL is not available",
                "The AI will identify and analyze your competitors",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiCompetitorIntelligenceAgentTeamPage;