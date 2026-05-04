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

const RagDatabaseRoutingPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("main");
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (tabKey: string, data: any) => {
    setLoading(tabKey);
    try {
      const res = await fetch('/.netlify/functions/rag-database-routing', {
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
        <title>RagDatabaseRouting - VideoRemix.vip</title>
        <meta name="description" content="Use rag-database-routing to automate tasks with AI." />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Rag Database Routing</h1>
            <p className="text-xl text-gray-400">AI-powered rag database routing.</p>
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
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit('main', { enter_openai_api_key, enter_qdrant_url, enter_qdrant_api_key, enter_your_question }); }} className="space-y-6">

                    <div className="space-y-2">
                      <Label htmlFor="enter_openai_api_key">Enter OpenAI API Key:</Label>
                      <Textarea
                        id="enter_openai_api_key"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="enter_qdrant_url">Enter Qdrant URL:</Label>
                      <Textarea
                        id="enter_qdrant_url"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="enter_qdrant_api_key">Enter Qdrant API Key:</Label>
                      <Textarea
                        id="enter_qdrant_api_key"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="enter_your_question">Enter your question:</Label>
                      <Textarea
                        id="enter_your_question"
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
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit('advanced', { enter_openai_api_key, enter_qdrant_url, enter_qdrant_api_key, enter_your_question }); }} className="space-y-6">

                    <div className="space-y-2">
                      <Label htmlFor="enter_openai_api_key">Enter OpenAI API Key:</Label>
                      <Textarea
                        id="enter_openai_api_key"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="enter_qdrant_url">Enter Qdrant URL:</Label>
                      <Textarea
                        id="enter_qdrant_url"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="enter_qdrant_api_key">Enter Qdrant API Key:</Label>
                      <Textarea
                        id="enter_qdrant_api_key"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="enter_your_question">Enter your question:</Label>
                      <Textarea
                        id="enter_your_question"
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

export default RagDatabaseRoutingPage;
