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
import { User, CheckCircle2, Briefcase } from "lucide-react";

const STORAGE_KEY = "ai-profilegen";

const INDUSTRY_OPTIONS = [
  { value: "tech", label: "Technology" },
  { value: "finance", label: "Finance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "marketing", label: "Marketing" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
];

const AiProfilegenPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    profession: "",
    industry: "tech",
    skills: "",
    experienceLevel: "mid",
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
    if (!formData.profession.trim() || !formData.skills.trim()) {
      setError("Please provide profession and skills");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-profilegen`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            profession_or_role: formData.profession,
            industry: formData.industry,
            key_skills_and_expertise: formData.skills,
            experience_level: formData.experienceLevel,
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
    setFormData({ openaiApiKey: "", profession: "", industry: "tech", skills: "", experienceLevel: "mid" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - Profile Gen</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-600 to-cyan-500 rounded-3xl mb-6">
                <User className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Profile Generated</h1>
              <p className="text-xl text-gray-400">AI-powered professional profile ready</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<Briefcase className="h-5 w-5" />}
                title="Profession"
                value={result.profession || formData.profession}
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
                <h3 className="text-lg font-medium text-white mb-4">Generated Profile</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Generate Another Profile
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
        <title>Profile Gen - VideoRemix.vip</title>
        <meta name="description" content="Generate professional AI-powered profiles and bios for any industry." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-600 to-cyan-500 rounded-3xl mb-6">
              <User className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Profile Gen</h1>
            <p className="text-xl text-gray-400">Generate professional AI-powered profiles</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Generation failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Profile Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Professional Details" description="Tell us about your role">
                  <SmartInput
                    label="Profession or Role"
                    name="profession"
                    value={formData.profession}
                    onChange={(val) => updateField("profession", val)}
                    placeholder="e.g. Software Engineer, Product Manager..."
                    helperText="Your current or target role"
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectDropdown
                      label="Industry"
                      value={formData.industry}
                      onValueChange={(val) => updateField("industry", val)}
                      options={INDUSTRY_OPTIONS}
                      helperText="Your industry"
                    />
                    <SmartInput
                      label="Experience Level"
                      name="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={(val) => updateField("experienceLevel", val)}
                      placeholder="junior, mid, senior, lead..."
                      helperText="Your experience level"
                    />
                  </div>

                  <SmartTextarea
                    label="Key Skills"
                    name="skills"
                    value={formData.skills}
                    onChange={(val) => updateField("skills", val)}
                    placeholder="List your key skills and expertise..."
                    helperText="Focus on relevant, high-impact skills"
                    required
                    rows={3}
                  />
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for AI-powered profile generation"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.profession.trim() || !formData.skills.trim()}
                  >
                    <User className="h-4 w-4" />
                    Generate Profile
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator message="Generating profile..." subtext="Creating your professional profile" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<User className="h-16 w-16 text-gray-600" />}
              title="Ready to profile"
              description="Enter your profession and skills to generate a professional profile"
              tips={[
                "Include quantifiable achievements when possible",
                "Tailor skills to your target role",
                "Use industry-standard terminology",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AiProfilegenPage;
