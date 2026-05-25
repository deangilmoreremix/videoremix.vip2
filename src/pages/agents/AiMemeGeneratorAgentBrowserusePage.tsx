import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { SelectDropdown } from "@/components/agent-ui/SelectDropdown";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { FormSection } from "@/components/agent-ui/FormSection";
import { Sparkles, Image as ImageIcon, CheckCircle2 } from "lucide-react";

const STORAGE_KEY = 'ai-meme-generator-browseruse';

const AiMemeGeneratorAgentBrowserusePage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    aiModel: '',
    claudeApiKey: '',
    deepseekApiKey: '',
    openaiApiKey: '',
    memeIdea: ''
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
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-meme-generator-agent-browseruse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          select_ai_model: formData.aiModel,
          claude_api_key: formData.claudeApiKey,
          deepseek_api_key: formData.deepseekApiKey,
          openai_api_key: formData.openaiApiKey,
          meme_idea_input: formData.memeIdea,
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
          <title>Results - Meme Generator</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-3">Meme Generated!</h1>
                <p className="text-gray-400">Your AI-generated meme is ready</p>
              </div>

              <ResultGrid columns={2}>
                <ResultCard
                  icon={<Sparkles className="h-5 w-5" />}
                  title="AI Model Used"
                  value={formData.aiModel || 'Default'}
                />
                <ResultCard
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  title="Status"
                  value="Completed"
                  variant="success"
                />
              </ResultGrid>

              {result.memeUrl && (
                <ResultCard
                  icon={<ImageIcon className="h-5 w-5" />}
                  title="Generated Meme"
                  description={<img src={result.memeUrl} alt="Generated meme" className="mt-2 rounded-lg max-w-full" />}
                />
              )}

              {result.result && (
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">Meme Details</h3>
                  <div className="text-gray-300 whitespace-pre-wrap">{result.result}</div>
                </div>
              )}

              <div className="flex justify-center">
                <ActionButton onClick={() => { setResult(null); }}>
                  Generate Another Meme
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
        <title>Meme Generator Agent - VideoRemix.vip</title>
        <meta name="description" content="AI-powered meme generation agent." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-600 to-orange-500 rounded-3xl mb-6">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Meme Generator Agent</h1>
            <p className="text-xl text-gray-400">AI-powered meme generation using browser automation.</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="AI Model Selection" description="Choose which AI model to use">
                  <SelectDropdown
                    label="Select AI Model"
                    value={formData.aiModel}
                    onValueChange={(v) => updateField('aiModel', v)}
                    options={[
                      { value: 'claude', label: 'Claude (Anthropic)' },
                      { value: 'gpt4', label: 'GPT-4 (OpenAI)' },
                      { value: 'deepseek', label: 'DeepSeek' }
                    ]}
                    helperText="Different models may produce different creative results"
                    required
                  />
                </FormSection>

                <FormSection title="API Keys" description="Configure your AI service credentials">
                  <ApiKeyInput
                    label="Claude API Key"
                    value={formData.claudeApiKey}
                    onChange={(v) => updateField('claudeApiKey', v)}
                    helperText="Required if using Claude model"
                  />
                  <ApiKeyInput
                    label="DeepSeek API Key"
                    value={formData.deepseekApiKey}
                    onChange={(v) => updateField('deepseekApiKey', v)}
                    helperText="Required if using DeepSeek model"
                  />
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(v) => updateField('openaiApiKey', v)}
                    helperText="Required if using GPT-4 model"
                  />
                </FormSection>

                <FormSection title="Meme Idea" description="Describe your meme concept">
                  <SmartInput
                    label="Meme Idea Input"
                    name="memeIdea"
                    value={formData.memeIdea}
                    onChange={(v) => updateField('memeIdea', v)}
                    placeholder="A cat sitting like a human at a dinner table..."
                    helperText="Describe the meme concept in detail for best results"
                    required
                  />
                </FormSection>

                {error && (
                  <ErrorMessage
                    title="Meme generation failed"
                    message={error}
                    onRetry={handleSubmit}
                    retryLoading={loading}
                  />
                )}

                <ActionButton
                  type="submit"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={loading || !formData.memeIdea.trim()}
                  size="lg"
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Meme
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator
              message="Generating your meme..."
              subtext="This typically takes 15-30 seconds"
            />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<ImageIcon className="h-16 w-16 text-gray-600" />}
              title="Create a viral meme"
              description="Describe your meme idea and let AI generate it for you"
              tips={[
                "Be descriptive about the scene and mood you want",
                "Reference popular meme formats if applicable",
                "Include specific characters, objects, or text you want",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiMemeGeneratorAgentBrowserusePage;
