import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, MapPin, Calendar, DollarSign, Plane, Preferences } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { FormSection } from "@/components/agent-ui/FormSection";

const STORAGE_KEY = 'ai-travel-planner-mcp-agent-team-form';

const AiTravelPlannerMcpAgentTeamPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ 
    openai_api_key: "", 
    google_maps_api_key: "", 
    destination: "", 
    number_of_days: "", 
    budget_usd: "", 
    start_date: "", 
    describe_your_travel_preferences: "", 
    quick_preferences_optional: "" 
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
    if (!formData.destination.trim()) {
      setError("Please enter a destination");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-travel-planner-mcp-agent-team`, {
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
    setFormData({ 
      openai_api_key: "", 
      google_maps_api_key: "", 
      destination: "", 
      number_of_days: "", 
      budget_usd: "", 
      start_date: "", 
      describe_your_travel_preferences: "", 
      quick_preferences_optional: "" 
    });
    setResult(null);
    setError(null);
  };

  return (
    <>
      <Helmet>
        <title>AiTravelPlannerMcpAgentTeam - VideoRemix.vip</title>
        <meta name="description" content="Use ai-travel-planner-mcp-agent-team to plan trips with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-3xl mb-6">
              <Plane className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">AI Travel Planner Team</h1>
            <p className="text-xl text-gray-400">Get a comprehensive travel plan with AI-powered recommendations for destinations, accommodations, and activities.</p>
          </motion.div>

          {!result && !loading && (
            <EmptyState
              icon={<MapPin className="h-16 w-16 text-gray-600" />}
              title="Create your perfect travel plan"
              description="Enter your destination, budget, and preferences. Our AI team will craft a personalized itinerary."
              tips={[
                "Enter a specific city or country as your destination",
                "Specify your budget in USD for accurate recommendations",
                "Describe your travel style: adventure, relaxation, culture"
              ]}
            />
          )}

          <FormSection
            title="API Configuration"
            description="Enter your API keys to enable travel planning"
          >
            <SmartInput
              label="OpenAI API Key"
              name="openai_api_key"
              type="password"
              value={formData.openai_api_key}
              onChange={(val) => setFormData({ ...formData, openai_api_key: val })}
              placeholder="sk-..."
              helperText="Your OpenAI API key for AI-powered planning"
              required
            />

            <SmartInput
              label="Google Maps API Key"
              name="google_maps_api_key"
              type="password"
              value={formData.google_maps_api_key}
              onChange={(val) => setFormData({ ...formData, google_maps_api_key: val })}
              placeholder="Enter your Google Maps API key"
              helperText="Google Maps API key for location services"
              required
            />
          </FormSection>

          <FormSection
            title="Trip Details"
            description="Tell us about your upcoming trip"
          >
            <SmartInput
              label="Destination"
              name="destination"
              value={formData.destination}
              onChange={(val) => setFormData({ ...formData, destination: val })}
              placeholder="e.g., Tokyo, Japan or Barcelona, Spain"
              helperText="The city or country you're traveling to"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SmartInput
                label="Number of Days"
                name="number_of_days"
                type="number"
                value={formData.number_of_days}
                onChange={(val) => setFormData({ ...formData, number_of_days: val })}
                placeholder="e.g., 7"
                helperText="Total days for your trip"
                required
              />

              <SmartInput
                label="Budget (USD)"
                name="budget_usd"
                type="number"
                value={formData.budget_usd}
                onChange={(val) => setFormData({ ...formData, budget_usd: val })}
                placeholder="e.g., 2500"
                helperText="Your total budget in US dollars"
                required
              />
            </div>

            <SmartInput
              label="Start Date"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={(val) => setFormData({ ...formData, start_date: val })}
              placeholder=""
              helperText="When does your trip begin?"
              required
            />

            <SmartTextarea
              label="Travel Preferences"
              name="describe_your_travel_preferences"
              value={formData.describe_your_travel_preferences}
              onChange={(val) => setFormData({ ...formData, describe_your_travel_preferences: val })}
              placeholder="Describe your ideal trip... e.g., I love cultural experiences, local food, and off-the-beaten-path locations. Not interested in typical tourist traps."
              helperText="Tell us about your travel style, interests, and what you want to experience"
              rows={4}
              required
            />

            <SmartInput
              label="Quick Preferences (optional)"
              name="quick_preferences_optional"
              value={formData.quick_preferences_optional}
              onChange={(val) => setFormData({ ...formData, quick_preferences_optional: val })}
              placeholder="e.g., beach, food, adventure"
              helperText="Short keywords for your trip type (comma-separated)"
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
              message="Creating your travel plan..."
              subtext="Researching destinations and building your itinerary"
            />
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultGrid columns={1}>
                <ResultCard
                  icon={<MapPin className="h-5 w-5" />}
                  title="Your Travel Plan"
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
                Create Travel Plan
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

export default AiTravelPlannerMcpAgentTeamPage;
