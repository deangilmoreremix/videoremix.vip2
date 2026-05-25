import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import AgentInputForm from "../../components/agents/AgentInputForm";

interface SalesIntelligenceResult {
  id: string;
  competitor: string;
  product: string;
  timestamp: string;
  status: 'processing' | 'completed' | 'error';
  competitorProfile?: any;
  error?: string;
}

const SalesForceAIPage: React.FC = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [result, setResult] = useState<SalesIntelligenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAgentSubmit = async (formData: {
    competitor: string;
    product: string;
    industry?: string;
    context?: string;
  }) => {
    setIsProcessing(true);
    setCurrentStage(0);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/salesforce-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: user?.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: SalesIntelligenceResult = await response.json();

      if (data.status === 'error') {
        throw new Error(data.error || 'Processing failed');
      }

      setResult(data);

      for (let i = 1; i <= 7; i++) {
        setTimeout(() => setCurrentStage(i), i * 5000);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('SalesForce AI error:', err);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 35000);
    }
  };

  return (
    <>
      <Helmet>
        <title>SalesForce AI - Competitive Intelligence | VideoRemix.vip</title>
        <meta
          name="description"
          content="Generate comprehensive sales battle cards against competitors. AI-powered competitive intelligence with research, SWOT analysis, and objection handling scripts."
        />
        <meta property="og:title" content="SalesForce AI - Competitive Intelligence" />
        <meta
          property="og:description"
          content="Create professional battle cards against any competitor with AI research, positioning analysis, and sales-ready content."
        />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <AgentInputForm
            onSubmit={handleAgentSubmit}
            isProcessing={isProcessing}
            currentStage={currentStage}
            error={error || undefined}
          />

          {result && result.status === 'completed' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 max-w-4xl mx-auto"
            >
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-2xl font-bold text-white mb-6">Battle Card Results</h3>

                {result.competitorProfile && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-3">Company Overview</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-gray-400">Name:</span> <span className="text-white">{result.competitorProfile.companyOverview?.name || result.competitor}</span></p>
                          <p><span className="text-gray-400">Founded:</span> <span className="text-white">{result.competitorProfile.companyOverview?.founded || 'Unknown'}</span></p>
                          <p><span className="text-gray-400">HQ:</span> <span className="text-white">{result.competitorProfile.companyOverview?.hq || 'Unknown'}</span></p>
                          <p><span className="text-gray-400">Size:</span> <span className="text-white">{result.competitorProfile.companyOverview?.size || 'Unknown'}</span></p>
                        </div>
                      </div>

                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-3">Target Market</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-gray-400">Customers:</span> <span className="text-white">{result.competitorProfile.targetMarket?.customers?.join(', ') || 'Unknown'}</span></p>
                          <p><span className="text-gray-400">Industries:</span> <span className="text-white">{result.competitorProfile.targetMarket?.industries?.join(', ') || 'Unknown'}</span></p>
                          <p><span className="text-gray-400">Company Size:</span> <span className="text-white">{result.competitorProfile.targetMarket?.companySize || 'Unknown'}</span></p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Products & Pricing</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-400">Offerings:</span> <span className="text-white">{result.competitorProfile.products?.offerings?.join(', ') || 'Unknown'}</span></p>
                        <p><span className="text-gray-400">Pricing:</span> <span className="text-white">{result.competitorProfile.products?.pricing?.join(', ') || 'Unknown'}</span></p>
                      </div>
                    </div>

                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Customer Sentiment</h4>
                      <p className="text-sm text-white">{result.competitorProfile.customerSentiment?.reviews || 'Analysis in progress...'}</p>
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    <strong>Next Steps:</strong> Full battle card with SWOT analysis, objection scripts, and visual comparison will be available in the complete implementation.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
};

export default SalesForceAIPage;