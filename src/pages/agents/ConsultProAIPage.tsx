import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import ConsultProForm from "../../components/agents/ConsultProForm";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";

interface BusinessConsultationResult {
  id: string;
  question: string;
  industry: string;
  stage: string;
  timestamp: string;
  status: 'processing' | 'completed' | 'error';
  researchAnalysis?: any;
  marketIntelligence?: any;
  strategicRecommendations?: any;
  implementationRoadmap?: any;
  riskAssessment?: any;
  processingTime: number;
  sources: string[];
  confidence: number;
  executiveSummary: string;
  error?: string;
}

const ConsultProAIPage: React.FC = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [result, setResult] = useState<BusinessConsultationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('executive');

  const handleAgentSubmit = async (formData: {
    question: string;
    industry: string;
    stage: 'idea' | 'startup' | 'growth' | 'enterprise';
    context?: string;
    goals?: string;
    budget?: string;
    timeline?: string;
  }) => {
    setIsProcessing(true);
    setCurrentStage(0);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/consultpro-ai`, {
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

      const data: BusinessConsultationResult = await response.json();

      if (data.status === 'error') {
        throw new Error(data.error || 'Processing failed');
      }

      setResult(data);

      for (let i = 1; i <= 5; i++) {
        setTimeout(() => setCurrentStage(i), i * 60000);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('ConsultPro AI error:', err);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 300000);
    }
  };

  const tabs = [
    { id: 'executive', label: 'Executive Summary' },
    { id: 'research', label: 'Research & Analysis' },
    { id: 'market', label: 'Market Intelligence' },
    { id: 'strategy', label: 'Strategic Recommendations' },
    { id: 'roadmap', label: 'Implementation Roadmap' },
    { id: 'risks', label: 'Risk Assessment' },
  ];

  return (
    <>
      <Helmet>
        <title>ConsultPro AI - Business Consultation | VideoRemix.vip</title>
        <meta
          name="description"
          content="Expert AI-powered business consultation with market analysis, strategic recommendations, and implementation roadmaps for entrepreneurs and business leaders."
        />
        <meta property="og:title" content="ConsultPro AI - Expert Business Consultation" />
        <meta
          property="og:description"
          content="Get comprehensive business consultation with AI-driven market analysis, strategic planning, and actionable implementation guidance."
        />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <ConsultProForm
            onSubmit={handleAgentSubmit}
            isProcessing={isProcessing}
            currentStage={currentStage}
            error={error || undefined}
          />

          {error && !isProcessing && (
            <div className="mt-6 max-w-7xl mx-auto">
              <ErrorMessage title="Processing Failed" message={error} onRetry={() => {}} />
            </div>
          )}

          {/* Results Display */}
          {result && result.status === 'completed' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 max-w-7xl mx-auto"
            >
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Business Consultation Report</h3>
                      <p className="text-gray-300">{result.question}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Analysis Confidence</div>
                      <div className="text-2xl font-bold text-purple-400">{Math.round(result.confidence * 100)}%</div>
                      <div className="text-xs text-gray-500">{Math.round(result.processingTime / 1000)}s processing time</div>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-700">
                  <div className="flex overflow-x-auto">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                            : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-700/30'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* Executive Summary Tab */}
                  {activeTab === 'executive' && (
                    <div className="space-y-6">
                      <ResultCard title="Executive Summary" description={result.executiveSummary} variant="info" />

                      {/* Key Metrics */}
                      <ResultGrid columns={3}>
                        <ResultCard title="Data Sources" value={result.sources.length} variant="default" />
                        <ResultCard title="Success Factors" value={result.strategicRecommendations?.successFactors?.length || 0} variant="default" />
                        <ResultCard title="Risk Level" value={result.riskAssessment?.riskProbability === 'high' ? 'High' : result.riskAssessment?.riskProbability === 'medium' ? 'Medium' : 'Low'} variant="default" />
                      </ResultGrid>
                    </div>
                  )}

                  {/* Research & Analysis Tab */}
                  {activeTab === 'research' && result.researchAnalysis && (
                    <div className="space-y-6">
                      <ResultGrid columns={2}>
                        <ResultCard title="Business Overview" description={result.researchAnalysis.businessOverview} variant="default" />
                        <ResultCard title="Industry Analysis" description={result.researchAnalysis.industryAnalysis} variant="default" />
                      </ResultGrid>

                      <ResultCard title="Current Challenges" variant="error">
                        <ul className="text-gray-300 space-y-2 mt-2">
                          {result.researchAnalysis.currentChallenges.map((challenge: string, index: number) => (
                            <li key={index} className="flex items-start text-sm">
                              <span className="text-red-400 mr-2 mt-1">•</span>
                              <span>{challenge}</span>
                            </li>
                          ))}
                        </ul>
                      </ResultCard>

                      <ResultCard title="Market Opportunities" variant="success">
                        <ul className="text-gray-300 space-y-2 mt-2">
                          {result.researchAnalysis.opportunities.map((opportunity: string, index: number) => (
                            <li key={index} className="flex items-start text-sm">
                              <span className="text-green-400 mr-2 mt-1">•</span>
                              <span>{opportunity}</span>
                            </li>
                          ))}
                        </ul>
                      </ResultCard>
                    </div>
                  )}

                  {/* Market Intelligence Tab */}
                  {activeTab === 'market' && result.marketIntelligence && (
                    <div className="space-y-6">
                      <ResultGrid columns={2}>
                        <ResultCard title="Market Size" value={result.marketIntelligence.marketSize} variant="default" />
                        <ResultCard title="Growth Rate" value={result.marketIntelligence.growthRate} variant="success" />
                      </ResultGrid>
                    </div>
                  )}

                  {/* Strategic Recommendations Tab */}
                  {activeTab === 'strategy' && result.strategicRecommendations && (
                    <div className="space-y-6">
                      <ResultCard title="Primary Strategic Direction" description={result.strategicRecommendations.primaryStrategy} variant="info" />
                    </div>
                  )}

                  {/* Implementation Roadmap Tab */}
                  {activeTab === 'roadmap' && result.implementationRoadmap && (
                    <div className="space-y-6">
                      <ResultCard title="Implementation Roadmap" variant="default" />
                    </div>
                  )}

                  {/* Risk Assessment Tab */}
                  {activeTab === 'risks' && result.riskAssessment && (
                    <div className="space-y-6">
                      <ResultCard
                        title="Overall Risk Assessment"
                        value={result.riskAssessment.riskProbability.toUpperCase() + ' RISK'}
                        variant={result.riskAssessment.riskProbability === 'high' ? 'error' : result.riskAssessment.riskProbability === 'medium' ? 'warning' : 'success'}
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
};


export default ConsultProAIPage;
