import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import ContentGeniusForm from "../../components/agents/ContentGeniusForm";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";

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

      for (let i = 1; i <= 5; i++) {
        setTimeout(() => setCurrentStage(i), i * 12000);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('ContentGenius AI error:', err);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 60000);
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

          {error && !isProcessing && (
            <div className="mt-6 max-w-6xl mx-auto">
              <ErrorMessage title="Analysis Failed" message={error} onRetry={() => {}} />
            </div>
          )}

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
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  <ResultGrid columns={2}>
                    <ResultCard title="Executive Summary" description={result.summary} variant="info" />
                    <ResultCard title="Action Items" value={result.actionItems.length} variant="default" />
                  </ResultGrid>

                  <ResultCard title="Overall Sentiment" value={result.sentiment.overall.toUpperCase()} variant={result.sentiment.overall === 'positive' ? 'success' : result.sentiment.overall === 'negative' ? 'error' : 'warning'} />

                  <ResultCard title="Key Insights" variant="default">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {result.insights.map((insight, index) => (
                        <div key={index} className="flex items-start space-x-3 p-4 bg-gray-800/50 rounded-lg">
                          <span className="text-yellow-400 mt-1">•</span>
                          <p className="text-sm text-gray-300">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </ResultCard>

                  <ResultCard title="Topics Discussed" variant="default">
                    <div className="flex flex-wrap gap-2 mt-4">
                      {result.topics.map((topic, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </ResultCard>

                  <ResultGrid columns={4}>
                    <ResultCard title="Action Items" value={result.actionItems.length} variant="default" />
                    <ResultCard title="Key Insights" value={result.insights.length} variant="default" />
                    <ResultCard title="Topics" value={result.topics.length} variant="default" />
                    <ResultCard title="Processing Time" value={`${Math.round(result.processingTime / 1000)}s`} variant="default" />
                  </ResultGrid>
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
