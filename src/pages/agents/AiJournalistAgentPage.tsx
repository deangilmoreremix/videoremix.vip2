import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, FileText, Search } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ExamplePrompt } from "@/components/agent-ui/ExamplePrompt";

const STORAGE_KEY = 'ai-journalist-agent';

const AiJournalistAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [serpApiKey, setSerpApiKey] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setOpenaiApiKey(parsed.openaiApiKey || "");
        setSerpApiKey(parsed.serpApiKey || "");
        setTopic(parsed.topic || "");
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ openaiApiKey, serpApiKey, topic }));
  }, [openaiApiKey, serpApiKey, topic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Please enter a topic for the article");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-journalist-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enter_openai_api_key_to_access_gpt4o: openaiApiKey,
          enter_serp_api_key_for_search_functionality: serpApiKey,
          what_do_you_want_the_ai_journalist_to_write_an_article_on: topic,
          userId: user?.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Article generation failed');
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOpenaiApiKey("");
    setSerpApiKey("");
    setTopic("");
    setResult(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-20">
        <LoadingIndicator message="Researching and writing your article..." subtext="Gathering sources and crafting compelling content" />
      </div>
    );
  }

  if (result && result.status === 'completed') {
    return (
      <>
        <Helmet>
          <title>Article - AiJournalistAgent</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-600 to-orange-500 rounded-3xl mb-6">
                <FileText className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Article Written</h1>
              <p className="text-xl text-gray-400">Your AI-crafted article is ready</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<FileText />}
                title="Word Count"
                value={result.wordCount || result.words || "—"}
                subtext="words generated"
                variant="info"
              />
              <ResultCard
                icon={<Search />}
                title="Sources Used"
                value={result.sources?.length || "—"}
                subtext="web sources researched"
                variant="success"
              />
            </ResultGrid>

            <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Article</h3>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{result.result}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Write Another Article
              </ActionButton>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>AiJournalistAgent - VideoRemix.vip</title>
        <meta name="description" content="Generate well-researched, professional news articles on any topic using AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-600 to-orange-500 rounded-3xl mb-6">
              <FileText className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Ai Journalist Agent</h1>
            <p className="text-xl text-gray-400">Write professional, research-backed articles with AI</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Article Configuration</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <SmartInput
                  label="OpenAI API Key"
                  name="openaiApiKey"
                  value={openaiApiKey}
                  onChange={setOpenaiApiKey}
                  type="password"
                  placeholder="sk-... (required for GPT-4o)"
                  helperText="Your API key for GPT-4o access. Stored locally only."
                  required
                />

                <SmartInput
                  label="Serp API Key"
                  name="serpApiKey"
                  value={serpApiKey}
                  onChange={setSerpApiKey}
                  type="password"
                  placeholder="... (required for web search)"
                  helperText="Required for real-time web search. Get one at serpapi.com"
                  required
                />

                <SmartTextarea
                  label="Article Topic"
                  name="topic"
                  value={topic}
                  onChange={setTopic}
                  placeholder="What would you like the AI journalist to write about? e.g., 'The impact of remote work on commercial real estate in major metropolitan areas'"
                  helperText="Be specific about the angle and scope. Include relevant context, timeframes, or geographic focus."
                  required
                  rows={4}
                />

                <ExamplePrompt
                  title="Try one of these article topics:"
                  examples={[
                    "How AI is transforming healthcare diagnostics in 2026",
                    "The rise of sustainable packaging in e-commerce",
                    "Remote work trends and their effect on urban planning",
                  ]}
                  onSelect={setTopic}
                />

                {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

                <div className="flex gap-3">
                  <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={!topic.trim()}>
                    <FileText className="h-4 w-4" />
                    Write Article
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          <EmptyState
            icon={<FileText className="h-16 w-16 text-gray-600" />}
            title="No article written yet"
            description="Enter a topic and let AI research and write a professional article for you"
            tips={[
              "Be specific about the angle and perspective",
              "Include relevant timeframes or current events",
              "Mention specific industries or demographics",
              "Consider adding a target audience description"
            ]}
          />
        </div>
      </main>
    </>
  );
};

export default AiJournalistAgentPage;