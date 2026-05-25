import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, Grid3X3 } from "lucide-react";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";

const STORAGE_KEY = 'ai-tic-tac-toe-agent-form';

const AiTicTacToeAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.result) setResult(data.result);
      } catch {}
    }
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tic-tac-toe-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.error || "Request failed");
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setResult(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      <Helmet>
        <title>AiTicTacToeAgent - VideoRemix.vip</title>
        <meta name="description" content="Use ai-tic-tac-toe-agent to play an AI-powered Tic Tac Toe game." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-cyan-500 rounded-3xl mb-6">
              <Grid3X3 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">AI Tic Tac Toe Agent</h1>
            <p className="text-xl text-gray-400">Challenge an AI opponent in a game of Tic Tac Toe. The agent uses strategic moves to compete against you.</p>
          </motion.div>

          {!result && !loading && (
            <EmptyState
              icon={<Grid3X3 className="h-16 w-16 text-gray-600" />}
              title="Ready to play?"
              description="Start a new game against our AI Tic Tac Toe agent. Make your moves strategically!"
              tips={[
                "Click 'Start Game' to begin a new game",
                "You play as X, the AI plays as O",
                "The AI uses strategic decision-making to compete"
              ]}
            />
          )}

          {error && (
            <ErrorMessage
              title="Game error"
              message={error}
              onRetry={handleSubmit}
              retryLoading={loading}
            />
          )}

          {loading && (
            <LoadingIndicator
              message="AI is thinking..."
              subtext="Calculating the best move"
            />
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultGrid columns={1}>
                <ResultCard
                  icon={<Grid3X3 className="h-5 w-5" />}
                  title="Game Result"
                  description={result.result}
                  variant="success"
                />
              </ResultGrid>

              <ActionButton onClick={handleClear} variant="ghost" className="w-full">
                Play Again
              </ActionButton>
            </motion.div>
          )}

          {!result && !loading && (
            <div className="flex gap-3 justify-center mt-6">
              <ActionButton onClick={handleSubmit} loading={loading} size="lg">
                <Sparkles className="h-4 w-4" />
                Start Game
              </ActionButton>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default AiTicTacToeAgentPage;
