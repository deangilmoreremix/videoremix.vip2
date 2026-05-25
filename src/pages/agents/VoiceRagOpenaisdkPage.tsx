import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Loader2, Upload, FileText } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { FormSection } from "@/components/agent-ui/FormSection";
import { FileUploadZone } from "@/components/agent-ui/FileUploadZone";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";

const STORAGE_KEY = "voice-rag-openaisdk-form";

interface FormData {
  qdrant_url: string;
  qdrant_api_key: string;
  openai_api_key: string;
  select_voice: string;
  upload_pdf: string;
  question: string;
}

const VoiceRagOpenaisdkPage: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          qdrant_url: "",
          qdrant_api_key: "",
          openai_api_key: "",
          select_voice: "",
          upload_pdf: "",
          question: "",
        };
      }
    }
    return {
      qdrant_url: "",
      qdrant_api_key: "",
      openai_api_key: "",
      select_voice: "",
      upload_pdf: "",
      question: "",
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      formDataToSend.append('qdrant_url', formData.qdrant_url || '');
      formDataToSend.append('qdrant_api_key', formData.qdrant_api_key || '');
      formDataToSend.append('openai_api_key', formData.openai_api_key || '');
      formDataToSend.append('select_voice', formData.select_voice || '');
      formDataToSend.append('upload_pdf', formData.upload_pdf || '');
      formDataToSend.append('what_would_you_like_to_know_about_the_documentation', formData.question || '');
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-rag-openaisdk`, {
        method: 'POST',
        body: formDataToSend
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>VoiceRagOpenaisdk - VideoRemix.vip</title>
        <meta name="description" content="Use voice-rag-openaisdk to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-500 rounded-3xl mb-6">
              <Upload className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Voice Rag Openaisdk</h1>
            <p className="text-xl text-gray-400">AI-powered voice rag openaisdk.</p>
          </motion.div>

          <FormSection title="Upload & Configure" description="Upload your file and configure the voice rag service">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="col-span-full">
                <FileUploadZone
                  accept="*/*"
                  onFileSelect={(files) => setFile(files as File | null)}
                  selectedFile={file}
                  helperText="Upload a file to process with the voice rag service"
                />
              </div>

              <div className="col-span-full">
                <SmartInput
                  label="Qdrant URL"
                  name="qdrant_url"
                  value={formData.qdrant_url}
                  onChange={(val) => updateField("qdrant_url", val)}
                  placeholder="e.g., 'https://localhost:6333' or cloud URL"
                  helperText="The URL of your Qdrant instance (local or cloud)"
                  required
                />
              </div>

              <div className="col-span-full">
                <ApiKeyInput
                  label="Qdrant API Key"
                  value={formData.qdrant_api_key}
                  onChange={(val) => updateField("qdrant_api_key", val)}
                  helperText="Your Qdrant API key for authentication"
                  required
                />
              </div>

              <div className="col-span-full">
                <ApiKeyInput
                  label="OpenAI API Key"
                  value={formData.openai_api_key}
                  onChange={(val) => updateField("openai_api_key", val)}
                  helperText="Your OpenAI API key for voice synthesis"
                  required
                />
              </div>

              <div className="col-span-full">
                <SmartInput
                  label="Select Voice"
                  name="select_voice"
                  value={formData.select_voice}
                  onChange={(val) => updateField("select_voice", val)}
                  placeholder="e.g., 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'"
                  helperText="Choose an OpenAI voice for synthesis"
                  required
                />
              </div>

              <div className="col-span-full">
                <SmartInput
                  label="Upload PDF"
                  name="upload_pdf"
                  value={formData.upload_pdf}
                  onChange={(val) => updateField("upload_pdf", val)}
                  placeholder="URL or path to PDF"
                  helperText="URL or path to the PDF documentation to query"
                  required
                />
              </div>

              <div className="col-span-full">
                <SmartTextarea
                  label="What would you like to know about the documentation?"
                  name="question"
                  value={formData.question}
                  onChange={(val) => updateField("question", val)}
                  placeholder="e.g., 'How do I configure authentication?'"
                  helperText="Enter your question about the documentation"
                  required
                />
              </div>

              <div className="col-span-full pt-2">
                <ActionButton
                  type="submit"
                  loading={loading}
                  loadingText="Processing..."
                  disabled={loading || !file}
                  className="w-full"
                >
                  Process File
                </ActionButton>
              </div>
            </form>
          </FormSection>

          {loading && (
            <LoadingIndicator
              message="Processing your file..."
              subtext="This may take a few moments"
            />
          )}

          {error && (
            <ErrorMessage
              title="Processing Failed"
              message={error}
              onRetry={handleSubmit}
            />
          )}

          {!file && !loading && !result && (
            <EmptyState
              icon={<FileText className="h-12 w-12 text-gray-400" />}
              title="No File Uploaded"
              description="Upload a file to get started with the voice rag openaisdk service."
              tips={[
                "Upload a document file to process",
                "Configure your Qdrant and OpenAI credentials",
                "Select a voice for synthesis",
                "Ask a question about your documentation"
              ]}
            />
          )}

          {result && !loading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <ResultGrid columns={1}>
                <ResultCard
                  title="Result"
                  variant="success"
                  icon="check"
                >
                  <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans text-gray-300">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </ResultCard>
              </ResultGrid>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
};

export default VoiceRagOpenaisdkPage;
