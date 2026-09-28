import React, { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ResultCard } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { Loader2, Upload, FileText } from "lucide-react";

const MultimodalCodingAgentTeamPage: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('openai_api_key', textValues.openai_api_key || '');
      formData.append('upload_an_image_of_your_coding_problem_optional', textValues.upload_an_image_of_your_coding_problem_optional || '');
      formData.append('or_type_your_coding_problem_here', textValues.or_type_your_coding_problem_here || '');
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-app-builder-assistant`, {
        method: 'POST',
        body: formData
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
        <title>MultimodalCodingAgentTeam - VideoRemix.vip</title>
        <meta name="description" content="Use ai-app-builder-assistant to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-500 rounded-3xl mb-6">
              <Upload className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Multimodal Coding Agent Team</h1>
            <p className="text-xl text-gray-400">AI-powered multimodal coding agent team.</p>
          </motion.div>

          {loading && <LoadingIndicator message="Processing file..." subtext="Analyzing your coding problem" />}

          {error && <ErrorMessage title="Processing Failed" message={error} onRetry={handleSubmit} retryLoading={loading} />}

          {!loading && (
            <Card className="bg-gray-800/50 border-gray-700 mb-8">
              <CardHeader><CardTitle>Upload & Configure</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <FormSection title="File Upload" description="Upload your coding problem file">
                    <div className="space-y-2">
                      <Label htmlFor="file">Upload File *</Label>
                      <div
                        className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                        <p className="text-gray-300">Click to select a file</p>
                        {file && <p className="text-sm text-blue-400 mt-2">{file.name}</p>}
                      </div>
                      <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />
                    </div>
                  </FormSection>

                  <FormSection title="API Configuration" description="Enter your OpenAI API key">
                    <ApiKeyInput label="OpenAI API Key" name="openai_api_key" value={textValues.openai_api_key || ''} onChange={(v) => setTextValues(prev => ({ ...prev, openai_api_key: v }))} required helperText="Get your API key from OpenAI Platform" />
                  </FormSection>

                  <FormSection title="Problem Details" description="Describe your coding problem">
                    <SmartInput label="Upload an image of your coding problem (optional)" name="upload_an_image_of_your_coding_problem_optional" value={textValues.upload_an_image_of_your_coding_problem_optional || ''} onChange={(v) => setTextValues(prev => ({ ...prev, upload_an_image_of_your_coding_problem_optional: v }))} placeholder="" />
                    <SmartTextarea label="Or type your coding problem here" name="or_type_your_coding_problem_here" value={textValues.or_type_your_coding_problem_here || ''} onChange={(v) => setTextValues(prev => ({ ...prev, or_type_your_coding_problem_here: v }))} placeholder="" required />
                  </FormSection>

                  <ActionButton type="submit" loading={loading} disabled={loading || !file} className="w-full">
                    Process File
                  </ActionButton>
                </form>
              </CardContent>
            </Card>
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <ResultCard title="Result" variant="success">
                <div className="space-y-4 mt-4">
                  {result.result && (
                    <div className="space-y-2">
                      <Label>Transcript</Label>
                      <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans">{JSON.stringify(result, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </ResultCard>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
};

 export default MultimodalCodingAgentTeamPage;
