import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  Brain,
  Zap,
  History,
  Sparkles,
  Loader2,
  MessageSquare,
  ArrowRight,
  Clock,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface ReasoningResponse {
  standardAnswer?: string;
  reasoningAnswer?: string;
  timestamp: string;
  question: string;
  model: string;
  mode: string;
  processingTime: number;
}

const ReasoningAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<"standard" | "reasoning" | "compare">("compare");
  const [model, setModel] = useState("gpt-4o-mini");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ReasoningResponse | null>(null);
  const [history, setHistory] = useState<ReasoningResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('reasoning-history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {
        // Ignore parse errors, start fresh
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('reasoning-history', JSON.stringify(history));
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reasoning-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          mode,
          model,
          userId: user?.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process reasoning request');
      }

      const reasoningResult: ReasoningResponse = {
        ...data,
        timestamp: new Date().toISOString()
      };

      setResult(reasoningResult);
      setHistory(prev => [reasoningResult, ...prev.slice(0, 19)]); // Keep last 20

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Reasoning agent error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleQuestions = [
    "How many 'r's are in 'strawberry'?",
    "If a bat and ball cost $1.10 and bat costs $1.00 more than ball, how much each?",
    "A farmer has 17 sheep, all but 9 die. How many left?",
    "What is the 17th letter of the alphabet?",
    "If you have 3 apples, give half away, then buy 4 more, how many total?"
  ];

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('reasoning-history');
  };

  return (
    <>
      <Helmet>
        <title>AI Reasoning Agent - Compare AI Thinking Patterns | VideoRemix.vip</title>
        <meta
          name="description"
          content="Watch AI think step-by-step. Compare standard answers vs reasoned responses to see how reasoning mode improves problem-solving."
        />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 rounded-2xl mb-6 shadow-lg shadow-purple-500/20">
              <Brain className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              AI Reasoning Agent
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Compare how AI answers with and without explicit reasoning.
              See the difference step-by-step thinking makes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Settings Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  Configuration
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      AI Model
                    </label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2.5 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    >
                      <option value="gpt-4o">GPT-4o (Most Capable)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (Fastest)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      GPT-4o provides best reasoning; mini is faster for simple puzzles
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Reasoning Mode
                    </label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value as any)}
                      className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2.5 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    >
                      <option value="compare">
                        Compare Both (Recommended)
                      </option>
                      <option value="reasoning">
                        Reasoning Mode Only
                      </option>
                      <option value="standard">
                        Standard Mode Only
                      </option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Compare to see how reasoning changes the answer
                    </p>
                  </div>
                </div>

                {/* Question Input */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Ask a Reasoning Question
                    </label>
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Enter a logic puzzle, math problem, or analytical question that requires step-by-step thinking..."
                      className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 min-h-[120px] resize-none transition-all"
                    />
                  </div>

                  {/* Example Chips */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-gray-400 flex items-center mr-2">Try:</span>
                    {exampleQuestions.map((q, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setQuestion(q)}
                        className="text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full transition-all border border-gray-600 hover:border-purple-500/50"
                      >
                        {q.length > 40 ? q.substring(0, 40) + '...' : q}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      type="submit"
                      disabled={isProcessing || !question.trim()}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="h-5 w-5" />
                          Analyze with AI
                        </>
                      )}
                    </button>

                    {history.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 px-4 py-2.5 rounded-lg transition-colors"
                      >
                        <History className="h-4 w-4" />
                        History ({history.length})
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>

              {/* Results Section */}
              <AnimatePresence>
                {(result || isProcessing) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
                  >
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-400" />
                      AI Response
                    </h2>

                    {isProcessing && (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
                        <p className="text-gray-300 font-medium">AI is thinking...</p>
                        <p className="text-sm text-gray-500 mt-1">This may take 10-30 seconds</p>
                      </div>
                    )}

                    {result && !isProcessing && (
                      <div className="space-y-6">
                        {mode === "compare" && result.standardAnswer && result.reasoningAnswer && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-900/50 rounded-lg p-5 border border-gray-700">
                              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                <Zap className="h-4 w-4 text-blue-400" />
                                Standard Response
                                <span className="text-xs text-gray-500 ml-auto">No step-by-step</span>
                              </h3>
                              <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                                {result.standardAnswer}
                              </div>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-5 border border-purple-500/30">
                              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                <Brain className="h-4 w-4 text-purple-400" />
                                With Reasoning
                                <span className="text-xs text-gray-500 ml-auto">Step-by-step</span>
                              </h3>
                              <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                                {result.reasoningAnswer}
                              </div>
                            </div>
                          </div>
                        )}

                        {mode === "standard" && result.standardAnswer && (
                          <div className="bg-gray-900/50 rounded-lg p-5 border border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-300 mb-3">Standard Response</h3>
                            <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                              {result.standardAnswer}
                            </div>
                          </div>
                        )}

                        {mode === "reasoning" && result.reasoningAnswer && (
                          <div className="bg-gray-900/50 rounded-lg p-5 border border-purple-500/30">
                            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                              <Brain className="h-4 w-4 text-purple-400" />
                              Reasoning Response
                            </h3>
                            <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                              {result.reasoningAnswer}
                            </div>
                          </div>
                        )}

                        {/* Meta info */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-700">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.round(result.processingTime / 1000)}s
                          </span>
                          <span>{new Date(result.timestamp).toLocaleString()}</span>
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {result.model}
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 flex items-start gap-3"
                >
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* History Panel */}
              <AnimatePresence>
                {showHistory && history.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <History className="h-5 w-5 text-blue-400" />
                        Recent Queries
                      </h3>
                      <button
                        onClick={clearHistory}
                        className="text-sm text-gray-400 hover:text-red-400 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="divide-y divide-gray-700/50 max-h-96 overflow-y-auto">
                      {history.map((entry, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setResult(entry);
                            setQuestion(entry.question);
                            setMode(entry.mode as any);
                            setModel(entry.model);
                            setShowHistory(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-4 hover:bg-gray-700/30 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white line-clamp-2 mb-2">
                                {entry.question}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="px-2 py-0.5 bg-gray-700/50 rounded">
                                  {entry.mode}
                                </span>
                                <span>{entry.model}</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(entry.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* How It Works */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-400" />
                  How It Works
                </h3>
                <div className="space-y-4">
                  {[
                    { step: 1, title: 'Enter Question', desc: 'Choose a puzzle, logic problem, or analytical question' },
                    { step: 2, title: 'Select Mode', desc: 'Compare standard vs reasoning or use reasoning explicitly' },
                    { step: 3, title: 'View Results', desc: 'See how reasoning changes the AI\'s approach and answer' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Tips Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 rounded-xl p-6 border border-purple-500/20"
              >
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-400" />
                  Pro Tips
                </h3>
                <ul className="space-y-2.5 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5" />
                    <span><strong>Logic puzzles:</strong> Use Compare mode to see both answer styles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5" />
                    <span><strong>Math problems:</strong> Reasoning mode shows step-by-step working</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5" />
                    <span><strong>Complex analysis:</strong> Compare to evaluate answer quality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5" />
                    <span><strong>Factual questions:</strong> Standard mode is faster & sufficient</span>
                  </li>
                  <li className="flex items-start gap-2 mt-3 pt-3 border-t border-purple-500/20">
                    <RefreshCw className="h-4 w-4 text-blue-400" />
                    <span>History is saved locally in your browser</span>
                  </li>
                </ul>
              </motion.div>

              {/* Use Cases */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <h3 className="text-lg font-bold text-white mb-3">📚 Common Use Cases</h3>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {[
                    { icon: '🧮', text: 'Math puzzles & calculations' },
                    { icon: '♟️', text: 'Logic puzzles & riddles' },
                    { icon: '🔍', text: 'Multi-step analysis' },
                    { icon: '📊', text: 'Decision-making frameworks' },
                    { icon: '💡', text: 'Creative problem-solving' },
                    { icon: '🎯', text: 'Strategy evaluation' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-300">
                      <span>{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ReasoningAgentPage;
