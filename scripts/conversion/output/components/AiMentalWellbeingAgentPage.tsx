import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles } from "lucide-react";

const AiMentalWellbeingAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ how_have_you_been_feeling_recently: "", current_stress_level_110: "", current_support_system: "", any_significant_life_changes_or_events_recently: "", current_symptoms: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/.netlify/functions/ai-mental-wellbeing-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>AiMentalWellbeingAgent - VideoRemix.vip</title>
        <meta name="description" content="Use ai-mental-wellbeing-agent to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Ai Mental Wellbeing Agent</h1>
            <p className="text-xl text-gray-400">AI-powered ai mental wellbeing agent.</p>
          </motion.div>

          {error && <Card className="mb-6 border-red-500/50 bg-red-500/10"><CardContent className="pt-6"><p className="text-red-300">{error}</p></CardContent></Card>}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Input</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <Label htmlFor="how_have_you_been_feeling_recently">How have you been feeling recently? *</Label>
                
                <Textarea
                  id="how_have_you_been_feeling_recently"
                  value={formData.how_have_you_been_feeling_recently}
                  onChange={(e) => setFormData({ ...formData, how_have_you_been_feeling_recently: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white min-h-[120px]"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_stress_level_110">Current Stress Level (1-10) *</Label>
                
                <Input
                  id="current_stress_level_110"
                  type="range"
                  value={formData.current_stress_level_110}
                  onChange={(e) => setFormData({ ...formData, current_stress_level_110: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_support_system">Current Support System *</Label>
                
                <Input
                  id="current_support_system"
                  type="multiselect"
                  value={formData.current_support_system}
                  onChange={(e) => setFormData({ ...formData, current_support_system: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="any_significant_life_changes_or_events_recently">Any significant life changes or events recently? *</Label>
                
                <Textarea
                  id="any_significant_life_changes_or_events_recently"
                  value={formData.any_significant_life_changes_or_events_recently}
                  onChange={(e) => setFormData({ ...formData, any_significant_life_changes_or_events_recently: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white min-h-[120px]"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_symptoms">Current Symptoms *</Label>
                
                <Input
                  id="current_symptoms"
                  type="multiselect"
                  value={formData.current_symptoms}
                  onChange={(e) => setFormData({ ...formData, current_symptoms: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Processing...' : 'Generate Results'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-gray-400">Processing...</p>
              </CardContent>
            </Card>
          )}

           {result && result.status === 'completed' && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
               <Card className="bg-gray-800/50 border-gray-700">
                 <CardHeader><CardTitle>Results</CardTitle></CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     
                     <div className="space-y-2">
                       <Label>Transcript</Label>
                       <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans">{result.result}</pre>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </motion.div>
           )}
        </div>
      </main>
    </>
  );
};

export default AiMentalWellbeingAgentPage;
