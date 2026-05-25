import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { EmptyState } from "@/components/agent-ui/EmptyState";

const Agent92LoopAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ 
    topic: "", 
    target_iterations_early_stop_possible: "5" 
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('loop-agent-form-data');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('loop-agent-form-data', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim()) {
      setError('Please enter a topic to research');
      return;
    }
    const iterations = parseInt(formData.target_iterations_early_stop_possible);
    if (isNaN(iterations) || iterations < 1 || iterations > 20) {
      setError('Target iterations must be between 1 and 20');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutorial-loop-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem('loop-agent-form-data');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.topic.trim().length > 0 && 
    !isNaN(parseInt(formData.target_iterations_early_stop_possible)) &&
    parseInt(formData.target_iterations_early_stop_possible) >= 1;

  return (
    <>
      <Helmet>
        <title>9.2 Loop Agent - VideoRemix.vip</title>
        <meta name="description" content="Iterate on research with AI-powered loop agent." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl mb-6">
              <RefreshCw className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">9.2 Loop Agent</h1>
            <p className="text-xl text-gray-400">AI-powered iterative research with early stopping</p>
          </motion.div>

          {error && (
            <Card className="mb-6 border-red-500/50 bg-red-500/10">
              <CardContent className="pt-6">
                <p className="text-red-300">{error}</p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Research Configuration</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <SmartTextarea
                  label="Topic to research"
                  name="topic"
                  value={formData.topic}
                  onChange={(val) => setFormData({ ...formData, topic: val })}
                  placeholder="Enter a topic to research iteratively... e.g., 'What are the latest developments in quantum computing and their potential impact on cryptography?'"
                  helperText="The loop agent will continuously refine its research on this topic"
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <SmartInput
                  label="Target iterations (early stop possible)"
                  name="target_iterations_early_stop_possible"
                  type="number"
                  value={formData.target_iterations_early_stop_possible}
                  onChange={(val) => setFormData({ ...formData, target_iterations_early_stop_possible: val })}
                  placeholder="5"
                  helperText="Maximum number of iterations (1-20). Agent may stop early if results converge."
                  required
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
                  {loading ? 'Researching...' : 'Start Research'}
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-emerald-500" />
                <p className="text-gray-400">Iterating on research... (early stopping enabled)</p>
              </CardContent>
            </Card>
          )}

           {result && result.status === 'completed' && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
               <Card className="bg-gray-800/50 border-gray-700">
                 <CardHeader><CardTitle>Research Results</CardTitle></CardHeader>
                 <CardContent>
                   <div className="bg-gray-900/50 rounded-lg p-4">
                     <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{result.result}</p>
                   </div>
                 </CardContent>
               </Card>
             </motion.div>
           )}

           {!result && !loading && (
             <EmptyState
               icon={<RefreshCw className="h-16 w-16 text-gray-600" />}
               title="Ready to iterate"
               description="Enter a topic and set iterations to begin AI-powered iterative research"
               tips={[
                 "Start with a broad research question",
                 "Set higher iterations for complex topics",
                 "The agent may stop early if results converge"
             ]}
             />
           )}
        </div>
      </main>
    </>
  );
};

 export default Agent92LoopAgentPage;