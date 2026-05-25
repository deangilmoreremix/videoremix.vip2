import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ResultCard } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ExamplePrompt } from "@/components/agent-ui/ExamplePrompt";
import { Loader2, Sparkles, BookOpen, Search, Brain } from "lucide-react";

const AiArxivAgentMemoryPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ 
    research_interests_and_background: "", 
    research_paper_search_query: "" 
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ai-arxiv-memory-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ai-arxiv-memory-state', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.research_interests_and_background.trim() || !formData.research_paper_search_query.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-arxiv-agent-memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem('ai-arxiv-memory-state');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>AiArxivAgentMemory - VideoRemix.vip</title>
        <meta name="description" content="Use ai-arxiv-agent-memory to search and analyze research papers." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Ai Arxiv Agent Memory</h1>
            <p className="text-xl text-gray-400">AI-powered research paper search and analysis.</p>
          </motion.div>

          {error && <ErrorMessage title="Request Failed" message={error} onRetry={handleSubmit} retryLoading={loading} />}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Research Configuration</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Your Background" description="Tell us about your research interests">
                  <SmartTextarea
                    label="Research interests and background"
                    name="research_interests_and_background"
                    value={formData.research_interests_and_background}
                    onChange={(val) => setFormData({ ...formData, research_interests_and_background: val })}
                    placeholder="Machine learning, computer vision, natural language processing. PhD student focusing on transformer architectures."
                    helperText="Share your research areas and expertise level"
                    rows={4}
                    required
                  />
                </FormSection>

                <FormSection title="Search Query" description="Enter your research question or topic">
                  <SmartInput
                    label="Research paper search query"
                    name="research_paper_search_query"
                    value={formData.research_paper_search_query}
                    onChange={(val) => setFormData({ ...formData, research_paper_search_query: val })}
                    placeholder="attention mechanism in vision transformers"
                    helperText="Enter keywords, authors, or specific topics"
                    required
                  />

                  <ExamplePrompt
                    examples={[
                      "reinforcement learning from human feedback",
                      "graph neural networks for drug discovery",
                      "Yann LeCun self-supervised learning",
                    ]}
                    onSelect={(q) => setFormData({ ...formData, research_paper_search_query: q })}
                  />
                </FormSection>

                <ActionButton type="submit" loading={loading} disabled={loading} size="lg" className="w-full">
                  <Search className="h-4 w-4" />
                  Search Papers
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator 
              message="Searching ArXiv papers..." 
              subtext="Finding relevant research papers"
            />
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultCard
                icon={<BookOpen className="h-5 w-5" />}
                title="Research Results"
                description={result.result}
                variant="success"
              />

              <EmptyState
                icon={<Brain className="h-16 w-16 text-gray-600" />}
                title="Search Complete"
                description="Relevant papers found based on your query."
                action={
                  <ActionButton onClick={() => { setResult(null); setFormData({ research_interests_and_background: "", research_paper_search_query: "" }); }}>
                    Search Again
                  </ActionButton>
                }
              />
            </motion.div>
          )}

          {!result && !loading && (
            <EmptyState
              icon={<BookOpen className="h-16 w-16 text-gray-600" />}
              title="Ready to Research"
              description="Enter your research interests and search query to find relevant ArXiv papers."
              tips={[
                "Be specific about your research area",
                "Include author names if known",
                "Add keywords relevant to your field",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiArxivAgentMemoryPage;