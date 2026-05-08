import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, MapPin, Calendar, Plane } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { FormSection } from "@/components/agent-ui/FormSection";

const STORAGE_KEY = 'ai-travel-agent-form';

const AiTravelAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ 
    enter_serp_api_key_for_search_functionality: "", 
    where_do_you_want_to_go: "", 
    how_many_days_do_you_want_to_travel_for: "" 
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
    if (!formData.where_do_you_want_to_go.trim()) {
      setError("Please enter a destination");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-travel-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.error || "Request failed");
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ enter_serp_api_key_for_search_functionality: "", where_do_you_want_to_go: "", how_many_days_do_you_want_to_travel_for: "" });
    setResult(null);
    setError(null);
  };

  return (
    <>
      <Helmet>
        <title>AiTravelAgent - VideoRemix.vip</title>
        <meta name="description" content="Use ai-travel-agent to plan your trips with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-600 to-blue-500 rounded-3xl mb-6">
              <Plane className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">AI Travel Agent</h1>
            <p className="text-xl text-gray-400">Plan your perfect trip with AI-powered search and travel recommendations.</p>
          </motion.div>

          {!result && !loading && (
            <EmptyState
              icon={<MapPin className="h-16 w-16 text-gray-600" />}
              title="Plan your next adventure"
              description="Tell us where you want to go and how long you're staying. We'll find the best deals and attractions."
              tips={[
                "Enter a destination like 'Tokyo, Japan' or 'European backpack route'",
                "Specify number of days for accurate trip planning",
                "Have your SerpAPI key ready for search functionality"
              ]}
            />
          )}

          <FormSection
            title="API Configuration"
            description="Enter your SerpAPI key for search functionality"
          >
            <SmartInput
              label="SerpAPI Key"
              name="enter_serp_api_key_for_search_functionality"
              type="password"
              value={formData.enter_serp_api_key_for_search_functionality}
              onChange={(val) => setFormData({ ...formData, enter_serp_api_key_for_search_functionality: val })}
              placeholder="Enter your SerpAPI key"
              helperText="SerpAPI key for web search. Get yours at serpapi.com"
              required
            />
          </FormSection>

          <FormSection
            title="Trip Details"
            description="Tell us about your dream trip"
          >
            <SmartInput
              label="Destination"
              name="where_do_you_want_to_go"
              value={formData.where_do_you_want_to_go}
              onChange={(val) => setFormData({ ...formData, where_do_you_want_to_go: val })}
              placeholder="e.g., Bali, Indonesia or Paris, France"
              helperText="Enter your desired destination city or country"
              required
            />

            <SmartInput
              label="Trip Duration (days)"
              name="how_many_days_do_you_want_to_travel_for"
              type="number"
              value={formData.how_many_days_do_you_want_to_travel_for}
              onChange={(val) => setFormData({ ...formData, how_many_days_do_you_want_to_travel_for: val })}
              placeholder="e.g., 7"
              helperText="How many days will you be traveling?"
              required
            />
          </FormSection>

          {error && (
            <ErrorMessage
              title="Request failed"
              message={error}
              onRetry={handleSubmit}
              retryLoading={loading}
            />
          )}

          {loading && (
            <LoadingIndicator
              message="Planning your trip..."
              subtext="Searching for best destinations and deals"
            />
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultGrid columns={1}>
                <ResultCard
                  icon={<MapPin className="h-5 w-5" />}
                  title="Trip Plan"
                  description={result.result}
                  variant="success"
                />
              </ResultGrid>

              <ActionButton onClick={handleClear} variant="ghost" className="w-full">
                Plan Another Trip
              </ActionButton>
            </motion.div>
          )}

          {!result && !loading && (
            <div className="flex gap-3 mt-6">
              <ActionButton onClick={handleSubmit} loading={loading} size="lg" className="flex-1">
                <Sparkles className="h-4 w-4" />
                Plan My Trip
              </ActionButton>
              <ActionButton onClick={handleClear} variant="ghost" size="lg">
                Clear
              </ActionButton>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default AiTravelAgentPage;
