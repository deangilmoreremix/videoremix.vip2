import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ResultCard } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { FileText, Sparkles, Mail } from "lucide-react";

const STORAGE_KEY = 'chat-with-substack';

const ChatWithSubstackPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ openai_api_key: "", enter_substack_newsletter_url: "", ask_any_question_about_the_substack_newsletter: "" });
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
    if (!formData.openai_api_key.trim()) {
      setError("OpenAI API key is required");
      return;
    }
    if (!formData.enter_substack_newsletter_url.trim()) {
      setError("Substack newsletter URL is required");
      return;
    }
    if (!formData.ask_any_question_about_the_substack_newsletter.trim()) {
      setError("Question is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-substack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (result && result.status === 'completed') {
    return (
      <>
        <Helmet>
          <title>ChatWithSubstack - VideoRemix.vip</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <ResultCard
                icon={<Mail className="h-5 w-5" />}
                title="Newsletter Analysis"
                description={result.result}
                variant="success"
              />
              <div className="flex justify-center">
                <ActionButton onClick={() => { setResult(null); setFormData({ openai_api_key: "", enter_substack_newsletter_url: "", ask_any_question_about_the_substack_newsletter: "" }); }}>
                  <Sparkles className="h-4 w-4" />
                  Ask Another Question
                </ActionButton>
              </div>
            </motion.div>
          </div>
        </main>
      </>
    );
  }

  if (loading) {
    return <LoadingIndicator message="Analyzing newsletter..." subtext="Fetching and analyzing the Substack content" />;
  }

  if (!result && !loading) {
    return (
      <>
        <Helmet>
          <title>ChatWithSubstack - VideoRemix.vip</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl mb-6">
                <Mail className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Chat With Substack</h1>
              <p className="text-xl text-gray-400">AI-powered chat with Substack newsletters.</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 space-y-6">
                <SmartInput
                  label="OpenAI API Key"
                  name="openai_api_key"
                  value={formData.openai_api_key}
                  onChange={(value) => setFormData(prev => ({ ...prev, openai_api_key: value }))}
                  type="password"
                  placeholder="sk-..."
                  helperText="Your API key is stored locally and never sent to our servers"
                  required
                />

                <SmartInput
                  label="Newsletter URL"
                  name="enter_substack_newsletter_url"
                  value={formData.enter_substack_newsletter_url}
                  onChange={(value) => setFormData(prev => ({ ...prev, enter_substack_newsletter_url: value }))}
                  placeholder="e.g., https://yourname.substack.com/p/issue-42"
                  helperText="Paste the full URL of the Substack newsletter issue you want to analyze"
                  required
                />

                <SmartInput
                  label="Your Question"
                  name="ask_any_question_about_the_substack_newsletter"
                  value={formData.ask_any_question_about_the_substack_newsletter}
                  onChange={(value) => setFormData(prev => ({ ...prev, ask_any_question_about_the_substack_newsletter: value }))}
                  placeholder="e.g., 'What are the main arguments in this issue?'"
                  helperText="Ask anything about the newsletter content - summaries, key points, opinions, etc."
                  required
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <ActionButton type="submit" loading={loading} size="lg" className="w-full">
                <Sparkles className="h-4 w-4" />
                Analyze Newsletter
              </ActionButton>
            </form>

            <EmptyState
              icon={<Mail className="h-16 w-16 text-gray-600" />}
              title="Chat with Substack Newsletters"
              description="Paste a Substack newsletter URL and ask questions about its content"
              tips={[
                "Make sure the URL points to a specific issue or article",
                "Ask about main arguments, key takeaways, or the author's perspective",
                "You can ask follow-up questions after the first analysis"
              ]}
            />
          </div>
        </main>
      </>
    );
  }

  return null;
};

export default ChatWithSubstackPage;
