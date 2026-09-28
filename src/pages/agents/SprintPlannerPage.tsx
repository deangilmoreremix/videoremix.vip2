import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { FormSection } from "@/components/agent-ui/FormSection";
import { Calendar, Users, CheckCircle2 } from "lucide-react";

const STORAGE_KEY = "sprint-planner-agent";

const SprintPlannerPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    projectOverview: "",
    teamSize: "",
    sprintDuration: "2",
    backlogItems: "",
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
    if (!formData.projectOverview.trim() || !formData.backlogItems.trim()) {
      setError("Please provide project overview and backlog items");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sprint-planner`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            project_overview_and_goals: formData.projectOverview,
            team_size: formData.teamSize,
            sprint_duration_weeks: formData.sprintDuration,
            backlog_items_or_epics: formData.backlogItems,
            userId: user?.id,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Planning failed");
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ openaiApiKey: "", projectOverview: "", teamSize: "", sprintDuration: "2", backlogItems: "" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Sprint Plan - Sprint Planner</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-500 rounded-3xl mb-6">
                <Calendar className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Sprint Plan Ready</h1>
              <p className="text-xl text-gray-400">AI-generated sprint plan and backlog</p>
            </motion.div>

            <ResultGrid columns={3}>
              <ResultCard
                icon={<Users className="h-5 w-5" />}
                title="Team Size"
                value={result.teamSize || formData.teamSize || "—"}
              />
              <ResultCard
                icon={<Calendar className="h-5 w-5" />}
                title="Sprint Duration"
                value={`${result.sprintDuration || formData.sprintDuration} weeks`}
              />
              <ResultCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="Status"
                value="Planned"
                variant="success"
              />
            </ResultGrid>

            {result.result && (
              <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Sprint Plan</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Plan Another Sprint
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
        <title>Sprint Planner - VideoRemix.vip</title>
        <meta name="description" content="AI-powered sprint planning and backlog management for agile teams." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-500 rounded-3xl mb-6">
              <Calendar className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Sprint Planner</h1>
            <p className="text-xl text-gray-400">AI-powered sprint planning and backlog management</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Planning failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Sprint Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Project Context" description="Tell us about your project">
                  <SmartTextarea
                    label="Project Overview"
                    name="projectOverview"
                    value={formData.projectOverview}
                    onChange={(val) => updateField("projectOverview", val)}
                    placeholder="Describe your project goals and current status..."
                    helperText="Include key objectives and any constraints"
                    required
                    rows={4}
                  />

                  <SmartTextarea
                    label="Backlog Items"
                    name="backlogItems"
                    value={formData.backlogItems}
                    onChange={(val) => updateField("backlogItems", val)}
                    placeholder="List your backlog items, user stories, or epics..."
                    helperText="One item per line for best results"
                    required
                    rows={4}
                  />
                </FormSection>

                <FormSection title="Team Settings" description="Sprint parameters">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SmartInput
                      label="Team Size"
                      name="teamSize"
                      value={formData.teamSize}
                      onChange={(val) => updateField("teamSize", val)}
                      placeholder="e.g. 5 developers"
                      helperText="Number of team members"
                    />
                    <SmartInput
                      label="Sprint Duration (weeks)"
                      name="sprintDuration"
                      value={formData.sprintDuration}
                      onChange={(val) => updateField("sprintDuration", val)}
                      type="number"
                      placeholder="2"
                      helperText="Typical sprint length"
                    />
                  </div>
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for AI-powered sprint planning"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.projectOverview.trim() || !formData.backlogItems.trim()}
                  >
                    <Calendar className="h-4 w-4" />
                    Generate Sprint Plan
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator message="Planning sprint..." subtext="Prioritizing backlog and estimating tasks" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Calendar className="h-16 w-16 text-gray-600" />}
              title="Ready to plan"
              description="Enter your project details and backlog to generate a sprint plan"
              tips={[
                "Break down features into user stories",
                "Estimate relative complexity for better prioritization",
                "Consider team capacity when setting sprint goals",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default SprintPlannerPage;
