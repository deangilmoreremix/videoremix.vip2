import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Sparkles, Home } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { SelectDropdown } from "@/components/agent-ui/SelectDropdown";

const STORAGE_KEY = 'ai-real-estate-agent-team-form';

const PROPERTY_TYPE_OPTIONS = [
  { value: "single_family", label: "Single Family Home" },
  { value: "condo", label: "Condominium" },
  { value: "townhouse", label: "Townhouse" },
  { value: "multi_family", label: "Multi-Family" },
  { value: "apartment", label: "Apartment" },
  { value: "land", label: "Land/Lot" },
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
];

const URGENCY_OPTIONS = [
  { value: "immediate", label: "Immediately - Ready to buy/rent now" },
  { value: "1_3_months", label: "Within 1-3 months" },
  { value: "3_6_months", label: "Within 3-6 months" },
  { value: "6_12_months", label: "Within 6-12 months" },
  { value: "exploring", label: "Just exploring options" },
];

const TIMELINE_OPTIONS = [
  { value: "1_3_months", label: "1-3 months" },
  { value: "3_6_months", label: "3-6 months" },
  { value: "6_12_months", label: "6-12 months" },
  { value: "over_1_year", label: "Over 1 year" },
];

const AiRealEstateAgentTeamPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    firecrawl_api_key: "",
    _city: "",
    _stateprovince_optional: "",
    _minimum_price_: "",
    _maximum_price_: "",
    _property_type: "",
    _bedrooms: "",
    _bathrooms: "",
    _minimum_square_feet: "",
    _timeline: "",
    _urgency: "",
    _special_features__requirements: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse saved form data');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData._city.trim()) {
      setError("Please enter a city");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-real-estate-agent-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      firecrawl_api_key: "",
      _city: "",
      _stateprovince_optional: "",
      _minimum_price_: "",
      _maximum_price_: "",
      _property_type: "",
      _bedrooms: "",
      _bathrooms: "",
      _minimum_square_feet: "",
      _timeline: "",
      _urgency: "",
      _special_features__requirements: ""
    });
    setResult(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-20">
        <LoadingIndicator message="Searching real estate listings..." subtext="Analysing properties in your target area" />
      </div>
    );
  }

  if (result && result.status === 'completed') {
    return (
      <>
        <Helmet>
          <title>Search Results - AiRealEstateAgentTeam</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-3xl mb-6">
                <Home className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Real Estate Search Complete</h1>
              <p className="text-xl text-gray-400">Properties matching your criteria in {formData._city}</p>
            </motion.div>

            <ResultGrid columns={3}>
              <ResultCard
                icon={<Home />}
                title="City"
                value={formData._city || "—"}
                variant="info"
              />
              <ResultCard
                icon={<Sparkles />}
                title="Properties Found"
                value={result.count || result.properties?.length || "—"}
                variant="success"
              />
              <ResultCard
                icon={<Sparkles />}
                title="Status"
                value="Completed"
                variant="success"
              />
            </ResultGrid>

            <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Property Results</h3>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{result.result || JSON.stringify(result, null, 2)}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                New Search
              </ActionButton>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>AiRealEstateAgentTeam - VideoRemix.vip</title>
        <meta name="description" content="AI-powered real estate agent team for property search and analysis." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-3xl mb-6">
              <Home className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">AI Real Estate Agent Team</h1>
            <p className="text-xl text-gray-400">Find your dream property with AI-powered search</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Property Search Configuration</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="API Configuration" description="Enter your Firecrawl API key to enable property search">
                  <SmartInput
                    label="Firecrawl API Key"
                    name="firecrawl_api_key"
                    value={formData.firecrawl_api_key}
                    onChange={(v) => updateField('firecrawl_api_key', v)}
                    type="password"
                    placeholder="fc-... (required for property search)"
                    helperText="Firecrawl enables comprehensive property listing search. Get one at firecrawl.dev"
                    required
                  />
                </FormSection>

                <FormSection title="Location" description="Where are you looking for property?">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SmartInput
                      label="City"
                      name="_city"
                      value={formData._city}
                      onChange={(v) => updateField('_city', v)}
                      placeholder="e.g., Chicago, Los Angeles, New York"
                      helperText="Enter the city where you want to search for properties"
                      required
                    />

                    <SmartInput
                      label="State/Province (optional)"
                      name="_stateprovince_optional"
                      value={formData._stateprovince_optional}
                      onChange={(v) => updateField('_stateprovince_optional', v)}
                      placeholder="e.g., IL, CA, NY"
                      helperText="Optional - specify state or province for more accurate results"
                    />
                  </div>
                </FormSection>

                <FormSection title="Budget & Property Type" description="Define your price range and property type">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SmartInput
                      label="Minimum Price ($)"
                      name="_minimum_price_"
                      value={formData._minimum_price_}
                      onChange={(v) => updateField('_minimum_price_', v)}
                      type="number"
                      placeholder="e.g., 200000"
                      helperText="Minimum price in USD"
                    />

                    <SmartInput
                      label="Maximum Price ($)"
                      name="_maximum_price_"
                      value={formData._maximum_price_}
                      onChange={(v) => updateField('_maximum_price_', v)}
                      type="number"
                      placeholder="e.g., 500000"
                      helperText="Maximum price in USD"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectDropdown
                      label="Property Type"
                      name="_property_type"
                      value={formData._property_type}
                      onValueChange={(v) => updateField('_property_type', v)}
                      options={PROPERTY_TYPE_OPTIONS}
                      placeholder="Select property type"
                      helperText="What type of property are you looking for?"
                    />

                    <SmartInput
                      label="Minimum Square Feet"
                      name="_minimum_square_feet"
                      value={formData._minimum_square_feet}
                      onChange={(v) => updateField('_minimum_square_feet', v)}
                      type="number"
                      placeholder="e.g., 1500"
                      helperText="Minimum living space in sq ft"
                    />
                  </div>
                </FormSection>

                <FormSection title="Bedrooms & Bathrooms" description="Define minimum bedroom and bathroom requirements">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SmartInput
                      label="Bedrooms (minimum)"
                      name="_bedrooms"
                      value={formData._bedrooms}
                      onChange={(v) => updateField('_bedrooms', v)}
                      type="number"
                      placeholder="e.g., 3"
                      helperText="Minimum number of bedrooms"
                    />

                    <SmartInput
                      label="Bathrooms (minimum)"
                      name="_bathrooms"
                      value={formData._bathrooms}
                      onChange={(v) => updateField('_bathrooms', v)}
                      type="number"
                      placeholder="e.g., 2"
                      helperText="Minimum number of bathrooms"
                    />
                  </div>
                </FormSection>

                <FormSection title="Timeline & Urgency" description="When are you looking to buy or rent?">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectDropdown
                      label="Timeline"
                      name="_timeline"
                      value={formData._timeline}
                      onValueChange={(v) => updateField('_timeline', v)}
                      options={TIMELINE_OPTIONS}
                      placeholder="Select timeline"
                      helperText="When are you looking to make a decision?"
                    />

                    <SelectDropdown
                      label="Urgency"
                      name="_urgency"
                      value={formData._urgency}
                      onValueChange={(v) => updateField('_urgency', v)}
                      options={URGENCY_OPTIONS}
                      placeholder="Select urgency"
                      helperText="How urgently do you need to find a property?"
                    />
                  </div>
                </FormSection>

                <FormSection title="Special Requirements" description="Any special features or requirements?">
                  <SmartTextarea
                    label="Special Features & Requirements"
                    name="_special_features__requirements"
                    value={formData._special_features__requirements}
                    onChange={(v) => updateField('_special_features__requirements', v)}
                    placeholder="e.g., garage, pool, good schools nearby, pet-friendly, near public transit"
                    helperText="List any special features, amenities, or requirements"
                    rows={3}
                  />
                </FormSection>

                {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

                <div className="flex gap-3">
                  <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={loading || !formData._city.trim()}>
                    <Home className="h-4 w-4" />
                    Search Properties
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          <EmptyState
            icon={<Home className="h-16 w-16 text-gray-600" />}
            title="Ready to find your dream property"
            description="Configure your property search criteria and let our AI agents find the best matches for you"
            tips={[
              "Start with your target city",
              "Set a realistic budget range",
              "Specify minimum bedrooms and bathrooms",
              "Include any special features you must have"
            ]}
          />
        </div>
      </main>
    </>
  );
};

export default AiRealEstateAgentTeamPage;
