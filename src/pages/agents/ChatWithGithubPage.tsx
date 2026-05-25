import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, Github, Key, MessageSquare } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ExamplePrompt } from "@/components/agent-ui/ExamplePrompt";

const STORAGE_KEY = 'chat-with-github-form';

const ChatWithGithubPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ 
    openai_api_key: "", 
    enter_the_github_repo: "", 
    ask_any_question_about_the_github_repo: "" 
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
    if (!formData.enter_the_github_repo.trim()) {
      setError("Please enter a GitHub repository");
      return;
    }
    if (!formData.ask_any_question_about_the_github_repo.trim()) {
      setError("Please enter your question");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-github`, {
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
    setFormData({ openai_api_key: "", enter_the_github_repo: "", ask_any_question_about_the_github_repo: "" });
    setResult(null);
    setError(null);
  };

  return (
    <>
      <Helmet>
        <title>ChatWithGithub - VideoRemix.vip</title>
        <meta name="description" content="Use chat-with-github to ask questions about any GitHub repository." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-900 rounded-3xl mb-6">
              <Github className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Chat with GitHub</h1>
            <p className="text-xl text-gray-400">Ask questions about any GitHub repository. Get instant answers about code, issues, pull requests, and documentation.</p>
          </motion.div>

          {!result && !loading && (
            <EmptyState
              icon={<MessageSquare className="h-16 w-16 text-gray-600" />}
              title="Explore any GitHub repository"
              description="Enter a repository URL and ask questions. Our AI will analyze the code and documentation to answer your questions."
              tips={[
                "Enter a repository like 'facebook/react' or 'https://github.com/torvalds/linux'",
                "Ask about specific features, bugs, or architecture",
                "The AI reads code, issues, and docs to find answers"
              ]}
            />
          )}

          <FormSection
            title="API Configuration"
            description="Enter your OpenAI API key for AI-powered analysis"
          >
            <SmartInput
              label="OpenAI API Key"
              name="openai_api_key"
              type="password"
              value={formData.openai_api_key}
              onChange={(val) => setFormData({ ...formData, openai_api_key: val })}
              placeholder="sk-..."
              helperText="Your OpenAI API key for analyzing the repository"
              required
            />
          </FormSection>

          <FormSection
            title="Repository & Question"
            description="Select a repository and ask your question"
          >
            <SmartInput
              label="GitHub Repository"
              name="enter_the_github_repo"
              value={formData.enter_the_github_repo}
              onChange={(val) => setFormData({ ...formData, enter_the_github_repo: val })}
              placeholder="e.g., facebook/react or https://github.com/facebook/react"
              helperText="Enter the repository owner/name or full URL"
              required
            />

            <SmartInput
              label="Your Question"
              name="ask_any_question_about_the_github_repo"
              value={formData.ask_any_question_about_the_github_repo}
              onChange={(val) => setFormData({ ...formData, ask_any_question_about_the_github_repo: val })}
              placeholder="e.g., How does the useState hook work internally?"
              helperText="Ask anything about the repository's code, issues, or documentation"
              required
            />

            <ExamplePrompt
              examples={[
                "What is the main purpose of this repository?",
                "Explain how the authentication flow works",
                "What are the key components and their roles?",
                "Find all API endpoints in this codebase"
              ]}
              onSelect={(val) => setFormData({ ...formData, ask_any_question_about_the_github_repo: val })}
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
              message="Analyzing repository..."
              subtext="Reading code and generating answer"
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

export default ChatWithGithubPage;
