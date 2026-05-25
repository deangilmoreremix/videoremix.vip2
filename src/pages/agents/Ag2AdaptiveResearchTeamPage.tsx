import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Upload, FileText } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { FileUploadZone } from "@/components/agent-ui/FileUploadZone";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";

const Ag2AdaptiveResearchTeamPage: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ag2-research-form-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTextValues(parsed.textValues || {});
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ag2-research-form-data', JSON.stringify({ textValues }));
  }, [textValues]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a file');
      return;
    }
    if (!textValues.research_question?.trim()) {
      setError('Please enter a research question');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('openai_api_key', textValues.openai_api_key || '');
      formData.append('model', textValues.model || '');
      formData.append('upload_pdfs_or_text_files', textValues.upload_pdfs_or_text_files || '');
      formData.append('research_question', textValues.research_question || '');
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ag2-adaptive-research-team`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult(data);
      localStorage.removeItem('ag2-research-form-data');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = file && textValues.research_question?.trim();

  return (
    <>
      <Helmet>
        <title>AG2 Adaptive Research Team - VideoRemix.vip</title>
        <meta name="description" content="Multi-agent research team that adapts to your research questions." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-500 rounded-3xl mb-6">
              <Upload className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">AG2 Adaptive Research Team</h1>
            <p className="text-xl text-gray-400">AI-powered multi-agent research with adaptive reasoning</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Upload & Configure</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-2">
                  <label htmlFor="file" className="text-sm font-medium text-gray-200">
                    Upload File <span className="text-red-500">*</span>
                  </label>
                  <FileUploadZone
                    accept=".pdf,.txt,.docx"
                    maxSize={10 * 1024 * 1024}
                    onFileSelect={setFile}
                    selectedFile={file}
                    helperText="Upload research materials (PDF, TXT, or DOCX up to 10MB)"
                  />
                </div>

                <div className="space-y-2">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={textValues.openai_api_key || ''}
                    onChange={(val) => setTextValues(prev => ({ ...prev, openai_api_key: val }))}
                    helperText="Your API key is stored locally and never sent to our servers"
                    required={false}
                  />
                </div>

                <div className="space-y-2">
                  <SmartInput
                    label="Model"
                    name="model"
                    type="text"
                    value={textValues.model || ''}
                    onChange={(val) => setTextValues(prev => ({ ...prev, model: val }))}
                    placeholder="gpt-4o, gpt-4-turbo, gpt-3.5-turbo"
                    helperText="OpenAI model to use for analysis (defaults to gpt-4o)"
                    required={false}
                  />
                </div>

                <div className="space-y-2">
                  <SmartTextarea
                    label="Research question"
                    name="research_question"
                    value={textValues.research_question || ''}
                    onChange={(val) => setTextValues(prev => ({ ...prev, research_question: val }))}
                    placeholder="What specific insights are you looking for from this research material? e.g., 'Identify the main论点 and supporting evidence for the author's claims about AI safety'"
                    helperText="Be specific about what you want to learn from the uploaded materials"
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
                  <FileText className="h-4 w-4" />
                  {loading ? 'Processing...' : 'Process File'}
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {error && (
            <Card className="border-red-500/50 bg-red-500/10 mb-8">
              <CardContent className="pt-6">
                <p className="text-red-300">{error}</p>
              </CardContent>
            </Card>
          )}

           {loading && (
             <Card className="bg-gray-800/50 border-gray-700">
               <CardContent className="py-8 text-center">
                 <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                 <p className="text-gray-400">Adaptive research team analyzing your materials...</p>
               </CardContent>
             </Card>
           )}

           {result && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
               <Card className="bg-gray-800/50 border-gray-700">
                 <CardHeader><CardTitle>Research Results</CardTitle></CardHeader>
                 <CardContent>
                   <div className="bg-gray-900/50 rounded-lg p-4">
                     <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                       {typeof result.result === 'string' ? result.result : JSON.stringify(result, null, 2)}
                     </p>
                   </div>
                 </CardContent>
               </Card>
             </motion.div>
           )}

           {!result && !loading && (
             <EmptyState
               icon={<FileText className="h-16 w-16 text-gray-600" />}
               title="Ready to research"
               description="Upload your research materials and enter a question to get AI-powered multi-agent analysis"
               tips={[
                 "Upload PDF, TXT, or DOCX files for analysis",
                 "Be specific in your research question",
                 "The adaptive team will reason through multiple angles"
             ]}
             />
           )}
        </div>
      </main>
    </>
  );
};

export default Ag2AdaptiveResearchTeamPage;