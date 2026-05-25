import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, Radio, Link2 } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { FormSection } from "@/components/agent-ui/FormSection";

const STORAGE_KEY = 'blog-to-podcast-agent-form';

const BlogToPodcastAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ enter_blog_url: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.enter_blog_url.trim()) {
      setError("Please enter a blog URL");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/blog-to-podcast-agent-`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.error || "Request failed");
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ enter_blog_url: "" });
    setResult(null);
    setError(null);
  };

  return (
    <>
      <Helmet>
        <title>BlogToPodcastAgent - VideoRemix.vip</title>
        <meta name="description" content="Use blog-to-podcast-agent to convert blog posts into podcast audio." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-600 to-red-500 rounded-3xl mb-6">
              <Radio className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Blog to Podcast Agent</h1>
            <p className="text-xl text-gray-400">Transform any blog post into a podcast-style audio file. Listen to articles on the go.</p>
          </motion.div>

          {!result && !loading && (
            <EmptyState
              icon={<Radio className="h-16 w-16 text-gray-600" />}
              title="Transform blogs into podcasts"
              description="Enter a blog URL and we'll convert it into an engaging podcast audio file you can listen to anytime."
              tips={[
                "Paste a blog post URL from any website",
                "The AI will read and summarize the content",
                "You'll receive an audio file to listen on the go"
              ]}
            />
          )}

          <FormSection
            title="Blog URL"
            description="Enter the blog post you want to convert to audio"
          >
            <SmartInput
              label="Blog URL"
              name="enter_blog_url"
              type="url"
              value={formData.enter_blog_url}
              onChange={(val) => setFormData({ ...formData, enter_blog_url: val })}
              placeholder="https://example.com/blog/your-article"
              helperText="Paste the full URL of the blog post you want to convert"
              required
            />
          </FormSection>

          {error && (
            <ErrorMessage
              title="Request failed"
              message={error}
              onRetry={handleSubmit}
              retryLoading={loading}
            />
          )}

          {loading && (
            <LoadingIndicator
              message="Converting blog to podcast..."
              subtext="Reading content and generating audio"
            />
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultGrid columns={1}>
                {result.audioUrl && (
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Radio className="h-6 w-6 text-orange-400" />
                      <h3 className="text-lg font-medium text-white">Podcast Audio</h3>
                    </div>
                    <audio controls src={result.audioUrl} className="w-full" />
                  </div>
                )}
                <ResultCard
                  icon={<Radio className="h-5 w-5" />}
                  title="Transcript"
                  description={result.result}
                  variant="success"
                />
              </ResultGrid>

              <ActionButton onClick={handleClear} variant="ghost" className="w-full">
                Convert Another Blog
              </ActionButton>
            </motion.div>
          )}

          {!result && !loading && (
            <div className="flex gap-3 mt-6">
              <ActionButton onClick={handleSubmit} loading={loading} size="lg" className="flex-1">
                <Sparkles className="h-4 w-4" />
                Convert to Podcast
              </ActionButton>
              <ActionButton onClick={handleClear} variant="ghost" size="lg">
                Clear
              </ActionButton>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default BlogToPodcastAgentPage;
