import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { FileUploadZone } from "@/components/agent-ui/FileUploadZone";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { Upload, Sparkles, Layout } from "lucide-react";

const STORAGE_KEY = 'frontend-agent';

const FrontendPage: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.fileName) {
          // File cannot be restored from localStorage
        }
      } catch {}
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload a file");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/frontend`, {
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
          <title>Frontend - VideoRemix.vip</title>
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
                  icon={<Layout className="h-5 w-5" />}
                  title="Frontend Analysis Result"
                  description={result.result || result.response || JSON.stringify(result, null, 2)}
                  variant="success"
                />
              </ResultGrid>
              <div className="flex justify-center">
                <ActionButton onClick={() => { setResult(null); setFile(null); }}>
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
    return <LoadingIndicator message="Processing frontend..." subtext="Analyzing frontend code and structure" />;
  }

  if (!result && !loading) {
    return (
      <>
        <Helmet>
          <title>Frontend - VideoRemix.vip</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-500 rounded-3xl mb-6">
                <Layout className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Frontend Agent</h1>
              <p className="text-xl text-gray-400">AI-powered frontend code analysis and generation.</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 space-y-6">
                <FormSection title="File Upload" description="Upload your frontend code or design file">
                  <FileUploadZone
                    accept=".tsx,.jsx,.ts,.js,.figma,.sketch"
                    maxSize={10 * 1024 * 1024}
                    onFileSelect={setFile}
                    selectedFile={file}
                    helperText="Upload frontend code files (TSX, JSX, TS, JS) or design files (Figma, Sketch up to 10MB)"
                  />
                </FormSection>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <ActionButton type="submit" loading={loading} size="lg" className="w-full" disabled={!file}>
                <Sparkles className="h-4 w-4" />
                Analyze Frontend
              </ActionButton>
            </form>

            <EmptyState
              icon={<Layout className="h-16 w-16 text-gray-600" />}
              title="Frontend Code Analysis"
              description="Upload your frontend code and get AI-powered insights"
              tips={[
                "Upload React, Vue, or Angular component files",
                "You can also upload Figma or Sketch files for design analysis",
                "The AI will analyze code quality, structure, and best practices"
              ]}
            />
          </div>
        </main>
      </>
    );
  }

  return null;
};

export default FrontendPage;
