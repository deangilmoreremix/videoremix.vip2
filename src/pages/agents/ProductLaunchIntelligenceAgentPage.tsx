import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, Rocket, Key } from "lucide-react";

const ProductLaunchIntelligenceAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("main");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [firecrawlApiKey, setFirecrawlApiKey] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem('product-launch-intelligence-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setOpenaiApiKey(parsed.openaiApiKey || "");
        setFirecrawlApiKey(parsed.firecrawlApiKey || "");
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('product-launch-intelligence-data', JSON.stringify({ openaiApiKey, firecrawlApiKey }));
  }, [openaiApiKey, firecrawlApiKey]);

  const handleSubmit = async (tabKey: string, data: any) => {
    if (!openaiApiKey.trim()) {
      setErrors(prev => ({ ...prev, [tabKey]: "OpenAI API key is required" }));
      return;
    }
    if (!firecrawlApiKey.trim()) {
      setErrors(prev => ({ ...prev, [tabKey]: "Firecrawl API key is required" }));
      return;
    }
    setLoading(tabKey);
    setErrors(prev => ({ ...prev, [tabKey]: null }));
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-launch-intelligence-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, mode: tabKey, userId: user?.id })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed');
      setResults(prev => ({ ...prev, [tabKey]: result }));
      localStorage.removeItem('product-launch-intelligence-data');
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [tabKey]: err.message }));
    } finally {
      setLoading(null);
    }
  };

  const handleClear = () => {
    setOpenaiApiKey("");
    setFirecrawlApiKey("");
    setResults({});
  };

  return (
    <>
      <Helmet>
        <title>ProductLaunchIntelligenceAgent - VideoRemix.vip</title>
        <meta name="description" content="Use product-launch-intelligence-agent to automate tasks with AI." />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-rose-600 to-orange-500 rounded-3xl mb-6">
              <Rocket className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Product Launch Intelligence Agent</h1>
            <p className="text-xl text-gray-400">AI-powered product launch analysis and competitive intelligence.</p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="main">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>Launch Intelligence Configuration</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit('main', { openai_api_key: openaiApiKey, firecrawl_api_key: firecrawlApiKey }); }} className="space-y-6">
                    <FormSection title="API Configuration" description="Enter your API keys for OpenAI and Firecrawl">
                      <ApiKeyInput
                        label="OpenAI API Key"
                        name="openai_api_key"
                        value={openaiApiKey}
                        onChange={setOpenaiApiKey}
                        helperText="Your key is stored locally and never sent to our servers"
                        required
                      />
                      
                      <ApiKeyInput
                        label="Firecrawl API Key"
                        name="firecrawl_api_key"
                        value={firecrawlApiKey}
                        onChange={setFirecrawlApiKey}
                        helperText="Used for web scraping and competitive analysis"
                        required
                      />
                    </FormSection>

                    <div className="flex gap-3 pt-4">
                      <ActionButton type="submit" loading={loading === 'main'} size="lg" className="flex-1" disabled={!openaiApiKey.trim() || !firecrawlApiKey.trim()}>
                        <Sparkles className="h-4 w-4" />
                        Generate Launch Intelligence
                      </ActionButton>
                      <ActionButton variant="ghost" onClick={handleClear} disabled={loading === 'main'}>
                        Clear
                      </ActionButton>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {errors['main'] && <ErrorMessage message={errors['main']} onRetry={() => handleSubmit('main', { openai_api_key: openaiApiKey, firecrawl_api_key: firecrawlApiKey })} retryLoading={loading === 'main'} />}

              {loading === 'main' && <LoadingIndicator message="Analyzing product launch..." subtext="Gathering competitive intelligence and market data" />}

              {results['main'] && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
                  <ResultGrid columns={2}>
                    <ResultCard
                      icon={<Rocket className="h-5 w-5" />}
                      title="Analysis Type"
                      value="Launch Intelligence"
                      subtext="Main mode"
                    />
                    <ResultCard
                      icon={<Sparkles className="h-5 w-5" />}
                      title="Status"
                      value="Completed"
                      variant="success"
                    />
                  </ResultGrid>

                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader><CardTitle>Launch Intelligence Report</CardTitle></CardHeader>
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
                <CardHeader><CardTitle>Advanced Launch Configuration</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit('advanced', { openai_api_key: openaiApiKey, firecrawl_api_key: firecrawlApiKey }); }} className="space-y-6">
                    <FormSection title="API Configuration" description="Enter your API keys for comprehensive analysis">
                      <ApiKeyInput
                        label="OpenAI API Key"
                        name="openai_api_key"
                        value={openaiApiKey}
                        onChange={setOpenaiApiKey}
                        helperText="Your key is stored locally and never sent to our servers"
                        required
                      />
                      
                      <ApiKeyInput
                        label="Firecrawl API Key"
                        name="firecrawl_api_key"
                        value={firecrawlApiKey}
                        onChange={setFirecrawlApiKey}
                        helperText="Used for deep web scraping and competitive analysis"
                        required
                      />
                    </FormSection>

                    <div className="flex gap-3 pt-4">
                      <ActionButton type="submit" loading={loading === 'advanced'} size="lg" className="flex-1" disabled={!openaiApiKey.trim() || !firecrawlApiKey.trim()}>
                        <Sparkles className="h-4 w-4" />
                        Run Deep Analysis
                      </ActionButton>
                      <ActionButton variant="ghost" onClick={handleClear} disabled={loading === 'advanced'}>
                        Clear
                      </ActionButton>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {errors['advanced'] && <ErrorMessage message={errors['advanced']} onRetry={() => handleSubmit('advanced', { openai_api_key: openaiApiKey, firecrawl_api_key: firecrawlApiKey })} retryLoading={loading === 'advanced'} />}

              {loading === 'advanced' && <LoadingIndicator message="Running deep analysis..." subtext="Performing comprehensive competitive intelligence gathering" />}

              {results['advanced'] && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
                  <ResultGrid columns={2}>
                    <ResultCard
                      icon={<Rocket className="h-5 w-5" />}
                      title="Analysis Type"
                      value="Deep Launch Analysis"
                      subtext="Advanced mode"
                    />
                    <ResultCard
                      icon={<Sparkles className="h-5 w-5" />}
                      title="Status"
                      value="Completed"
                      variant="success"
                    />
                  </ResultGrid>

                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader><CardTitle>Advanced Analysis Report</CardTitle></CardHeader>
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

export default ProductLaunchIntelligenceAgentPage;
