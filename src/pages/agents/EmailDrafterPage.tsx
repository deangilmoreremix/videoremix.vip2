import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { Sparkles } from "lucide-react";

const STORAGE_KEY = 'email-drafter-state';

const EmailDrafterPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    enter_your_openai_api_key: "",
    recipient: "",
    subject: "",
    key_points: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.recipient.trim()) {
      setError("Please fill in the required fields");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-drafter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: user?.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      enter_your_openai_api_key: "",
      recipient: "",
      subject: "",
      key_points: ""
    });
    setResult(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-20">
        <LoadingIndicator message="Processing your request..." subtext="AI is working on your task" />
      </div>
    );
  }

  if (result) {
    return (
      <>
        <Helmet>
          <title>Results - Email Drafter</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-500 rounded-3xl mb-6">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Email Drafter</h1>
              <p className="text-xl text-gray-400">Results generated successfully</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<Sparkles />}
                title="Status"
                value="Completed"
                variant="success"
              />
              <ResultCard
                icon={<Sparkles />}
                title="Agent"
                value="Email Drafter"
                variant="info"
              />
            </ResultGrid>

            {result.result && (
              <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Result</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">{typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2)}</p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Try Again
              </ActionButton>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Email Drafter - VideoRemix.vip</title>
        <meta name="description" content="Draft professional emails in seconds with AI assistance." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-500 rounded-3xl mb-6">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Email Drafter</h1>
            <p className="text-xl text-gray-400">Draft professional emails in seconds with AI assistance.</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Configure & Run</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="API Configuration" description="Enter your OpenAI API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    name="enter_your_openai_api_key"
                    value={formData.enter_your_openai_api_key}
                    onChange={(val) => updateField('enter_your_openai_api_key', val)}
                    placeholder="sk-..."
                    helperText="Get your API key from OpenAI Platform"
                    required
                  />
                </FormSection>

                <FormSection title="Recipient" description="Provide recipient">
                  <SmartInput
                    label="Recipient"
                    name="recipient"
                    value={formData.recipient}
                    onChange={(val) => updateField('recipient', val)}
                    placeholder="e.g. hiring manager, client, team member"
                    helperText="Recipient"
                    type="text"
                    required={true}
                  />
                </FormSection>
                <FormSection title="Subject" description="Provide subject">
                  <SmartInput
                    label="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={(val) => updateField('subject', val)}
                    placeholder="Email subject line"
                    helperText="Subject"
                    type="text"
                    required={true}
                  />
                </FormSection>
                <FormSection title="Key Points" description="Provide key points">
                  <SmartTextarea
                    label="Key Points"
                    name="key_points"
                    value={formData.key_points}
                    onChange={(val) => updateField('key_points', val)}
                    placeholder="Main points you want to communicate..."
                    helperText="Key Points"
                    rows={4}
                    required={true}
                  />
                </FormSection>

                {error && (
                  <ErrorMessage
                    title="Request Failed"
                    message={error}
                    onRetry={handleSubmit}
                    retryLoading={loading}
                  />
                )}

                <ActionButton
                  type="submit"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={loading || !formData.recipient.trim()}
                  size="lg"
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4" />
                  Run Agent
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          <EmptyState
            icon={<Sparkles className="h-16 w-16 text-gray-600" />}
            title="Ready to get started"
            description="Draft professional emails in seconds with AI assistance."
            tips={[
              "Enter your OpenAI API key to get started",
              "Provide clear inputs for best results",
              "Add any relevant context that might help the agent"
            ]}
          />
        </div>
      </main>
    </>
  );
};

export default EmailDrafterPage;
