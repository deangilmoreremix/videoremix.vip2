import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { SelectDropdown } from "@/components/agent-ui/SelectDropdown";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ResultCard } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { Github, Sparkles, Code, GitBranch } from "lucide-react";

const STORAGE_KEY = 'github-mcp-agent';

const GithubMcpAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    openai_api_key: "",
    github_token: "",
    repository: "",
    query_type: "code_search",
    query: ""
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.repository.trim()) {
      setError("Repository is required");
      return;
    }
    if (!formData.query.trim()) {
      setError("Query is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-mcp-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (result && result.status === 'completed') {
    return (
      <>
        <Helmet>
          <title>GithubMcpAgent - VideoRemix.vip</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <ResultCard
                icon={<Code className="h-5 w-5" />}
                title="GitHub Analysis Results"
                description={result.result}
                variant="success"
              />
              <div className="flex justify-center">
                <ActionButton onClick={() => { setResult(null); setFormData({
                  openai_api_key: "",
                  github_token: "",
                  repository: "",
                  query_type: "code_search",
                  query: ""
                }); }}>
                  <Sparkles className="h-4 w-4" />
                  New Query
                </ActionButton>
              </div>
            </motion.div>
          </div>
        </main>
      </>
    );
  }

  if (loading) {
    return <LoadingIndicator message="Analyzing GitHub repository..." subtext="Searching code and issues" />;
  }

  if (!result && !loading) {
    return (
      <>
        <Helmet>
          <title>GithubMcpAgent - VideoRemix.vip</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-900 rounded-3xl mb-6">
                <Github className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">GitHub MCP Agent</h1>
              <p className="text-xl text-gray-400">AI-powered GitHub repository analysis with MCP.</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 space-y-6">
                <FormSection title="API Configuration" description="Enter your API credentials">
                  <div className="space-y-4">
                    <SmartInput
                      label="OpenAI API Key"
                      name="openai_api_key"
                      value={formData.openai_api_key}
                      onChange={(value) => setFormData(prev => ({ ...prev, openai_api_key: value }))}
                      type="password"
                      placeholder="sk-..."
                      helperText="Your API key is stored locally"
                    />

                    <SmartInput
                      label="GitHub Token"
                      name="github_token"
                      value={formData.github_token}
                      onChange={(value) => setFormData(prev => ({ ...prev, github_token: value }))}
                      type="password"
                      placeholder="ghp_..."
                      helperText="Personal access token for GitHub API access"
                    />
                  </div>
                </FormSection>

                <FormSection title="Repository" description="Specify the repository to analyze">
                  <div className="space-y-4">
                    <SmartInput
                      label="Repository"
                      name="repository"
                      value={formData.repository}
                      onChange={(value) => setFormData(prev => ({ ...prev, repository: value }))}
                      placeholder="e.g., owner/repo or https://github.com/owner/repo"
                      helperText="Full repository path or URL"
                      required
                    />

                    <SelectDropdown
                      label="Query Type"
                      name="query_type"
                      value={formData.query_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, query_type: value }))}
                      options={[
                        { value: "code_search", label: "Code Search" },
                        { value: "issues", label: "Issues" },
                        { value: "pull_requests", label: "Pull Requests" },
                        { value: "repo_info", label: "Repository Info" },
                        { value: "file_search", label: "File Search" }
                      ]}
                      helperText="Select the type of query to perform"
                    />
                  </div>
                </FormSection>

                <FormSection title="Query" description="Enter your search query">
                  <SmartTextarea
                    label="Your Query"
                    name="query"
                    value={formData.query}
                    onChange={(value) => setFormData(prev => ({ ...prev, query: value }))}
                    placeholder="e.g., 'Find all functions related to user authentication'"
                    helperText="Describe what you want to search for in the repository"
                    rows={4}
                    required
                  />
                </FormSection>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <ActionButton type="submit" loading={loading} size="lg" className="w-full">
                <Sparkles className="h-4 w-4" />
                Search Repository
              </ActionButton>
            </form>

            <EmptyState
              icon={<GitBranch className="h-16 w-16 text-gray-600" />}
              title="GitHub Repository Analysis"
              description="Search and analyze GitHub repositories with AI"
              tips={[
                "Enter the repository in owner/repo format",
                "Choose the appropriate query type for your search",
                "Be specific about what you're looking for in the code"
              ]}
            />
          </div>
        </main>
      </>
    );
  }

  return null;
};

export default GithubMcpAgentPage;
