import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ExamplePrompt } from "@/components/agent-ui/ExamplePrompt";
import { Loader2, Sparkles, Globe, Key, Link, HelpCircle, FileText } from "lucide-react";

const AgenticRagWithReasoningPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ 
    google_api_key: "", 
    openai_api_key: "", 
    add_new_url: "", 
    your_question: "" 
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('agentic-rag-reasoning-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('agentic-rag-reasoning-state', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.google_api_key.trim() || !formData.openai_api_key.trim() || !formData.add_new_url.trim() || !formData.your_question.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agentic-rag-with-reasoning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem('agentic-rag-reasoning-state');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>AgenticRagWithReasoning - VideoRemix.vip</title>
        <meta name="description" content="Use agentic-rag-with-reasoning to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Agentic Rag With Reasoning</h1>
            <p className="text-xl text-gray-400">AI-powered agentic rag with reasoning.</p>
          </motion.div>

          {error && <ErrorMessage title="Request Failed" message={error} onRetry={handleSubmit} retryLoading={loading} />}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="API Keys" description="Enter your API keys to enable AI processing">
                  <ApiKeyInput
                    label="Google API Key"
                    name="google_api_key"
                    value={formData.google_api_key}
                    onChange={(val) => setFormData({ ...formData, google_api_key: val })}
                    placeholder="AIza..."
                    helperText="Get your API key from Google Cloud Console"
                    required
                  />

                  <ApiKeyInput
                    label="OpenAI API Key"
                    name="openai_api_key"
                    value={formData.openai_api_key}
                    onChange={(val) => setFormData({ ...formData, openai_api_key: val })}
                    placeholder="sk-..."
                    helperText="Get your API key from OpenAI Platform"
                    required
                  />
                </FormSection>

                <FormSection title="Data Source" description="Enter the URL to analyze">
                  <SmartInput
                    label="Add new URL"
                    name="add_new_url"
                    type="url"
                    value={formData.add_new_url}
                    onChange={(val) => setFormData({ ...formData, add_new_url: val })}
                    placeholder="https://example.com/article"
                    helperText="Enter a full URL including https://"
                    required
                  />
                </FormSection>

                <FormSection title="Question" description="Ask anything about the content">
                  <SmartTextarea
                    label="Your question"
                    name="your_question"
                    value={formData.your_question}
                    onChange={(val) => setFormData({ ...formData, your_question: val })}
                    placeholder="What are the main topics covered in this article?"
                    helperText="Be specific for better results"
                    rows={4}
                    required
                  />

                  <ExamplePrompt
                    examples={[
                      "What is the main argument of this article?",
                      "Summarize the key findings",
                      "What evidence supports the conclusion?",
                    ]}
                    onSelect={(q) => setFormData({ ...formData, your_question: q })}
                  />
                </FormSection>

                <ActionButton type="submit" loading={loading} disabled={loading} size="lg" className="w-full">
                  <Sparkles className="h-4 w-4" />
                  Generate Results
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator 
              message="Processing your request..." 
              subtext="This may take a few moments"
            />
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultCard
                icon={<FileText className="h-5 w-5" />}
                title="Analysis Result"
                description={result.result}
                variant="success"
              />

              <EmptyState
                icon={<Sparkles className="h-16 w-16 text-gray-600" />}
                title="Analysis Complete"
                description="Your RAG reasoning analysis is ready above."
                action={
                  <ActionButton onClick={() => { setResult(null); setFormData({ google_api_key: "", openai_api_key: "", add_new_url: "", your_question: "" }); }}>
                    Start New Analysis
                  </ActionButton>
                }
              />
            </motion.div>
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Globe className="h-16 w-16 text-gray-600" />}
              title="Ready to Analyze"
              description="Enter a URL and ask questions to get AI-powered insights from the content."
              tips={[
                "Enter a valid URL including https://",
                "Ask specific questions about the content",
                "Use the example prompts below for inspiration",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AgenticRagWithReasoningPage;