import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, MapPin, Calendar, Key } from "lucide-react";

const LocalTravelAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ enter_serp_api_key_for_search_functionality: "", where_do_you_want_to_go: "", how_many_days_do_you_want_to_travel_for: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('local-travel-agent-data');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('local-travel-agent-data', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.enter_serp_api_key_for_search_functionality.trim()) {
      setError("Serp API key is required for search functionality");
      return;
    }
    if (!formData.where_do_you_want_to_go.trim()) {
      setError("Please enter a destination");
      return;
    }
    if (!formData.how_many_days_do_you_want_to_travel_for.trim()) {
      setError("Please enter the number of days");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/local-travel-agent-`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem('local-travel-agent-data');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ enter_serp_api_key_for_search_functionality: "", where_do_you_want_to_go: "", how_many_days_do_you_want_to_travel_for: "" });
    setResult(null);
  };

  return (
    <>
      <Helmet>
        <title>LocalTravelAgent - VideoRemix.vip</title>
        <meta name="description" content="Use local-travel-agent- to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sky-600 to-blue-500 rounded-3xl mb-6">
              <MapPin className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Local Travel Agent</h1>
            <p className="text-xl text-gray-400">AI-powered travel planning with search integration.</p>
          </motion.div>

          {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

          {!result ? (
            <Card className="bg-gray-800/50 border-gray-700 mb-8">
              <CardHeader><CardTitle>Travel Planning Configuration</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <FormSection title="API Configuration" description="Enter your Serp API key for search functionality">
                    <ApiKeyInput
                      label="Serp API Key"
                      name="enter_serp_api_key_for_search_functionality"
                      value={formData.enter_serp_api_key_for_search_functionality}
                      onChange={(val) => setFormData({ ...formData, enter_serp_api_key_for_search_functionality: val })}
                      helperText="Required for web search capabilities. Get your key from serpapi.com"
                      required
                    />
                  </FormSection>

                  <FormSection title="Trip Details" description="Tell us about your travel plans">
                    <SmartInput
                      label="Destination"
                      name="where_do_you_want_to_go"
                      type="text"
                      value={formData.where_do_you_want_to_go}
                      onChange={(val) => setFormData({ ...formData, where_do_you_want_to_go: val })}
                      placeholder="Tokyo, Japan"
                      helperText="Enter a city, country, or specific location you want to visit"
                      required
                    />
                    
                    <SmartInput
                      label="Trip Duration"
                      name="how_many_days_do_you_want_to_travel_for"
                      type="number"
                      value={formData.how_many_days_do_you_want_to_travel_for}
                      onChange={(val) => setFormData({ ...formData, how_many_days_do_you_want_to_travel_for: val })}
                      placeholder="7"
                      helperText="Number of days for your trip. This helps plan an appropriate itinerary."
                      min={1}
                      max={365}
                      required
                    />
                  </FormSection>

                  <div className="flex gap-3 pt-4">
                    <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={!formData.where_do_you_want_to_go.trim()}>
                      <Sparkles className="h-4 w-4" />
                      Plan My Trip
                    </ActionButton>
                    <ActionButton variant="ghost" onClick={handleClear} disabled={loading}>
                      Clear
                    </ActionButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : loading ? (
            <LoadingIndicator message="Planning your trip..." subtext="Searching for attractions, restaurants, and tips" />
          ) : null}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultGrid columns={2}>
                <ResultCard
                  icon={<MapPin className="h-5 w-5" />}
                  title="Destination"
                  value={formData.where_do_you_want_to_go}
                  subtext="Your planned trip"
                />
                <ResultCard
                  icon={<Calendar className="h-5 w-5" />}
                  title="Duration"
                  value={`${formData.how_many_days_do_you_want_to_travel_for} days`}
                  variant="success"
                />
              </ResultGrid>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>Travel Plan</CardTitle></CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans text-gray-200">{result.result}</pre>
                  </div>
                </CardContent>
              </Card>

              <ActionButton onClick={() => { setResult(null); setFormData({ enter_serp_api_key_for_search_functionality: formData.enter_serp_api_key_for_search_functionality, where_do_you_want_to_go: "", how_many_days_do_you_want_to_travel_for: "" }); }} variant="secondary" className="w-full">
                Plan Another Trip
              </ActionButton>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
};

export default LocalTravelAgentPage;
