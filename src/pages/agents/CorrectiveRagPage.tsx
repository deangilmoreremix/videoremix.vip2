import React, { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Upload, FileText } from "lucide-react";

const CorrectiveRagPage: React.FC = () => {
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
      formData.append('anthropic_api_key', textValues.anthropic_api_key || '');
      formData.append('openai_api_key', textValues.openai_api_key || '');
      formData.append('tavily_api_key', textValues.tavily_api_key || '');
      formData.append('qdrant_url', textValues.qdrant_url || '');
      formData.append('qdrant_api_key', textValues.qdrant_api_key || '');
      formData.append('document_url', textValues.document_url || '');
      formData.append('choose_input_method', textValues.choose_input_method || '');
      formData.append('enter_document_url', textValues.enter_document_url || '');
      formData.append('upload_a_document', textValues.upload_a_document || '');
      formData.append('please_enter_your_question', textValues.please_enter_your_question || '');
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/corrective-rag`, {
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
        <title>CorrectiveRag - VideoRemix.vip</title>
        <meta name="description" content="Use corrective-rag to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-500 rounded-3xl mb-6">
              <Upload className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Corrective Rag</h1>
            <p className="text-xl text-gray-400">AI-powered corrective rag.</p>
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
                  <Label htmlFor="anthropic_api_key">Anthropic API Key *</Label>
                  <Input
                    id="anthropic_api_key"
                    value={textValues.anthropic_api_key || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, anthropic_api_key: e.target.value }))}
                    placeholder=""
                    className="bg-gray-900/50 border-gray-600"
                  />
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
                  <Label htmlFor="tavily_api_key">Tavily API Key *</Label>
                  <Input
                    id="tavily_api_key"
                    value={textValues.tavily_api_key || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, tavily_api_key: e.target.value }))}
                    placeholder=""
                    className="bg-gray-900/50 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qdrant_url">Qdrant URL *</Label>
                  <Input
                    id="qdrant_url"
                    value={textValues.qdrant_url || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, qdrant_url: e.target.value }))}
                    placeholder=""
                    className="bg-gray-900/50 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qdrant_api_key">Qdrant API Key *</Label>
                  <Input
                    id="qdrant_api_key"
                    value={textValues.qdrant_api_key || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, qdrant_api_key: e.target.value }))}
                    placeholder=""
                    className="bg-gray-900/50 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document_url">Document URL *</Label>
                  <Input
                    id="document_url"
                    value={textValues.document_url || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, document_url: e.target.value }))}
                    placeholder=""
                    className="bg-gray-900/50 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="choose_input_method">Choose input method: *</Label>
                  <Input
                    id="choose_input_method"
                    value={textValues.choose_input_method || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, choose_input_method: e.target.value }))}
                    placeholder=""
                    className="bg-gray-900/50 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enter_document_url">Enter document URL: *</Label>
                  <Input
                    id="enter_document_url"
                    value={textValues.enter_document_url || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, enter_document_url: e.target.value }))}
                    placeholder=""
                    className="bg-gray-900/50 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upload_a_document">Upload a document *</Label>
                  <Input
                    id="upload_a_document"
                    value={textValues.upload_a_document || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, upload_a_document: e.target.value }))}
                    placeholder=""
                    className="bg-gray-900/50 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="please_enter_your_question">Please enter your question: *</Label>
                  <Input
                    id="please_enter_your_question"
                    value={textValues.please_enter_your_question || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, please_enter_your_question: e.target.value }))}
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

export default CorrectiveRagPage;
