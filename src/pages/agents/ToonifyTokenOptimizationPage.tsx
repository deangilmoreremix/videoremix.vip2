import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SmartInput } from "../../components/agent-ui/SmartInput";
import { SmartTextarea } from "../../components/agent-ui/SmartTextarea";
import { ActionButton } from "../../components/agent-ui/ActionButton";
import { ResultCard, ResultGrid } from "../../components/agent-ui/ResultCard";
import { EmptyState } from "../../components/agent-ui/EmptyState";
import { LoadingIndicator } from "../../components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "../../components/agent-ui/ErrorMessage";
import { FormSection } from "../../components/agent-ui/FormSection";

const STORAGE_KEY = 'toonify_token_optimization_form';

interface FormData {
  llm_model: string;
  toon_delimiter: string;
  key_folding: string;
  choose_example_dataset: string;
  json_data: string;
}

const defaultFormData: FormData = {
  llm_model: '',
  toon_delimiter: '',
  key_folding: '',
  choose_example_dataset: '',
  json_data: '',
};

const ToonifyTokenOptimizationPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("main");
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mainFormData, setMainFormData] = useState<FormData>(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}_main`);
    return stored ? JSON.parse(stored) : defaultFormData;
  });
  const [advancedFormData, setAdvancedFormData] = useState<FormData>(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}_advanced`);
    return stored ? JSON.parse(stored) : defaultFormData;
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_main`, JSON.stringify(mainFormData));
  }, [mainFormData]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_advanced`, JSON.stringify(advancedFormData));
  }, [advancedFormData]);

  const handleSubmit = async (tabKey: string, data: FormData) => {
    setLoading(tabKey);
    setErrors(prev => ({ ...prev, [tabKey]: '' }));
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/toonify-token-optimization`, {
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

  const renderForm = (tabKey: string, formData: FormData, setFormData: React.Dispatch<React.SetStateAction<FormData>>) => (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(tabKey, formData); }} className="space-y-6">
      <FormSection title="LLM Model">
        <SmartTextarea
          id={`${tabKey}_llm_model`}
          value={formData.llm_model}
          onChange={(val) => setFormData(prev => ({ ...prev, llm_model: val }))}
          placeholder="e.g., 'gpt-4', 'claude-3', 'gemini-pro'"
          className="bg-gray-900/50 border-gray-600"
        />
      </FormSection>

      <FormSection title="TOON Delimiter">
        <SmartTextarea
          id={`${tabKey}_toon_delimiter`}
          value={formData.toon_delimiter}
          onChange={(val) => setFormData(prev => ({ ...prev, toon_delimiter: val }))}
          placeholder="e.g., '||', '---', '[TOON]'"
          className="bg-gray-900/50 border-gray-600"
        />
      </FormSection>

      <FormSection title="Key Folding">
        <SmartTextarea
          id={`${tabKey}_key_folding`}
          value={formData.key_folding}
          onChange={(val) => setFormData(prev => ({ ...prev, key_folding: val }))}
          placeholder="e.g., 'lowercase', 'uppercase', 'preserve'"
          className="bg-gray-900/50 border-gray-600"
        />
      </FormSection>

      <FormSection title="Choose example dataset">
        <SmartTextarea
          id={`${tabKey}_choose_example_dataset`}
          value={formData.choose_example_dataset}
          onChange={(val) => setFormData(prev => ({ ...prev, choose_example_dataset: val }))}
          placeholder="e.g., 'medical', 'legal', 'financial'"
          className="bg-gray-900/50 border-gray-600"
        />
      </FormSection>

      <FormSection title="JSON Data">
        <SmartTextarea
          id={`${tabKey}_json_data`}
          value={formData.json_data}
          onChange={(val) => setFormData(prev => ({ ...prev, json_data: val }))}
          placeholder='{"key": "value"} example JSON data'
          className="bg-gray-900/50 border-gray-600"
        />
      </FormSection>

      <ActionButton type="submit" loading={loading === tabKey}>
        {loading === tabKey ? 'Processing...' : 'Run'}
      </ActionButton>
    </form>
  );

  const renderResults = (tabKey: string) => {
    if (errors[tabKey]) {
      return <ErrorMessage message={errors[tabKey]} />;
    }
    if (!results[tabKey]) {
      return <EmptyState message="No results yet. Run the form to see results." />;
    }
    return (
      <ResultGrid>
        <ResultCard title="Optimization Result">
          <pre className="whitespace-pre-wrap text-sm font-sans">{JSON.stringify(results[tabKey], null, 2)}</pre>
        </ResultCard>
      </ResultGrid>
    );
  };

  return (
    <>
      <Helmet>
        <title>ToonifyTokenOptimization - VideoRemix.vip</title>
        <meta name="description" content="Use toonify-token-optimization to automate tasks with AI." />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Toonify Token Optimization</h1>
            <p className="text-xl text-gray-400">AI-powered toonify token optimization.</p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="main">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>Main</CardTitle></CardHeader>
                <CardContent>
                  {renderForm('main', mainFormData, setMainFormData)}
                </CardContent>
              </Card>
              {loading === 'main' ? (
                <LoadingIndicator />
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                  {renderResults('main')}
                </motion.div>
              )}
            </TabsContent>
            
            <TabsContent value="advanced">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>Advanced</CardTitle></CardHeader>
                <CardContent>
                  {renderForm('advanced', advancedFormData, setAdvancedFormData)}
                </CardContent>
              </Card>
              {loading === 'advanced' ? (
                <LoadingIndicator />
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                  {renderResults('advanced')}
                </motion.div>
              )}
            </TabsContent>
            
          </Tabs>
        </div>
      </main>
    </>
  );
};

export default ToonifyTokenOptimizationPage;
