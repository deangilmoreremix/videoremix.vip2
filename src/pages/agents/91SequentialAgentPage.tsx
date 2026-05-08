import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, Briefcase } from "lucide-react";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { EmptyState } from "@/components/agent-ui/EmptyState";

const Agent91SequentialAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ enter_a_business_opportunity_to_analyze: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sequential-agent-form-data');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sequential-agent-form-data', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.enter_a_business_opportunity_to_analyze.trim()) {
      setError('Please enter a business opportunity to analyze');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutorial-sequential-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      localStorage.removeItem('sequential-agent-form-data');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.enter_a_business_opportunity_to_analyze.trim().length > 0;

  return (
    <>
      <Helmet>
        <title>9.1 Sequential Agent - VideoRemix.vip</title>
        <meta name="description" content="Analyze business opportunities with AI-powered sequential reasoning." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl mb-6">
              <Briefcase className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">9.1 Sequential Agent</h1>
            <p className="text-xl text-gray-400">AI-powered sequential analysis for business opportunities</p>
          </motion.div>

          {error && (
            <Card className="mb-6 border-red-500/50 bg-red-500/10">
              <CardContent className="pt-6">
                <p className="text-red-300">{error}</p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Business Opportunity</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <SmartTextarea
                  label="Enter a business opportunity to analyze"
                  name="enter_a_business_opportunity_to_analyze"
                  value={formData.enter_a_business_opportunity_to_analyze}
                  onChange={(val) => setFormData({ ...formData, enter_a_business_opportunity_to_analyze: val })}
                  placeholder="Describe a potential business opportunity... e.g., 'A new mobile app that helps small businesses manage their social media presence with AI-generated content suggestions, scheduling, and analytics tracking'"
                  helperText="Be specific about the market, target audience, and value proposition for best analysis results"
                  rows={5}
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
                  {loading ? 'Analyzing...' : 'Analyze Opportunity'}
                </ActionButton>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                <p className="text-gray-400">Analyzing business opportunity step by step...</p>
              </CardContent>
            </Card>
          )}

           {result && result.status === 'completed' && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
               <Card className="bg-gray-800/50 border-gray-700">
                 <CardHeader><CardTitle>Analysis Results</CardTitle></CardHeader>
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
               icon={<Briefcase className="h-16 w-16 text-gray-600" />}
               title="Ready to analyze"
               description="Enter a business opportunity to receive a detailed AI-powered sequential analysis"
               tips={[
                 "Describe a specific business idea or opportunity",
                 "Include information about the target market",
                 "Mention any competitors or unique advantages"
             ]}
             />
           )}
        </div>
      </main>
    </>
  );
};

 export default Agent91SequentialAgentPage;