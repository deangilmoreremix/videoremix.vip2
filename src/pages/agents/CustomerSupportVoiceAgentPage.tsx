import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { SelectDropdown } from "@/components/agent-ui/SelectDropdown";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { Mic, Sparkles, Headphones, FileText } from "lucide-react";

const STORAGE_KEY = 'customer-support-voice-agent';

const CustomerSupportVoiceAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    qdrant_url: "",
    qdrant_api_key: "",
    firecrawl_api_key: "",
    openai_api_key: "",
    documentation_url: "",
    select_voice: "alloy",
    query: ""
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
    if (!formData.documentation_url.trim()) {
      setError("Documentation URL is required");
      return;
    }
    if (!formData.query.trim()) {
      setError("Question is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-support-voice-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
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

  if (result && result.status === 'completed') {
    return (
      <>
        <Helmet>
          <title>CustomerSupportVoiceAgent - VideoRemix.vip</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <ResultGrid columns={1}>
                {result.audioUrl && (
                  <ResultCard
                    icon={<Headphones className="h-5 w-5" />}
                    title="Audio Response"
                    description={<audio controls src={result.audioUrl} className="w-full mt-2" />}
                    variant="info"
                  />
                )}
                <ResultCard
                  icon={<FileText className="h-5 w-5" />}
                  title="Response Transcript"
                  description={result.result}
                  variant="success"
                />
              </ResultGrid>
              <div className="flex justify-center">
                <ActionButton onClick={() => { setResult(null); setFormData({
                  qdrant_url: "",
                  qdrant_api_key: "",
                  firecrawl_api_key: "",
                  openai_api_key: "",
                  documentation_url: "",
                  select_voice: "alloy",
                  query: ""
                }); }}>
                  <Sparkles className="h-4 w-4" />
                  New Query
                </ActionButton>
              </div>
            </motion.div>
          </div>
        </main>
      </>
    );
  }

  if (loading) {
    return <LoadingIndicator message="Generating voice response..." subtext="Consulting the documentation knowledge base" />;
  }

  if (!result && !loading) {
    return (
      <>
        <Helmet>
          <title>CustomerSupportVoiceAgent - VideoRemix.vip</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-600 to-blue-500 rounded-3xl mb-6">
                <Mic className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Customer Support Voice Agent</h1>
              <p className="text-xl text-gray-400">AI-powered voice agent for documentation support.</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 space-y-6">
                <FormSection title="API Configuration" description="Enter your API credentials">
                  <div className="space-y-4">
                    <SmartInput
                      label="Qdrant URL"
                      name="qdrant_url"
                      value={formData.qdrant_url}
                      onChange={(value) => setFormData(prev => ({ ...prev, qdrant_url: value }))}
                      placeholder="e.g., https://your-qdrant-instance.com"
                      helperText="Vector database URL for semantic search"
                    />

                    <SmartInput
                      label="Qdrant API Key"
                      name="qdrant_api_key"
                      value={formData.qdrant_api_key}
                      onChange={(value) => setFormData(prev => ({ ...prev, qdrant_api_key: value }))}
                      type="password"
                      placeholder="your-qdrant-api-key"
                      helperText="API key for Qdrant authentication"
                    />

                    <SmartInput
                      label="Firecrawl API Key"
                      name="firecrawl_api_key"
                      value={formData.firecrawl_api_key}
                      onChange={(value) => setFormData(prev => ({ ...prev, firecrawl_api_key: value }))}
                      type="password"
                      placeholder="fc-..."
                      helperText="For web scraping and documentation fetching"
                    />

                    <SmartInput
                      label="OpenAI API Key"
                      name="openai_api_key"
                      value={formData.openai_api_key}
                      onChange={(value) => setFormData(prev => ({ ...prev, openai_api_key: value }))}
                      type="password"
                      placeholder="sk-..."
                      helperText="For voice synthesis and text processing"
                    />
                  </div>
                </FormSection>

                <FormSection title="Documentation" description="Configure documentation source">
                  <div className="space-y-4">
                    <SmartInput
                      label="Documentation URL"
                      name="documentation_url"
                      value={formData.documentation_url}
                      onChange={(value) => setFormData(prev => ({ ...prev, documentation_url: value }))}
                      placeholder="e.g., https://docs.yourproduct.com"
                      helperText="URL of the documentation to index and query"
                      required
                    />

                    <SelectDropdown
                      label="Voice Selection"
                      name="select_voice"
                      value={formData.select_voice}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, select_voice: value }))}
                      options={[
                        { value: "alloy", label: "Alloy - Neutral" },
                        { value: "echo", label: "Echo - Warm" },
                        { value: "fable", label: "Fable - British" },
                        { value: "onyx", label: "Onyx - Deep" },
                        { value: "nova", label: "Nova - Energetic" },
                        { value: "shimmer", label: "Shimmer - Soft" }
                      ]}
                      helperText="Select the voice for the audio response"
                    />
                  </div>
                </FormSection>

                <FormSection title="Query" description="Ask your question">
                  <SmartTextarea
                    label="Your Question"
                    name="query"
                    value={formData.query}
                    onChange={(value) => setFormData(prev => ({ ...prev, query: value }))}
                    placeholder="e.g., 'How do I set up the API integration?'"
                    helperText="Ask any question about the documentation"
                    rows={4}
                    required
                  />
                </FormSection>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <ActionButton type="submit" loading={loading} size="lg" className="w-full">
                <Sparkles className="h-4 w-4" />
                Get Voice Response
              </ActionButton>
            </form>

            <EmptyState
              icon={<Headphones className="h-16 w-16 text-gray-600" />}
              title="Voice-Powered Documentation Support"
              description="Ask questions and receive spoken answers from your documentation"
              tips={[
                "Provide the URL of your product documentation",
                "Choose a voice that matches your brand",
                "Ask specific questions about features or troubleshooting"
              ]}
            />
          </div>
        </main>
      </>
    );
  }

  return null;
};

export default CustomerSupportVoiceAgentPage;
