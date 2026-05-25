import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, Zap } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultGrid } from "@/components/agent-ui/ResultCard";

const Agent7PluginsPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ 
    choose_a_test_scenario: "", 
    or_enter_your_own_message: "" 
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('7plugins-form-data');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('7plugins-form-data', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.choose_a_test_scenario && !formData.or_enter_your_own_message) {
      setError('Please select a test scenario or enter a custom message');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutorial-plugins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem('7plugins-form-data');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testScenarios = [
    { value: "code_review", label: "Code Review - Analyze a code snippet for bugs and improvements" },
    { value: "email_response", label: "Email Response - Generate a professional reply to a customer email" },
    { value: "data_analysis", label: "Data Analysis - Analyze a dataset and extract key insights" },
    { value: "content_summary", label: "Content Summary - Summarize a long article or document" },
    { value: "meeting_notes", label: "Meeting Notes - Convert meeting transcript into actionable items" },
  ];

  const isFormValid = formData.choose_a_test_scenario || formData.or_enter_your_own_message.trim();

  return (
    <>
      <Helmet>
        <title>7Plugins - VideoRemix.vip</title>
        <meta name="description" content="Use 7-plugins to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl mb-6">
              <Zap className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">7 Plugins</h1>
            <p className="text-xl text-gray-400">AI-powered task automation with 7 specialized plugins</p>
          </motion.div>

          {error && (
            <Card className="mb-6 border-red-500/50 bg-red-500/10">
              <CardContent className="pt-6">
                <p className="text-red-300">{error}</p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Configure Your Task</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <label htmlFor="choose_a_test_scenario" className="text-sm font-medium text-gray-200">
                  Choose a test scenario
                </label>
                <select
                  id="choose_a_test_scenario"
                  value={formData.choose_a_test_scenario}
                  onChange={(e) => setFormData({ ...formData, choose_a_test_scenario: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="">Select a scenario...</option>
                  {testScenarios.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Choose a predefined scenario or provide your own custom input below
                </p>
              </div>

              <div className="space-y-2">
                <SmartTextarea
                  label="Or enter your own message"
                  name="or_enter_your_own_message"
                  value={formData.or_enter_your_own_message}
                  onChange={(val) => setFormData({ ...formData, or_enter_your_own_message: val })}
                  placeholder="Describe your task... e.g., 'Help me draft a response to a customer complaint about delayed shipping'"
                  helperText="Provide specific details about what you want the AI to help you with"
                  rows={4}
                  required={false}
                />
              </div>

                <ActionButton 
                  type="submit" 
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={!isFormValid}
                  className="w-full"
                  size="lg"
                >
                  <Sparkles className="h-4 w-4" />
                  {loading ? 'Processing...' : 'Generate Results'}
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-amber-500" />
                <p className="text-gray-400">Processing with AI plugins...</p>
              </CardContent>
            </Card>
          )}

           {result && result.status === 'completed' && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
               <Card className="bg-gray-800/50 border-gray-700">
                 <CardHeader><CardTitle>Results</CardTitle></CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     <div className="bg-gray-900/50 rounded-lg p-4">
                       <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{result.result}</p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </motion.div>
           )}

           {!result && !loading && (
             <EmptyState
               icon={<Zap className="h-16 w-16 text-gray-600" />}
               title="Ready to automate"
               description="Select a test scenario or enter your own task to get AI-powered assistance"
               tips={[
                 "Start by selecting a scenario from the dropdown",
                 "Or describe your own task in the text area",
                 "The AI will process your input using multiple plugins"
             ]}
             />
           )}
        </div>
      </main>
    </>
  );
};

 export default Agent7PluginsPage;