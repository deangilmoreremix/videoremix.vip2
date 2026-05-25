import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, Globe, Terminal } from "lucide-react";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { FormSection } from "@/components/agent-ui/FormSection";

const STORAGE_KEY = 'browser-mcp-agent-form';

const BrowserMcpAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ your_command: "" });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.your_command.trim()) {
      setError("Please enter a command");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/browser-mcp-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.error || "Request failed");
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ your_command: "" });
    setResult(null);
    setError(null);
  };

  return (
    <>
      <Helmet>
        <title>BrowserMcpAgent - VideoRemix.vip</title>
        <meta name="description" content="Use browser-mcp-agent to control a browser with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-500 rounded-3xl mb-6">
              <Globe className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Browser MCP Agent</h1>
            <p className="text-xl text-gray-400">Control a web browser with natural language commands. Let AI navigate, search, and interact with websites for you.</p>
          </motion.div>

          {!result && !loading && (
            <EmptyState
              icon={<Terminal className="h-16 w-16 text-gray-600" />}
              title="Command your browser with AI"
              description="Tell the browser agent what to do in plain English. It can navigate websites, fill forms, extract data, and more."
              tips={[
                "Be specific about what you want: 'Go to Amazon and find the cheapest headphones'",
                "The agent can interact with web pages on your behalf",
                "Specify exact actions like clicks, scrolls, or form submissions"
              ]}
            />
          )}

          <FormSection
            title="Your Command"
            description="Tell the browser what to do"
          >
            <SmartTextarea
              label="Browser Command"
              name="your_command"
              value={formData.your_command}
              onChange={(val) => setFormData({ ...formData, your_command: val })}
              placeholder="e.g., Go to google.com and search for 'best restaurants in San Francisco', then show me the top 5 results"
              helperText="Describe what you want the browser to do in natural language. Be as specific as possible."
              rows={4}
              required
            />
          </FormSection>

          {error && (
            <ErrorMessage
              title="Request failed"
              message={error}
              onRetry={handleSubmit}
              retryLoading={loading}
            />
          )}

          {loading && (
            <LoadingIndicator
              message="Executing browser command..."
              subtext="Navigating and interacting with the web"
            />
          )}

          {result && result.status === 'completed' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ResultGrid columns={1}>
                <ResultCard
                  icon={<Globe className="h-5 w-5" />}
                  title="Command Result"
                  description={result.result}
                  variant="success"
                />
              </ResultGrid>

              <ActionButton onClick={handleClear} variant="ghost" className="w-full">
                Execute Another Command
              </ActionButton>
            </motion.div>
          )}

          {!result && !loading && (
            <div className="flex gap-3 mt-6">
              <ActionButton onClick={handleSubmit} loading={loading} size="lg" className="flex-1">
                <Sparkles className="h-4 w-4" />
                Execute Command
              </ActionButton>
              <ActionButton onClick={handleClear} variant="ghost" size="lg">
                Clear
              </ActionButton>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default BrowserMcpAgentPage;
