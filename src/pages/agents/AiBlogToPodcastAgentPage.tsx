import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ResultCard } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { FileUploadZone } from "@/components/agent-ui/FileUploadZone";
import { Loader2, Sparkles, Mic, Radio, Link2 } from "lucide-react";

const AiBlogToPodcastAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ enter_blog_url: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ai-blog-to-podcast-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ai-blog-to-podcast-state', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.enter_blog_url.trim()) {
      setError('Please enter a blog URL');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-blog-to-podcast-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem('ai-blog-to-podcast-state');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>AiBlogToPodcastAgent - VideoRemix.vip</title>
        <meta name="description" content="Use ai-blog-to-podcast-agent to convert blog posts to podcast audio." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Ai Blog To Podcast Agent</h1>
            <p className="text-xl text-gray-400">Convert blog posts into engaging podcast audio.</p>
          </motion.div>

          {error && <ErrorMessage title="Request Failed" message={error} onRetry={handleSubmit} retryLoading={loading} />}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Blog URL</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Source Blog" description="Enter the blog URL to convert to podcast">
                  <SmartInput
                    label="Blog URL"
                    name="enter_blog_url"
                    type="url"
                    value={formData.enter_blog_url}
                    onChange={(val) => setFormData({ ...formData, enter_blog_url: val })}
                    placeholder="https://example.com/blog/your-post"
                    helperText="Enter the full URL of the blog post you want to convert"
                    required
                  />
                </FormSection>

                <ActionButton type="submit" loading={loading} disabled={loading} size="lg" className="w-full">
                  <Mic className="h-4 w-4" />
                  Convert to Podcast
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator 
              message="Converting blog to podcast..." 
              subtext="Generating audio from blog content"
            />
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {result.audioUrl && (
                <ResultCard
                  icon={<Radio className="h-5 w-5" />}
                  title="Podcast Audio Ready"
                  description="Your blog has been converted to podcast format."
                  variant="success"
                />
              )}

              {result.audioUrl && (
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <label className="text-sm font-medium text-gray-200 mb-3 flex items-center gap-2">
                    <Mic className="h-4 w-4" /> Audio Player
                  </label>
                  <audio controls src={result.audioUrl} className="w-full" />
                </div>
              )}

              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                <label className="text-sm font-medium text-gray-200 mb-3 flex items-center gap-2">
                  Transcript
                </label>
                <p className="text-gray-300 whitespace-pre-wrap">{result.result}</p>
              </div>

              <EmptyState
                icon={<Radio className="h-16 w-16 text-gray-600" />}
                title="Podcast Generated"
                description="Your blog post has been converted to audio."
                action={
                  <ActionButton onClick={() => { setResult(null); setFormData({ enter_blog_url: "" }); }}>
                    Convert Another Blog
                  </ActionButton>
                }
              />
            </motion.div>
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Mic className="h-16 w-16 text-gray-600" />}
              title="Ready to Convert"
              description="Enter a blog URL to transform it into a podcast audio file."
              tips={[
                "Use a full blog post URL for best results",
                "Longer posts make for more detailed podcasts",
                "The AI will summarize and narrate the content",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiBlogToPodcastAgentPage;