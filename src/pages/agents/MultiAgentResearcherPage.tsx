import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, FileSearch, Key } from "lucide-react";

const MultiAgentResearcherPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ openai_api_key: "", enter_your_report_query: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('multi-agent-researcher-data');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('multi-agent-researcher-data', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.openai_api_key.trim()) {
      setError("OpenAI API key is required");
      return;
    }
    if (!formData.enter_your_report_query.trim()) {
      setError("Please enter your research query");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/multi-agent-researcher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem('multi-agent-researcher-data');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ openai_api_key: "", enter_your_report_query: "" });
    setResult(null);
  };

  return (
    <>
      <Helmet>
        <title>MultiAgentResearcher - VideoRemix.vip</title>
        <meta name="description" content="Use multi-agent-researcher to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-600 to-blue-500 rounded-3xl mb-6">
              <FileSearch className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Multi Agent Researcher</h1>
            <p className="text-xl text-gray-400">Deep research powered by multiple AI agents working together.</p>
          </motion.div>

          {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

          {!result ? (
            <Card className="bg-gray-800/50 border-gray-700 mb-8">
              <CardHeader><CardTitle>Research Configuration</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <FormSection title="API Configuration" description="Enter your OpenAI API key">
                    <ApiKeyInput
                      label="OpenAI API Key"
                      name="openai_api_key"
                      value={formData.openai_api_key}
                      onChange={(val) => setFormData({ ...formData, openai_api_key: val })}
                      helperText="Your key is stored locally and never sent to our servers"
                      required
                    />
                  </FormSection>

                  <FormSection title="Research Topic" description="Define what you want to research">
                    <SmartTextarea
                      label="Report Query"
                      name="enter_your_report_query"
                      value={formData.enter_your_report_query}
                      onChange={(val) => setFormData({ ...formData, enter_your_report_query: val })}
                      placeholder="Research the latest developments in quantum computing, focusing on recent breakthroughs, key players, and potential applications in the next 5 years"
                      helperText="Be specific about your research topic. Include scope, time frame, and focus areas for best results."
                      rows={5}
                      required
                    />
                  </FormSection>

                  <div className="flex gap-3 pt-4">
                    <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={!formData.enter_your_report_query.trim()}>
                      <Sparkles className="h-4 w-4" />
                      Start Research
                    </ActionButton>
                    <ActionButton variant="ghost" onClick={handleClear} disabled={loading}>
                      Clear
                    </ActionButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : loading ? (
            <LoadingIndicator message="Running multi-agent research..." subtext="Multiple agents are investigating your topic" />
          ) : null}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultGrid columns={2}>
                <ResultCard
                  icon={<FileSearch className="h-5 w-5" />}
                  title="Topic"
                  value={formData.enter_your_report_query.slice(0, 50) + (formData.enter_your_report_query.length > 50 ? '...' : '')}
                  subtext="Research complete"
                />
                <ResultCard
                  icon={<Sparkles className="h-5 w-5" />}
                  title="Status"
                  value="Completed"
                  variant="success"
                />
              </ResultGrid>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>Research Report</CardTitle></CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans text-gray-200">{result.result}</pre>
                  </div>
                </CardContent>
              </Card>

              <ActionButton onClick={() => { setResult(null); setFormData({ openai_api_key: formData.openai_api_key, enter_your_report_query: "" }); }} variant="secondary" className="w-full">
                Research Another Topic
              </ActionButton>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
};

export default MultiAgentResearcherPage;
