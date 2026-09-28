import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { SelectDropdown } from "@/components/agent-ui/SelectDropdown";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { FormSection } from "@/components/agent-ui/FormSection";
import { FileText, Users, CheckCircle2 } from "lucide-react";

const STORAGE_KEY = "technical-writer-agent";

const DOC_TYPE_OPTIONS = [
  { value: "api", label: "API Documentation" },
  { value: "user-guide", label: "User Guide" },
  { value: "technical", label: "Technical Specification" },
  { value: "readme", label: "README" },
  { value: "tutorial", label: "Tutorial" },
];

const TechnicalWriterPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    topic: "",
    docType: "user-guide",
    audience: "",
    keyPoints: "",
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

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim() || !formData.keyPoints.trim()) {
      setError("Please provide a topic and key points");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/technical-writer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            topic_or_subject: formData.topic,
            documentation_type: formData.docType,
            target_audience: formData.audience,
            key_points_to_cover: formData.keyPoints,
            userId: user?.id,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ openaiApiKey: "", topic: "", docType: "user-guide", audience: "", keyPoints: "" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Documentation - Technical Writer</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-400 rounded-3xl mb-6">
                <FileText className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Documentation Generated</h1>
              <p className="text-xl text-gray-400">AI-powered technical documentation ready</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<FileText className="h-5 w-5" />}
                title="Type"
                value={result.docType || formData.docType}
                variant="info"
              />
              <ResultCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="Status"
                value="Complete"
                variant="success"
              />
            </ResultGrid>

            {result.result && (
              <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Documentation</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Write Another Document
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
        <title>Technical Writer - VideoRemix.vip</title>
        <meta name="description" content="AI-powered technical writing assistant for documentation, guides, and specifications." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-400 rounded-3xl mb-6">
              <FileText className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Technical Writer</h1>
            <p className="text-xl text-gray-400">AI-powered technical documentation assistant</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Generation failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Documentation Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Content Details" description="What documentation do you need">
                  <SmartInput
                    label="Topic"
                    name="topic"
                    value={formData.topic}
                    onChange={(val) => updateField("topic", val)}
                    placeholder="e.g. REST API authentication, React component library..."
                    helperText="The subject of your documentation"
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectDropdown
                      label="Document Type"
                      value={formData.docType}
                      onValueChange={(val) => updateField("docType", val)}
                      options={DOC_TYPE_OPTIONS}
                      helperText="Type of documentation to generate"
                    />
                    <SmartInput
                      label="Target Audience"
                      name="audience"
                      value={formData.audience}
                      onChange={(val) => updateField("audience", val)}
                      placeholder="Developers, end-users, administrators..."
                      helperText="Who will read this documentation"
                    />
                  </div>

                  <SmartTextarea
                    label="Key Points"
                    name="keyPoints"
                    value={formData.keyPoints}
                    onChange={(val) => updateField("keyPoints", val)}
                    placeholder="List the main sections, concepts, or features to cover..."
                    helperText="Be specific about what needs to be documented"
                    required
                    rows={4}
                  />
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for AI-powered documentation generation"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.topic.trim() || !formData.keyPoints.trim()}
                  >
                    <FileText className="h-4 w-4" />
                    Generate Documentation
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator message="Writing documentation..." subtext="Creating clear and comprehensive docs" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<FileText className="h-16 w-16 text-gray-600" />}
              title="Ready to document"
              description="Enter your topic and key points to generate professional technical documentation"
              tips={[
                "Choose the right document type for your needs",
                "Include all necessary sections in key points",
                "Specify the audience for better tone and depth",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default TechnicalWriterPage;
