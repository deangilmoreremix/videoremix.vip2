import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles } from "lucide-react";

const CustomerSupportVoiceAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ qdrant_url: "", qdrant_api_key: "", firecrawl_api_key: "", openai_api_key: "", documentation_url: "", select_voice: "", what_would_you_like_to_know_about_the_documentation: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/.netlify/functions/customer-support-voice-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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
        <title>CustomerSupportVoiceAgent - VideoRemix.vip</title>
        <meta name="description" content="Use customer-support-voice-agent to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Customer Support Voice Agent</h1>
            <p className="text-xl text-gray-400">AI-powered customer support voice agent.</p>
          </motion.div>

          {error && <Card className="mb-6 border-red-500/50 bg-red-500/10"><CardContent className="pt-6"><p className="text-red-300">{error}</p></CardContent></Card>}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Input</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <Label htmlFor="qdrant_url">Qdrant URL *</Label>
                
                <Input
                  id="qdrant_url"
                  type="text"
                  value={formData.qdrant_url}
                  onChange={(e) => setFormData({ ...formData, qdrant_url: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="qdrant_api_key">Qdrant API Key *</Label>
                
                <Input
                  id="qdrant_api_key"
                  type="text"
                  value={formData.qdrant_api_key}
                  onChange={(e) => setFormData({ ...formData, qdrant_api_key: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="firecrawl_api_key">Firecrawl API Key *</Label>
                
                <Input
                  id="firecrawl_api_key"
                  type="text"
                  value={formData.firecrawl_api_key}
                  onChange={(e) => setFormData({ ...formData, firecrawl_api_key: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="openai_api_key">OpenAI API Key *</Label>
                
                <Input
                  id="openai_api_key"
                  type="text"
                  value={formData.openai_api_key}
                  onChange={(e) => setFormData({ ...formData, openai_api_key: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentation_url">Documentation URL *</Label>
                
                <Input
                  id="documentation_url"
                  type="text"
                  value={formData.documentation_url}
                  onChange={(e) => setFormData({ ...formData, documentation_url: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="select_voice">Select Voice *</Label>
                
                <select
                  id="select_voice"
                  value={formData.select_voice}
                  onChange={(e) => setFormData({ ...formData, select_voice: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value=""></option>
                </select>
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="what_would_you_like_to_know_about_the_documentation">What would you like to know about the documentation? *</Label>
                
                <Input
                  id="what_would_you_like_to_know_about_the_documentation"
                  type="text"
                  value={formData.what_would_you_like_to_know_about_the_documentation}
                  onChange={(e) => setFormData({ ...formData, what_would_you_like_to_know_about_the_documentation: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Processing...' : 'Generate Results'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-gray-400">Processing...</p>
              </CardContent>
            </Card>
          )}

           {result && result.status === 'completed' && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
               <Card className="bg-gray-800/50 border-gray-700">
                 <CardHeader><CardTitle>Results</CardTitle></CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     
                     <div className="space-y-2">
                       <Label>Audio Response</Label>
                       <audio controls src={result.audioUrl} className="w-full" />
                     </div>
                     
                     <div className="space-y-2">
                       <Label>Transcript</Label>
                       <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans">{result.result}</pre>
                     </div>
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

export default CustomerSupportVoiceAgentPage;
