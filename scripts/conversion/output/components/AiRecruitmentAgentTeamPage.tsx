import React, { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Upload, FileText } from "lucide-react";

const AiRecruitmentAgentTeamPage: React.FC = () => {
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
      formData.append('zoom_account_id', textValues.zoom_account_id || '');
      formData.append('zoom_client_id', textValues.zoom_client_id || '');
      formData.append('zoom_client_secret', textValues.zoom_client_secret || '');
      formData.append('sender_email', textValues.sender_email || '');
      formData.append('email_app_password', textValues.email_app_password || '');
      formData.append('company_name', textValues.company_name || '');
      formData.append('select_the_role_you', textValues.select_the_role_you || '');
      formData.append('upload_your_resume_pdf', textValues.upload_your_resume_pdf || '');
      formData.append('candidate', textValues.candidate || '');
      const res = await fetch('/.netlify/functions/ai-recruitment-agent-team', {
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
        <title>AiRecruitmentAgentTeam - VideoRemix.vip</title>
        <meta name="description" content="Use ai-recruitment-agent-team to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-500 rounded-3xl mb-6">
              <Upload className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Ai Recruitment Agent Team</h1>
            <p className="text-xl text-gray-400">AI-powered ai recruitment agent team.</p>
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
                  <Label htmlFor="zoom_account_id">Zoom Account ID *</Label>
                  <Input
                    id="zoom_account_id"
                    value={textValues.zoom_account_id || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, zoom_account_id: e.target.value }))}
                    placeholder=""
                    className="bg-gray-900/50 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zoom_client_id">Zoom Client ID *</Label>
                  <Input
                    id="zoom_client_id"
                    value={textValues.zoom_client_id || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, zoom_client_id: e.target.value }))}
                    placeholder=""
                    className="bg-gray-900/50 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zoom_client_secret">Zoom Client Secret *</Label>
                  <Input
                    id="zoom_client_secret"
                    value={textValues.zoom_client_secret || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, zoom_client_secret: e.target.value }))}
                    placeholder=""
                    className="bg-gray-900/50 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sender_email">Sender Email *</Label>
                  <Input
                    id="sender_email"
                    value={textValues.sender_email || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, sender_email: e.target.value }))}
                    placeholder=""
                    className="bg-gray-900/50 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_app_password">Email App Password *</Label>
                  <Input
                    id="email_app_password"
                    value={textValues.email_app_password || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, email_app_password: e.target.value }))}
                    placeholder=""
                    className="bg-gray-900/50 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={textValues.company_name || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder=""
                    className="bg-gray-900/50 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="select_the_role_you">Select the role you *</Label>
                  <Input
                    id="select_the_role_you"
                    value={textValues.select_the_role_you || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, select_the_role_you: e.target.value }))}
                    placeholder=""
                    className="bg-gray-900/50 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upload_your_resume_pdf">Upload your resume (PDF) *</Label>
                  <Input
                    id="upload_your_resume_pdf"
                    value={textValues.upload_your_resume_pdf || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, upload_your_resume_pdf: e.target.value }))}
                    placeholder=""
                    className="bg-gray-900/50 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="candidate">Candidate *</Label>
                  <Input
                    id="candidate"
                    value={textValues.candidate || ''}
                    onChange={(e) => setTextValues(prev => ({ ...prev, candidate: e.target.value }))}
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

export default AiRecruitmentAgentTeamPage;
