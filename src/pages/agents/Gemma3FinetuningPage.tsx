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
import { Cpu, CheckCircle2, Layers } from "lucide-react";

const STORAGE_KEY = "gemma3-finetuning";

const TASK_TYPE_OPTIONS = [
  { value: "instruction", label: "Instruction Tuning" },
  { value: "classification", label: "Classification" },
  { value: "summarization", label: "Summarization" },
  { value: "qa", label: "Question Answering" },
];

const Gemma3FinetuningPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    datasetDescription: "",
    taskType: "instruction",
    epochs: "3",
    additionalInstructions: "",
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
    if (!formData.datasetDescription.trim()) {
      setError("Please describe your dataset");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemma3-finetuning`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enter_your_openai_api_key: formData.openaiApiKey,
            dataset_description: formData.datasetDescription,
            task_type: formData.taskType,
            training_epochs: formData.epochs,
            additional_instructions: formData.additionalInstructions,
            userId: user?.id,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Finetuning failed");
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ openaiApiKey: "", datasetDescription: "", taskType: "instruction", epochs: "3", additionalInstructions: "" });
    setResult(null);
    setError(null);
  };

  if (result && result.status === "completed" && !loading) {
    return (
      <>
        <Helmet>
          <title>Results - Gemma3 Finetuning</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-600 to-rose-500 rounded-3xl mb-6">
                <Cpu className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Finetuning Complete</h1>
              <p className="text-xl text-gray-400">Gemma3 model finetuning finished</p>
            </motion.div>

            <ResultGrid columns={3}>
              <ResultCard
                icon={<Layers className="h-5 w-5" />}
                title="Task Type"
                value={result.taskType || formData.taskType}
              />
              <ResultCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="Epochs"
                value={result.epochs || formData.epochs}
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
                <h3 className="text-lg font-medium text-white mb-4">Finetuning Results</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Start New Finetuning
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
        <title>Gemma3 Finetuning - VideoRemix.vip</title>
        <meta name="description" content="Finetune Gemma3 models on your custom dataset with AI-assisted configuration." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-600 to-rose-500 rounded-3xl mb-6">
              <Cpu className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Gemma3 Finetuning</h1>
            <p className="text-xl text-gray-400">Finetune Gemma3 on your custom dataset</p>
          </motion.div>

          {error && (
            <ErrorMessage title="Finetuning failed" message={error} onRetry={handleSubmit} retryLoading={loading} />
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle>Finetuning Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Dataset" description="Describe your training data">
                  <SmartTextarea
                    label="Dataset Description"
                    name="datasetDescription"
                    value={formData.datasetDescription}
                    onChange={(val) => updateField("datasetDescription", val)}
                    placeholder="Describe your dataset: size, format, content type..."
                    helperText="Include information about data quality and diversity"
                    required
                    rows={4}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectDropdown
                      label="Task Type"
                      value={formData.taskType}
                      onValueChange={(val) => updateField("taskType", val)}
                      options={TASK_TYPE_OPTIONS}
                      helperText="Type of task for finetuning"
                    />
                    <SmartInput
                      label="Training Epochs"
                      name="epochs"
                      value={formData.epochs}
                      onChange={(val) => updateField("epochs", val)}
                      type="number"
                      placeholder="3"
                      helperText="Number of training epochs"
                    />
                  </div>

                  <SmartTextarea
                    label="Additional Instructions"
                    name="additionalInstructions"
                    value={formData.additionalInstructions}
                    onChange={(val) => updateField("additionalInstructions", val)}
                    placeholder="Any special requirements or constraints..."
                    helperText="Optional guidance for the finetuning process"
                    rows={3}
                  />
                </FormSection>

                <FormSection title="API Configuration" description="Required API key">
                  <ApiKeyInput
                    label="OpenAI API Key"
                    value={formData.openaiApiKey}
                    onChange={(val) => updateField("openaiApiKey", val)}
                    helperText="Required for model finetuning"
                    required
                  />
                </FormSection>

                <div className="flex gap-3">
                  <ActionButton
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="flex-1"
                    disabled={!formData.datasetDescription.trim()}
                  >
                    <Cpu className="h-4 w-4" />
                    Start Finetuning
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <LoadingIndicator message="Finetuning Gemma3..." subtext="This may take several minutes" />
          )}

          {!result && !loading && (
            <EmptyState
              icon={<Cpu className="h-16 w-16 text-gray-600" />}
              title="Ready to finetune"
              description="Configure your dataset and training parameters for Gemma3 finetuning"
              tips={[
                "Ensure your dataset is clean and well-formatted",
                "Start with fewer epochs and increase if needed",
                "Monitor for overfitting on small datasets",
              ]}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default Gemma3FinetuningPage;
