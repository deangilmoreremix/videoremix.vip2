import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Upload,
  Image as ImageIcon,
  CheckCircle
} from "lucide-react";
import {
  SmartInput,
  SmartTextarea,
  ActionButton,
  ResultCard,
  ResultGrid,
  EmptyState,
  LoadingIndicator,
  ErrorMessage,
  FormSection,
  FileUploadZone,
  ApiKeyInput,
} from "@/components/agent-ui";

const STORAGE_KEY = "visionrag_form_data";

interface FormData {
  cohere_api_key: string;
  google_api_key_gemini: string;
  upload_images: string;
  ask_a_question: string;
}

const VisionRagPage: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<FormData>({
    cohere_api_key: "",
    google_api_key_gemini: "",
    upload_images: "",
    ask_a_question: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
      } catch {}
    }
  }, []);

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
      formDataToSend.append("file", file);
      formDataToSend.append("cohere_api_key", formData.cohere_api_key || "");
      formDataToSend.append("google_api_key_gemini", formData.google_api_key_gemini || "");
      formDataToSend.append("upload_images_png_jpg_jpeg_or_pdfs", formData.upload_images || "");
      formDataToSend.append("ask_a_question_about_the_loaded_images", formData.ask_a_question || "");
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vision-rag`, {
        method: "POST",
        body: formDataToSend,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleSubmit(new Event("submit") as any);
  };

  return (
    <>
      <Helmet>
        <title>VisionRag - VideoRemix.vip</title>
        <meta name="description" content="Use vision-rag to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-500 rounded-3xl mb-6">
              <ImageIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Vision Rag</h1>
            <p className="text-xl text-gray-400">AI-powered vision rag.</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Upload & Configure</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection
                  title="File Upload"
                  description="Upload your document file for processing"
                >
                  <div className="col-span-1 md:col-span-2">
                    <FileUploadZone
                      accept=".pdf,.png,.jpg,.jpeg"
                      maxSize={50 * 1024 * 1024}
                      onFileSelect={(files) => setFile(files as File | null)}
                      selectedFile={file}
                      helperText="Upload PDF, PNG, JPG, or JPEG files up to 50MB"
                    />
                  </div>
                </FormSection>

                <FormSection
                  title="API Configuration"
                  description="Enter your API keys to enable AI processing"
                >
                  <div className="col-span-1 md:col-span-2">
                    <ApiKeyInput
                      label="Cohere API Key"
                      value={formData.cohere_api_key}
                      onChange={(v) => updateField("cohere_api_key", v)}
                      placeholder="Your Cohere API key"
                      helperText="Get your API key from Cohere dashboard"
                      required
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <ApiKeyInput
                      label="Google Gemini API Key"
                      value={formData.google_api_key_gemini}
                      onChange={(v) => updateField("google_api_key_gemini", v)}
                      placeholder="Your Google Gemini API key"
                      helperText="Get your API key from Google AI Studio"
                      required
                    />
                  </div>
                </FormSection>

                <FormSection
                  title="Vision Processing"
                  description="Configure image URLs and your question"
                >
                  <div className="col-span-1 md:col-span-2">
                    <SmartInput
                      label="Upload Images"
                      name="upload_images"
                      value={formData.upload_images}
                      onChange={(v) => updateField("upload_images", v)}
                      placeholder="URL or path to images"
                      helperText="Enter URLs or file paths for images to analyze"
                      required
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <SmartTextarea
                      label="Ask a Question"
                      name="ask_a_question"
                      value={formData.ask_a_question}
                      onChange={(v) => updateField("ask_a_question", v)}
                      placeholder="e.g., 'What objects are in this image?'"
                      helperText="Describe what you want to know about the images"
                      required
                    />
                  </div>
                </FormSection>

                <ActionButton
                  type="submit"
                  disabled={loading || !file}
                  loading={loading}
                  loadingText="Processing..."
                  className="w-full"
                >
                  Process File
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {error && (
            <ErrorMessage
              message={error}
              onRetry={handleRetry}
              retryLoading={loading}
            />
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResultGrid columns={1}>
                    <ResultCard
                      title="Analysis Result"
                      description="Vision model response"
                      icon={<CheckCircle className="h-5 w-5" />}
                      variant="success"
                    >
                      <div className="space-y-4 mt-4">
                        {result.answer && (
                          <div>
                            <p className="text-sm font-medium text-gray-300 mb-1">Answer</p>
                            <p className="text-white whitespace-pre-wrap">{result.answer}</p>
                          </div>
                        )}
                        {result.confidence !== undefined && (
                          <div>
                            <p className="text-sm font-medium text-gray-300 mb-1">Confidence</p>
                            <p className="text-green-400 font-semibold">{(result.confidence * 100).toFixed(0)}%</p>
                          </div>
                        )}
                        {result.metadata && (
                          <div>
                            <p className="text-sm font-medium text-gray-300 mb-1">Metadata</p>
                            <div className="text-xs text-gray-400 space-y-1">
                              {Object.entries(result.metadata).map(([key, val]) => (
                                <div key={key} className="flex justify-between">
                                  <span>{key}:</span>
                                  <span>{String(val)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </ResultCard>
                  </ResultGrid>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {!file && !loading && !result && (
            <EmptyState
              icon={<ImageIcon className="h-12 w-12 text-gray-400" />}
              title="No file uploaded"
              description="Upload a file to get started with Vision Rag processing"
              tips={[
                "Upload a PDF or image file to begin",
                "Enter your Cohere and Gemini API keys",
                "Add image URLs for additional context",
                "Ask questions about your visual content",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default VisionRagPage;
