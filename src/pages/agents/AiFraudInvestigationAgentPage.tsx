import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Shield, MapPin } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { SelectDropdown } from "@/components/agent-ui/SelectDropdown";

const STORAGE_KEY = 'ai-fraud-investigation-agent';

const MODEL_OPTIONS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "deepseek-chat", label: "DeepSeek Chat" },
];

const ZIP_CODES = [
  { value: "60601", label: "60601 - Chicago Loop" },
  { value: "60602", label: "60602 - Chicago" },
  { value: "60603", label: "60603 - Chicago" },
  { value: "60604", label: "60604 - Chicago" },
  { value: "60605", label: "60605 - Chicago" },
  { value: "60606", label: "60606 - Chicago" },
  { value: "60607", label: "60607 - Chicago" },
  { value: "60608", label: "60608 - Chicago" },
  { value: "60609", label: "60609 - Chicago" },
  { value: "60610", label: "60610 - Chicago" },
  { value: "60611", label: "60611 - Chicago" },
  { value: "60612", label: "60612 - Chicago" },
  { value: "60613", label: "60613 - Chicago" },
  { value: "60614", label: "60614 - Chicago" },
  { value: "60615", label: "60615 - Chicago" },
  { value: "60616", label: "60616 - Chicago" },
  { value: "60617", label: "60617 - Chicago" },
  { value: "60618", label: "60618 - Chicago" },
  { value: "60619", label: "60619 - Chicago" },
  { value: "60620", label: "60620 - Chicago" },
  { value: "60621", label: "60621 - Chicago" },
  { value: "60622", label: "60622 - Chicago" },
  { value: "60623", label: "60623 - Chicago" },
  { value: "60624", label: "60624 - Chicago" },
  { value: "60625", label: "60625 - Chicago" },
  { value: "60626", label: "60626 - Chicago" },
  { value: "60628", label: "60628 - Chicago" },
  { value: "60629", label: "60629 - Chicago" },
  { value: "60630", label: "60630 - Chicago" },
  { value: "60631", label: "60631 - Chicago" },
  { value: "60632", label: "60632 - Chicago" },
  { value: "60633", label: "60633 - Chicago" },
  { value: "60634", label: "60634 - Chicago" },
  { value: "60636", label: "60636 - Chicago" },
  { value: "60637", label: "60637 - Chicago" },
  { value: "60638", label: "60638 - Chicago" },
  { value: "60639", label: "60639 - Chicago" },
  { value: "60640", label: "60640 - Chicago" },
  { value: "60641", label: "60641 - Chicago" },
  { value: "60642", label: "60642 - Chicago" },
  { value: "60643", label: "60643 - Chicago" },
  { value: "60644", label: "60644 - Chicago" },
  { value: "60645", label: "60645 - Chicago" },
  { value: "60646", label: "60646 - Chicago" },
  { value: "60647", label: "60647 - Chicago" },
  { value: "60649", label: "60649 - Chicago" },
  { value: "60651", label: "60651 - Chicago" },
  { value: "60652", label: "60652 - Chicago" },
  { value: "60653", label: "60653 - Chicago" },
  { value: "60654", label: "60654 - Chicago" },
  { value: "60655", label: "60655 - Chicago" },
  { value: "60656", label: "60656 - Chicago" },
  { value: "60657", label: "60657 - Chicago" },
  { value: "60659", label: "60659 - Chicago" },
  { value: "60660", label: "60660 - Chicago" },
  { value: "60661", label: "60661 - Chicago" },
  { value: "60706", label: "60706 - Harwood Heights" },
  { value: "60707", label: "60707 - Elmwood Park" },
  { value: "60714", label: "60714 - Niles" },
  { value: "60827", label: "60827 - Riverdale" },
];

const AiFraudInvestigationAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [openrouterApiKey, setOpenrouterApiKey] = useState("");
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [zipCode, setZipCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setOpenrouterApiKey(parsed.openrouterApiKey || "");
        setGoogleMapsApiKey(parsed.googleMapsApiKey || "");
        setModel(parsed.model || "gpt-4o");
        setZipCode(parsed.zipCode || "");
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ openrouterApiKey, googleMapsApiKey, model, zipCode }));
  }, [openrouterApiKey, googleMapsApiKey, model, zipCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipCode.trim()) {
      setError("Please select a ZIP Code");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-fraud-investigation-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openrouter_api_key: openrouterApiKey,
          google_maps_api_key: googleMapsApiKey,
          model: model,
          zip_code_cook_county_il: zipCode,
          userId: user?.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Investigation failed');
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOpenrouterApiKey("");
    setGoogleMapsApiKey("");
    setModel("gpt-4o");
    setZipCode("");
    setResult(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-20">
        <LoadingIndicator message="Investigating fraud patterns..." subtext="Analysing business registrations in the selected area" />
      </div>
    );
  }

  if (result && result.status === 'completed') {
    return (
      <>
        <Helmet>
          <title>Investigation Results - AiFraudInvestigationAgent</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-coral-500 rounded-3xl mb-6">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Investigation Complete</h1>
              <p className="text-xl text-gray-400">Fraud risk analysis for ZIP Code {zipCode}</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<MapPin />}
                title="ZIP Code"
                value={zipCode}
                variant="info"
              />
              <ResultCard
                icon={<Shield />}
                title="Risk Level"
                value={result.riskLevel || result.risk || "Analysed"}
                variant={result.riskLevel === 'high' || result.risk === 'high' ? 'error' : 'success'}
              />
            </ResultGrid>

            <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Investigation Report</h3>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{result.result}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                New Investigation
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
        <title>AiFraudInvestigationAgent - VideoRemix.vip</title>
        <meta name="description" content="Investigate potential fraud patterns in business registrations within Cook County, IL." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-coral-500 rounded-3xl mb-6">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Ai Fraud Investigation Agent</h1>
            <p className="text-xl text-gray-400">Detect fraud patterns in Cook County business registrations</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Investigation Parameters</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <SmartInput
                  label="OpenRouter API Key"
                  name="openrouterApiKey"
                  value={openrouterApiKey}
                  onChange={setOpenrouterApiKey}
                  type="password"
                  placeholder="sk-... (required for model access)"
                  helperText="OpenRouter provides access to multiple AI models. Get one at openrouter.ai"
                  required
                />

                <SmartInput
                  label="Google Maps API Key"
                  name="googleMapsApiKey"
                  value={googleMapsApiKey}
                  onChange={setGoogleMapsApiKey}
                  type="password"
                  placeholder="AIza... (required for location data)"
                  helperText="Required for geographic analysis. Get one at console.cloud.google.com"
                  required
                />

                <SelectDropdown
                  label="AI Model"
                  value={model}
                  onValueChange={setModel}
                  options={MODEL_OPTIONS}
                  helperText="Choose the AI model for analysis"
                />

                <SelectDropdown
                  label="ZIP Code (Cook County, IL) *"
                  value={zipCode}
                  onValueChange={setZipCode}
                  options={ZIP_CODES}
                  helperText="Select the ZIP code to investigate for fraud patterns"
                  required
                />

                {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

                <div className="flex gap-3">
                  <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={!zipCode.trim()}>
                    <Shield className="h-4 w-4" />
                    Start Investigation
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          <EmptyState
            icon={<Shield className="h-16 w-16 text-gray-600" />}
            title="No investigation results yet"
            description="Select a ZIP code in Cook County to investigate potential fraud patterns"
            tips={[
              "Choose a ZIP code with suspected fraudulent activity",
              "Larger ZIP codes provide more data points",
              "Results include risk assessment and flagged entities",
              "May include names, addresses, and risk indicators"
            ]}
          />
        </div>
      </main>
    </>
  );
};

export default AiFraudInvestigationAgentPage;