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

const RagChainPage: React.FC = () => {
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
      formData.append('bulb_enter_your_query_about_the_pharmaceutical_industry', textValues.bulb_enter_your_query_about_the_pharmaceutical_industry || '');
      formData.append('enter_your_openai_api_key', textValues.enter_your_openai_api_key || '');
      formData.append('upload_your_research_documents_related_to_pharmaceutical_sciences_optional_memo', textValues.upload_your_research_documents_related_to_pharmaceutical_sciences_optional_memo || '');
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-chain`, {
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
        <title>RagChain - VideoRemix.vip</title>
        <meta name="description" content="Use rag-chain to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-500 rounded-3xl mb-6">
              <Upload className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Rag Chain</h1>
            <p className="text-xl text-gray-400">AI-powered rag chain.</p>
          </motion.div>

          {loading && <LoadingIndicator message="Processing file..." subtext="Running RAG chain analysis" />}

          {error && <ErrorMessage title="Processing Failed" message={error} onRetry={handleSubmit} retryLoading={loading} />}

          {!loading && (
            <Card className="bg-gray-800/50 border-gray-700 mb-8">
              <CardHeader><CardTitle>Upload & Configure</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <FormSection title="File Upload" description="Upload your research file">
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

                  <FormSection title="Query & API" description="Enter your query and API key">
                    <SmartTextarea label=":bulb: Enter your query about the Pharmaceutical Industry" name="bulb_enter_your_query_about_the_pharmaceutical_industry" value={textValues.bulb_enter_your_query_about_the_pharmaceutical_industry || ''} onChange={(v) => setTextValues(prev => ({ ...prev, bulb_enter_your_query_about_the_pharmaceutical_industry: v }))} placeholder="" required />
                    <ApiKeyInput label="Enter your OpenAI API key" name="enter_your_openai_api_key" value={textValues.enter_your_openai_api_key || ''} onChange={(v) => setTextValues(prev => ({ ...prev, enter_your_openai_api_key: v }))} required helperText="Get your API key from OpenAI Platform" />
                    <SmartInput label="Upload your research documents related to Pharmaceutical Sciences (Optional)" name="upload_your_research_documents_related_to_pharmaceutical_sciences_optional_memo" value={textValues.upload_your_research_documents_related_to_pharmaceutical_sciences_optional_memo || ''} onChange={(v) => setTextValues(prev => ({ ...prev, upload_your_research_documents_related_to_pharmaceutical_sciences_optional_memo: v }))} placeholder="" />
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

 export default RagChainPage;
