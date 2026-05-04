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

const Agent7SessionsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("main");
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        <meta name="description" content="Use 7-sessions to automate tasks with AI." />
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
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>Main</CardTitle></CardHeader>
                <CardContent>
                   <form onSubmit={(e) => { e.preventDefault(); handleSubmit('main', { select_demo_type, session_type, your_message, get_last_n_items, user_message_to_add, assistant_response_to_add, alice, bob, support_question, sales_inquiry, select_agent, customer_message }); }} className="space-y-6">

                    <div className="space-y-2">
                      <Label htmlFor="select_demo_type">Select Demo Type</Label>
                      <Textarea
                        id="select_demo_type"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="session_type">Session Type</Label>
                      <Textarea
                        id="session_type"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="your_message">Your message:</Label>
                      <Textarea
                        id="your_message"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="your_message">Your message:</Label>
                      <Textarea
                        id="your_message"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="your_message">Your message:</Label>
                      <Textarea
                        id="your_message"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="get_last_n_items">Get last N items:</Label>
                      <Textarea
                        id="get_last_n_items"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user_message_to_add">User message to add:</Label>
                      <Textarea
                        id="user_message_to_add"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assistant_response_to_add">Assistant response to add:</Label>
                      <Textarea
                        id="assistant_response_to_add"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alice">Alice</Label>
                      <Textarea
                        id="alice"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bob">Bob</Label>
                      <Textarea
                        id="bob"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="support_question">Support question:</Label>
                      <Textarea
                        id="support_question"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sales_inquiry">Sales inquiry:</Label>
                      <Textarea
                        id="sales_inquiry"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="select_agent">Select Agent:</Label>
                      <Textarea
                        id="select_agent"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer_message">Customer message:</Label>
                      <Textarea
                        id="customer_message"
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
                   <form onSubmit={(e) => { e.preventDefault(); handleSubmit('advanced', { select_demo_type, session_type, your_message, get_last_n_items, user_message_to_add, assistant_response_to_add, alice, bob, support_question, sales_inquiry, select_agent, customer_message }); }} className="space-y-6">

                    <div className="space-y-2">
                      <Label htmlFor="select_demo_type">Select Demo Type</Label>
                      <Textarea
                        id="select_demo_type"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="session_type">Session Type</Label>
                      <Textarea
                        id="session_type"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="your_message">Your message:</Label>
                      <Textarea
                        id="your_message"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="your_message">Your message:</Label>
                      <Textarea
                        id="your_message"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="your_message">Your message:</Label>
                      <Textarea
                        id="your_message"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="get_last_n_items">Get last N items:</Label>
                      <Textarea
                        id="get_last_n_items"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user_message_to_add">User message to add:</Label>
                      <Textarea
                        id="user_message_to_add"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assistant_response_to_add">Assistant response to add:</Label>
                      <Textarea
                        id="assistant_response_to_add"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alice">Alice</Label>
                      <Textarea
                        id="alice"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bob">Bob</Label>
                      <Textarea
                        id="bob"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="support_question">Support question:</Label>
                      <Textarea
                        id="support_question"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sales_inquiry">Sales inquiry:</Label>
                      <Textarea
                        id="sales_inquiry"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="select_agent">Select Agent:</Label>
                      <Textarea
                        id="select_agent"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer_message">Customer message:</Label>
                      <Textarea
                        id="customer_message"
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

 export default Agent7SessionsPage;
