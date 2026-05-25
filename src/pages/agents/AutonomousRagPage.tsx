import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, FileSearch, Brain } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ExamplePrompt } from "@/components/agent-ui/ExamplePrompt";

const STORAGE_KEY = 'autonomous-rag-form';

const AutonomousRagPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ _ask_your_question: "" });
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
    if (!formData._ask_your_question.trim()) {
      setError("Please enter a question");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/autonomous-rag`, {
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
    setFormData({ _ask_your_question: "" });
    setResult(null);
    setError(null);
  };

  return (
    <>
      <Helmet>
        <title>AutonomousRag - VideoRemix.vip</title>
        <meta name="description" content="Use autonomous-rag to get AI-powered answers from your documents." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-500 rounded-3xl mb-6">
              <Brain className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Autonomous RAG</h1>
            <p className="text-xl text-gray-400">Ask questions about your documents and get AI-powered answers using Retrieval-Augmented Generation.</p>
          </motion.div>

          {!result && !loading && (
            <EmptyState
              icon={<FileSearch className="h-16 w-16 text-gray-600" />}
              title="Ask anything about your documents"
              description="Upload your documents and ask questions. The AI will find relevant information and provide accurate answers."
              tips={[
                "Ask specific questions about your document content",
                "Example: 'What are the key findings in this research paper?'",
                "Example: 'Summarize the main points of this article'",
                "The AI searches through your documents to find relevant answers"
              ]}
            />
          )}

          <FormSection
            title="Your Question"
            description="Ask anything about your documents"
          >
            <SmartInput
              label="Question"
              name="_ask_your_question"
              value={formData._ask_your_question}
              onChange={(val) => setFormData({ ...formData, _ask_your_question: val })}
              placeholder="e.g., What are the main conclusions of this document?"
              helperText="Ask a clear, specific question about your document content"
              required
            />

            <ExamplePrompt
              examples={[
                "What are the key takeaways from this document?",
                "Summarize the main arguments presented",
                "Find all references to specific data or statistics",
                "What methodology was used in this study?"
              ]}
              onSelect={(val) => setFormData({ ...formData, _ask_your_question: val })}
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
              message="Searching your documents..."
              subtext="Finding relevant information and generating answer"
            />
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultGrid columns={1}>
                <ResultCard
                  icon={<FileSearch className="h-5 w-5" />}
                  title="Answer"
                  description={result.result}
                  variant="success"
                />
              </ResultGrid>

              <ActionButton onClick={handleClear} variant="ghost" className="w-full">
                Ask Another Question
              </ActionButton>
            </motion.div>
          )}

          {!result && !loading && (
            <div className="flex gap-3 mt-6">
              <ActionButton onClick={handleSubmit} loading={loading} size="lg" className="flex-1">
                <Sparkles className="h-4 w-4" />
                Get Answer
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

export default AutonomousRagPage;
