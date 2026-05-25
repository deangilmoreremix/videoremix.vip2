import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2 } from "lucide-react";

const AiFinancialCoachAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("main");
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (tabKey: string, data: any) => {
    setLoading(tabKey);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-financial-coach-agent`, {
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
        <title>AiFinancialCoachAgent - VideoRemix.vip</title>
        <meta name="description" content="Use ai-financial-coach-agent to automate tasks with AI." />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Ai Financial Coach Agent</h1>
            <p className="text-xl text-gray-400">AI-powered ai financial coach agent.</p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
            <TabsList className="grid grid-cols-2 mb-8">
              
              <TabsTrigger value="main">Main</TabsTrigger>
                            
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              
            </TabsList>

            
            <TabsContent value="main">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>Main</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit('main', { monthly_income_, number_of_dependants, how_would_you_like_to_enter_your_expenses, choose_your_csv_file, how_many_debts_do_you_have, name, amount_, interest_rate_, minimum_payment_ }); }} className="space-y-6">

                    <div className="space-y-2">
                      <Label htmlFor="monthly_income_">Monthly Income ($)</Label>
                      <Textarea
                        id="monthly_income_"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="number_of_dependants">Number of Dependants</Label>
                      <Textarea
                        id="number_of_dependants"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="how_would_you_like_to_enter_your_expenses">How would you like to enter your expenses?</Label>
                      <Textarea
                        id="how_would_you_like_to_enter_your_expenses"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="choose_your_csv_file">Choose your CSV file</Label>
                      <Textarea
                        id="choose_your_csv_file"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="how_many_debts_do_you_have">How many debts do you have?</Label>
                      <Textarea
                        id="how_many_debts_do_you_have"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Textarea
                        id="name"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount_">Amount ($)</Label>
                      <Textarea
                        id="amount_"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interest_rate_">Interest Rate (%)</Label>
                      <Textarea
                        id="interest_rate_"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minimum_payment_">Minimum Payment ($)</Label>
                      <Textarea
                        id="minimum_payment_"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <Button type="submit" disabled={loading === 'main'}>
                      {loading === 'main' ? 'Processing...' : 'Run'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {results['main'] && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader><CardTitle>Results</CardTitle></CardHeader>
                    <CardContent>
                      <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans">{JSON.stringify(results['main'], null, 2)}</pre>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </TabsContent>
            
            <TabsContent value="advanced">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>Advanced</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit('advanced', { monthly_income_, number_of_dependants, how_would_you_like_to_enter_your_expenses, choose_your_csv_file, how_many_debts_do_you_have, name, amount_, interest_rate_, minimum_payment_ }); }} className="space-y-6">

                    <div className="space-y-2">
                      <Label htmlFor="monthly_income_">Monthly Income ($)</Label>
                      <Textarea
                        id="monthly_income_"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="number_of_dependants">Number of Dependants</Label>
                      <Textarea
                        id="number_of_dependants"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="how_would_you_like_to_enter_your_expenses">How would you like to enter your expenses?</Label>
                      <Textarea
                        id="how_would_you_like_to_enter_your_expenses"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="choose_your_csv_file">Choose your CSV file</Label>
                      <Textarea
                        id="choose_your_csv_file"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="how_many_debts_do_you_have">How many debts do you have?</Label>
                      <Textarea
                        id="how_many_debts_do_you_have"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Textarea
                        id="name"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount_">Amount ($)</Label>
                      <Textarea
                        id="amount_"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interest_rate_">Interest Rate (%)</Label>
                      <Textarea
                        id="interest_rate_"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minimum_payment_">Minimum Payment ($)</Label>
                      <Textarea
                        id="minimum_payment_"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <Button type="submit" disabled={loading === 'advanced'}>
                      {loading === 'advanced' ? 'Processing...' : 'Run'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {results['advanced'] && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader><CardTitle>Results</CardTitle></CardHeader>
                    <CardContent>
                      <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans">{JSON.stringify(results['advanced'], null, 2)}</pre>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </TabsContent>
            
          </Tabs>
        </div>
      </main>
    </>
  );
};

export default AiFinancialCoachAgentPage;
