import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import ContentGeniusForm from "../../components/agents/ContentGeniusForm";

interface ActionItem {
  description: string;
  owner?: string;
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
}

interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative';
  score: number;
  breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

interface ContentGeniusResult {
  id: string;
  meetingTitle?: string;
  timestamp: string;
  status: 'processing' | 'completed' | 'error';
  summary: string;
  actionItems: ActionItem[];
  insights: string[];
  sentiment: SentimentAnalysis;
  topics: string[];
  processingTime: number;
  error?: string;
}

const ContentGeniusAIPage: React.FC = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [result, setResult] = useState<ContentGeniusResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAgentSubmit = async (formData: {
    content: string;
    contentType: 'transcript' | 'audio' | 'notes';
    meetingTitle?: string;
    attendees?: string[];
    meetingDate?: string;
  }) => {
    setIsProcessing(true);
    setCurrentStage(0);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contentgenius-ai`, {
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

      const data: ContentGeniusResult = await response.json();

      if (data.status === 'error') {
        throw new Error(data.error || 'Analysis failed');
      }

      setResult(data);

      // Simulate progress through stages
      for (let i = 1; i <= 5; i++) {
        setTimeout(() => setCurrentStage(i), i * 12000); // 12 seconds per stage
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('ContentGenius AI error:', err);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 60000); // Complete after all stages
    }
  };

  return (
    <>
      <Helmet>
        <title>ContentGenius AI - Meeting Analysis & Summaries | VideoRemix.vip</title>
        <meta
          name="description"
          content="Transform meeting transcripts into actionable insights, summaries, and task lists with AI-powered analysis."
        />
        <meta property="og:title" content="ContentGenius AI - Meeting Analysis & Summaries" />
        <meta
          property="og:description"
          content="Extract key decisions, action items, and insights from meetings instantly with AI-powered content analysis."
        />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <ContentGeniusForm
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
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-b border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">CG</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">
                          {result.meetingTitle || 'Meeting Analysis'}
                        </h3>
                        <p className="text-gray-300">Analysis Complete</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 text-sm text-gray-400 mb-1">
                        <span>Processed in {Math.round(result.processingTime / 1000)}s</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3 mt-4">
                    <button className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                      <span className="mr-2">📄</span>
                      Download Summary
                    </button>
                    <button className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                      <span className="mr-2">📋</span>
                      Export Actions
                    </button>
                    <button className="bg-green-600/20 hover:bg-green-600/30 text-green-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                      <span className="mr-2">📧</span>
                      Share Results
                    </button>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-700">
                  <div className="flex overflow-x-auto">
                    {[
                      { id: 'overview', label: 'Overview' },
                      { id: 'actions', label: 'Action Items' },
                      { id: 'insights', label: 'Key Insights' },
                      { id: 'sentiment', label: 'Sentiment Analysis' },
                      { id: 'topics', label: 'Topics Covered' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        className="flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 border-transparent text-gray-400 hover:text-white hover:bg-gray-700/30 transition-colors"
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Overview Tab (Default) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-900/50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <span className="text-blue-400 mr-2">📋</span>
                        Executive Summary
                      </h4>
                      <div className="text-gray-300 leading-relaxed text-sm whitespace-pre-line">
                        {result.summary}
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Action Items Preview */}
                      <div className="bg-gray-900/50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <span className="text-purple-400 mr-2">✅</span>
                          Action Items ({result.actionItems.length})
                        </h4>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {result.actionItems.slice(0, 5).map((item, index) => (
                            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                item.priority === 'high' ? 'bg-red-400' :
                                item.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                              }`} />
                              <div className="flex-1">
                                <p className="text-sm text-gray-300">{item.description}</p>
                                {item.owner && (
                                  <p className="text-xs text-gray-400 mt-1">Owner: {item.owner}</p>
                                )}
                              </div>
                            </div>
                          ))}
                          {result.actionItems.length > 5 && (
                            <p className="text-xs text-gray-500 text-center">
                              +{result.actionItems.length - 5} more actions
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Sentiment Overview */}
                      <div className="bg-gray-900/50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <span className="text-green-400 mr-2">😊</span>
                          Overall Sentiment
                        </h4>
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${
                              result.sentiment.overall === 'positive' ? 'text-green-400' :
                              result.sentiment.overall === 'negative' ? 'text-red-400' :
                              'text-yellow-400'
                            }`}>
                              {result.sentiment.overall.toUpperCase()}
                            </div>
                            <div className="text-xs text-gray-400">Score: {(result.sentiment.score * 100).toFixed(0)}%</div>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-green-400">Positive</span>
                              <span className="text-gray-300">{result.sentiment.breakdown.positive}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${result.sentiment.breakdown.positive}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key Insights */}
                  <div className="bg-gray-900/50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <span className="text-yellow-400 mr-2">💡</span>
                      Key Insights ({result.insights.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.insights.map((insight, index) => (
                        <div key={index} className="flex items-start space-x-3 p-4 bg-gray-800/50 rounded-lg">
                          <span className="text-yellow-400 mt-1">•</span>
                          <p className="text-sm text-gray-300">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Topics Covered */}
                  <div className="bg-gray-900/50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <span className="text-blue-400 mr-2">🏷️</span>
                      Topics Discussed ({result.topics.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.topics.map((topic, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Meeting Stats */}
                  <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Meeting Analysis Stats</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{result.actionItems.length}</div>
                        <div className="text-sm text-gray-400">Action Items</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">{result.insights.length}</div>
                        <div className="text-sm text-gray-400">Key Insights</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{result.topics.length}</div>
                        <div className="text-sm text-gray-400">Topics</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">{Math.round(result.processingTime / 1000)}s</div>
                        <div className="text-sm text-gray-400">Processing Time</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
};

export default ContentGeniusAIPage;
