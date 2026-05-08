import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, FileSearch } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";

const AgenticRagGpt5Page: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ 
    openai_api_key: "", 
    add_url: "", 
    your_question: "" 
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('rag-gpt5-form-data');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('rag-gpt5-form-data', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.add_url.trim()) {
      setError('Please enter a URL to analyze');
      return;
    }
    if (!formData.your_question.trim()) {
      setError('Please enter your question');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agentic-rag-gpt5`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem('rag-gpt5-form-data');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.add_url.trim() && formData.your_question.trim();

  return (
    <>
      <Helmet>
        <title>Agentic RAG with GPT-5 - VideoRemix.vip</title>
        <meta name="description" content="Agentic RAG powered by GPT-5 for advanced reasoning." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-rose-600 to-pink-600 rounded-3xl mb-6">
              <FileSearch className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Agentic RAG with GPT-5</h1>
            <p className="text-xl text-gray-400">Advanced RAG reasoning powered by GPT-5</p>
          </motion.div>

          {error && (
            <Card className="mb-6 border-red-500/50 bg-red-500/10">
              <CardContent className="pt-6">
                <p className="text-red-300">{error}</p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>RAG Configuration</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <ApiKeyInput
                  label="OpenAI API Key"
                  value={formData.openai_api_key}
                  onChange={(val) => setFormData({ ...formData, openai_api_key: val })}
                  helperText="Your API key is stored locally and encrypted"
                  required={false}
                />
              </div>

              <div className="space-y-2">
                <SmartInput
                  label="Add URL"
                  name="add_url"
                  type="url"
                  value={formData.add_url}
                  onChange={(val) => setFormData({ ...formData, add_url: val })}
                  placeholder="https://example.com/article or paste a URL to analyze"
                  helperText="Enter the URL of content to search and reason about"
                  required
                />
              </div>

              <div className="space-y-2">
                <SmartTextarea
                  label="Your question"
                  name="your_question"
                  value={formData.your_question}
                  onChange={(val) => setFormData({ ...formData, your_question: val })}
                  placeholder="What would you like to know about this content? e.g., 'Summarize the key findings and provide analysis'"
                  helperText="Ask a detailed question for GPT-5 to reason about"
                  rows={4}
                  required
                />
              </div>

                <ActionButton 
                  type="submit" 
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={!isFormValid}
                  className="w-full"
                  size="lg"
                >
                  <Sparkles className="h-4 w-4" />
                  {loading ? 'Processing...' : 'Query RAG'}
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-rose-500" />
                <p className="text-gray-400">Processing with GPT-5 advanced reasoning...</p>
              </CardContent>
            </Card>
          )}

           {result && result.status === 'completed' && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
               <Card className="bg-gray-800/50 border-gray-700">
                 <CardHeader><CardTitle>Query Results</CardTitle></CardHeader>
                 <CardContent>
                   <div className="bg-gray-900/50 rounded-lg p-4">
                     <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{result.result}</p>
                   </div>
                 </CardContent>
               </Card>
             </motion.div>
           )}

           {!result && !loading && (
             <EmptyState
               icon={<FileSearch className="h-16 w-16 text-gray-600" />}
               title="Ready to query"
               description="Enter a URL and question for GPT-5 powered RAG reasoning"
               tips={[
                 "URLs should contain text content to analyze",
                 "Be specific in your question for better results",
                 "GPT-5 provides advanced multi-step reasoning"
             ]}
             />
           )}
        </div>
      </main>
    </>
  );
};

export default AgenticRagGpt5Page;