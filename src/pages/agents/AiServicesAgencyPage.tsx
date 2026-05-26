import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Sparkles, Briefcase } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ResultCard, ResultGrid, ResultIcons } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { ActionButton } from "@/components/agent-ui/ActionButton";

const STORAGE_KEY = 'ai-services-agency-form';

const PROJECT_TYPE_OPTIONS = [
  { value: "web_app", label: "Web Application" },
  { value: "mobile_app", label: "Mobile Application" },
  { value: "desktop_app", label: "Desktop Application" },
  { value: "api_integration", label: "API Integration" },
  { value: "data_analytics", label: "Data Analytics" },
  { value: "machine_learning", label: "Machine Learning/AI" },
  { value: "blockchain", label: "Blockchain/Web3" },
  { value: "custom_software", label: "Custom Software" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low - No rush" },
  { value: "medium", label: "Medium - Standard timeline" },
  { value: "high", label: "High - Priority project" },
  { value: "urgent", label: "Urgent - Time-sensitive" },
];

const BUDGET_OPTIONS = [
  { value: "under_5k", label: "Under $5,000" },
  { value: "5k_15k", label: "$5,000 - $15,000" },
  { value: "15k_50k", label: "$15,000 - $50,000" },
  { value: "50k_100k", label: "$50,000 - $100,000" },
  { value: "over_100k", label: "Over $100,000" },
  { value: "not_sure", label: "Not sure yet" },
];

const AiServicesAgencyPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openai_api_key: "",
    project_name: "",
    project_description: "",
    project_type: "",
    expected_timeline: "",
    budget_range: "",
    project_priority: "",
    technical_requirements_optional: "",
    special_considerations_optional: "",
    show_analysis_history: ""
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
    if (!formData.project_name.trim()) {
      setError("Please enter a project name");
      return;
    }
    if (!formData.project_description.trim()) {
      setError("Please describe your project");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-services-agency`, {
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
      project_name: "",
      project_description: "",
      project_type: "",
      expected_timeline: "",
      budget_range: "",
      project_priority: "",
      technical_requirements_optional: "",
      special_considerations_optional: "",
      show_analysis_history: ""
    });
    setResult(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-20">
        <LoadingIndicator message="Processing your project request..." subtext="Our AI agents are analysing your requirements" />
      </div>
    );
  }

  if (result && result.status === 'completed') {
    return (
      <>
        <Helmet>
          <title>Project Results - AiServicesAgency</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-500 rounded-3xl mb-6">
                <Briefcase className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Project Analysis Complete</h1>
              <p className="text-xl text-gray-400">Your AI services agency results are ready</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<Briefcase />}
                title="Project Name"
                value={formData.project_name || "—"}
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
                New Project Analysis
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
        <title>AiServicesAgency - VideoRemix.vip</title>
        <meta name="description" content="AI-powered services agency for project analysis and recommendations." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-500 rounded-3xl mb-6">
              <Briefcase className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">AI Services Agency</h1>
            <p className="text-xl text-gray-400">Get AI-powered analysis and recommendations for your projects</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Project Configuration</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="API Configuration" description="Enter your OpenAI API key to enable AI features">
                  <SmartInput
                    label="OpenAI API Key"
                    name="openai_api_key"
                    value={formData.openai_api_key}
                    onChange={(v) => updateField('openai_api_key', v)}
                    type="password"
                    placeholder="sk-... (required for AI analysis)"
                    helperText="Your API key enables GPT-4 for project analysis. Stored locally only."
                    required
                  />
                </FormSection>

                <FormSection title="Project Details" description="Describe your project and requirements">
                  <SmartInput
                    label="Project Name"
                    name="project_name"
                    value={formData.project_name}
                    onChange={(v) => updateField('project_name', v)}
                    placeholder="My Awesome Project"
                    helperText="Give your project a descriptive name"
                    required
                  />

                  <SmartTextarea
                    label="Project Description"
                    name="project_description"
                    value={formData.project_description}
                    onChange={(v) => updateField('project_description', v)}
                    placeholder="Describe your project in detail. What problem does it solve? Who are the users? What are the key features?"
                    helperText="Be specific about the problem you're solving and the target users"
                    required
                    rows={4}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SmartInput
                      label="Project Type"
                      name="project_type"
                      value={formData.project_type}
                      onChange={(v) => updateField('project_type', v)}
                      placeholder="e.g., Web Application, Mobile App, API Integration"
                      helperText="Select or describe the type of project"
                      required
                    />

                    <SmartInput
                      label="Expected Timeline"
                      name="expected_timeline"
                      value={formData.expected_timeline}
                      onChange={(v) => updateField('expected_timeline', v)}
                      placeholder="e.g., 3 months, 6 months, 1 year"
                      helperText="When do you need this completed?"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SmartInput
                      label="Budget Range"
                      name="budget_range"
                      value={formData.budget_range}
                      onChange={(v) => updateField('budget_range', v)}
                      placeholder="e.g., $10,000 - $50,000"
                      helperText="What is your project budget?"
                      required
                    />

                    <SmartInput
                      label="Project Priority"
                      name="project_priority"
                      value={formData.project_priority}
                      onChange={(v) => updateField('project_priority', v)}
                      placeholder="e.g., High Priority, Medium, Low"
                      helperText="How urgent is this project?"
                      required
                    />
                  </div>
                </FormSection>

                <FormSection title="Additional Details" description="Optional specifications and considerations">
                  <SmartTextarea
                    label="Technical Requirements (optional)"
                    name="technical_requirements_optional"
                    value={formData.technical_requirements_optional}
                    onChange={(v) => updateField('technical_requirements_optional', v)}
                    placeholder="List any specific technical requirements, tech stack preferences, integrations needed, etc."
                    helperText="Optional - describe any specific technical needs"
                    rows={3}
                  />

                  <SmartTextarea
                    label="Special Considerations (optional)"
                    name="special_considerations_optional"
                    value={formData.special_considerations_optional}
                    onChange={(v) => updateField('special_considerations_optional', v)}
                    placeholder="Any special circumstances, constraints, or requirements we should know about?"
                    helperText="Optional - describe any special circumstances"
                    rows={3}
                  />
                </FormSection>

                {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

                <div className="flex gap-3">
                  <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={loading || !formData.project_name.trim()}>
                    <Sparkles className="h-4 w-4" />
                    Analyze Project
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          <EmptyState
            icon={<Briefcase className="h-16 w-16 text-gray-600" />}
            title="Ready to analyze your project"
            description="Fill in your project details and let our AI agents provide analysis and recommendations"
            tips={[
              "Be specific about your project requirements",
              "Include your target users and use case",
              "Mention any technical constraints",
              "Consider your timeline and budget constraints"
            ]}
          />
        </div>
      </main>
    </>
  );
};

export default AiServicesAgencyPage;
