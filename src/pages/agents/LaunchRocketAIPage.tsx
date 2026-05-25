import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  BarChart3,
  Lightbulb,
  Rocket,
  CheckCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import LaunchRocketForm from "../../components/agents/LaunchRocketForm";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultGrid } from "@/components/agent-ui/ResultCard";

interface LaunchIntelligenceResult {
  id: string;
  product: string;
  market: string;
  competitors: string[];
  timestamp: string;
  status: 'processing' | 'completed' | 'error';
  competitorAnalysis?: any;
  marketSentiment?: any;
  launchMetrics?: any;
  recommendations?: any;
  processingTime: number;
  sources: string[];
  confidence: number;
  error?: string;
}

const LaunchRocketAIPage: React.FC = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [result, setResult] = useState<LaunchIntelligenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAgentSubmit = async (formData: {
    product: string;
    market: string;
    competitors: string[];
    timeline?: string;
    context?: string;
  }) => {
    setIsProcessing(true);
    setCurrentStage(0);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/launchrocket-ai`, {
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

      const data: LaunchIntelligenceResult = await response.json();

      if (data.status === 'error') {
        throw new Error(data.error || 'Processing failed');
      }

      setResult(data);

      for (let i = 1; i <= 4; i++) {
        setTimeout(() => setCurrentStage(i), i * 20000);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('LaunchRocket AI error:', err);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 80000);
    }
  };

  return (
    <>
      <Helmet>
        <title>LaunchRocket AI - Product Launch Intelligence | VideoRemix.vip</title>
        <meta
          name="description"
          content="AI-powered product launch intelligence with competitor analysis, market sentiment, and strategic recommendations for successful GTM execution."
        />
        <meta property="og:title" content="LaunchRocket AI - Product Launch Intelligence" />
        <meta
          property="og:description"
          content="Get comprehensive launch intelligence with AI analysis of competitors, market sentiment, and actionable GTM recommendations."
        />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <LaunchRocketForm
            onSubmit={handleAgentSubmit}
            isProcessing={isProcessing}
            currentStage={currentStage}
            error={error || undefined}
          />

          {result && result.status === 'completed' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 max-w-6xl mx-auto"
            >
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-3xl font-bold text-white mb-6">Launch Intelligence Report</h3>

                <ResultGrid columns={3}>
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-400">{result.confidence * 100}%</div>
                    <div className="text-sm text-gray-300">Analysis Confidence</div>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-400">{Math.round(result.processingTime / 1000)}s</div>
                    <div className="text-sm text-gray-300">Processing Time</div>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-400">{result.sources.length}</div>
                    <div className="text-sm text-gray-300">Data Sources</div>
                  </div>
                </ResultGrid>

                <div className="space-y-6 mt-8">
                  {result.competitorAnalysis && (
                    <div className="bg-gray-900/50 rounded-lg p-6">
                      <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <Building2 className="h-6 w-6 mr-2 text-orange-400" />
                        Competitor Analysis
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <h5 className="text-lg font-medium text-orange-300 mb-2">Positioning & Messaging</h5>
                          <p className="text-gray-300 leading-relaxed">{result.competitorAnalysis.positioning}</p>
                        </div>
                        <div>
                          <h5 className="text-lg font-medium text-orange-300 mb-2">Pricing Strategy</h5>
                          <p className="text-gray-300">{result.competitorAnalysis.pricing}</p>
                        </div>
                        <div>
                          <h5 className="text-lg font-medium text-orange-300 mb-2">Go-To-Market Channels</h5>
                          <ul className="text-gray-300 list-disc list-inside space-y-1">
                            {result.competitorAnalysis.channels.map((channel: string, index: number) => (
                              <li key={index}>{channel}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.marketSentiment && (
                    <div className="bg-gray-900/50 rounded-lg p-6">
                      <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <Users className="h-6 w-6 mr-2 text-orange-400" />
                        Market Sentiment Analysis
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-orange-400">
                              {Math.round(result.marketSentiment.overallScore * 100)}%
                            </div>
                            <div className="text-sm text-gray-300">Overall Sentiment</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-green-400">
                              {result.marketSentiment.socialMentions.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-300">Social Mentions</div>
                          </div>
                        </div>

                        <div>
                          <h5 className="text-lg font-medium text-green-300 mb-2">Positive Drivers</h5>
                          <ul className="text-gray-300 list-disc list-inside space-y-1">
                            {result.marketSentiment.positiveDrivers.map((driver: string, index: number) => (
                              <li key={index}>{driver}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="text-lg font-medium text-red-300 mb-2">Challenges & Concerns</h5>
                          <ul className="text-gray-300 list-disc list-inside space-y-1">
                            {result.marketSentiment.negativeDrivers.map((driver: string, index: number) => (
                              <li key={index}>{driver}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="text-lg font-medium text-orange-300 mb-2">Key Themes</h5>
                          <div className="flex flex-wrap gap-2">
                            {result.marketSentiment.keyThemes.map((theme: string, index: number) => (
                              <span key={index} className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm">
                                {theme}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.launchMetrics && (
                    <div className="bg-gray-900/50 rounded-lg p-6">
                      <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <BarChart3 className="h-6 w-6 mr-2 text-orange-400" />
                        Launch Performance Metrics
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="text-lg font-medium text-orange-300 mb-2">Market Adoption</h5>
                          <p className="text-gray-300">{result.launchMetrics.adoptionRate}</p>
                        </div>
                        <div>
                          <h5 className="text-lg font-medium text-orange-300 mb-2">Customer Acquisition Cost</h5>
                          <p className="text-gray-300">{result.launchMetrics.cacRange}</p>
                        </div>
                        <div>
                          <h5 className="text-lg font-medium text-orange-300 mb-2">Time to Market</h5>
                          <p className="text-gray-300">{result.launchMetrics.timeToMarket}</p>
                        </div>
                        <div>
                          <h5 className="text-lg font-medium text-orange-300 mb-2">Success Factors</h5>
                          <ul className="text-gray-300 list-disc list-inside space-y-1">
                            {result.launchMetrics.successFactors.slice(0, 3).map((factor: string, index: number) => (
                              <li key={index}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.recommendations && (
                    <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/20 rounded-lg p-6">
                      <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <Lightbulb className="h-6 w-6 mr-2 text-green-400" />
                        Strategic Recommendations
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="text-lg font-medium text-green-300 mb-3">Positioning Strategy</h5>
                          <ul className="text-gray-300 space-y-2">
                            {result.recommendations.positioning.map((rec: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="text-green-400 mr-2 mt-1">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="text-lg font-medium text-green-300 mb-3">Go-To-Market Actions</h5>
                          <ul className="text-gray-300 space-y-2">
                            {result.recommendations.actionItems.slice(0, 4).map((action: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="text-green-400 mr-2 mt-1">•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    <strong>Export Options:</strong> Full detailed report, executive summary, and implementation roadmap available in the complete version.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {!result && !isProcessing && !error && (
            <EmptyState
              icon={<Rocket className="h-16 w-16 text-gray-600" />}
              title="Launch Intelligence Ready"
              description="Enter your product details to receive AI-powered competitor analysis, market sentiment, and strategic recommendations"
              tips={[
                "Enter your product or service name",
                "Select a target market category",
                "Add up to 3 key competitors",
                "Optional: Set your launch timeline"
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};


export default LaunchRocketAIPage;