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

const AiLifeInsuranceAdvisorAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ openai_api_key: "", firecrawl_api_key: "", e2b_api_key: "", age: "", annual_income: "", dependents: "", country__state: "", total_outstanding_debt_incl_mortgage: "", savings__investments_available_to_dependents: "", existing_life_insurance: "", currency: "", income_replacement_horizon: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/.netlify/functions/ai-life-insurance-advisor-agent', {
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
        <title>AiLifeInsuranceAdvisorAgent - VideoRemix.vip</title>
        <meta name="description" content="Use ai-life-insurance-advisor-agent to automate tasks with AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Ai Life Insurance Advisor Agent</h1>
            <p className="text-xl text-gray-400">AI-powered ai life insurance advisor agent.</p>
          </motion.div>

          {error && <Card className="mb-6 border-red-500/50 bg-red-500/10"><CardContent className="pt-6"><p className="text-red-300">{error}</p></CardContent></Card>}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Input</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <Label htmlFor="openai_api_key">OpenAI API Key *</Label>
                
                <Input
                  id="openai_api_key"
                  type="text"
                  value={formData.openai_api_key}
                  onChange={(e) => setFormData({ ...formData, openai_api_key: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="firecrawl_api_key">Firecrawl API Key *</Label>
                
                <Input
                  id="firecrawl_api_key"
                  type="text"
                  value={formData.firecrawl_api_key}
                  onChange={(e) => setFormData({ ...formData, firecrawl_api_key: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="e2b_api_key">E2B API Key *</Label>
                
                <Input
                  id="e2b_api_key"
                  type="text"
                  value={formData.e2b_api_key}
                  onChange={(e) => setFormData({ ...formData, e2b_api_key: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="annual_income">Annual Income *</Label>
                
                <Input
                  id="annual_income"
                  type="number"
                  value={formData.annual_income}
                  onChange={(e) => setFormData({ ...formData, annual_income: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="dependents">Dependents *</Label>
                
                <Input
                  id="dependents"
                  type="number"
                  value={formData.dependents}
                  onChange={(e) => setFormData({ ...formData, dependents: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="country__state">Country / State *</Label>
                
                <Input
                  id="country__state"
                  type="text"
                  value={formData.country__state}
                  onChange={(e) => setFormData({ ...formData, country__state: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_outstanding_debt_incl_mortgage">Total Outstanding Debt (incl. mortgage) *</Label>
                
                <Input
                  id="total_outstanding_debt_incl_mortgage"
                  type="number"
                  value={formData.total_outstanding_debt_incl_mortgage}
                  onChange={(e) => setFormData({ ...formData, total_outstanding_debt_incl_mortgage: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="savings__investments_available_to_dependents">Savings & Investments available to dependents *</Label>
                
                <Input
                  id="savings__investments_available_to_dependents"
                  type="number"
                  value={formData.savings__investments_available_to_dependents}
                  onChange={(e) => setFormData({ ...formData, savings__investments_available_to_dependents: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="existing_life_insurance">Existing Life Insurance *</Label>
                
                <Input
                  id="existing_life_insurance"
                  type="number"
                  value={formData.existing_life_insurance}
                  onChange={(e) => setFormData({ ...formData, existing_life_insurance: e.target.value })}
                  placeholder=""
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value=""></option>
                </select>
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="income_replacement_horizon">Income Replacement Horizon *</Label>
                
                <select
                  id="income_replacement_horizon"
                  value={formData.income_replacement_horizon}
                  onChange={(e) => setFormData({ ...formData, income_replacement_horizon: e.target.value })}
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

export default AiLifeInsuranceAdvisorAgentPage;
