import React, { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Upload, FileText } from "lucide-react";

const Ag2AdaptiveResearchTeamPage: React.FC = () => {
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
      formData.append('model', textValues.model || '');
      formData.append('upload_pdfs_or_text_files', textValues.upload_pdfs_or_text_files || '');
      formData.append('research_question', textValues.research_question || '');
      const res = await fetch('/.netlify/functions/ag2-adaptive-research-team', {
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
        <title>Ag2AdaptiveResearchTeam - VideoRemix.vip</title>
        <meta name="description" content="Use ag2-adaptive-research-team to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-500 rounded-3xl mb-6">
              <Upload className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Ag2 Adaptive Research Team</h1>
            <p className="text-xl text-gray-400">AI-powered ag2 adaptive research team.</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Upload & Configure</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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


                <div className="space-y-2">
                  <Label htmlFor="openai_api_key">OpenAI API Key *</Label>
                  <Input
                    id="openai_api_key"
                    value={textValues.openai_api_key || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, openai_api_key: e.target.value }))}
                    placeholder=""
                    className="bg-gray-900/50 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={textValues.model || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, model: e.target.value }))}
                    placeholder=""
                    className="bg-gray-900/50 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upload_pdfs_or_text_files">Upload PDFs or text files *</Label>
                  <Input
                    id="upload_pdfs_or_text_files"
                    value={textValues.upload_pdfs_or_text_files || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, upload_pdfs_or_text_files: e.target.value }))}
                    placeholder=""
                    className="bg-gray-900/50 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="research_question">Research question *</Label>
                  <Input
                    id="research_question"
                    value={textValues.research_question || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, research_question: e.target.value }))}
                    placeholder=""
                    className="bg-gray-900/50 border-gray-600"
                  />
                </div>


                <Button type="submit" disabled={loading || !file} className="w-full">
                  {loading ? 'Processing...' : 'Process File'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {error && <Card className="border-red-500/50 bg-red-500/10 mb-8"><CardContent className="pt-6"><p className="text-red-300">{error}</p></CardContent></Card>}

           {result && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
               <Card className="bg-gray-800/50 border-gray-700">
                 <CardHeader><CardTitle>Result</CardTitle></CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     
                     {result.result && (
                       <div className="space-y-2">
                         <Label>Transcript</Label>
                         <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans">{JSON.stringify(result, null, 2)}</pre>
                       </div>
                     )}
                   </div>
                 </CardContent>
               </Card>
             </motion.div>
           )}
        </div>
      </main>
    </>
  );
};

export default Ag2AdaptiveResearchTeamPage;
