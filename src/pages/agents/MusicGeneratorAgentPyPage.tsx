import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { FormSection } from "@/components/agent-ui/FormSection";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ResultCard } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { Loader2, Sparkles } from "lucide-react";

const MusicGeneratorAgentPyPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ enter_a_music_generation_prompt: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/music-generator-agent-py`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>MusicGeneratorAgentPy - VideoRemix.vip</title>
        <meta name="description" content="Use music-generator-agent-py to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Music Generator Agent Py</h1>
            <p className="text-xl text-gray-400">AI-powered music generator agent py.</p>
          </motion.div>

          {error && <ErrorMessage title="Generation Failed" message={error} onRetry={handleSubmit} retryLoading={loading} />}

          {loading && <LoadingIndicator message="Generating music..." subtext="AI is composing your track" />}

          {!loading && !result && (
            <Card className="bg-gray-800/50 border-gray-700 mb-8">
              <CardHeader><CardTitle>Input</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <FormSection title="Music Prompt" description="Describe the music you want to generate">
                    <SmartTextarea label="Enter a music generation prompt" name="enter_a_music_generation_prompt" value={formData.enter_a_music_generation_prompt} onChange={(v) => setFormData({ ...formData, enter_a_music_generation_prompt: v })} placeholder="" required />
                  </FormSection>

                  <ActionButton type="submit" loading={loading} className="w-full">
                    Generate Results
                  </ActionButton>
                </form>
              </CardContent>
            </Card>
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <ResultCard title="Results" variant="success">
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Audio Response</Label>
                    <audio controls src={result.audioUrl} className="w-full" />
                  </div>

                  <div className="space-y-2">
                    <Label>Transcript</Label>
                    <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans">{result.result}</pre>
                  </div>
                </div>
              </ResultCard>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
};

 export default MusicGeneratorAgentPyPage;
