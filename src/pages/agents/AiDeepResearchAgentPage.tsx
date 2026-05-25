import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Search, Globe } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ExamplePrompt } from "@/components/agent-ui/ExamplePrompt";

const STORAGE_KEY = 'ai-deep-research-agent';

const AiDeepResearchAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [firecrawlApiKey, setFirecrawlApiKey] = useState("");
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
        setFirecrawlApiKey(parsed.firecrawlApiKey || "");
        setTopic(parsed.topic || "");
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ openaiApiKey, firecrawlApiKey, topic }));
  }, [openaiApiKey, firecrawlApiKey, topic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Please enter a research topic");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-deep-research-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openai_api_key: openaiApiKey,
          firecrawl_api_key: firecrawlApiKey,
          enter_your_research_topic: topic,
          userId: user?.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Research failed');
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
    setFirecrawlApiKey("");
    setTopic("");
    setResult(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-20">
        <LoadingIndicator message="Conducting deep research..." subtext="This may take 30-60 seconds as we gather sources from across the web" />
      </div>
    );
  }

  if (result && result.status === 'completed') {
    return (
      <>
        <Helmet>
          <title>Research Results - AiDeepResearchAgent</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-500 rounded-3xl mb-6">
                <Globe className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Research Complete</h1>
              <p className="text-xl text-gray-400">Your comprehensive research report is ready</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<Globe />}
                title="Sources Found"
                value={result.sources?.length || result.sourceCount || "—"}
                subtext="Web sources analysed"
                variant="info"
              />
              <ResultCard
                icon={<Search />}
                title="Depth Level"
                value={result.depth || "Comprehensive"}
                variant="success"
              />
            </ResultGrid>

            <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Research Report</h3>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{result.result}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Research Another Topic
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
        <title>AiDeepResearchAgent - VideoRemix.vip</title>
        <meta name="description" content="Conduct comprehensive deep research on any topic using AI-powered web scraping and analysis." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-500 rounded-3xl mb-6">
              <Search className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Ai Deep Research Agent</h1>
            <p className="text-xl text-gray-400">Conduct comprehensive research powered by AI</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Research Configuration</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <SmartInput
                  label="OpenAI API Key"
                  name="openaiApiKey"
                  value={openaiApiKey}
                  onChange={setOpenaiApiKey}
                  type="password"
                  placeholder="sk-... (required for GPT-4 access)"
                  helperText="Your API key enables GPT-4 for advanced reasoning. Stored locally."
                  required
                />

                <SmartInput
                  label="Firecrawl API Key"
                  name="firecrawlApiKey"
                  value={firecrawlApiKey}
                  onChange={setFirecrawlApiKey}
                  type="password"
                  placeholder="fc-... (required for web scraping)"
                  helperText="Firecrawl enables comprehensive web scraping. Get one at firecrawl.dev"
                  required
                />

                <SmartTextarea
                  label="Research Topic"
                  name="topic"
                  value={topic}
                  onChange={setTopic}
                  placeholder="Enter your research topic... e.g., 'Impact of quantum computing on cryptography in banking sector'"
                  helperText="Be specific about your research question. Include scope, time period, and context for best results."
                  required
                  rows={3}
                />

                <ExamplePrompt
                  title="Try one of these research topics:"
                  examples={[
                    "Latest developments in renewable energy storage",
                    "Impact of remote work on commercial real estate",
                    "AI regulation trends in the European Union",
                  ]}
                  onSelect={setTopic}
                />

                {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

                <div className="flex gap-3">
                  <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={!topic.trim()}>
                    <Search className="h-4 w-4" />
                    Start Research
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          <EmptyState
            icon={<Globe className="h-16 w-16 text-gray-600" />}
            title="No research results yet"
            description="Enter a topic and let AI conduct comprehensive deep research across the web"
            tips={[
              "Be specific about the scope and context",
              "Include time periods when relevant",
              "Mention specific industries or regions",
              "The more detail, the more valuable the research"
            ]}
          />
        </div>
      </main>
    </>
  );
};

export default AiDeepResearchAgentPage;