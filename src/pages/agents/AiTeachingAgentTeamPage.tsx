import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, Key, Compass, Search, BookOpen } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { FormSection } from "@/components/agent-ui/FormSection";

const STORAGE_KEY = 'ai-teaching-agent-team-form';

const AiTeachingAgentTeamPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ 
    enter_your_openai_api_key: "", 
    enter_your_composio_api_key: "", 
    enter_your_serpapi_key: "", 
    enter_the_topic_you_want_to_learn_about: "" 
  });
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
    if (!formData.enter_the_topic_you_want_to_learn_about.trim()) {
      setError("Please enter a topic you want to learn about");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-teaching-agent-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
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
    setFormData({ enter_your_openai_api_key: "", enter_your_composio_api_key: "", enter_your_serpapi_key: "", enter_the_topic_you_want_to_learn_about: "" });
    setResult(null);
    setError(null);
  };

  return (
    <>
      <Helmet>
        <title>AiTeachingAgentTeam - VideoRemix.vip</title>
        <meta name="description" content="Use ai-teaching-agent-team to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-cyan-500 rounded-3xl mb-6">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">AI Teaching Agent Team</h1>
            <p className="text-xl text-gray-400">Learn any topic with AI-powered teaching agents that search and synthesize information for you.</p>
          </motion.div>

          {!result && !loading && (
            <EmptyState
              icon={<Sparkles className="h-16 w-16 text-gray-600" />}
              title="Ready to learn something new?"
              description="Enter a topic you want to learn about and let our AI teaching team guide you through it."
              tips={[
                "Enter a specific topic like 'quantum physics basics' or 'French cooking techniques'",
                "Have your API keys ready for OpenAI, Composio, and SerpAPI",
                "The more specific your topic, the better your learning experience"
              ]}
            />
          )}

          <FormSection
            title="API Configuration"
            description="Enter your API keys to enable the teaching agent team"
          >
            <SmartInput
              label="OpenAI API Key"
              name="enter_your_openai_api_key"
              type="password"
              value={formData.enter_your_openai_api_key}
              onChange={(val) => setFormData({ ...formData, enter_your_openai_api_key: val })}
              placeholder="sk-..."
              helperText="Your OpenAI API key for GPT-powered learning. Stored locally."
              required
            />

            <SmartInput
              label="Composio API Key"
              name="enter_your_composio_api_key"
              type="password"
              value={formData.enter_your_composio_api_key}
              onChange={(val) => setFormData({ ...formData, enter_your_composio_api_key: val })}
              placeholder="Enter your Composio API key"
              helperText="Composio API key for tool orchestration"
              required
            />

            <SmartInput
              label="SerpAPI Key"
              name="enter_your_serpapi_key"
              type="password"
              value={formData.enter_your_serpapi_key}
              onChange={(val) => setFormData({ ...formData, enter_your_serpapi_key: val })}
              placeholder="Enter your SerpAPI key"
              helperText="SerpAPI key for web search functionality"
              required
            />
          </FormSection>

          <FormSection
            title="Learning Topic"
            description="What would you like to learn about today?"
          >
            <SmartInput
              label="Topic to Learn"
              name="enter_the_topic_you_want_to_learn_about"
              value={formData.enter_the_topic_you_want_to_learn_about}
              onChange={(val) => setFormData({ ...formData, enter_the_topic_you_want_to_learn_about: val })}
              placeholder="e.g., How neural networks learn, History of the Roman Empire"
              helperText="Enter any topic you're curious about. Be specific for better results."
              required
            />
          </FormSection>

          {error && (
            <ErrorMessage
              title="Request failed"
              message={error}
              onRetry={handleSubmit}
              retryLoading={loading}
            />
          )}

          {loading && (
            <LoadingIndicator
              message="Setting up your learning session..."
              subtext="Researching and preparing educational content"
            />
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultGrid columns={1}>
                <ResultCard
                  icon={<BookOpen className="h-5 w-5" />}
                  title="Learning Session Complete"
                  description={result.result}
                  variant="success"
                />
              </ResultGrid>

              <ActionButton onClick={handleClear} variant="ghost" className="w-full">
                Start New Learning Session
              </ActionButton>
            </motion.div>
          )}

          {!result && !loading && (
            <div className="flex gap-3 mt-6">
              <ActionButton onClick={handleSubmit} loading={loading} size="lg" className="flex-1">
                <Sparkles className="h-4 w-4" />
                Start Learning
              </ActionButton>
              <ActionButton onClick={handleClear} variant="ghost" size="lg">
                Clear
              </ActionButton>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default AiTeachingAgentTeamPage;
