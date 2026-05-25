import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { FileUploadZone } from "@/components/agent-ui/FileUploadZone";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { Upload, FileText, Sparkles, Search } from "lucide-react";

const STORAGE_KEY = 'corrective-rag';

const CorrectiveRagPage: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTextValues(parsed.textValues || {});
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ textValues }));
  }, [textValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textValues.please_enter_your_question?.trim()) {
      setError("Question is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      Object.entries(textValues).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/corrective-rag`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <>
        <Helmet>
          <title>CorrectiveRag - VideoRemix.vip</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <ResultGrid columns={1}>
                <ResultCard
                  icon={<Search className="h-5 w-5" />}
                  title="RAG Analysis Result"
                  description={result.result || result.response || JSON.stringify(result, null, 2)}
                  variant="success"
                />
              </ResultGrid>
              <div className="flex justify-center">
                <ActionButton onClick={() => { setResult(null); setFile(null); setTextValues({}); }}>
                  <Sparkles className="h-4 w-4" />
                  New Analysis
                </ActionButton>
              </div>
            </motion.div>
          </div>
        </main>
      </>
    );
  }

  if (loading) {
    return <LoadingIndicator message="Processing document..." subtext="Running corrective RAG analysis" />;
  }

  if (!result && !loading) {
    return (
      <>
        <Helmet>
          <title>CorrectiveRag - VideoRemix.vip</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-500 rounded-3xl mb-6">
                <Upload className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Corrective RAG</h1>
              <p className="text-xl text-gray-400">AI-powered corrective retrieval augmented generation.</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 space-y-6">
                <FormSection title="Document Upload" description="Upload a document or provide a URL">
                  <FileUploadZone
                    accept=".pdf,.txt,.docx"
                    maxSize={10 * 1024 * 1024}
                    onFileSelect={setFile}
                    selectedFile={file}
                    helperText="Upload a document for RAG analysis (PDF, TXT, DOCX up to 10MB)"
                  />
                </FormSection>

                <FormSection title="API Configuration" description="Enter your API keys">
                  <div className="space-y-4">
                    <SmartInput
                      label="Anthropic API Key"
                      name="anthropic_api_key"
                      value={textValues.anthropic_api_key || ''}
                      onChange={(value) => setTextValues(prev => ({ ...prev, anthropic_api_key: value }))}
                      type="password"
                      placeholder="sk-ant-..."
                      helperText="Required for Claude-powered analysis"
                    />

                    <SmartInput
                      label="OpenAI API Key"
                      name="openai_api_key"
                      value={textValues.openai_api_key || ''}
                      onChange={(value) => setTextValues(prev => ({ ...prev, openai_api_key: value }))}
                      type="password"
                      placeholder="sk-..."
                      helperText="Required for GPT-powered analysis"
                    />

                    <SmartInput
                      label="Tavily API Key"
                      name="tavily_api_key"
                      value={textValues.tavily_api_key || ''}
                      onChange={(value) => setTextValues(prev => ({ ...prev, tavily_api_key: value }))}
                      type="password"
                      placeholder="tvly-..."
                      helperText="For enhanced web search capabilities"
                    />
                  </div>
                </FormSection>

                <FormSection title="Query" description="Enter your question about the document">
                  <SmartTextarea
                    label="Your Question"
                    name="please_enter_your_question"
                    value={textValues.please_enter_your_question || ''}
                    onChange={(value) => setTextValues(prev => ({ ...prev, please_enter_your_question: value }))}
                    placeholder="e.g., 'What are the main findings in this document?'"
                    helperText="Ask a specific question about the document content"
                    rows={4}
                    required
                  />
                </FormSection>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <ActionButton type="submit" loading={loading} size="lg" className="w-full">
                <Sparkles className="h-4 w-4" />
                Run Analysis
              </ActionButton>
            </form>

            <EmptyState
              icon={<FileText className="h-16 w-16 text-gray-600" />}
              title="Corrective RAG Analysis"
              description="Upload a document and ask questions to get AI-powered insights"
              tips={[
                "Upload a PDF, TXT, or DOCX file",
                "Provide your API keys for the AI services",
                "Ask specific questions about the document content"
              ]}
            />
          </div>
        </main>
      </>
    );
  }

  return null;
};

export default CorrectiveRagPage;
