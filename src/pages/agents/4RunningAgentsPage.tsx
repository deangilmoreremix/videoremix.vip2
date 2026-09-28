import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { FormSection } from "@/components/agent-ui/FormSection";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";

const Agent4RunningAgentsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("main");
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mainForm, setMainForm] = useState({
    select_demo_type: "", model: "", temperature: "", max_turns: "", your_message: "", top_p: "", workflow_name: "", group_id: "", user_id: "", feature: "", max_turns_set_low_to_trigger: ""
  });
  const [advancedForm, setAdvancedForm] = useState({
    select_demo_type: "", model: "", temperature: "", max_turns: "", your_message: "", top_p: "", workflow_name: "", group_id: "", user_id: "", feature: "", max_turns_set_low_to_trigger: ""
  });

  const updateMain = (field: string, value: string) => setMainForm(prev => ({ ...prev, [field]: value }));
  const updateAdvanced = (field: string, value: string) => setAdvancedForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (tabKey: string, data: any) => {
    setLoading(tabKey);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutorial-running-agents`, {
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
        <title>4RunningAgents - VideoRemix.vip</title>
        <meta name="description" content="Use ai-video-script-producer to automate tasks with AI." />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">4 Running Agents</h1>
            <p className="text-xl text-gray-400">AI-powered 4 running agents.</p>
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
                <SmartTextarea label="Model" name="model" value={mainForm.model} onChange={(v) => updateMain('model', v)} placeholder="" required />
                <SmartTextarea label="Temperature" name="temperature" value={mainForm.temperature} onChange={(v) => updateMain('temperature', v)} placeholder="" required />
                <SmartTextarea label="Max Turns" name="max_turns" value={mainForm.max_turns} onChange={(v) => updateMain('max_turns', v)} placeholder="" required />
                <SmartTextarea label="Your Message" name="your_message" value={mainForm.your_message} onChange={(v) => updateMain('your_message', v)} placeholder="" required />
                <SmartTextarea label="Top P" name="top_p" value={mainForm.top_p} onChange={(v) => updateMain('top_p', v)} placeholder="" required />
                <SmartTextarea label="Workflow Name" name="workflow_name" value={mainForm.workflow_name} onChange={(v) => updateMain('workflow_name', v)} placeholder="" required />
                <SmartTextarea label="Group ID" name="group_id" value={mainForm.group_id} onChange={(v) => updateMain('group_id', v)} placeholder="" required />
                <SmartTextarea label="User ID" name="user_id" value={mainForm.user_id} onChange={(v) => updateMain('user_id', v)} placeholder="" required />
                <SmartTextarea label="Feature" name="feature" value={mainForm.feature} onChange={(v) => updateMain('feature', v)} placeholder="" required />
                <SmartTextarea label="Max Turns (set low to trigger)" name="max_turns_set_low_to_trigger" value={mainForm.max_turns_set_low_to_trigger} onChange={(v) => updateMain('max_turns_set_low_to_trigger', v)} placeholder="" required />
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
              <FormSection title="Advanced Configuration" description="Configure advanced settings">
                <SmartTextarea label="Select Demo Type" name="select_demo_type" value={advancedForm.select_demo_type} onChange={(v) => updateAdvanced('select_demo_type', v)} placeholder="" required />
                <SmartTextarea label="Model" name="model" value={advancedForm.model} onChange={(v) => updateAdvanced('model', v)} placeholder="" required />
                <SmartTextarea label="Temperature" name="temperature" value={advancedForm.temperature} onChange={(v) => updateAdvanced('temperature', v)} placeholder="" required />
                <SmartTextarea label="Max Turns" name="max_turns" value={advancedForm.max_turns} onChange={(v) => updateAdvanced('max_turns', v)} placeholder="" required />
                <SmartTextarea label="Your Message" name="your_message" value={advancedForm.your_message} onChange={(v) => updateAdvanced('your_message', v)} placeholder="" required />
                <SmartTextarea label="Top P" name="top_p" value={advancedForm.top_p} onChange={(v) => updateAdvanced('top_p', v)} placeholder="" required />
                <SmartTextarea label="Workflow Name" name="workflow_name" value={advancedForm.workflow_name} onChange={(v) => updateAdvanced('workflow_name', v)} placeholder="" required />
                <SmartTextarea label="Group ID" name="group_id" value={advancedForm.group_id} onChange={(v) => updateAdvanced('group_id', v)} placeholder="" required />
                <SmartTextarea label="User ID" name="user_id" value={advancedForm.user_id} onChange={(v) => updateAdvanced('user_id', v)} placeholder="" required />
                <SmartTextarea label="Feature" name="feature" value={advancedForm.feature} onChange={(v) => updateAdvanced('feature', v)} placeholder="" required />
                <SmartTextarea label="Max Turns (set low to trigger)" name="max_turns_set_low_to_trigger" value={advancedForm.max_turns_set_low_to_trigger} onChange={(v) => updateAdvanced('max_turns_set_low_to_trigger', v)} placeholder="" required />
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

 export default Agent4RunningAgentsPage;
