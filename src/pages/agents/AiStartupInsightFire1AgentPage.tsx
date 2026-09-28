import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ResultCard } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";

const AiStartupInsightFire1AgentPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("main");
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mainForm, setMainForm] = useState({ openai_api_key: "", website_urls_one_per_line: "" });
  const [advancedForm, setAdvancedForm] = useState({ openai_api_key: "", website_urls_one_per_line: "" });

  const updateMain = (field: string, value: string) => setMainForm(prev => ({ ...prev, [field]: value }));
  const updateAdvanced = (field: string, value: string) => setAdvancedForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (tabKey: string, data: any) => {
    setLoading(tabKey);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-code-review-pro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, mode: tabKey, userId: user?.id })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed');
      setResults(prev => ({ ...prev, [tabKey]: result }));
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [tabKey]: err.message }));
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>AiStartupInsightFire1Agent - VideoRemix.vip</title>
        <meta name="description" content="Use ai-code-review-pro to automate tasks with AI." />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Ai Startup Insight Fire1 Agent</h1>
            <p className="text-xl text-gray-400">AI-powered ai startup insight fire1 agent.</p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="main">
              {errors['main'] && <ErrorMessage title="Request Failed" message={errors['main']} onRetry={() => handleSubmit('main', mainForm)} retryLoading={loading === 'main'} />}
              <FormSection title="API Configuration" description="Enter your OpenAI API key">
                <ApiKeyInput label="OpenAI API Key" name="openai_api_key" value={mainForm.openai_api_key} onChange={(v) => updateMain('openai_api_key', v)} required helperText="Get your API key from OpenAI Platform" />
              </FormSection>
              <FormSection title="Input" description="Provide website URLs">
                <SmartTextarea label="Website URLs (one per line)" name="website_urls_one_per_line" value={mainForm.website_urls_one_per_line} onChange={(v) => updateMain('website_urls_one_per_line', v)} placeholder="" required />
              </FormSection>

              {loading === 'main' && <LoadingIndicator message="Processing..." subtext="Analyzing startup insight" />}

              <ActionButton type="button" loading={loading === 'main'} onClick={() => handleSubmit('main', mainForm)} className="w-full mt-6">
                Run
              </ActionButton>

              {results['main'] && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                  <ResultCard title="Main Result" variant="success">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans mt-2">{JSON.stringify(results['main'], null, 2)}</pre>
                  </ResultCard>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="advanced">
              {errors['advanced'] && <ErrorMessage title="Request Failed" message={errors['advanced']} onRetry={() => handleSubmit('advanced', advancedForm)} retryLoading={loading === 'advanced'} />}
              <FormSection title="API Configuration" description="Enter your OpenAI API key">
                <ApiKeyInput label="OpenAI API Key" name="openai_api_key" value={advancedForm.openai_api_key} onChange={(v) => updateAdvanced('openai_api_key', v)} required helperText="Get your API key from OpenAI Platform" />
              </FormSection>
              <FormSection title="Input" description="Provide website URLs">
                <SmartTextarea label="Website URLs (one per line)" name="website_urls_one_per_line" value={advancedForm.website_urls_one_per_line} onChange={(v) => updateAdvanced('website_urls_one_per_line', v)} placeholder="" required />
              </FormSection>

              {loading === 'advanced' && <LoadingIndicator message="Processing..." subtext="Analyzing startup insight" />}

              <ActionButton type="button" loading={loading === 'advanced'} onClick={() => handleSubmit('advanced', advancedForm)} className="w-full mt-6">
                Run
              </ActionButton>

              {results['advanced'] && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                  <ResultCard title="Advanced Result" variant="success">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans mt-2">{JSON.stringify(results['advanced'], null, 2)}</pre>
                  </ResultCard>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
};

 export default AiStartupInsightFire1AgentPage;
