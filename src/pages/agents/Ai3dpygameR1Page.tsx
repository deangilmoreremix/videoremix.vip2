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
import { Loader2, Sparkles, Gamepad2, Key, Code, HelpCircle } from "lucide-react";

const Ai3dpygameR1Page: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ 
    deepseek_api_key: "", 
    openai_api_key: "", 
    enter_your_pygame_query: "" 
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ai-3dpygame-r1-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ai-3dpygame-r1-state', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.deepseek_api_key.trim() || !formData.openai_api_key.trim() || !formData.enter_your_pygame_query.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-3dpygame-r1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem('ai-3dpygame-r1-state');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Ai3dpygameR1 - VideoRemix.vip</title>
        <meta name="description" content="Use ai-3dpygame-r1 to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Ai 3dpygame R1</h1>
            <p className="text-xl text-gray-400">AI-powered AI 3D PyGame agent with reasoning.</p>
          </motion.div>

          {error && <ErrorMessage title="Request Failed" message={error} onRetry={handleSubmit} retryLoading={loading} />}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="API Keys" description="Enter your API keys to enable AI processing">
                  <ApiKeyInput
                    label="DeepSeek API Key"
                    name="deepseek_api_key"
                    value={formData.deepseek_api_key}
                    onChange={(val) => setFormData({ ...formData, deepseek_api_key: val })}
                    placeholder="sk-..."
                    helperText="Get your API key from DeepSeek platform"
                    required
                  />

                  <ApiKeyInput
                    label="OpenAI API Key"
                    name="openai_api_key"
                    value={formData.openai_api_key}
                    onChange={(val) => setFormData({ ...formData, openai_api_key: val })}
                    placeholder="sk-..."
                    helperText="Get your API key from OpenAI Platform"
                    required
                  />
                </FormSection>

                <FormSection title="PyGame Query" description="Describe your PyGame project or question">
                  <SmartTextarea
                    label="Enter your PyGame query"
                    name="enter_your_pygame_query"
                    value={formData.enter_your_pygame_query}
                    onChange={(val) => setFormData({ ...formData, enter_your_pygame_query: val })}
                    placeholder="Create a 3D pong game with physics simulation"
                    helperText="Describe what you want to build or ask a question about PyGame"
                    rows={4}
                    required
                  />

                  <ExamplePrompt
                    examples={[
                      "Create a 3D racing game with realistic physics",
                      "Build a first-person shooter with multiplayer",
                      "How do I implement collision detection in PyGame?",
                    ]}
                    onSelect={(q) => setFormData({ ...formData, enter_your_pygame_query: q })}
                  />
                </FormSection>

                <ActionButton type="submit" loading={loading} disabled={loading} size="lg" className="w-full">
                  <Gamepad2 className="h-4 w-4" />
                  Generate Results
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator 
              message="Building your PyGame project..." 
              subtext="This may take a few moments"
            />
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultCard
                icon={<Code className="h-5 w-5" />}
                title="PyGame Code"
                description={result.result}
                variant="success"
              />

              <EmptyState
                icon={<Gamepad2 className="h-16 w-16 text-gray-600" />}
                title="Code Generated"
                description="Your PyGame code is ready above."
                action={
                  <ActionButton onClick={() => { setResult(null); setFormData({ deepseek_api_key: "", openai_api_key: "", enter_your_pygame_query: "" }); }}>
                    Generate More Code
                  </ActionButton>
                }
              />
            </motion.div>
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Gamepad2 className="h-16 w-16 text-gray-600" />}
              title="Ready to Create"
              description="Enter your PyGame query and let AI build your game."
              tips={[
                "Be specific about game mechanics you want",
                "Include details about graphics and physics",
                "Ask about specific PyGame features you need",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default Ai3dpygameR1Page;