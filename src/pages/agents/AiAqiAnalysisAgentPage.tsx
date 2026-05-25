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
import { ExamplePrompt } from "@/components/agent-ui/ExamplePrompt";
import { Loader2, Sparkles, Cloud, MapPin, Heart, Activity, Wind } from "lucide-react";

const AiAqiAnalysisAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ 
    firecrawl_api_key: "", 
    openai_api_key: "", 
    city: "", 
    state: "", 
    country: "", 
    medical_conditions_optional: "", 
    planned_activity: "" 
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ai-aqi-analysis-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ai-aqi-analysis-state', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firecrawl_api_key.trim() || !formData.openai_api_key.trim() || !formData.city.trim() || !formData.state.trim() || !formData.country.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-aqi-analysis-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem('ai-aqi-analysis-state');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>AiAqiAnalysisAgent - VideoRemix.vip</title>
        <meta name="description" content="Use ai-aqi-analysis-agent to analyze air quality with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Ai Aqi Analysis Agent</h1>
            <p className="text-xl text-gray-400">AI-powered air quality analysis and health recommendations.</p>
          </motion.div>

          {error && <ErrorMessage title="Request Failed" message={error} onRetry={handleSubmit} retryLoading={loading} />}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="API Keys" description="Enter your API keys to enable AI processing">
                  <ApiKeyInput
                    label="Firecrawl API Key"
                    name="firecrawl_api_key"
                    value={formData.firecrawl_api_key}
                    onChange={(val) => setFormData({ ...formData, firecrawl_api_key: val })}
                    placeholder="fc-..."
                    helperText="Get your API key from Firecrawl"
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

                <FormSection title="Location" description="Enter the location to analyze air quality">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SmartInput
                      label="City"
                      name="city"
                      value={formData.city}
                      onChange={(val) => setFormData({ ...formData, city: val })}
                      placeholder="Los Angeles"
                      helperText="Enter city name"
                      required
                    />
                    <SmartInput
                      label="State"
                      name="state"
                      value={formData.state}
                      onChange={(val) => setFormData({ ...formData, state: val })}
                      placeholder="California"
                      helperText="Enter state or region"
                      required
                    />
                    <SmartInput
                      label="Country"
                      name="country"
                      value={formData.country}
                      onChange={(val) => setFormData({ ...formData, country: val })}
                      placeholder="USA"
                      helperText="Enter country name"
                      required
                    />
                  </div>
                </FormSection>

                <FormSection title="Health Context" description="Optional information for personalized recommendations">
                  <SmartTextarea
                    label="Medical Conditions (optional)"
                    name="medical_conditions_optional"
                    value={formData.medical_conditions_optional}
                    onChange={(val) => setFormData({ ...formData, medical_conditions_optional: val })}
                    placeholder="Asthma, allergies, or other respiratory conditions"
                    helperText="This helps provide personalized health recommendations"
                    rows={3}
                  />

                  <SmartTextarea
                    label="Planned Activity"
                    name="planned_activity"
                    value={formData.planned_activity}
                    onChange={(val) => setFormData({ ...formData, planned_activity: val })}
                    placeholder="Morning jog, cycling, outdoor work"
                    helperText="Tell us what activities you're planning"
                    rows={3}
                    required
                  />

                  <ExamplePrompt
                    examples={[
                      "Outdoor yoga session in the park",
                      "Running a marathon in the city",
                      "Children playing in the backyard",
                    ]}
                    onSelect={(q) => setFormData({ ...formData, planned_activity: q })}
                  />
                </FormSection>

                <ActionButton type="submit" loading={loading} disabled={loading} size="lg" className="w-full">
                  <Wind className="h-4 w-4" />
                  Analyze Air Quality
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator 
              message="Analyzing air quality data..." 
              subtext="Gathering real-time AQI information"
            />
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultCard
                icon={<Cloud className="h-5 w-5" />}
                title="Air Quality Analysis"
                description={result.result}
                variant="success"
              />

              <EmptyState
                icon={<Wind className="h-16 w-16 text-gray-600" />}
                title="Analysis Complete"
                description="Your personalized air quality recommendations are ready."
                action={
                  <ActionButton onClick={() => { setResult(null); setFormData({ firecrawl_api_key: "", openai_api_key: "", city: "", state: "", country: "", medical_conditions_optional: "", planned_activity: "" }); }}>
                    Analyze Another Location
                  </ActionButton>
                }
              />
            </motion.div>
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Wind className="h-16 w-16 text-gray-600" />}
              title="Ready to Analyze"
              description="Enter a location and activity to get personalized air quality recommendations."
              tips={[
                "Be specific about your location for accurate data",
                "Include any respiratory conditions for better recommendations",
                "Describe your planned outdoor activities",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiAqiAnalysisAgentPage;