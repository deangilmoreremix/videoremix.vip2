import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { SelectDropdown } from "@/components/agent-ui/SelectDropdown";
import { ResultCard } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { Sparkles, Cards } from "lucide-react";

const STORAGE_KEY = 'chat-with-tarots';

const ChatWithTarotsPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ card_count: "3", context: "" });
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
    if (!formData.context.trim()) {
      setError("Please enter your question or context");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-tarots`, {
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
          <title>ChatWithTarots - VideoRemix.vip</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <ResultCard
                icon={<Cards className="h-5 w-5" />}
                title="Tarot Reading"
                description={result.result}
                variant="success"
              />
              <div className="flex justify-center">
                <ActionButton onClick={() => { setResult(null); setFormData({ card_count: "3", context: "" }); }}>
                  <Sparkles className="h-4 w-4" />
                  New Reading
                </ActionButton>
              </div>
            </motion.div>
          </div>
        </main>
      </>
    );
  }

  if (loading) {
    return <LoadingIndicator message="Consulting the cards..." subtext="The tarot is revealing your path" />;
  }

  if (!result && !loading) {
    return (
      <>
        <Helmet>
          <title>ChatWithTarots - VideoRemix.vip</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-violet-500 rounded-3xl mb-6">
                <Cards className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Chat With Tarots</h1>
              <p className="text-xl text-gray-400">AI-powered tarot readings for insight and guidance.</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 space-y-6">
                <SelectDropdown
                  label="Number of Cards"
                  name="card_count"
                  value={formData.card_count}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, card_count: value }))}
                  options={[
                    { value: "3", label: "3 Cards - Celtic Cross (focused insight)" },
                    { value: "7", label: "7 Cards - General Overview" },
                    { value: "1", label: "1 Card - Daily Quick Read" }
                  ]}
                  helperText="Choose your spread: 3 cards for focused questions, 7 for broader guidance"
                />

                <SmartTextarea
                  label="Your Question or Context"
                  name="context"
                  value={formData.context}
                  onChange={(value) => setFormData(prev => ({ ...prev, context: value }))}
                  placeholder="e.g., 'What does the universe have in store for me regarding my career?'"
                  helperText="Speak freely about your situation. The cards respond to both specific questions and general curiosity."
                  rows={5}
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
                Draw the Cards
              </ActionButton>
            </form>

            <EmptyState
              icon={<Cards className="h-16 w-16 text-gray-600" />}
              title="Tarot Reading"
              description="Ask a question and let the cards reveal your path"
              tips={[
                "Focus on one area of your life for best results",
                "Be open to unexpected interpretations",
                "The cards reflect current energies, not fixed futures"
              ]}
            />
          </div>
        </main>
      </>
    );
  }

  return null;
};

export default ChatWithTarotsPage;
