import React, { useState, useEffect, useRef } from "react";
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
import { FileUploadZone } from "@/components/agent-ui/FileUploadZone";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Upload, FileText, Image, Sparkles } from "lucide-react";

const MultimodalAiAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('multimodal-agent-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTextValues(parsed.textValues || {});
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('multimodal-agent-data', JSON.stringify({ textValues }));
  }, [textValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload a file");
      return;
    }
    if (!textValues.enter_your_gemini_api_key?.trim()) {
      setError("Gemini API key is required");
      return;
    }
    if (!textValues.enter_your_taskquestion_for_the_ai_agent?.trim()) {
      setError("Please enter your task or question");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('enter_your_gemini_api_key', textValues.enter_your_gemini_api_key || '');
      formData.append('upload_image', textValues.upload_image || '');
      formData.append('enter_your_taskquestion_for_the_ai_agent', textValues.enter_your_taskquestion_for_the_ai_agent || '');
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/multimodal-ai-agent`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult(data);
      localStorage.removeItem('multimodal-agent-data');
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
  };

  return (
    <>
      <Helmet>
        <title>MultimodalAiAgent - VideoRemix.vip</title>
        <meta name="description" content="Use multimodal-ai-agent to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-500 rounded-3xl mb-6">
              <Upload className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Multimodal AI Agent</h1>
            <p className="text-xl text-gray-400">Process images and files with Gemini-powered AI analysis.</p>
          </motion.div>

          {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

          {!result ? (
            <Card className="bg-gray-800/50 border-gray-700 mb-8">
              <CardHeader><CardTitle>Upload & Configure</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <FormSection title="File Upload" description="Upload the file you want to analyze">
                    <FileUploadZone
                      accept="image/*,.pdf,.txt,.docx"
                      maxSize={10 * 1024 * 1024}
                      onFileSelect={setFile}
                      selectedFile={file}
                      helperText="Upload an image or document for analysis. Max 10MB."
                    />
                  </FormSection>

                  <FormSection title="API Configuration" description="Enter your Gemini API key">
                    <ApiKeyInput
                      label="Gemini API Key"
                      name="enter_your_gemini_api_key"
                      value={textValues.enter_your_gemini_api_key || ''}
                      onChange={(val) => setTextValues(prev => ({ ...prev, enter_your_gemini_api_key: val }))}
                      helperText="Your key is stored locally and never sent to our servers"
                      required
                    />
                  </FormSection>

                  <FormSection title="Additional Options" description="Optional image URL for additional context">
                    <SmartInput
                      label="Image URL (Optional)"
                      name="upload_image"
                      type="url"
                      value={textValues.upload_image || ''}
                      onChange={(val) => setTextValues(prev => ({ ...prev, upload_image: val }))}
                      placeholder="https://example.com/image.jpg"
                      helperText="Provide a URL to an image if you don't want to upload a file"
                    />
                  </FormSection>

                  <FormSection title="Your Task" description="Describe what you want the AI to do with your file">
                    <SmartTextarea
                      label="Task/Question for AI Agent"
                      name="enter_your_taskquestion_for_the_ai_agent"
                      value={textValues.enter_your_taskquestion_for_the_ai_agent || ''}
                      onChange={(val) => setTextValues(prev => ({ ...prev, enter_your_taskquestion_for_the_ai_agent: val }))}
                      placeholder="Analyze this image and describe what you see. Identify any objects, text, or patterns."
                      helperText="Be specific about what you want. Describe the type of analysis or extraction needed."
                      rows={4}
                      required
                    />
                  </FormSection>

                  <div className="flex gap-3 pt-4">
                    <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={!file || !textValues.enter_your_gemini_api_key?.trim()}>
                      <Sparkles className="h-4 w-4" />
                      Process File
                    </ActionButton>
                    <ActionButton variant="ghost" onClick={handleClear} disabled={loading}>
                      Clear
                    </ActionButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : loading ? (
            <LoadingIndicator message="Processing your file..." subtext="Gemini is analyzing the content" />
          ) : null}

          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultGrid columns={2}>
                <ResultCard
                  icon={<FileText className="h-5 w-5" />}
                  title="File Processed"
                  value={file?.name || "Uploaded file"}
                  subtext="Analysis complete"
                />
                <ResultCard
                  icon={<Sparkles className="h-5 w-5" />}
                  title="Status"
                  value="Completed"
                  variant="success"
                />
              </ResultGrid>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>Analysis Result</CardTitle></CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans text-gray-200">{typeof result.result === 'string' ? result.result : JSON.stringify(result.result || result, null, 2)}</pre>
                  </div>
                </CardContent>
              </Card>

              <ActionButton onClick={() => { setResult(null); setFile(null); }} variant="secondary" className="w-full">
                Process Another File
              </ActionButton>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
};

export default MultimodalAiAgentPage;
