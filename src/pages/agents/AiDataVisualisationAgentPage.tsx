import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Upload, FileText, BarChart3 } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { FileUploadZone } from "@/components/agent-ui/FileUploadZone";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { SelectDropdown } from "@/components/agent-ui/SelectDropdown";

const STORAGE_KEY = 'ai-data-visualisation-agent';

const MODEL_OPTIONS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
];

const AiDataVisualisationAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [model, setModel] = useState("gpt-4o");
  const [csvPath, setCsvPath] = useState("");
  const [showFullDataset, setShowFullDataset] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setModel(parsed.model || "gpt-4o");
        setCsvPath(parsed.csvPath || "");
        setQuery(parsed.query || "");
        setShowFullDataset(parsed.showFullDataset || false);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ model, csvPath, query, showFullDataset }));
  }, [model, csvPath, query, showFullDataset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !csvPath.trim()) {
      setError("Please upload a file or provide a CSV path");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      formData.append('select_model', model);
      formData.append('choose_a_csv_file', csvPath);
      formData.append('show_full_dataset', showFullDataset ? "yes" : "no");
      formData.append('what_would_you_like_to_know_about_your_data', query);
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-data-visualisation-agent`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Visualisation generation failed');
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setModel("gpt-4o");
    setCsvPath("");
    setShowFullDataset(false);
    setQuery("");
    setResult(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-20">
        <LoadingIndicator message="Creating visualisation..." subtext="This usually takes 15-30 seconds" />
      </div>
    );
  }

  if (result) {
    return (
      <>
        <Helmet>
          <title>Visualisation Results - AiDataVisualisationAgent</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-600 to-blue-500 rounded-3xl mb-6">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Visualisation Complete</h1>
              <p className="text-xl text-gray-400">Your data visualisation has been generated</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<BarChart3 />}
                title="Chart Type"
                value={result.chartType || "Dynamic"}
                variant="info"
              />
              <ResultCard
                icon={<FileText />}
                title="Data Points"
                value={result.dataPoints || result.records?.length || "—"}
                subtext="Records visualised"
                variant="success"
              />
            </ResultGrid>

            {result.visualisation && (
              <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Visualisation Output</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">{typeof result.visualisation === 'string' ? result.visualisation : JSON.stringify(result.visualisation, null, 2)}</p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Create Another Visualisation
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
        <title>AiDataVisualisationAgent - VideoRemix.vip</title>
        <meta name="description" content="Upload your data and generate AI-powered visualisations and charts." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-600 to-blue-500 rounded-3xl mb-6">
              <BarChart3 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Ai Data Visualisation Agent</h1>
            <p className="text-xl text-gray-400">Transform your data into beautiful visualisations</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Upload & Configure</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FileUploadZone
                  accept=".csv,.xlsx,.xls"
                  maxSize={10 * 1024 * 1024}
                  onFileSelect={setFile}
                  selectedFile={file}
                  helperText="Upload a CSV or Excel file. Max size: 10MB"
                />

                <SelectDropdown
                  label="Select Model"
                  value={model}
                  onValueChange={setModel}
                  options={MODEL_OPTIONS}
                  helperText="Choose the AI model to generate visualisations"
                />

                <SmartTextarea
                  label="CSV File Path"
                  name="csvPath"
                  value={csvPath}
                  onChange={setCsvPath}
                  placeholder="/path/to/your/data.csv or upload above"
                  helperText="Enter the path to your CSV file or upload it directly above"
                  rows={2}
                />

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showFullDataset"
                    checked={showFullDataset}
                    onChange={(e) => setShowFullDataset(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-900/50 text-violet-500 focus:ring-violet-500/20"
                  />
                  <label htmlFor="showFullDataset" className="text-sm font-medium text-gray-200 cursor-pointer">
                    Show full dataset in output
                  </label>
                </div>

                <SmartTextarea
                  label="Your Question"
                  name="query"
                  value={query}
                  onChange={setQuery}
                  placeholder="What would you like to visualise? e.g., 'Create a bar chart showing monthly revenue trends'"
                  helperText="Ask a specific question about what visualisation you need"
                  required
                  rows={4}
                />

                {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

                <div className="flex gap-3">
                  <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={!query.trim() && !file && !csvPath.trim()}>
                    <BarChart3 className="h-4 w-4" />
                    Generate Visualisation
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          <EmptyState
            icon={<BarChart3 className="h-16 w-16 text-gray-600" />}
            title="No visualisation results yet"
            description="Upload your CSV or Excel file and ask a question to generate AI-powered visualisations"
            tips={[
              "Upload clean tabular data with headers",
              "Ask for specific chart types: bar, line, pie, etc.",
              "Specify time periods or categories of interest",
              "Try 'Show correlations between columns X and Y'"
            ]}
          />
        </div>
      </main>
    </>
  );
};

export default AiDataVisualisationAgentPage;