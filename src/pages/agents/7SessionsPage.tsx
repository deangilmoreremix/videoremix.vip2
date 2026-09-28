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

const Agent7SessionsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("main");
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mainForm, setMainForm] = useState({
    select_demo_type: "", session_type: "", your_message: "", get_last_n_items: "", user_message_to_add: "", assistant_response_to_add: "", alice: "", bob: "", support_question: "", sales_inquiry: "", select_agent: "", customer_message: ""
  });
  const [advancedForm, setAdvancedForm] = useState({
    select_demo_type: "", session_type: "", your_message: "", get_last_n_items: "", user_message_to_add: "", assistant_response_to_add: "", alice: "", bob: "", support_question: "", sales_inquiry: "", select_agent: "", customer_message: ""
  });

  const updateMain = (field: string, value: string) => setMainForm(prev => ({ ...prev, [field]: value }));
  const updateAdvanced = (field: string, value: string) => setAdvancedForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (tabKey: string, data: any) => {
    setLoading(tabKey);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutorial-sessions`, {
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
        <title>7Sessions - VideoRemix.vip</title>
        <meta name="description" content="Use ai-audio-guide-creator to automate tasks with AI." />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">7 Sessions</h1>
            <p className="text-xl text-gray-400">AI-powered 7 sessions.</p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="main">
              {errors['main'] && <ErrorMessage title="Request Failed" message={errors['main']} onRetry={() => handleSubmit('main', mainForm)} retryLoading={loading === 'main'} />}
              <FormSection title="Main Configuration" description="Configure main settings">
                <SmartTextarea label="Select Demo Type" name="select_demo_type" value={mainForm.select_demo_type} onChange={(v) => updateMain('select_demo_type', v)} placeholder="" required />
                <SmartTextarea label="Session Type" name="session_type" value={mainForm.session_type} onChange={(v) => updateMain('session_type', v)} placeholder="" required />
                <SmartTextarea label="Your Message" name="your_message" value={mainForm.your_message} onChange={(v) => updateMain('your_message', v)} placeholder="" required />
                <SmartTextarea label="Get last N items" name="get_last_n_items" value={mainForm.get_last_n_items} onChange={(v) => updateMain('get_last_n_items', v)} placeholder="" required />
                <SmartTextarea label="User message to add" name="user_message_to_add" value={mainForm.user_message_to_add} onChange={(v) => updateMain('user_message_to_add', v)} placeholder="" required />
                <SmartTextarea label="Assistant response to add" name="assistant_response_to_add" value={mainForm.assistant_response_to_add} onChange={(v) => updateMain('assistant_response_to_add', v)} placeholder="" required />
                <SmartTextarea label="Alice" name="alice" value={mainForm.alice} onChange={(v) => updateMain('alice', v)} placeholder="" required />
                <SmartTextarea label="Bob" name="bob" value={mainForm.bob} onChange={(v) => updateMain('bob', v)} placeholder="" required />
                <SmartTextarea label="Support question" name="support_question" value={mainForm.support_question} onChange={(v) => updateMain('support_question', v)} placeholder="" required />
                <SmartTextarea label="Sales inquiry" name="sales_inquiry" value={mainForm.sales_inquiry} onChange={(v) => updateMain('sales_inquiry', v)} placeholder="" required />
                <SmartTextarea label="Select Agent" name="select_agent" value={mainForm.select_agent} onChange={(v) => updateMain('select_agent', v)} placeholder="" required />
                <SmartTextarea label="Customer message" name="customer_message" value={mainForm.customer_message} onChange={(v) => updateMain('customer_message', v)} placeholder="" required />
              </FormSection>

              {loading === 'main' && <LoadingIndicator message="Processing..." subtext="Running main session" />}

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
              <FormSection title="Advanced Configuration" description="Configure advanced settings">
                <SmartTextarea label="Select Demo Type" name="select_demo_type" value={advancedForm.select_demo_type} onChange={(v) => updateAdvanced('select_demo_type', v)} placeholder="" required />
                <SmartTextarea label="Session Type" name="session_type" value={advancedForm.session_type} onChange={(v) => updateAdvanced('session_type', v)} placeholder="" required />
                <SmartTextarea label="Your Message" name="your_message" value={advancedForm.your_message} onChange={(v) => updateAdvanced('your_message', v)} placeholder="" required />
                <SmartTextarea label="Get last N items" name="get_last_n_items" value={advancedForm.get_last_n_items} onChange={(v) => updateAdvanced('get_last_n_items', v)} placeholder="" required />
                <SmartTextarea label="User message to add" name="user_message_to_add" value={advancedForm.user_message_to_add} onChange={(v) => updateAdvanced('user_message_to_add', v)} placeholder="" required />
                <SmartTextarea label="Assistant response to add" name="assistant_response_to_add" value={advancedForm.assistant_response_to_add} onChange={(v) => updateAdvanced('assistant_response_to_add', v)} placeholder="" required />
                <SmartTextarea label="Alice" name="alice" value={advancedForm.alice} onChange={(v) => updateAdvanced('alice', v)} placeholder="" required />
                <SmartTextarea label="Bob" name="bob" value={advancedForm.bob} onChange={(v) => updateAdvanced('bob', v)} placeholder="" required />
                <SmartTextarea label="Support question" name="support_question" value={advancedForm.support_question} onChange={(v) => updateAdvanced('support_question', v)} placeholder="" required />
                <SmartTextarea label="Sales inquiry" name="sales_inquiry" value={advancedForm.sales_inquiry} onChange={(v) => updateAdvanced('sales_inquiry', v)} placeholder="" required />
                <SmartTextarea label="Select Agent" name="select_agent" value={advancedForm.select_agent} onChange={(v) => updateAdvanced('select_agent', v)} placeholder="" required />
                <SmartTextarea label="Customer message" name="customer_message" value={advancedForm.customer_message} onChange={(v) => updateAdvanced('customer_message', v)} placeholder="" required />
              </FormSection>

              {loading === 'advanced' && <LoadingIndicator message="Processing..." subtext="Running advanced session" />}

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

 export default Agent7SessionsPage;
