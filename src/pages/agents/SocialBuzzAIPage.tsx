import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Download,
  Share2,
  CheckCircle,
  AlertTriangle,
  Target,
  Clock,
  TrendingUpIcon
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import SocialBuzzForm from "../../components/agents/SocialBuzzForm";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultGrid } from "@/components/agent-ui/ResultCard";

interface SocialBuzzResult {
  id: string;
  topic: string;
  platform: string;
  timeframe: string;
  timestamp: string;
  status: 'processing' | 'completed' | 'error';
  sentiment: {
    overall: 'positive' | 'negative' | 'neutral';
    score: number;
    breakdown: { positive: number; negative: number; neutral: number };
  };
  trendingTopics: string[];
  keyInsights: string[];
  engagementMetrics: {
    totalMentions: number;
    peakEngagement: string;
    topInfluencers: string[];
  };
  recommendations: string[];
  processingTime: number;
  error?: string;
}

const SocialBuzzAIPage: React.FC = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [result, setResult] = useState<SocialBuzzResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAgentSubmit = async (formData: {
    topic: string;
    platform?: string;
    timeframe?: string;
  }) => {
    setIsProcessing(true);
    setCurrentStage(0);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/socialbuzz-ai`, {
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

      const data: SocialBuzzResult = await response.json();

      if (data.status === 'error') {
        throw new Error(data.error || 'Processing failed');
      }

      setResult(data);

      for (let i = 1; i <= 4; i++) {
        setTimeout(() => setCurrentStage(i), i * 12000);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('SocialBuzz AI error:', err);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 50000);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="h-5 w-5" />;
      case 'negative': return <ThumbsDown className="h-5 w-5" />;
      default: return <Minus className="h-5 w-5" />;
    }
  };

  return (
    <>
      <Helmet>
        <title>SocialBuzz AI - Social Media Intelligence | VideoRemix.vip</title>
        <meta
          name="description"
          content="Analyze social media sentiment, trends, and engagement patterns across Twitter, LinkedIn, and Facebook with AI-powered insights."
        />
        <meta property="og:title" content="SocialBuzz AI - Social Media Intelligence" />
        <meta
          property="og:description"
          content="Get real-time social media analysis with sentiment tracking, trending topics, and strategic recommendations for social media success."
        />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <SocialBuzzForm
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
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border-b border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Social Media Analysis</h3>
                        <p className="text-gray-300">Topic: {result.topic}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getSentimentColor(result.sentiment.overall)} flex items-center`}>
                        {getSentimentIcon(result.sentiment.overall)}
                        <span className="ml-2 capitalize">{result.sentiment.overall}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Generated in {Math.round(result.processingTime / 1000)}s
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 mt-4">
                    <button className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                      <Download className="h-4 w-4 mr-2" />
                      Export Report
                    </button>
                    <button className="bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Insights
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-8">
                  <ResultGrid columns={3}>
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <Users className="h-5 w-5 mr-2 text-blue-400" />
                        <span className="text-blue-300 font-medium">Sentiment</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Score:</span>
                          <span className="text-white font-semibold">{(result.sentiment.score * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-400">Positive:</span>
                          <span className="text-green-400">{result.sentiment.breakdown.positive}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Neutral:</span>
                          <span className="text-gray-400">{result.sentiment.breakdown.neutral}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-red-400">Negative:</span>
                          <span className="text-red-400">{result.sentiment.breakdown.negative}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <BarChart3 className="h-5 w-5 mr-2 text-purple-400" />
                        <span className="text-purple-300 font-medium">Engagement</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Total Mentions:</span>
                          <span className="text-white font-semibold">{result.engagementMetrics.totalMentions.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Peak:</span>
                          <span className="text-white">{result.engagementMetrics.peakEngagement}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <TrendingUpIcon className="h-5 w-5 mr-2 text-cyan-400" />
                        <span className="text-cyan-300 font-medium">Trending</span>
                      </div>
                      <div className="space-y-1">
                        {result.trendingTopics.slice(0, 3).map((topic, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <span className="text-cyan-400 mr-2">#{index + 1}</span>
                            <span className="text-gray-300">{topic}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ResultGrid>

                  <div className="bg-gray-900/50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Target className="h-5 w-5 mr-2 text-green-400" />
                      Key Insights
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.keyInsights.map((insight, index) => (
                        <div key={index} className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                          <div className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-1 flex-shrink-0" />
                            <p className="text-green-300 text-sm leading-relaxed">{insight}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-purple-400" />
                      Strategic Recommendations
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.recommendations.map((recommendation, index) => (
                        <div key={index} className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                          <div className="flex items-start">
                            <AlertTriangle className="h-5 w-5 text-purple-400 mr-3 mt-1 flex-shrink-0" />
                            <p className="text-purple-300 text-sm leading-relaxed">{recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        Platform: {result.platform} | Timeframe: {result.timeframe}
                      </div>
                      <div className="text-xs text-gray-500">
                        Analyzed {new Date(result.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {!result && !isProcessing && !error && (
            <EmptyState
              icon={<TrendingUpIcon className="h-16 w-16 text-gray-600" />}
              title="Ready to analyze"
              description="Enter a topic to analyze social media sentiment, trends, and engagement across platforms"
              tips={[
                "Enter a topic, keyword, or hashtag to analyze",
                "Choose a platform or analyze all",
                "Select a timeframe for the analysis"
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default SocialBuzzAIPage;