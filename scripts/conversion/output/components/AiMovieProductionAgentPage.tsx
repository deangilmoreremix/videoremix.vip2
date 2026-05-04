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

const AiMovieProductionAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ enter_google_api_key_to_access_gemini_25_flash: "", enter_serp_api_key_for_search_functionality: "", describe_your_movie_idea_in_a_few_sentences: "", select_the_movie_genre: "", select_the_target_audience: "", estimated_runtime_in_minutes: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/.netlify/functions/ai-movie-production-agent', {
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
        <title>AiMovieProductionAgent - VideoRemix.vip</title>
        <meta name="description" content="Use ai-movie-production-agent to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Ai Movie Production Agent</h1>
            <p className="text-xl text-gray-400">AI-powered ai movie production agent.</p>
          </motion.div>

          {error && <Card className="mb-6 border-red-500/50 bg-red-500/10"><CardContent className="pt-6"><p className="text-red-300">{error}</p></CardContent></Card>}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Input</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <Label htmlFor="enter_google_api_key_to_access_gemini_25_flash">Enter Google API Key to access Gemini 2.5 Flash *</Label>
                
                <Input
                  id="enter_google_api_key_to_access_gemini_25_flash"
                  type="text"
                  value={formData.enter_google_api_key_to_access_gemini_25_flash}
                  onChange={(e) => setFormData({ ...formData, enter_google_api_key_to_access_gemini_25_flash: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="enter_serp_api_key_for_search_functionality">Enter Serp API Key for Search functionality *</Label>
                
                <Input
                  id="enter_serp_api_key_for_search_functionality"
                  type="text"
                  value={formData.enter_serp_api_key_for_search_functionality}
                  onChange={(e) => setFormData({ ...formData, enter_serp_api_key_for_search_functionality: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="describe_your_movie_idea_in_a_few_sentences">Describe your movie idea in a few sentences: *</Label>
                
                <Textarea
                  id="describe_your_movie_idea_in_a_few_sentences"
                  value={formData.describe_your_movie_idea_in_a_few_sentences}
                  onChange={(e) => setFormData({ ...formData, describe_your_movie_idea_in_a_few_sentences: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white min-h-[120px]"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="select_the_movie_genre">Select the movie genre: *</Label>
                
                <select
                  id="select_the_movie_genre"
                  value={formData.select_the_movie_genre}
                  onChange={(e) => setFormData({ ...formData, select_the_movie_genre: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value=""></option>
                </select>
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="select_the_target_audience">Select the target audience: *</Label>
                
                <select
                  id="select_the_target_audience"
                  value={formData.select_the_target_audience}
                  onChange={(e) => setFormData({ ...formData, select_the_target_audience: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value=""></option>
                </select>
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_runtime_in_minutes">Estimated runtime (in minutes): *</Label>
                
                <Input
                  id="estimated_runtime_in_minutes"
                  type="range"
                  value={formData.estimated_runtime_in_minutes}
                  onChange={(e) => setFormData({ ...formData, estimated_runtime_in_minutes: e.target.value })}
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

export default AiMovieProductionAgentPage;
