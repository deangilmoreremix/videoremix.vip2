import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { FormSection } from "@/components/agent-ui/FormSection";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ResultCard } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";

const KnowledgeGraphRagCitationsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("main");
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mainForm, setMainForm] = useState({ choose_sample_document: "", or_paste_your_own_document: "", document_name: "", enter_your_question: "" });
  const [advancedForm, setAdvancedForm] = useState({ choose_sample_document: "", or_paste_your_own_document: "", document_name: "", enter_your_question: "" });

  const updateMain = (field: string, value: string) => setMainForm(prev => ({ ...prev, [field]: value }));
  const updateAdvanced = (field: string, value: string) => setAdvancedForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (tabKey: string, data: any) => {
    setLoading(tabKey);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/knowledge-graph-rag-citations`, {
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
        <title>KnowledgeGraphRagCitations - VideoRemix.vip</title>
        <meta name="description" content="Use knowledge-graph-rag-citations to automate tasks with AI." />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Knowledge Graph Rag Citations</h1>
            <p className="text-xl text-gray-400">AI-powered knowledge graph rag citations.</p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="main">
              {errors['main'] && <ErrorMessage title="Request Failed" message={errors['main']} onRetry={() => handleSubmit('main', mainForm)} retryLoading={loading === 'main'} />}
              <FormSection title="Document Input" description="Choose or paste your document">
                <SmartTextarea label="Choose sample document" name="choose_sample_document" value={mainForm.choose_sample_document} onChange={(v) => updateMain('choose_sample_document', v)} placeholder="" required />
                <SmartTextarea label="Or paste your own document" name="or_paste_your_own_document" value={mainForm.or_paste_your_own_document} onChange={(v) => updateMain('or_paste_your_own_document', v)} placeholder="" required />
                <SmartTextarea label="Document name" name="document_name" value={mainForm.document_name} onChange={(v) => updateMain('document_name', v)} placeholder="" required />
                <SmartTextarea label="Enter your question" name="enter_your_question" value={mainForm.enter_your_question} onChange={(v) => updateMain('enter_your_question', v)} placeholder="" required />
              </FormSection>

              {loading === 'main' && <LoadingIndicator message="Processing..." subtext="Running main workflow" />}

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
              <FormSection title="Document Input" description="Choose or paste your document">
                <SmartTextarea label="Choose sample document" name="choose_sample_document" value={advancedForm.choose_sample_document} onChange={(v) => updateAdvanced('choose_sample_document', v)} placeholder="" required />
                <SmartTextarea label="Or paste your own document" name="or_paste_your_own_document" value={advancedForm.or_paste_your_own_document} onChange={(v) => updateAdvanced('or_paste_your_own_document', v)} placeholder="" required />
                <SmartTextarea label="Document name" name="document_name" value={advancedForm.document_name} onChange={(v) => updateAdvanced('document_name', v)} placeholder="" required />
                <SmartTextarea label="Enter your question" name="enter_your_question" value={advancedForm.enter_your_question} onChange={(v) => updateAdvanced('enter_your_question', v)} placeholder="" required />
              </FormSection>

              {loading === 'advanced' && <LoadingIndicator message="Processing..." subtext="Running advanced workflow" />}

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

 export default KnowledgeGraphRagCitationsPage;
