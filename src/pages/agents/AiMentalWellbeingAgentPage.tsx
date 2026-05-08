import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { FormSection } from "@/components/agent-ui/FormSection";
import { Heart, Brain, Users, Activity, CheckCircle2, Lightbulb } from "lucide-react";

const STORAGE_KEY = 'ai-mental-wellbeing-agent';

const AiMentalWellbeingAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    feeling: '',
    stressLevel: '5',
    supportSystem: '',
    lifeChanges: '',
    symptoms: ''
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
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-mental-wellbeing-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          how_have_you_been_feeling_recently: formData.feeling,
          current_stress_level_110: formData.stressLevel,
          current_support_system: formData.supportSystem,
          any_significant_life_changes_or_events_recently: formData.lifeChanges,
          current_symptoms: formData.symptoms,
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
          <title>Results - Mental Wellbeing</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-3">Wellbeing Assessment Complete</h1>
                <p className="text-gray-400">Your personalized insights are ready</p>
              </div>

              <ResultGrid columns={2}>
                <ResultCard
                  icon={<Brain className="h-5 w-5" />}
                  title="Stress Level"
                  value={formData.stressLevel}
                  subtext="out of 10"
                  variant={parseInt(formData.stressLevel) > 7 ? "warning" : "success"}
                />
                <ResultCard
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  title="Status"
                  value="Assessment Complete"
                  variant="success"
                />
              </ResultGrid>

              {result.insights && (
                <ResultCard
                  icon={<Lightbulb className="h-5 w-5" />}
                  title="AI Insights"
                  description={result.insights}
                  variant="info"
                />
              )}

              {result.recommendations && (
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-400" />
                    Personalized Recommendations
                  </h3>
                  <div className="text-gray-300 whitespace-pre-wrap">{result.recommendations}</div>
                </div>
              )}

              <div className="flex justify-center">
                <ActionButton onClick={() => { setResult(null); }}>
                  Start New Assessment
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
        <title>Mental Wellbeing Agent - VideoRemix.vip</title>
        <meta name="description" content="AI-powered mental health and wellbeing support agent." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-600 to-violet-500 rounded-3xl mb-6">
              <Heart className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Mental Wellbeing Agent</h1>
            <p className="text-xl text-gray-400">AI-powered mental health check-in and personalized support.</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Wellbeing Check-In</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Current State" description="How are you feeling right now?">
                  <SmartTextarea
                    label="How have you been feeling recently?"
                    name="feeling"
                    value={formData.feeling}
                    onChange={(v) => updateField('feeling', v)}
                    placeholder="I've been feeling anxious about work and having trouble sleeping..."
                    helperText="Share what's on your mind. The more detail you provide, the better insights you receive."
                    rows={4}
                    required
                  />

                  <SmartInput
                    label="Stress Level (1-10)"
                    name="stressLevel"
                    value={formData.stressLevel}
                    onChange={(v) => updateField('stressLevel', v)}
                    placeholder="Rate your stress from 1 (very low) to 10 (very high)"
                    helperText="1 = minimal stress, 10 = overwhelming stress"
                    required
                  />
                </FormSection>

                <FormSection title="Support System" description="Who and what supports you">
                  <SmartInput
                    label="Current Support System"
                    name="supportSystem"
                    value={formData.supportSystem}
                    onChange={(v) => updateField('supportSystem', v)}
                    placeholder="Family, friends, therapist, support groups..."
                    helperText="List the people and resources that help you cope"
                  />
                </FormSection>

                <FormSection title="Life Events" description="Any recent changes or events">
                  <SmartTextarea
                    label="Significant life changes or events recently"
                    name="lifeChanges"
                    value={formData.lifeChanges}
                    onChange={(v) => updateField('lifeChanges', v)}
                    placeholder="Started a new job, moved to a new city, relationship changes..."
                    helperText="Major life events can impact your mental wellbeing"
                    rows={3}
                  />
                </FormSection>

                <FormSection title="Symptoms" description="Any current symptoms to track">
                  <SmartInput
                    label="Current Symptoms"
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={(v) => updateField('symptoms', v)}
                    placeholder="Sleep issues, appetite changes, mood swings, physical symptoms..."
                    helperText="Track any physical or emotional symptoms you've noticed"
                  />
                </FormSection>

                {error && (
                  <ErrorMessage
                    title="Assessment failed"
                    message={error}
                    onRetry={handleSubmit}
                    retryLoading={loading}
                  />
                )}

                <ActionButton
                  type="submit"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={loading || !formData.feeling.trim()}
                  size="lg"
                  className="w-full"
                >
                  <Brain className="h-4 w-4" />
                  Get Personalized Insights
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator
              message="Analyzing your wellbeing..."
              subtext="Creating personalized recommendations based on your inputs"
            />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Heart className="h-16 w-16 text-gray-600" />}
              title="Start your wellbeing check-in"
              description="Take a moment to reflect on your mental health and get personalized support"
              tips={[
                "Be honest about how you're really feeling",
                "There's no "wrong" stress level - everyone's experience is different",
                "Sharing details helps generate more relevant insights",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiMentalWellbeingAgentPage;
