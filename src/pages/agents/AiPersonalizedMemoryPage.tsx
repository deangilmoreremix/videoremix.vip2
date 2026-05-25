import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { FormSection } from "@/components/agent-ui/FormSection";
import { Brain, User, Sparkles, CheckCircle2, MessageSquare } from "lucide-react";

const STORAGE_KEY = 'ai-personalized-memory';

const AiPersonalizedMemoryPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: '',
    username: '',
    userQuery: ''
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
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-personalized-memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enter_openai_api_key: formData.openaiApiKey,
          enter_your_username: formData.username,
          ask_chatgpt: formData.userQuery,
          userId: user?.id
        })
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

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (result && result.status === 'completed' && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - Personalized Memory</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-3">Memory Query Complete</h1>
                <p className="text-gray-400">AI-powered personalized response ready</p>
              </div>

              <ResultGrid columns={2}>
                <ResultCard
                  icon={<User className="h-5 w-5" />}
                  title="User"
                  value={formData.username}
                />
                <ResultCard
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  title="Status"
                  value="Complete"
                  variant="success"
                />
              </ResultGrid>

              {result.response && (
                <ResultCard
                  icon={<MessageSquare className="h-5 w-5" />}
                  title="AI Response"
                  description={result.response}
                  variant="info"
                />
              )}

              {result.result && (
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">Full Response</h3>
                  <div className="text-gray-300 whitespace-pre-wrap">{result.result}</div>
                </div>
              )}

              <div className="flex justify-center">
                <ActionButton onClick={() => { setResult(null); }}>
                  Ask Another Question
                </ActionButton>
              </div>
            </motion.div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Personalized Memory Agent - VideoRemix.vip</title>
        <meta name="description" content="AI-powered personalized memory and context agent." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-600 to-blue-500 rounded-3xl mb-6">
              <Brain className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Personalized Memory Agent</h1>
            <p className="text-xl text-gray-400">AI-powered memory and context-aware responses.</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Account" description="Your user information">
                  <SmartInput
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={(v) => updateField('username', v)}
                    placeholder="johndoe, sarah_dev..."
                    helperText="Enter your username to access your personalized memory context"
                    required
                  />
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(v) => updateField('openaiApiKey', v)}
                    helperText="Required for AI-powered memory and context"
                    required
                  />
                </FormSection>

                <FormSection title="Query" description="Ask anything based on your memory context">
                  <SmartTextarea
                    label="Your Question"
                    name="userQuery"
                    value={formData.userQuery}
                    onChange={(v) => updateField('userQuery', v)}
                    placeholder="What was my last project about? Remember my preferences for...? Can you recall my goals for...?"
                    helperText="Ask any question and the AI will use your stored memory context to provide personalized answers"
                    example={"What software tools did I mention using in my last project?\nRemember my communication style preferences\nRecall my career goals from our last discussion"}
                    rows={4}
                    required
                  />
                </FormSection>

                {error && (
                  <ErrorMessage
                    title="Query failed"
                    message={error}
                    onRetry={handleSubmit}
                    retryLoading={loading}
                  />
                )}

                <ActionButton
                  type="submit"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={loading || !formData.username.trim() || !formData.userQuery.trim()}
                  size="lg"
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4" />
                  Ask AI
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator
              message="Accessing your memory context..."
              subtext="This typically takes 5-15 seconds"
            />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Brain className="h-16 w-16 text-gray-600" />}
              title="Access your personalized memory"
              description="Enter your username and ask questions that use your stored context"
              tips={[
                "Use consistent usernames across sessions for best results",
                "Ask questions that reference your past interactions",
                "The AI uses your stored memory to provide contextual answers",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiPersonalizedMemoryPage;
