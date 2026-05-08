import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { Music, AudioWaveform, Sparkles, CheckCircle2, Play } from "lucide-react";

const STORAGE_KEY = 'ai-music-generator-agent';

const AiMusicGeneratorAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    musicPrompt: ''
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
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-music-generator-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enter_a_music_generation_prompt: formData.musicPrompt,
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

  if (result && result.status === 'completed' && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - Music Generator</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-3">Music Generated!</h1>
                <p className="text-gray-400">Your AI-generated music is ready</p>
              </div>

              <ResultGrid columns={2}>
                <ResultCard
                  icon={<Music className="h-5 w-5" />}
                  title="Status"
                  value="Completed"
                  variant="success"
                />
                <ResultCard
                  icon={<AudioWaveform className="h-5 w-5" />}
                  title="Generated"
                  value="New Track"
                />
              </ResultGrid>

              {result.audioUrl && (
                <ResultCard
                  icon={<Play className="h-5 w-5" />}
                  title="Your Generated Music"
                  description={
                    <audio controls src={result.audioUrl} className="w-full mt-2" />
                  }
                  variant="info"
                />
              )}

              {result.metadata && (
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-violet-400" />
                    Track Details
                  </h3>
                  <div className="text-gray-300 whitespace-pre-wrap">{result.metadata}</div>
                </div>
              )}

              <div className="flex justify-center">
                <ActionButton onClick={() => { setResult(null); }}>
                  Generate Another Track
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
        <title>Music Generator Agent - VideoRemix.vip</title>
        <meta name="description" content="AI-powered music generation agent." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-pink-500 rounded-3xl mb-6">
              <Music className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Music Generator Agent</h1>
            <p className="text-xl text-gray-400">AI-powered music generation from text prompts.</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Create Your Music</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <SmartTextarea
                  label="Music Generation Prompt"
                  name="musicPrompt"
                  value={formData.musicPrompt}
                  onChange={(v) => setFormData({ musicPrompt: v })}
                  placeholder="A calm ambient track with soft piano melodies, gentle strings, and subtle percussion for studying or relaxation. 120 BPM in the key of C major..."
                  helperText="Describe the music you want to create. Include genre, mood, instruments, tempo, and key. Be as detailed as possible for best results."
                  example={"Upbeat electronic dance music with driving bass, synth leads, and energetic drums. Perfect for workouts. 128 BPM"}
                  rows={5}
                  required
                />

                {error && (
                  <ErrorMessage
                    title="Music generation failed"
                    message={error}
                    onRetry={handleSubmit}
                    retryLoading={loading}
                  />
                )}

                <ActionButton
                  type="submit"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={loading || !formData.musicPrompt.trim()}
                  size="lg"
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Music
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator
              message="Generating your music..."
              subtext="This typically takes 30-60 seconds depending on the complexity"
            />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Music className="h-16 w-16 text-gray-600" />}
              title="Create your next track"
              description="Describe the music you want to generate and let AI bring your vision to life"
              tips={[
                "Include specific instruments or sounds you want",
                "Mention the mood (energetic, calm, emotional)",
                "Specify tempo (BPM), key, and genre if known",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiMusicGeneratorAgentPage;
