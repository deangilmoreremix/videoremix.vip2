import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Sparkles, Scale } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ResultCard, ResultGrid, ResultIcons } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { SelectDropdown } from "@/components/agent-ui/SelectDropdown";

const STORAGE_KEY = 'ai-legal-agent-team-form';

const ANALYSIS_TYPE_OPTIONS = [
  { value: "contract_review", label: "Contract Review" },
  { value: "risk_assessment", label: "Risk Assessment" },
  { value: "compliance_check", label: "Compliance Check" },
  { value: "legal_research", label: "Legal Research" },
  { value: "clause_analysis", label: "Clause Analysis" },
  { value: "liability_analysis", label: "Liability Analysis" },
];

const AiLegalAgentTeamPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openai_api_key: "",
    qdrant_api_key: "",
    qdrant_url: "",
    upload_legal_document: "",
    select_analysis_type: "",
    enter_your_specific_query: ""
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
    if (!formData.enter_your_specific_query.trim()) {
      setError("Please enter your specific query or question");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-legal-agent-team`, {
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
      openai_api_key: "",
      qdrant_api_key: "",
      qdrant_url: "",
      upload_legal_document: "",
      select_analysis_type: "",
      enter_your_specific_query: ""
    });
    setResult(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-20">
        <LoadingIndicator message="Analysing your legal document..." subtext="Our AI legal team is reviewing the content" />
      </div>
    );
  }

  if (result && result.status === 'completed') {
    return (
      <>
        <Helmet>
          <title>Analysis Results - AiLegalAgentTeam</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-500 rounded-3xl mb-6">
                <Scale className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Legal Analysis Complete</h1>
              <p className="text-xl text-gray-400">Your AI legal team has finished the analysis</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<Scale />}
                title="Analysis Type"
                value={formData.select_analysis_type || "—"}
                variant="info"
              />
              <ResultCard
                icon={<Sparkles />}
                title="Status"
                value="Completed"
                variant="success"
              />
            </ResultGrid>

            <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Analysis Results</h3>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{result.result || JSON.stringify(result, null, 2)}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                New Analysis
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
        <title>AiLegalAgentTeam - VideoRemix.vip</title>
        <meta name="description" content="AI-powered legal agent team for document analysis and legal research." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-500 rounded-3xl mb-6">
              <Scale className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">AI Legal Agent Team</h1>
            <p className="text-xl text-gray-400">Get AI-powered legal document analysis and research</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Legal Analysis Configuration</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="API Configuration" description="Enter your API keys to enable AI features">
                  <SmartInput
                    label="OpenAI API Key"
                    name="openai_api_key"
                    value={formData.openai_api_key}
                    onChange={(v) => updateField('openai_api_key', v)}
                    type="password"
                    placeholder="sk-... (required for GPT-4 analysis)"
                    helperText="Your API key enables GPT-4 for legal analysis. Stored locally only."
                    required
                  />

                  <SmartInput
                    label="Qdrant API Key"
                    name="qdrant_api_key"
                    value={formData.qdrant_api_key}
                    onChange={(v) => updateField('qdrant_api_key', v)}
                    type="password"
                    placeholder="... (required for vector search)"
                    helperText="Required for semantic search capabilities. Get one at qdrant.tech"
                  />

                  <SmartInput
                    label="Qdrant URL"
                    name="qdrant_url"
                    value={formData.qdrant_url}
                    onChange={(v) => updateField('qdrant_url', v)}
                    placeholder="https://your-qdrant-instance.cloud.com"
                    helperText="Your Qdrant cloud instance URL"
                  />
                </FormSection>

                <FormSection title="Document & Analysis Type" description="Upload or describe your legal document and select analysis type">
                  <SmartTextarea
                    label="Legal Document Content"
                    name="upload_legal_document"
                    value={formData.upload_legal_document}
                    onChange={(v) => updateField('upload_legal_document', v)}
                    placeholder="Paste the text content of your legal document here, or describe the document you want analysed..."
                    helperText="Paste the full text of contracts, agreements, or legal documents for analysis"
                    required
                    rows={6}
                  />

                  <SelectDropdown
                    label="Analysis Type"
                    name="select_analysis_type"
                    value={formData.select_analysis_type}
                    onValueChange={(v) => updateField('select_analysis_type', v)}
                    options={ANALYSIS_TYPE_OPTIONS}
                    placeholder="Select type of analysis"
                    helperText="Choose the type of legal analysis you need"
                  />
                </FormSection>

                <FormSection title="Your Query" description="Enter your specific question or concern">
                  <SmartTextarea
                    label="Specific Query"
                    name="enter_your_specific_query"
                    value={formData.enter_your_specific_query}
                    onChange={(v) => updateField('enter_your_specific_query', v)}
                    placeholder="What specific question do you have about this legal document? e.g., 'What are the key liability clauses?' or 'Are there any unusual terms I should be aware of?'"
                    helperText="Be specific about what you want to know. The more detailed your question, the better the analysis."
                    required
                    rows={4}
                  />
                </FormSection>

                {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

                <div className="flex gap-3">
                  <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={loading || !formData.enter_your_specific_query.trim()}>
                    <Scale className="h-4 w-4" />
                    Analyse Document
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          <EmptyState
            icon={<Scale className="h-16 w-16 text-gray-600" />}
            title="Ready to analyse your legal documents"
            description="Upload or paste your legal document and let our AI legal team provide insights and analysis"
            tips={[
              "Paste the full text of the document for best results",
              "Be specific in your query - ask about particular clauses or concerns",
              "Choose the appropriate analysis type for your needs",
              "Review results carefully - AI assists but doesn't replace legal advice"
            ]}
          />
        </div>
      </main>
    </>
  );
};

export default AiLegalAgentTeamPage;
