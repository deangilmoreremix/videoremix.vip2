import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, GitBranch } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { EmptyState } from "@/components/agent-ui/EmptyState";

const Agent93ParallelAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ research_topic: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('parallel-agent-form-data');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('parallel-agent-form-data', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.research_topic.trim()) {
      setError('Please enter a research topic');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutorial-parallel-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem('parallel-agent-form-data');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.research_topic.trim().length > 0;

  return (
    <>
      <Helmet>
        <title>9.3 Parallel Agent - VideoRemix.vip</title>
        <meta name="description" content="Research multiple aspects simultaneously with AI-powered parallel agents." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-600 rounded-3xl mb-6">
              <GitBranch className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">9.3 Parallel Agent</h1>
            <p className="text-xl text-gray-400">AI-powered parallel research across multiple aspects</p>
          </motion.div>

          {error && (
            <Card className="mb-6 border-red-500/50 bg-red-500/10">
              <CardContent className="pt-6">
                <p className="text-red-300">{error}</p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Research Topic</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <SmartInput
                  label="Research topic"
                  name="research_topic"
                  type="text"
                  value={formData.research_topic}
                  onChange={(val) => setFormData({ ...formData, research_topic: val })}
                  placeholder="Enter a topic to research in parallel... e.g., 'Renewable energy trends in 2026'"
                  helperText="The agent will research multiple aspects of this topic simultaneously"
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
                  {loading ? 'Researching in parallel...' : 'Start Parallel Research'}
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-violet-500" />
                <p className="text-gray-400">Researching multiple aspects simultaneously...</p>
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
               icon={<GitBranch className="h-16 w-16 text-gray-600" />}
               title="Ready to research in parallel"
               description="Enter a topic to have multiple AI agents research different aspects simultaneously"
               tips={[
                 "The same topic is researched from multiple angles",
                 "Results are synthesized from parallel searches",
                 "This approach provides comprehensive coverage faster"
             ]}
             />
           )}
        </div>
      </main>
    </>
  );
};

 export default Agent93ParallelAgentPage;