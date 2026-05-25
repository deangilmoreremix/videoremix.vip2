import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  FileText,
  TrendingUp,
  Target,
  MapPin,
  AlertTriangle,
  Download,
  Share2,
  CheckCircle,
  BarChart3,
  Users,
  DollarSign,
  Calendar,
  Lightbulb,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ConsultProForm from "../../components/agents/ConsultProForm";

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

      // Simulate progress through stages
      for (let i = 1; i <= 5; i++) {
        setTimeout(() => setCurrentStage(i), i * 60000); // 60 seconds per stage
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('ConsultPro AI error:', err);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 300000); // Complete after all stages
    }
  };

  const tabs = [
    { id: 'executive', label: 'Executive Summary', icon: FileText },
    { id: 'research', label: 'Research & Analysis', icon: FileText },
    { id: 'market', label: 'Market Intelligence', icon: TrendingUp },
    { id: 'strategy', label: 'Strategic Recommendations', icon: Target },
    { id: 'roadmap', label: 'Implementation Roadmap', icon: MapPin },
    { id: 'risks', label: 'Risk Assessment', icon: AlertTriangle },
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

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3 mt-4">
                    <button className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </button>
                    <button className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Report
                    </button>
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
                        <tab.icon className="h-4 w-4 mr-2" />
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
                      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/20 rounded-lg p-6">
                        <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                          <CheckCircle className="h-6 w-6 mr-2 text-green-400" />
                          Executive Summary
                        </h4>
                        <div className="prose prose-invert max-w-none">
                          <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
                            {result.executiveSummary}
                          </pre>
                        </div>
                      </div>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-purple-400 mb-1">{result.sources.length}</div>
                          <div className="text-sm text-gray-400">Data Sources</div>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-400 mb-1">
                            {result.strategicRecommendations?.successFactors?.length || 0}
                          </div>
                          <div className="text-sm text-gray-400">Success Factors</div>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-orange-400 mb-1">
                            {result.riskAssessment?.riskProbability === 'high' ? 'High' :
                             result.riskAssessment?.riskProbability === 'medium' ? 'Medium' : 'Low'}
                          </div>
                          <div className="text-sm text-gray-400">Risk Level</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Research & Analysis Tab */}
                  {activeTab === 'research' && result.researchAnalysis && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gray-900/50 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-purple-400" />
                            Business Overview
                          </h4>
                          <p className="text-gray-300 leading-relaxed text-sm">
                            {result.researchAnalysis.businessOverview}
                          </p>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2 text-purple-400" />
                            Industry Analysis
                          </h4>
                          <p className="text-gray-300 leading-relaxed text-sm">
                            {result.researchAnalysis.industryAnalysis}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <AlertCircle className="h-5 w-5 mr-2 text-red-400" />
                            Current Challenges
                          </h4>
                          <ul className="text-gray-300 space-y-2">
                            {result.researchAnalysis.currentChallenges.map((challenge: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="text-red-400 mr-2 mt-1">•</span>
                                <span className="text-sm">{challenge}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <Lightbulb className="h-5 w-5 mr-2 text-green-400" />
                            Market Opportunities
                          </h4>
                          <ul className="text-gray-300 space-y-2">
                            {result.researchAnalysis.opportunities.map((opportunity: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="text-green-400 mr-2 mt-1">•</span>
                                <span className="text-sm">{opportunity}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <TrendingUp className="h-5 w-5 mr-2 text-blue-400" />
                          Key Industry Trends
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {result.researchAnalysis.keyTrends.map((trend: string, index: number) => (
                            <span key={index} className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm">
                              {trend}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Market Intelligence Tab */}
                  {activeTab === 'market' && result.marketIntelligence && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-900/50 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-white mb-3">Market Size & Growth</h4>
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm text-gray-400">Market Size</div>
                              <div className="text-lg font-semibold text-white">{result.marketIntelligence.marketSize}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-400">Growth Rate</div>
                              <div className="text-lg font-semibold text-green-400">{result.marketIntelligence.growthRate}</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-white mb-3">Pricing Landscape</h4>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {result.marketIntelligence.pricingLandscape}
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-900/50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-white mb-4">Competitive Landscape</h4>
                        <p className="text-gray-300 text-sm leading-relaxed mb-4">
                          {result.marketIntelligence.competitiveLandscape}
                        </p>

                        <h5 className="text-md font-medium text-purple-300 mb-3">Entry Barriers</h5>
                        <ul className="text-gray-300 space-y-1">
                          {result.marketIntelligence.entryBarriers.map((barrier: string, index: number) => (
                            <li key={index} className="flex items-start text-sm">
                              <span className="text-purple-400 mr-2 mt-1">•</span>
                              <span>{barrier}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-gray-900/50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-white mb-4">Customer Segments</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {result.marketIntelligence.customerSegments.map((segment: string, index: number) => (
                            <div key={index} className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                              <div className="text-purple-300 text-sm font-medium">{segment}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Strategic Recommendations Tab */}
                  {activeTab === 'strategy' && result.strategicRecommendations && (
                    <div className="space-y-6">
                      <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-white mb-4">Primary Strategic Direction</h4>
                        <p className="text-gray-300 leading-relaxed">
                          {result.strategicRecommendations.primaryStrategy}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gray-900/50 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-white mb-4">Alternative Approaches</h4>
                          <div className="space-y-3">
                            {result.strategicRecommendations.alternativeApproaches.map((approach: string, index: number) => (
                              <div key={index} className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                <div className="text-blue-300 text-sm">{approach}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-white mb-4">Critical Success Factors</h4>
                          <ul className="text-gray-300 space-y-2">
                            {result.strategicRecommendations.successFactors.map((factor: string, index: number) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-green-400 mr-2 mt-1">✓</span>
                                <span>{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="bg-orange-900/20 border border-orange-500/20 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-white mb-4">Potential Pitfalls</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {result.strategicRecommendations.potentialPitfalls.map((pitfall: string, index: number) => (
                            <div key={index} className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                              <div className="flex items-start">
                                <AlertTriangle className="h-4 w-4 text-orange-400 mr-2 mt-1 flex-shrink-0" />
                                <span className="text-orange-300 text-sm">{pitfall}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Implementation Roadmap Tab */}
                  {activeTab === 'roadmap' && result.implementationRoadmap && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <Calendar className="h-5 w-5 mr-2 text-blue-400" />
                            Immediate Actions (0-30 days)
                          </h4>
                          <ul className="text-gray-300 space-y-2">
                            {result.implementationRoadmap.immediateActions.map((action: string, index: number) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-blue-400 mr-2 mt-1">•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <Target className="h-5 w-5 mr-2 text-purple-400" />
                            Short-term Goals (30-90 days)
                          </h4>
                          <ul className="text-gray-300 space-y-2">
                            {result.implementationRoadmap.shortTermGoals.map((goal: string, index: number) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-purple-400 mr-2 mt-1">•</span>
                                <span>{goal}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <BarChart3 className="h-5 w-5 mr-2 text-green-400" />
                            Long-term Objectives (90-365 days)
                          </h4>
                          <ul className="text-gray-300 space-y-2">
                            {result.implementationRoadmap.longTermObjectives.map((objective: string, index: number) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-green-400 mr-2 mt-1">•</span>
                                <span>{objective}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gray-900/50 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-white mb-4">Resource Requirements</h4>
                          <ul className="text-gray-300 space-y-2">
                            {result.implementationRoadmap.resourceRequirements.map((resource: string, index: number) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-gray-400 mr-2 mt-1">•</span>
                                <span>{resource}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-white mb-4">Success Metrics</h4>
                          <ul className="text-gray-300 space-y-2">
                            {result.implementationRoadmap.successMetrics.map((metric: string, index: number) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-blue-400 mr-2 mt-1">📊</span>
                                <span>{metric}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Risk Assessment Tab */}
                  {activeTab === 'risks' && result.riskAssessment && (
                    <div className="space-y-6">
                      <div className={`rounded-lg p-6 border ${
                        result.riskAssessment.riskProbability === 'high'
                          ? 'bg-red-900/20 border-red-500/20'
                          : result.riskAssessment.riskProbability === 'medium'
                          ? 'bg-orange-900/20 border-orange-500/20'
                          : 'bg-green-900/20 border-green-500/20'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-white flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            Overall Risk Assessment
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            result.riskAssessment.riskProbability === 'high'
                              ? 'bg-red-500/20 text-red-300'
                              : result.riskAssessment.riskProbability === 'medium'
                              ? 'bg-orange-500/20 text-orange-300'
                              : 'bg-green-500/20 text-green-300'
                          }`}>
                            {result.riskAssessment.riskProbability.toUpperCase()} RISK
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-white mb-4">High-Risk Factors</h4>
                          <ul className="text-gray-300 space-y-2">
                            {result.riskAssessment.highRiskFactors.map((risk: string, index: number) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-red-400 mr-2 mt-1">⚠️</span>
                                <span>{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-white mb-4">Mitigation Strategies</h4>
                          <ul className="text-gray-300 space-y-2">
                            {result.riskAssessment.mitigationStrategies.map((strategy: string, index: number) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-blue-400 mr-2 mt-1">🛡️</span>
                                <span>{strategy}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="bg-gray-900/50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-white mb-4">Contingency Plans</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {result.riskAssessment.contingencyPlans.map((plan: string, index: number) => (
                            <div key={index} className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                              <div className="text-purple-300 text-sm">{plan}</div>
                            </div>
                          ))}
                        </div>
                      </div>
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
