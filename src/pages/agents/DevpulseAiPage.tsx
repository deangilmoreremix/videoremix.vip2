import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { ResultCard } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { Zap, Sparkles, Code } from "lucide-react";

const DevpulseAiPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/devpulse-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (result && result.status === 'completed') {
    return (
      <>
        <Helmet>
          <title>DevpulseAi - VideoRemix.vip</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <ResultCard
                icon={<Zap className="h-5 w-5" />}
                title="Devpulse AI Results"
                description={result.result}
                variant="success"
              />
              <div className="flex justify-center">
                <ActionButton onClick={() => { setResult(null); }}>
                  <Sparkles className="h-4 w-4" />
                  Refresh
                </ActionButton>
              </div>
            </motion.div>
          </div>
        </main>
      </>
    );
  }

  if (loading) {
    return <LoadingIndicator message="Fetching dev insights..." subtext="Analyzing developer trends and patterns" />;
  }

  if (!result && !loading) {
    return (
      <>
        <Helmet>
          <title>DevpulseAi - VideoRemix.vip</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-500 rounded-3xl mb-6">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Devpulse AI</h1>
              <p className="text-xl text-gray-400">AI-powered developer insights and trends.</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <ActionButton type="submit" loading={loading} size="lg" className="w-full">
                <Sparkles className="h-4 w-4" />
                Get Dev Insights
              </ActionButton>
            </form>

            <EmptyState
              icon={<Code className="h-16 w-16 text-gray-600" />}
              title="Developer Pulse Insights"
              description="Get AI-powered insights on developer trends and best practices"
              tips={[
                "Insights are generated from the latest developer community data",
                "Click refresh to get updated insights",
                "Results include trending technologies and best practices"
              ]}
            />
          </div>
        </main>
      </>
    );
  }

  return null;
};

export default DevpulseAiPage;
