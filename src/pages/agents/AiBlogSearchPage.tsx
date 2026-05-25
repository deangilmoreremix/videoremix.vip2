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

const AiBlogSearchPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ enter_your_qdrant_host_url: "", enter_your_qdrant_api_key: "", enter_your_gemini_api_key: "", link_paste_the_blog_link: "", bulb_enter_your_query_about_the_blog_post: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-blog-search`, {
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
        <title>AiBlogSearch - VideoRemix.vip</title>
        <meta name="description" content="Use ai-blog-search to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Ai Blog Search</h1>
            <p className="text-xl text-gray-400">AI-powered ai blog search.</p>
          </motion.div>

          {error && <Card className="mb-6 border-red-500/50 bg-red-500/10"><CardContent className="pt-6"><p className="text-red-300">{error}</p></CardContent></Card>}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Input</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <Label htmlFor="enter_your_qdrant_host_url">Enter your Qdrant Host URL: *</Label>
                
                <Input
                  id="enter_your_qdrant_host_url"
                  type="text"
                  value={formData.enter_your_qdrant_host_url}
                  onChange={(e) => setFormData({ ...formData, enter_your_qdrant_host_url: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="enter_your_qdrant_api_key">Enter your Qdrant API key: *</Label>
                
                <Input
                  id="enter_your_qdrant_api_key"
                  type="text"
                  value={formData.enter_your_qdrant_api_key}
                  onChange={(e) => setFormData({ ...formData, enter_your_qdrant_api_key: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="enter_your_gemini_api_key">Enter your Gemini API key: *</Label>
                
                <Input
                  id="enter_your_gemini_api_key"
                  type="text"
                  value={formData.enter_your_gemini_api_key}
                  onChange={(e) => setFormData({ ...formData, enter_your_gemini_api_key: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="link_paste_the_blog_link">:link: Paste the blog link: *</Label>
                
                <Input
                  id="link_paste_the_blog_link"
                  type="text"
                  value={formData.link_paste_the_blog_link}
                  onChange={(e) => setFormData({ ...formData, link_paste_the_blog_link: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulb_enter_your_query_about_the_blog_post">:bulb: Enter your query about the blog post: *</Label>
                
                <Textarea
                  id="bulb_enter_your_query_about_the_blog_post"
                  value={formData.bulb_enter_your_query_about_the_blog_post}
                  onChange={(e) => setFormData({ ...formData, bulb_enter_your_query_about_the_blog_post: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white min-h-[120px]"
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

export default AiBlogSearchPage;
