import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ResultCard } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ExamplePrompt } from "@/components/agent-ui/ExamplePrompt";
import { Loader2, Sparkles, Link2, Key, Search, Lightbulb } from "lucide-react";

const AiBlogSearchPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ 
    enter_your_qdrant_host_url: "", 
    enter_your_qdrant_api_key: "", 
    enter_your_gemini_api_key: "", 
    link_paste_the_blog_link: "", 
    bulb_enter_your_query_about_the_blog_post: "" 
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ai-blog-search-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ai-blog-search-state', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.enter_your_qdrant_host_url.trim() || !formData.enter_your_qdrant_api_key.trim() || !formData.enter_your_gemini_api_key.trim() || !formData.link_paste_the_blog_link.trim() || !formData.bulb_enter_your_query_about_the_blog_post.trim()) {
      setError('Please fill in all required fields');
      return;
    }
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
      localStorage.removeItem('ai-blog-search-state');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>AiBlogSearch - VideoRemix.vip</title>
        <meta name="description" content="Use ai-blog-search to search and analyze blog posts with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Ai Blog Search</h1>
            <p className="text-xl text-gray-400">AI-powered blog post search and analysis.</p>
          </motion.div>

          {error && <ErrorMessage title="Request Failed" message={error} onRetry={handleSubmit} retryLoading={loading} />}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Qdrant Configuration" description="Enter your Qdrant vector database credentials">
                  <SmartInput
                    label="Qdrant Host URL"
                    name="enter_your_qdrant_host_url"
                    type="url"
                    value={formData.enter_your_qdrant_host_url}
                    onChange={(val) => setFormData({ ...formData, enter_your_qdrant_host_url: val })}
                    placeholder="https://your-cluster.qdrant.tech"
                    helperText="Find this in your Qdrant dashboard"
                    required
                  />

                  <ApiKeyInput
                    label="Qdrant API Key"
                    name="enter_your_qdrant_api_key"
                    value={formData.enter_your_qdrant_api_key}
                    onChange={(val) => setFormData({ ...formData, enter_your_qdrant_api_key: val })}
                    placeholder="..."
                    helperText="Your Qdrant API key"
                    required
                  />
                </FormSection>

                <FormSection title="AI Configuration" description="Enter your Gemini API key">
                  <ApiKeyInput
                    label="Gemini API Key"
                    name="enter_your_gemini_api_key"
                    value={formData.enter_your_gemini_api_key}
                    onChange={(val) => setFormData({ ...formData, enter_your_gemini_api_key: val })}
                    placeholder="AIza..."
                    helperText="Get your API key from Google AI Studio"
                    required
                  />
                </FormSection>

                <FormSection title="Blog Post" description="Enter the blog URL and your query">
                  <SmartInput
                    label="Blog Link"
                    name="link_paste_the_blog_link"
                    type="url"
                    value={formData.link_paste_the_blog_link}
                    onChange={(val) => setFormData({ ...formData, link_paste_the_blog_link: val })}
                    placeholder="https://example.com/blog/post"
                    helperText="Enter the full URL of the blog post"
                    required
                  />

                  <SmartTextarea
                    label="Query about the blog post"
                    name="bulb_enter_your_query_about_the_blog_post"
                    value={formData.bulb_enter_your_query_about_the_blog_post}
                    onChange={(val) => setFormData({ ...formData, bulb_enter_your_query_about_the_blog_post: val })}
                    placeholder="What is the main argument of this article?"
                    helperText="Ask anything about the blog content"
                    rows={4}
                    required
                  />

                  <ExamplePrompt
                    examples={[
                      "What are the key takeaways from this post?",
                      "Summarize the author's main points",
                      "What evidence does the author provide?",
                    ]}
                    onSelect={(q) => setFormData({ ...formData, bulb_enter_your_query_about_the_blog_post: q })}
                  />
                </FormSection>

                <ActionButton type="submit" loading={loading} disabled={loading} size="lg" className="w-full">
                  <Search className="h-4 w-4" />
                  Search Blog
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator 
              message="Searching blog post..." 
              subtext="Analyzing content with AI"
            />
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultCard
                icon={<Search className="h-5 w-5" />}
                title="Analysis Result"
                description={result.result}
                variant="success"
              />

              <EmptyState
                icon={<Lightbulb className="h-16 w-16 text-gray-600" />}
                title="Analysis Complete"
                description="Your blog search results are ready above."
                action={
                  <ActionButton onClick={() => { setResult(null); setFormData({ enter_your_qdrant_host_url: "", enter_your_qdrant_api_key: "", enter_your_gemini_api_key: "", link_paste_the_blog_link: "", bulb_enter_your_query_about_the_blog_post: "" }); }}>
                    Search Again
                  </ActionButton>
                }
              />
            </motion.div>
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Link2 className="h-16 w-16 text-gray-600" />}
              title="Ready to Search"
              description="Enter your Qdrant credentials, blog URL, and query to analyze blog posts."
              tips={[
                "Make sure your Qdrant cluster is running",
                "Enter the full blog URL including https://",
                "Ask specific questions for better results",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiBlogSearchPage;