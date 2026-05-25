import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { SelectDropdown } from "@/components/agent-ui/SelectDropdown";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { FormSection } from "@/components/agent-ui/FormSection";
import { Film, Clapperboard, Clock, Users, Sparkles, CheckCircle2 } from "lucide-react";

const STORAGE_KEY = 'ai-movie-production-agent';

const AiMovieProductionAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    googleApiKey: '',
    serpApiKey: '',
    movieIdea: '',
    genre: '',
    targetAudience: '',
    runtime: '90'
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
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-movie-production-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enter_google_api_key_to_access_gemini_25_flash: formData.googleApiKey,
          enter_serp_api_key_for_search_functionality: formData.serpApiKey,
          describe_your_movie_idea_in_a_few_sentences: formData.movieIdea,
          select_the_movie_genre: formData.genre,
          select_the_target_audience: formData.targetAudience,
          estimated_runtime_in_minutes: formData.runtime,
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
          <title>Results - Movie Production</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-3">Movie Production Plan Generated</h1>
                <p className="text-gray-400">Your AI-powered movie production plan is ready</p>
              </div>

              <ResultGrid columns={3}>
                <ResultCard
                  icon={<Film className="h-5 w-5" />}
                  title="Genre"
                  value={formData.genre || 'Not specified'}
                />
                <ResultCard
                  icon={<Clock className="h-5 w-5" />}
                  title="Runtime"
                  value={`${formData.runtime} min`}
                />
                <ResultCard
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  title="Status"
                  value="Completed"
                  variant="success"
                />
              </ResultGrid>

              {result.script && (
                <ResultCard
                  icon={<Clapperboard className="h-5 w-5" />}
                  title="Generated Script"
                  description={result.script}
                  variant="info"
                />
              )}

              {result.result && (
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">Full Production Plan</h3>
                  <div className="text-gray-300 whitespace-pre-wrap">{result.result}</div>
                </div>
              )}

              <div className="flex justify-center">
                <ActionButton onClick={() => { setResult(null); }}>
                  Generate Another Plan
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
        <title>Movie Production Agent - VideoRemix.vip</title>
        <meta name="description" content="AI-powered movie production planning agent." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-orange-500 rounded-3xl mb-6">
              <Clapperboard className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Movie Production Agent</h1>
            <p className="text-xl text-gray-400">AI-powered movie script generation and production planning.</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Production Details</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="API Configuration" description="Required API keys for AI services">
                  <ApiKeyInput
                    label="Google API Key (Gemini 2.5 Flash)"
                    value={formData.googleApiKey}
                    onChange={(v) => updateField('googleApiKey', v)}
                    helperText="Required for Gemini AI features"
                    required
                  />
                  <ApiKeyInput
                    label="Serp API Key"
                    value={formData.serpApiKey}
                    onChange={(v) => updateField('serpApiKey', v)}
                    helperText="Required for search functionality"
                    required
                  />
                </FormSection>

                <FormSection title="Movie Concept" description="Describe your movie idea">
                  <SmartTextarea
                    label="Movie Idea"
                    name="movieIdea"
                    value={formData.movieIdea}
                    onChange={(v) => updateField('movieIdea', v)}
                    placeholder="A retired detective discovers a hidden camera in her apartment that reveals a conspiracy spanning three decades..."
                    helperText="Describe your movie concept in 2-3 sentences. Include genre, main characters, and core conflict."
                    rows={4}
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectDropdown
                      label="Movie Genre"
                      value={formData.genre}
                      onValueChange={(v) => updateField('genre', v)}
                      options={[
                        { value: 'drama', label: 'Drama' },
                        { value: 'thriller', label: 'Thriller' },
                        { value: 'comedy', label: 'Comedy' },
                        { value: 'scifi', label: 'Science Fiction' },
                        { value: 'horror', label: 'Horror' },
                        { value: 'romance', label: 'Romance' },
                        { value: 'action', label: 'Action' },
                        { value: 'documentary', label: 'Documentary' }
                      ]}
                      helperText="Select the primary genre"
                      required
                    />

                    <SelectDropdown
                      label="Target Audience"
                      value={formData.targetAudience}
                      onValueChange={(v) => updateField('targetAudience', v)}
                      options={[
                        { value: 'family', label: 'Family (All Ages)' },
                        { value: 'pg13', label: 'PG-13 (Teens+)' },
                        { value: 'r', label: 'R-Rated (Adults)' },
                        { value: 'children', label: 'Children' }
                      ]}
                      helperText="Select your target audience rating"
                      required
                    />
                  </div>

                  <SmartInput
                    label="Estimated Runtime (minutes)"
                    name="runtime"
                    value={formData.runtime}
                    onChange={(v) => updateField('runtime', v)}
                    placeholder="90, 120, 150..."
                    helperText="Typical movies range from 90-150 minutes"
                    required
                  />
                </FormSection>

                {error && (
                  <ErrorMessage
                    title="Production plan generation failed"
                    message={error}
                    onRetry={handleSubmit}
                    retryLoading={loading}
                  />
                )}

                <ActionButton
                  type="submit"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={loading || !formData.movieIdea.trim()}
                  size="lg"
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Production Plan
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator
              message="Generating movie production plan..."
              subtext="Creating script and production details based on your concept"
            />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Clapperboard className="h-16 w-16 text-gray-600" />}
              title="Create your movie"
              description="Describe your movie concept and let AI generate a complete production plan"
              tips={[
                "Be specific about genre, tone, and target audience",
                "Include main character archetypes and their arcs",
                "Describe the central conflict or story question",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiMovieProductionAgentPage;
