import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { FileUploadZone } from "@/components/agent-ui/FileUploadZone";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { Upload, FileText, Image as ImageIcon, CheckCircle2 } from "lucide-react";

const STORAGE_KEY = 'ai-medical-imaging-agent';

const AiMedicalImagingAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setApiKey(parsed.apiKey || '');
        setImageDescription(parsed.imageDescription || '');
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ apiKey, imageDescription }));
  }, [apiKey, imageDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('google_api_key', apiKey);
      formData.append('image_description', imageDescription);
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-medical-imaging-agent`, {
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

  if (result && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - Medical Imaging Agent</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-3">Analysis Complete</h1>
                <p className="text-gray-400">Your medical image has been processed</p>
              </div>

              <ResultGrid columns={2}>
                <ResultCard
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  title="Status"
                  value="Completed"
                  variant="success"
                />
                <ResultCard
                  icon={<ImageIcon className="h-5 w-5" />}
                  title="File Analyzed"
                  value={file?.name || 'Unknown'}
                  subtext={file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}
                />
              </ResultGrid>

              {result.findings && (
                <ResultCard
                  icon={<FileText className="h-5 w-5" />}
                  title="Findings"
                  description={result.findings}
                  variant="info"
                />
              )}

              {result.analysis && (
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">Detailed Analysis</h3>
                  <p className="text-gray-300 whitespace-pre-wrap">{result.analysis}</p>
                </div>
              )}

              <div className="flex justify-center">
                <ActionButton onClick={() => { setResult(null); setFile(null); }}>
                  Analyze Another Image
                </ActionButton>
              </div>
            </motion.div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Medical Imaging Agent - VideoRemix.vip</title>
        <meta name="description" content="AI-powered medical image analysis agent." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-500 rounded-3xl mb-6">
              <ImageIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Medical Imaging Agent</h1>
            <p className="text-xl text-gray-400">Upload medical images for AI-powered analysis and insights.</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Upload & Configure</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-gray-200 mb-2">Medical Image File *</p>
                  <FileUploadZone
                    accept=".dcm,.jpg,.jpeg,.png,.tiff,.dicom"
                    maxSize={20 * 1024 * 1024}
                    onFileSelect={setFile}
                    selectedFile={file}
                    helperText="Supported formats: DICOM, JPG, PNG, TIFF (max 20MB)"
                  />
                </div>

                <ApiKeyInput
                  label="Google API Key"
                  value={apiKey}
                  onChange={setApiKey}
                  helperText="Required for Gemini AI analysis. Your key is stored locally."
                  required
                />

                <SmartInput
                  label="Image Description"
                  name="imageDescription"
                  value={imageDescription}
                  onChange={setImageDescription}
                  placeholder="Describe the imaging type, body region, or clinical context..."
                  helperText="Provide context about the image, such as body part, imaging modality, or clinical concern."
                  required
                />

                {error && (
                  <ErrorMessage
                    title="Analysis failed"
                    message={error}
                    onRetry={handleSubmit}
                    retryLoading={loading}
                  />
                )}

                <ActionButton
                  type="submit"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={loading || !file || !apiKey.trim()}
                  size="lg"
                  className="w-full"
                >
                  <Upload className="h-4 w-4" />
                  {loading ? 'Analyzing...' : 'Analyze Image'}
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator
              message="Analyzing medical image..."
              subtext="This typically takes 10-30 seconds depending on file size"
            />
          )}

          {!file && !loading && (
            <EmptyState
              icon={<ImageIcon className="h-16 w-16 text-gray-600" />}
              title="No image uploaded"
              description="Upload a medical image to receive AI-powered analysis and insights."
              tips={[
                "Upload clear, high-quality medical images in DICOM, JPG, or PNG format",
                "Provide detailed description of the clinical context",
                "Ensure you have proper authorization for the image",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiMedicalImagingAgentPage;
