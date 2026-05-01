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

const AiEmailGtmOutreachAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ target_companies_industry_size_region_tech_etc: "", your_productservice_offering_13_sentences: "", your_name: "", your_company: "", calendar_link_optional: "", number_of_companies: "", email_style: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-email-gtm-outreach-agent`, {
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
        <title>AiEmailGtmOutreachAgent - VideoRemix.vip</title>
        <meta name="description" content="Use ai-email-gtm-outreach-agent to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Ai Email Gtm Outreach Agent</h1>
            <p className="text-xl text-gray-400">AI-powered ai email gtm outreach agent.</p>
          </motion.div>

          {error && <Card className="mb-6 border-red-500/50 bg-red-500/10"><CardContent className="pt-6"><p className="text-red-300">{error}</p></CardContent></Card>}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Input</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <Label htmlFor="target_companies_industry_size_region_tech_etc">Target companies (industry, size, region, tech, etc.) *</Label>
                
                <Textarea
                  id="target_companies_industry_size_region_tech_etc"
                  value={formData.target_companies_industry_size_region_tech_etc}
                  onChange={(e) => setFormData({ ...formData, target_companies_industry_size_region_tech_etc: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white min-h-[120px]"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="your_productservice_offering_13_sentences">Your product/service offering (1-3 sentences) *</Label>
                
                <Textarea
                  id="your_productservice_offering_13_sentences"
                  value={formData.your_productservice_offering_13_sentences}
                  onChange={(e) => setFormData({ ...formData, your_productservice_offering_13_sentences: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white min-h-[120px]"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="your_name">Your name *</Label>
                
                <Input
                  id="your_name"
                  type="text"
                  value={formData.your_name}
                  onChange={(e) => setFormData({ ...formData, your_name: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="your_company">Your company *</Label>
                
                <Input
                  id="your_company"
                  type="text"
                  value={formData.your_company}
                  onChange={(e) => setFormData({ ...formData, your_company: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="calendar_link_optional">Calendar link (optional) *</Label>
                
                <Input
                  id="calendar_link_optional"
                  type="text"
                  value={formData.calendar_link_optional}
                  onChange={(e) => setFormData({ ...formData, calendar_link_optional: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="number_of_companies">Number of companies *</Label>
                
                <Input
                  id="number_of_companies"
                  type="number"
                  value={formData.number_of_companies}
                  onChange={(e) => setFormData({ ...formData, number_of_companies: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_style">Email style *</Label>
                
                <select
                  id="email_style"
                  value={formData.email_style}
                  onChange={(e) => setFormData({ ...formData, email_style: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value=""></option>
                </select>
                
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

export default AiEmailGtmOutreachAgentPage;
