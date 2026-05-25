import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ResultCard } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { FileCode, Sparkles, Lightbulb } from "lucide-react";

const STORAGE_KEY = 'cursor-ai-experiments';

const CursorAiExperimentsPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ openai_api_key: "", topic: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.openai_api_key.trim()) {
      setError("OpenAI API key is required");
      return;
    }
    if (!formData.topic.trim()) {
      setError("Topic is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cursor-ai-experiments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
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
          <title>CursorAiExperiments - VideoRemix.vip</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <ResultCard
                icon={<FileCode className="h-5 w-5" />}
                title="AI Experiment Results"
                description={result.result}
                variant="success"
              />
              <div className="flex justify-center">
                <ActionButton onClick={() => { setResult(null); setFormData({ openai_api_key: "", topic: "" }); }}>
                  <Sparkles className="h-4 w-4" />
                  New Experiment
                </ActionButton>
              </div>
            </motion.div>
          </div>
        </main>
      </>
    );
  }

  if (loading) {
    return <LoadingIndicator message="Running AI experiments..." subtext="Testing Cursor AI capabilities" />;
  }

  if (!result && !loading) {
    return (
      <>
        <Helmet>
          <title>CursorAiExperiments - VideoRemix.vip</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-3xl mb-6">
                <FileCode className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Cursor AI Experiments</h1>
              <p className="text-xl text-gray-400">Explore and experiment with Cursor AI capabilities.</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 space-y-6">
                <SmartInput
                  label="OpenAI API Key"
                  name="openai_api_key"
                  value={formData.openai_api_key}
                  onChange={(value) => setFormData(prev => ({ ...prev, openai_api_key: value }))}
                  type="password"
                  placeholder="sk-..."
                  helperText="Your API key is stored locally and never sent to our servers"
                  required
                />

                <SmartInput
                  label="Experiment Topic"
                  name="topic"
                  value={formData.topic}
                  onChange={(value) => setFormData(prev => ({ ...prev, topic: value }))}
                  placeholder="e.g., 'Code refactoring suggestions for my project'"
                  helperText="Describe the experiment or task you want Cursor AI to perform"
                  required
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <ActionButton type="submit" loading={loading} size="lg" className="w-full">
                <Sparkles className="h-4 w-4" />
                Run Experiment
              </ActionButton>
            </form>

            <EmptyState
              icon={<Lightbulb className="h-16 w-16 text-gray-600" />}
              title="Cursor AI Experiments"
              description="Experiment with Cursor AI to explore new possibilities"
              tips={[
                "Try code generation, refactoring, or debugging tasks",
                "Experiment with different coding styles and approaches",
                "Use specific technical terms for better results"
              ]}
            />
          </div>
        </main>
      </>
    );
  }

  return null;
};

export default CursorAiExperimentsPage;
