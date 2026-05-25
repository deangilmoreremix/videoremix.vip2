import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Mic,
  FileText,
  Clock,
  Download,
  Share2,
  CheckCircle,
  Volume2,
  Podcast
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PodcastifyForm from "../../components/agents/PodcastifyForm";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultGrid } from "@/components/agent-ui/ResultCard";

interface PodcastifyResult {
  id: string;
  blogUrl: string;
  timestamp: string;
  status: 'processing' | 'completed' | 'error';
  title: string;
  summary: string;
  podcastScript: string;
  keyPoints: string[];
  estimatedDuration: string;
  processingTime: number;
  error?: string;
}

const PodcastifyAIPage: React.FC = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [result, setResult] = useState<PodcastifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAgentSubmit = async (formData: {
    blogUrl: string;
    customInstructions?: string;
  }) => {
    setIsProcessing(true);
    setCurrentStage(0);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/podcastify-ai`, {
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

      const data: PodcastifyResult = await response.json();

      if (data.status === 'error') {
        throw new Error(data.error || 'Processing failed');
      }

      setResult(data);

      for (let i = 1; i <= 4; i++) {
        setTimeout(() => setCurrentStage(i), i * 15000);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Podcastify AI error:', err);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 60000);
    }
  };

  return (
    <>
      <Helmet>
        <title>PodCastify AI - Blog to Podcast Converter | VideoRemix.vip</title>
        <meta
          name="description"
          content="Transform any blog post into an engaging podcast episode with AI-powered content analysis and script generation."
        />
        <meta property="og:title" content="PodCastify AI - Blog to Podcast Converter" />
        <meta
          property="og:description"
          content="Convert blog posts to podcast episodes instantly with AI-powered content analysis, summarization, and script generation."
        />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <PodcastifyForm
            onSubmit={handleAgentSubmit}
            isProcessing={isProcessing}
            currentStage={currentStage}
            error={error || undefined}
          />

          {result && result.status === 'completed' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 max-w-5xl mx-auto"
            >
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-b border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
                        <Mic className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{result.title}</h3>
                        <p className="text-gray-300">Podcast Episode Generated</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 text-sm text-gray-400 mb-1">
                        <Clock className="h-4 w-4" />
                        <span>{result.estimatedDuration}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Generated in {Math.round(result.processingTime / 1000)}s
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 mt-4">
                    <button className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                      <Download className="h-4 w-4 mr-2" />
                      Download Script
                    </button>
                    <button className="bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                      <Volume2 className="h-4 w-4 mr-2" />
                      Generate Audio
                    </button>
                    <button className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Episode
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <ResultGrid columns={2}>
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <FileText className="h-5 w-5 mr-2 text-purple-400" />
                        <span className="text-purple-300 font-medium">Episode Summary</span>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{result.summary}</p>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                        <span className="text-green-300 font-medium">Key Takeaways</span>
                      </div>
                      <ul className="text-gray-300 space-y-1 text-sm">
                        {result.keyPoints.map((point, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-400 mr-2">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </ResultGrid>

                  <ResultGrid columns={4}>
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-purple-400">{result.podcastScript.split(' ').length}</div>
                      <div className="text-xs text-gray-400">Words</div>
                    </div>
                    <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-pink-400">{result.estimatedDuration}</div>
                      <div className="text-xs text-gray-400">Duration</div>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-purple-400">{result.keyPoints.length}</div>
                      <div className="text-xs text-gray-400">Key Points</div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-green-400">Ready</div>
                      <div className="text-xs text-gray-400">Status</div>
                    </div>
                  </ResultGrid>

                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Mic className="h-5 w-5 mr-2 text-purple-400" />
                      <span className="text-white font-medium">Full Podcast Script</span>
                    </div>
                    <div className="prose prose-invert max-w-none">
                      <div className="text-gray-300 leading-relaxed whitespace-pre-line text-sm">
                        {result.podcastScript}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        Source: <a href={result.blogUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">{result.blogUrl}</a>
                      </div>
                      <div className="text-xs text-gray-500">
                        Generated {new Date(result.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {!result && !isProcessing && !error && (
            <EmptyState
              icon={<Podcast className="h-16 w-16 text-gray-600" />}
              title="Ready to convert"
              description="Enter a blog URL to transform it into an engaging podcast episode"
              tips={[
                "Paste a full blog post URL",
                "Add custom instructions for tone and style",
                "The AI will extract key points and generate a script"
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default PodcastifyAIPage;