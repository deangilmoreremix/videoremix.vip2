import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ResultCard } from "@/components/agent-ui/ResultCard";
import { Loader2, Crown, Gamepad2 } from "lucide-react";

const AiChessAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chess-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>AiChessAgent - VideoRemix.vip</title>
        <meta name="description" content="Use ai-chess-agent to play chess with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Ai Chess Agent</h1>
            <p className="text-xl text-gray-400">Play chess against an AI opponent.</p>
          </motion.div>

          {error && <ErrorMessage title="Request Failed" message={error} onRetry={handleSubmit} retryLoading={loading} />}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Start Game</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <p className="text-gray-400 text-center">Click below to start a new chess game against the AI.</p>

                <ActionButton type="submit" loading={loading} disabled={loading} size="lg" className="w-full">
                  <Crown className="h-4 w-4" />
                  Start New Game
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator 
              message="Setting up chess game..." 
              subtext="Preparing the board"
            />
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultCard
                icon={<Crown className="h-5 w-5" />}
                title="Game Result"
                description={result.result}
                variant="success"
              />

              <EmptyState
                icon={<Gamepad2 className="h-16 w-16 text-gray-600" />}
                title="Game Complete"
                description="Your chess game is ready."
                action={
                  <ActionButton onClick={() => { setResult(null); }}>
                    Play Again
                  </ActionButton>
                }
              />
            </motion.div>
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Crown className="h-16 w-16 text-gray-600" />}
              title="Ready to Play"
              description="Start a new chess game against the AI. Make your moves and enjoy the game."
              tips={[
                "Click 'Start New Game' to begin",
                "The AI will respond to your moves",
                "Enjoy your game!",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiChessAgentPage;