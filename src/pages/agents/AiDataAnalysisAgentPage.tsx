import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Upload, FileText, AlertCircle } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { FileUploadZone } from "@/components/agent-ui/FileUploadZone";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";

const STORAGE_KEY = 'ai-data-analysis-agent';

const AiDataAnalysisAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [csvPath, setCsvPath] = useState("");
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
        setApiKey(parsed.apiKey || "");
        setCsvPath(parsed.csvPath || "");
        setQuery(parsed.query || "");
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ apiKey, csvPath, query }));
  }, [apiKey, csvPath, query]);

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
      formData.append('enter_your_openai_api_key', apiKey);
      formData.append('upload_a_csv_or_excel_file', csvPath);
      formData.append('ask_a_query_about_the_data', query);
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-data-analysis-agent`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
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
    setApiKey("");
    setCsvPath("");
    setQuery("");
    setResult(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-20">
        <LoadingIndicator message="Analyzing your data..." subtext="This usually takes 10-20 seconds" />
      </div>
    );
  }

  if (result) {
    return (
      <>
        <Helmet>
          <title>Analysis Results - AiDataAnalysisAgent</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-500 rounded-3xl mb-6">
                <FileText className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Analysis Complete</h1>
              <p className="text-xl text-gray-400">Your data has been analyzed successfully</p>
            </motion.div>

            <ResultGrid columns={2}>
              <ResultCard
                icon={<FileText />}
                title="Status"
                value="Completed"
                variant="success"
              />
              <ResultCard
                icon={<AlertCircle />}
                title="Records Processed"
                value={result.recordCount || result.records?.length || "—"}
                subtext="Data points analyzed"
                variant="info"
              />
            </ResultGrid>

            {result.result && (
              <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Analysis Results</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">{typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2)}</p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Analyze Another File
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
        <title>AiDataAnalysisAgent - VideoRemix.vip</title>
        <meta name="description" content="Upload your data and let AI analyze it to uncover patterns and insights." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-500 rounded-3xl mb-6">
              <Upload className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Ai Data Analysis Agent</h1>
            <p className="text-xl text-gray-400">Upload your data and let AI uncover patterns and insights</p>
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

                <SmartInput
                  label="OpenAI API Key"
                  name="apiKey"
                  value={apiKey}
                  onChange={setApiKey}
                  type="password"
                  placeholder="sk-... (leave blank to use stored key)"
                  helperText="Your API key is stored locally and never sent to our servers"
                  required
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

                <SmartTextarea
                  label="Your Query"
                  name="query"
                  value={query}
                  onChange={setQuery}
                  placeholder="What would you like to know about this data? e.g., 'What are the top 5 spending categories?'"
                  helperText="Be specific for better results. Include filters or calculations when relevant."
                  required
                  rows={4}
                />

                {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

                <div className="flex gap-3">
                  <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={!query.trim() && !file && !csvPath.trim()}>
                    <Upload className="h-4 w-4" />
                    Analyze Data
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          <EmptyState
            icon={<FileText className="h-16 w-16 text-gray-600" />}
            title="No analysis results yet"
            description="Upload your CSV or Excel file and ask a question to get AI-powered insights from your data"
            tips={[
              "Upload a file with clean, structured data",
              "Include column headers in the first row",
              "Ask specific questions about trends or patterns",
              "Try queries like 'Calculate total revenue by region'"
            ]}
          />
        </div>
      </main>
    </>
  );
};

export default AiDataAnalysisAgentPage;