import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, Upload, FileText, MessageSquare, XCircle } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { FormSection } from "@/components/agent-ui/FormSection";
import { FileUploadZone } from "@/components/agent-ui/FileUploadZone";
import { ExamplePrompt } from "@/components/agent-ui/ExamplePrompt";

const STORAGE_KEY = 'chat-with-pdf-form';

const ChatWithPdfPage: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload a PDF file");
      return;
    }
    if (!textValues.ask_a_question_about_the_pdf?.trim()) {
      setError("Please enter a question about the PDF");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_a_pdf_file', textValues.upload_a_pdf_file || '');
      formData.append('ask_a_question_about_the_pdf', textValues.ask_a_question_about_the_pdf || '');
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-pdf`, {
        method: 'POST',
        body: formData
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
    setFile(null);
    setTextValues({});
    setResult(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      <Helmet>
        <title>ChatWithPdf - VideoRemix.vip</title>
        <meta name="description" content="Use chat-with-pdf to ask questions about your PDF documents." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-500 rounded-3xl mb-6">
              <FileText className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Chat with PDF</h1>
            <p className="text-xl text-gray-400">Upload a PDF document and ask questions about its content. Get instant AI-powered answers from any PDF.</p>
          </motion.div>

          {!result && !loading && !file && (
            <EmptyState
              icon={<FileText className="h-16 w-16 text-gray-600" />}
              title="Upload a PDF to get started"
              description="Upload your PDF document and ask questions about its content. The AI will read and understand the document to answer your questions."
              tips={[
                "Upload a text-based PDF (not scanned images)",
                "Ask specific questions about the document content",
                "Example: 'What are the main conclusions of this research paper?'"
              ]}
            />
          )}

          <FormSection
            title="Document Upload"
            description="Select a PDF file to analyze (max 10MB)"
          >
            <div className="md:col-span-2">
              <FileUploadZone
                accept=".pdf"
                maxSize={10 * 1024 * 1024}
                onFileSelect={setFile}
                selectedFile={file}
                helperText="For best results, use text-based PDFs (not scanned images)"
              />
            </div>
          </FormSection>

          <FormSection
            title="Your Question"
            description="Ask anything about the PDF content"
          >
            <SmartTextarea
              label="Your Question"
              name="ask_a_question_about_the_pdf"
              value={textValues.ask_a_question_about_the_pdf || ''}
              onChange={(val) => setTextValues(prev => ({ ...prev, ask_a_question_about_the_pdf: val }))}
              placeholder="e.g., What are the key findings in this document?"
              helperText="Ask a clear, specific question about the PDF content"
              rows={3}
              required
            />

            <ExamplePrompt
              examples={[
                "Summarize the main points of this document",
                "What methodology was used in this study?",
                "Find all references to specific data or statistics",
                "What are the conclusions and recommendations?"
              ]}
              onSelect={(val) => setTextValues(prev => ({ ...prev, ask_a_question_about_the_pdf: val }))}
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
              message="Analyzing document..."
              subtext="Extracting text and generating answer"
            />
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultGrid columns={1}>
                <ResultCard
                  icon={<MessageSquare className="h-5 w-5" />}
                  title="Answer"
                  description={result.result}
                  variant="success"
                />
              </ResultGrid>

              <ActionButton onClick={handleClear} variant="ghost" className="w-full">
                Ask About Another Document
              </ActionButton>
            </motion.div>
          )}

          {!result && !loading && (
            <div className="flex gap-3 mt-6">
              <ActionButton onClick={handleSubmit} loading={loading} size="lg" className="flex-1" disabled={!file}>
                <Sparkles className="h-4 w-4" />
                Get Answer
              </ActionButton>
              <ActionButton onClick={handleClear} variant="ghost" size="lg" disabled={!file && !textValues.ask_a_question_about_the_pdf}>
                Clear
              </ActionButton>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default ChatWithPdfPage;
