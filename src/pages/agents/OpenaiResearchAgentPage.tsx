import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { FormSection } from "@/components/agent-ui/FormSection";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, FileSearch, Brain } from "lucide-react";

const OpenaiResearchAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("main");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem('openai-research-agent-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTopic(parsed.topic || "");
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('openai-research-agent-data', JSON.stringify({ topic }));
  }, [topic]);

  const handleSubmit = async (tabKey: string, data: any) => {
    if (!topic.trim()) {
      setErrors(prev => ({ ...prev, [tabKey]: "Please enter a research topic" }));
      return;
    }
    setLoading(tabKey);
    setErrors(prev => ({ ...prev, [tabKey]: null }));
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openai-research-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, mode: tabKey, userId: user?.id })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed');
      setResults(prev => ({ ...prev, [tabKey]: result }));
      localStorage.removeItem('openai-research-agent-data');
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [tabKey]: err.message }));
    } finally {
      setLoading(null);
    }
  };

  const handleClear = (tabKey: string) => {
    if (tabKey === activeTab) {
      setTopic("");
    }
    setResults(prev => ({ ...prev, [tabKey]: null }));
  };

  return (
    <>
      <Helmet>
        <title>OpenaiResearchAgent - VideoRemix.vip</title>
        <meta name="description" content="Use openai-research-agent to automate tasks with AI." />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-3xl mb-6">
              <Brain className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">OpenAI Research Agent</h1>
            <p className="text-xl text-gray-400">AI-powered research with mode selection for different analysis depths.</p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="main">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>Main Research Mode</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit('main', { enter_a_topic_to_research: topic }); }} className="space-y-6">
                    <FormSection title="Research Topic" description="Enter the topic you want to research">
                      <SmartTextarea
                        label="Topic to Research"
                        name="enter_a_topic_to_research"
                        value={topic}
                        onChange={setTopic}
                        placeholder="最新的人工智能发展趋势和技术突破有哪些？"
                        helperText="Enter your research topic in any language. Be specific for more targeted results."
                        rows={4}
                        required
                      />
                    </FormSection>

                    <div className="flex gap-3 pt-4">
                      <ActionButton type="submit" loading={loading === 'main'} size="lg" className="flex-1" disabled={!topic.trim()}>
                        <Sparkles className="h-4 w-4" />
                        Run Research
                      </ActionButton>
                      <ActionButton variant="ghost" onClick={() => handleClear('main')} disabled={loading === 'main'}>
                        Clear
                      </ActionButton>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {errors['main'] && <ErrorMessage message={errors['main']} onRetry={() => handleSubmit('main', { enter_a_topic_to_research: topic })} retryLoading={loading === 'main'} />}

              {loading === 'main' && <LoadingIndicator message="Researching topic..." subtext="AI is analyzing and gathering information" />}

              {results['main'] && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
                  <ResultGrid columns={2}>
                    <ResultCard
                      icon={<FileSearch className="h-5 w-5" />}
                      title="Topic"
                      value={topic.slice(0, 50) + (topic.length > 50 ? '...' : '')}
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
                    <CardHeader><CardTitle>Research Results</CardTitle></CardHeader>
                    <CardContent>
                      <div className="prose prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans text-gray-200">
                          {typeof results['main'].result === 'string' ? results['main'].result : JSON.stringify(results['main'], null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </TabsContent>
            
            <TabsContent value="advanced">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>Advanced Research Mode</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit('advanced', { enter_a_topic_to_research: topic }); }} className="space-y-6">
                    <FormSection title="Research Topic" description="Enter the topic for deep analysis">
                      <SmartTextarea
                        label="Topic to Research"
                        name="enter_a_topic_to_research"
                        value={topic}
                        onChange={setTopic}
                        placeholder="Analyze the impact of transformer architecture on NLP research over the past 5 years"
                        helperText="Advanced mode performs deeper analysis with more comprehensive source gathering."
                        rows={4}
                        required
                      />
                    </FormSection>

                    <div className="flex gap-3 pt-4">
                      <ActionButton type="submit" loading={loading === 'advanced'} size="lg" className="flex-1" disabled={!topic.trim()}>
                        <Sparkles className="h-4 w-4" />
                        Run Deep Research
                      </ActionButton>
                      <ActionButton variant="ghost" onClick={() => handleClear('advanced')} disabled={loading === 'advanced'}>
                        Clear
                      </ActionButton>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {errors['advanced'] && <ErrorMessage message={errors['advanced']} onRetry={() => handleSubmit('advanced', { enter_a_topic_to_research: topic })} retryLoading={loading === 'advanced'} />}

              {loading === 'advanced' && <LoadingIndicator message="Running deep research..." subtext="Conducting comprehensive analysis" />}

              {results['advanced'] && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
                  <ResultGrid columns={2}>
                    <ResultCard
                      icon={<FileSearch className="h-5 w-5" />}
                      title="Topic"
                      value={topic.slice(0, 50) + (topic.length > 50 ? '...' : '')}
                      subtext="Deep analysis complete"
                    />
                    <ResultCard
                      icon={<Sparkles className="h-5 w-5" />}
                      title="Status"
                      value="Completed"
                      variant="success"
                    />
                  </ResultGrid>

                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader><CardTitle>Deep Research Results</CardTitle></CardHeader>
                    <CardContent>
                      <div className="prose prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans text-gray-200">
                          {typeof results['advanced'].result === 'string' ? results['advanced'].result : JSON.stringify(results['advanced'], null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </TabsContent>
            
          </Tabs>
        </div>
      </main>
    </>
  );
};

export default OpenaiResearchAgentPage;
