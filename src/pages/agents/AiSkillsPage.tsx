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
import { Award, CheckCircle2, Users } from "lucide-react";

const STORAGE_KEY = "ai-skills";

const AiSkillsPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    skillName: "",
    skillDescription: "",
    targetAudience: "",
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
    if (!formData.skillName.trim() || !formData.skillDescription.trim()) {
      setError("Please provide skill name and description");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-skills`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            skill_name: formData.skillName,
            skill_description: formData.skillDescription,
            target_audience: formData.targetAudience,
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
    setFormData({ openaiApiKey: "", skillName: "", skillDescription: "", targetAudience: "" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - AI Skills</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-500 rounded-3xl mb-6">
                <Award className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Skill Framework Ready</h1>
              <p className="text-xl text-gray-400">AI-generated skill development plan</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<Users className="h-5 w-5" />}
                title="Audience"
                value={result.audience || formData.targetAudience}
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
                <h3 className="text-lg font-medium text-white mb-4">Skill Plan</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Create Another Skill
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
        <title>AI Skills - VideoRemix.vip</title>
        <meta name="description" content="AI-powered skill development and monetization assistant." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-500 rounded-3xl mb-6">
              <Award className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">AI Skills</h1>
            <p className="text-xl text-gray-400">AI-powered skill development and monetization</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Generation failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Skill Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Skill Details" description="Describe the skill you want to develop">
                  <SmartInput
                    label="Skill Name"
                    name="skillName"
                    value={formData.skillName}
                    onChange={(val) => updateField("skillName", val)}
                    placeholder="e.g. Advanced Prompt Engineering..."
                    helperText="Name of the skill or expertise area"
                    required
                  />

                  <SmartTextarea
                    label="Skill Description"
                    name="skillDescription"
                    value={formData.skillDescription}
                    onChange={(val) => updateField("skillDescription", val)}
                    placeholder="Describe what this skill involves, what problems it solves..."
                    helperText="Include key competencies and use cases"
                    required
                    rows={4}
                  />

                  <SmartInput
                    label="Target Audience"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={(val) => updateField("targetAudience", val)}
                    placeholder="e.g. content creators, developers..."
                    helperText="Who would benefit from this skill"
                  />
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for AI-powered skill generation"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.skillName.trim() || !formData.skillDescription.trim()}
                  >
                    <Award className="h-4 w-4" />
                    Generate Skill Plan
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator message="Developing skill framework..." subtext="Creating your AI-powered skill plan" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Award className="h-16 w-16 text-gray-600" />}
              title="Ready to develop"
              description="Enter a skill name and description to generate a development and monetization plan"
              tips={[
                "Focus on specific, high-value skills",
                "Consider market demand for the skill",
                "Think about how the skill can be packaged or taught",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiSkillsPage;
