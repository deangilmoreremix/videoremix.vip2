import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ResultCard } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { SelectDropdown } from "@/components/agent-ui/SelectDropdown";
import { Loader2, Sparkles, MapPin, Clock, User, Headphones } from "lucide-react";

const AiAudioTourAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ 
    openai_api_key: "", 
    tour_duration_minutes: "30", 
    guide: "historical"
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ai-audio-tour-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ai-audio-tour-state', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.openai_api_key.trim()) {
      setError('Please enter your OpenAI API key');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-audio-tour-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem('ai-audio-tour-state');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>AiAudioTourAgent - VideoRemix.vip</title>
        <meta name="description" content="Use ai-audio-tour-agent to create AI-powered audio tours." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Ai Audio Tour Agent</h1>
            <p className="text-xl text-gray-400">Create AI-powered audio tours for any location.</p>
          </motion.div>

          {error && <ErrorMessage title="Request Failed" message={error} onRetry={handleSubmit} retryLoading={loading} />}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Tour Configuration</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="API Configuration" description="Enter your OpenAI API key">
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

                <FormSection title="Tour Settings" description="Customize your audio tour">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-200 flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Tour Duration (minutes)
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="120"
                        step="5"
                        value={formData.tour_duration_minutes}
                        onChange={(e) => setFormData({ ...formData, tour_duration_minutes: e.target.value })}
                        className="w-full accent-violet-500"
                      />
                      <p className="text-xs text-gray-400 text-center">{formData.tour_duration_minutes} minutes</p>
                    </div>

                    <SelectDropdown
                      label="Guide Style"
                      value={formData.guide}
                      onValueChange={(val) => setFormData({ ...formData, guide: val })}
                      options={[
                        { value: "historical", label: "Historical" },
                        { value: "fun", label: "Fun & Engaging" },
                        { value: "educational", label: "Educational" },
                        { value: "mysterious", label: "Mysterious" },
                      ]}
                      helperText="Choose the tone of your tour guide"
                    />
                  </div>
                </FormSection>

                <ActionButton type="submit" loading={loading} disabled={loading} size="lg" className="w-full">
                  <Headphones className="h-4 w-4" />
                  Generate Audio Tour
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator 
              message="Generating your audio tour..." 
              subtext="Creating narration and audio"
            />
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {result.audioUrl && (
                <ResultCard
                  icon={<Headphones className="h-5 w-5" />}
                  title="Audio Tour Ready"
                  description="Your audio tour has been generated. Listen below."
                  variant="success"
                />
              )}

              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                <label className="text-sm font-medium text-gray-200 mb-3 flex items-center gap-2">
                  <Headphones className="h-4 w-4" /> Audio Player
                </label>
                <audio controls src={result.audioUrl} className="w-full" />
              </div>

              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                <label className="text-sm font-medium text-gray-200 mb-3 flex items-center gap-2">
                  Transcript
                </label>
                <p className="text-gray-300 whitespace-pre-wrap">{result.result}</p>
              </div>

              <EmptyState
                icon={<MapPin className="h-16 w-16 text-gray-600" />}
                title="Tour Generated"
                description="Your audio tour is ready to share."
                action={
                  <ActionButton onClick={() => { setResult(null); setFormData({ openai_api_key: "", tour_duration_minutes: "30", guide: "historical" }); }}>
                    Create Another Tour
                  </ActionButton>
                }
              />
            </motion.div>
          )}

          {!result && !loading && (
            <EmptyState
              icon={<MapPin className="h-16 w-16 text-gray-600" />}
              title="Ready to Create"
              description="Configure your tour settings and generate an AI-powered audio tour."
              tips={[
                "Set your desired tour duration",
                "Choose a guide style that fits your audience",
                "The AI will generate narration based on your settings",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiAudioTourAgentPage;