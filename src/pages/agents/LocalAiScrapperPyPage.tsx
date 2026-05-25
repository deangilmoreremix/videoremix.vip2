import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { FormSection } from "@/components/agent-ui/FormSection";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, Globe, Search, FileText } from "lucide-react";

const LocalAiScrapperPyPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ enter_the_url_of_the_website_you_want_to_scrape: "", what_you_want_the_ai_agent_to_scrape_from_the_website: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('local-ai-scrapper-data');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('local-ai-scrapper-data', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.enter_the_url_of_the_website_you_want_to_scrape.trim()) {
      setError("Please enter a website URL");
      return;
    }
    if (!formData.what_you_want_the_ai_agent_to_scrape_from_the_website.trim()) {
      setError("Please describe what you want to scrape");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/local-ai-scrapper-py`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem('local-ai-scrapper-data');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ enter_the_url_of_the_website_you_want_to_scrape: "", what_you_want_the_ai_agent_to_scrape_from_the_website: "" });
    setResult(null);
  };

  return (
    <>
      <Helmet>
        <title>LocalAiScrapperPy - VideoRemix.vip</title>
        <meta name="description" content="Use local-ai-scrapper-py to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl mb-6">
              <Search className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Local AI Web Scraper</h1>
            <p className="text-xl text-gray-400">Intelligently extract data from any website using AI.</p>
          </motion.div>

          {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

          {!result ? (
            <Card className="bg-gray-800/50 border-gray-700 mb-8">
              <CardHeader><CardTitle>Scraping Configuration</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <FormSection title="Target Website" description="Enter the URL of the website you want to scrape">
                    <SmartInput
                      label="Website URL"
                      name="enter_the_url_of_the_website_you_want_to_scrape"
                      type="url"
                      value={formData.enter_the_url_of_the_website_you_want_to_scrape}
                      onChange={(val) => setFormData({ ...formData, enter_the_url_of_the_website_you_want_to_scrape: val })}
                      placeholder="https://news.ycombinator.com"
                      helperText="Enter the full URL including https://. The AI will navigate and extract relevant content."
                      required
                    />
                  </FormSection>

                  <FormSection title="Data to Extract" description="Describe what specific information you want to extract">
                    <SmartTextarea
                      label="What to Scrape"
                      name="what_you_want_the_ai_agent_to_scrape_from_the_website"
                      value={formData.what_you_want_the_ai_agent_to_scrape_from_the_website}
                      onChange={(val) => setFormData({ ...formData, what_you_want_the_ai_agent_to_scrape_from_the_website: val })}
                      placeholder="Extract all article titles, their URLs, point counts, and author names from the front page"
                      helperText="Be specific about what data you need. Reference page elements, sections, or data types."
                      rows={4}
                      required
                    />
                  </FormSection>

                  <div className="flex gap-3 pt-4">
                    <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={!formData.enter_the_url_of_the_website_you_want_to_scrape.trim()}>
                      <Sparkles className="h-4 w-4" />
                      Start Scraping
                    </ActionButton>
                    <ActionButton variant="ghost" onClick={handleClear} disabled={loading}>
                      Clear
                    </ActionButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : loading ? (
            <LoadingIndicator message="Scraping website..." subtext="AI is extracting the requested information" />
          ) : null}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultGrid columns={2}>
                <ResultCard
                  icon={<Globe className="h-5 w-5" />}
                  title="Source URL"
                  value={formData.enter_the_url_of_the_website_you_want_to_scrape}
                  subtext="Website scraped"
                />
                <ResultCard
                  icon={<FileText className="h-5 w-5" />}
                  title="Status"
                  value="Completed"
                  variant="success"
                />
              </ResultGrid>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>Extracted Data</CardTitle></CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans text-gray-200">{result.result}</pre>
                  </div>
                </CardContent>
              </Card>

              <ActionButton onClick={() => { setResult(null); setFormData({ enter_the_url_of_the_website_you_want_to_scrape: "", what_you_want_the_ai_agent_to_scrape_from_the_website: "" }); }} variant="secondary" className="w-full">
                Scrape Another Website
              </ActionButton>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
};

export default LocalAiScrapperPyPage;
