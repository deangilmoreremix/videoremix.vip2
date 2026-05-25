import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, Mail, Key, MessageSquare } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ExamplePrompt } from "@/components/agent-ui/ExamplePrompt";

const STORAGE_KEY = 'chat-with-gmail-form';

const ChatWithGmailPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ 
    enter_your_openai_api_key: "", 
    ask_any_question_about_your_emails: "" 
  });
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
    if (!formData.enter_your_openai_api_key.trim()) {
      setError("Please enter your OpenAI API key");
      return;
    }
    if (!formData.ask_any_question_about_your_emails.trim()) {
      setError("Please enter your question");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-gmail`, {
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
    setFormData({ enter_your_openai_api_key: "", ask_any_question_about_your_emails: "" });
    setResult(null);
    setError(null);
  };

  return (
    <>
      <Helmet>
        <title>ChatWithGmail - VideoRemix.vip</title>
        <meta name="description" content="Use chat-with-gmail to ask questions about your emails." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-orange-500 rounded-3xl mb-6">
              <Mail className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Chat with Gmail</h1>
            <p className="text-xl text-gray-400">Ask questions about your email history. Get insights about your communications, find specific messages, and summarize email threads.</p>
          </motion.div>

          {!result && !loading && (
            <EmptyState
              icon={<MessageSquare className="h-16 w-16 text-gray-600" />}
              title="Explore your email history"
              description="Ask questions about your Gmail messages. Find important emails, summarize threads, or get insights about your communication patterns."
              tips={[
                "Ask about specific topics or time periods in your emails",
                "Example: 'Find all emails from my manager about the project'",
                "Example: 'Summarize our email correspondence with this client'",
                "The AI searches through your emails to find relevant answers"
              ]}
            />
          )}

          <FormSection
            title="API Configuration"
            description="Enter your OpenAI API key to enable email analysis"
          >
            <SmartInput
              label="OpenAI API Key"
              name="enter_your_openai_api_key"
              type="password"
              value={formData.enter_your_openai_api_key}
              onChange={(val) => setFormData({ ...formData, enter_your_openai_api_key: val })}
              placeholder="sk-..."
              helperText="Your OpenAI API key for analyzing emails. Stored locally."
              required
            />
          </FormSection>

          <FormSection
            title="Your Question"
            description="Ask anything about your emails"
          >
            <SmartInput
              label="Your Question"
              name="ask_any_question_about_your_emails"
              value={formData.ask_any_question_about_your_emails}
              onChange={(val) => setFormData({ ...formData, ask_any_question_about_your_emails: val })}
              placeholder="e.g., What emails did I receive about the quarterly report?"
              helperText="Ask a specific question about your email content"
              required
            />

            <ExamplePrompt
              examples={[
                "Find all emails about our upcoming meeting",
                "Summarize emails from this week",
                "What newsletters do I subscribe to?",
                "Show me all emails with attachments from this month"
              ]}
              onSelect={(val) => setFormData({ ...formData, ask_any_question_about_your_emails: val })}
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
              message="Searching your emails..."
              subtext="Finding relevant messages and generating answer"
            />
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultGrid columns={1}>
                <ResultCard
                  icon={<MessageSquare className="h-5 w-5" />}
                  title="Answer"
                  description={result.result}
                  variant="success"
                />
              </ResultGrid>

              <ActionButton onClick={handleClear} variant="ghost" className="w-full">
                Ask Another Question
              </ActionButton>
            </motion.div>
          )}

          {!result && !loading && (
            <div className="flex gap-3 mt-6">
              <ActionButton onClick={handleSubmit} loading={loading} size="lg" className="flex-1">
                <Sparkles className="h-4 w-4" />
                Get Answer
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

export default ChatWithGmailPage;
