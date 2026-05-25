import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Search, FolderOpen } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ExamplePrompt } from "@/components/agent-ui/ExamplePrompt";

const STORAGE_KEY = 'ai-domain-deep-research-agent';

const DOMAIN_SUGGESTIONS = [
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "legal", label: "Legal" },
  { value: "marketing", label: "Marketing" },
  { value: "academia", label: "Academia" },
  { value: "science", label: "Science" },
];

const AiDomainDeepResearchAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTopic(parsed.topic || "");
        setDomain(parsed.domain || "");
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ topic, domain }));
  }, [topic, domain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Please enter a research topic");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-domain-deep-research-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          what_topic_would_you_like_to_research: topic,
          what_domain_is_this_topic_in: domain,
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
    setTopic("");
    setDomain("");
    setResult(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-20">
        <LoadingIndicator message="Conducting domain-specific research..." subtext="Analysing sources within the selected domain" />
      </div>
    );
  }

  if (result && result.status === 'completed') {
    return (
      <>
        <Helmet>
          <title>Research Results - AiDomainDeepResearchAgent</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-3xl mb-6">
                <FolderOpen className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Research Complete</h1>
              <p className="text-xl text-gray-400">Your domain-specific research report is ready</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<FolderOpen />}
                title="Domain"
                value={result.domain || domain || "General"}
                variant="info"
              />
              <ResultCard
                icon={<Search />}
                title="Sources Analysed"
                value={result.sources?.length || "—"}
                subtext="Domain-specific sources"
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
        <title>AiDomainDeepResearchAgent - VideoRemix.vip</title>
        <meta name="description" content="Conduct deep research within a specific domain or field for focused, expert-level insights." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-3xl mb-6">
              <Search className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Ai Domain Deep Research Agent</h1>
            <p className="text-xl text-gray-400">Research topics within a specific domain</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Research Parameters</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <SmartTextarea
                  label="Research Topic"
                  name="topic"
                  value={topic}
                  onChange={setTopic}
                  placeholder="What would you like to research? e.g., 'Machine learning applications in diagnostic radiology'"
                  helperText="Enter a topic within your selected domain. Be specific about the aspect you want to explore."
                  required
                  rows={3}
                />

                <SmartInput
                  label="Domain/Field"
                  name="domain"
                  value={domain}
                  onChange={setDomain}
                  placeholder="e.g., healthcare, legal, finance, technology"
                  helperText="Specify the domain to focus the research. Examples: healthcare, finance, legal, marketing"
                />

                <ExamplePrompt
                  title="Try one of these domain-topic combinations:"
                  examples={[
                    "Topic: 'Natural language processing in legal document review' + Domain: 'legal'",
                    "Topic: 'Sustainable packaging innovations' + Domain: 'environmental'",
                    "Topic: 'Blockchain in supply chain management' + Domain: 'logistics'",
                  ]}
                  onSelect={(example) => {
                    const [topicPart] = example.split(' + Domain:');
                    setTopic(topicPart.replace('Topic: ', ''));
                  }}
                />

                {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

                <div className="flex gap-3">
                  <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={!topic.trim()}>
                    <Search className="h-4 w-4" />
                    Start Domain Research
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          <EmptyState
            icon={<FolderOpen className="h-16 w-16 text-gray-600" />}
            title="No research results yet"
            description="Enter a topic, select a domain, and let AI conduct focused domain-specific research"
            tips={[
              "Choose a specific domain for more focused results",
              "Combine domain expertise with your topic",
              "Include context about what you're trying to learn",
              "Mention any specific companies or frameworks"
            ]}
          />
        </div>
      </main>
    </>
  );
};

export default AiDomainDeepResearchAgentPage;