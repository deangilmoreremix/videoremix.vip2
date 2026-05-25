import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { FormSection } from "@/components/agent-ui/FormSection";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, Globe, HelpCircle } from "lucide-react";

const Llama31LocalRagPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ enter_webpage_url: "", ask_any_question_about_the_webpage: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('llama31-local-rag-data');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('llama31-local-rag-data', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.enter_webpage_url.trim()) {
      setError("Please enter a webpage URL");
      return;
    }
    if (!formData.ask_any_question_about_the_webpage.trim()) {
      setError("Please enter your question");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/llama3-1-local-rag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem('llama31-local-rag-data');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ enter_webpage_url: "", ask_any_question_about_the_webpage: "" });
    setResult(null);
  };

  return (
    <>
      <Helmet>
        <title>Llama31LocalRag - VideoRemix.vip</title>
        <meta name="description" content="Use llama3-1-local-rag to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-cyan-500 rounded-3xl mb-6">
              <Globe className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Llama3.1 Local RAG</h1>
            <p className="text-xl text-gray-400">Ask questions about any webpage using local LLM-powered RAG.</p>
          </motion.div>

          {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

          {!result ? (
            <Card className="bg-gray-800/50 border-gray-700 mb-8">
              <CardHeader><CardTitle>Webpage Q&A Configuration</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <FormSection title="Webpage Source" description="Enter the URL of the webpage you want to analyze">
                    <SmartInput
                      label="Enter Webpage URL"
                      name="enter_webpage_url"
                      type="url"
                      value={formData.enter_webpage_url}
                      onChange={(val) => setFormData({ ...formData, enter_webpage_url: val })}
                      placeholder="https://example.com/article"
                      helperText="Enter the full URL including https://. The page content will be extracted and indexed for Q&A."
                      required
                    />
                  </FormSection>

                  <FormSection title="Your Question" description="Ask anything about the webpage content">
                    <SmartTextarea
                      label="Ask any question about the webpage"
                      name="ask_any_question_about_the_webpage"
                      value={formData.ask_any_question_about_the_webpage}
                      onChange={(val) => setFormData({ ...formData, ask_any_question_about_the_webpage: val })}
                      placeholder="What is the main topic of this article? Summarize the key points."
                      helperText="Ask specific questions about the content. For best results, reference exact sections or data from the page."
                      rows={4}
                      required
                    />
                  </FormSection>

                  <div className="flex gap-3 pt-4">
                    <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={!formData.enter_webpage_url.trim()}>
                      <Sparkles className="h-4 w-4" />
                      Ask Question
                    </ActionButton>
                    <ActionButton variant="ghost" onClick={handleClear} disabled={loading}>
                      Clear
                    </ActionButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : loading ? (
            <LoadingIndicator message="Processing webpage..." subtext="Extracting content and generating answer" />
          ) : null}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultGrid columns={2}>
                <ResultCard
                  icon={<Globe className="h-5 w-5" />}
                  title="Source URL"
                  value={formData.enter_webpage_url}
                  subtext="Webpage analyzed"
                />
                <ResultCard
                  icon={<Sparkles className="h-5 w-5" />}
                  title="Status"
                  value="Completed"
                  variant="success"
                />
              </ResultGrid>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>Answer</CardTitle></CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans text-gray-200">{result.result}</pre>
                  </div>
                </CardContent>
              </Card>

              <ActionButton onClick={() => { setResult(null); setFormData({ enter_webpage_url: "", ask_any_question_about_the_webpage: "" }); }} variant="secondary" className="w-full">
                Ask Another Question
              </ActionButton>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
};

export default Llama31LocalRagPage;
