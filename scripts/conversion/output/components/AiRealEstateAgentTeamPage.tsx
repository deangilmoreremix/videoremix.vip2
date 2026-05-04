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

const AiRealEstateAgentTeamPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("main");
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (tabKey: string, data: any) => {
    setLoading(tabKey);
    try {
      const res = await fetch('/.netlify/functions/ai-real-estate-agent-team', {
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
        <title>AiRealEstateAgentTeam - VideoRemix.vip</title>
        <meta name="description" content="Use ai-real-estate-agent-team to automate tasks with AI." />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Ai Real Estate Agent Team</h1>
            <p className="text-xl text-gray-400">AI-powered ai real estate agent team.</p>
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
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit('main', { firecrawl_api_key, _city, _stateprovince_optional, _minimum_price_, _maximum_price_, _property_type, _bedrooms, _bathrooms, _minimum_square_feet, _timeline, _urgency, _special_features__requirements }); }} className="space-y-6">

                    <div className="space-y-2">
                      <Label htmlFor="firecrawl_api_key">Firecrawl API Key</Label>
                      <Textarea
                        id="firecrawl_api_key"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_city">🏙️ City</Label>
                      <Textarea
                        id="_city"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_stateprovince_optional">🗺️ State/Province (optional)</Label>
                      <Textarea
                        id="_stateprovince_optional"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_minimum_price_">💰 Minimum Price ($)</Label>
                      <Textarea
                        id="_minimum_price_"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_maximum_price_">💰 Maximum Price ($)</Label>
                      <Textarea
                        id="_maximum_price_"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_property_type">🏠 Property Type</Label>
                      <Textarea
                        id="_property_type"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_bedrooms">🛏️ Bedrooms</Label>
                      <Textarea
                        id="_bedrooms"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_bathrooms">🚿 Bathrooms</Label>
                      <Textarea
                        id="_bathrooms"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_minimum_square_feet">📏 Minimum Square Feet</Label>
                      <Textarea
                        id="_minimum_square_feet"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_timeline">⏰ Timeline</Label>
                      <Textarea
                        id="_timeline"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_urgency">🚨 Urgency</Label>
                      <Textarea
                        id="_urgency"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_special_features__requirements">🎯 Special Features & Requirements</Label>
                      <Textarea
                        id="_special_features__requirements"
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
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit('advanced', { firecrawl_api_key, _city, _stateprovince_optional, _minimum_price_, _maximum_price_, _property_type, _bedrooms, _bathrooms, _minimum_square_feet, _timeline, _urgency, _special_features__requirements }); }} className="space-y-6">

                    <div className="space-y-2">
                      <Label htmlFor="firecrawl_api_key">Firecrawl API Key</Label>
                      <Textarea
                        id="firecrawl_api_key"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_city">🏙️ City</Label>
                      <Textarea
                        id="_city"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_stateprovince_optional">🗺️ State/Province (optional)</Label>
                      <Textarea
                        id="_stateprovince_optional"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_minimum_price_">💰 Minimum Price ($)</Label>
                      <Textarea
                        id="_minimum_price_"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_maximum_price_">💰 Maximum Price ($)</Label>
                      <Textarea
                        id="_maximum_price_"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_property_type">🏠 Property Type</Label>
                      <Textarea
                        id="_property_type"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_bedrooms">🛏️ Bedrooms</Label>
                      <Textarea
                        id="_bedrooms"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_bathrooms">🚿 Bathrooms</Label>
                      <Textarea
                        id="_bathrooms"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_minimum_square_feet">📏 Minimum Square Feet</Label>
                      <Textarea
                        id="_minimum_square_feet"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_timeline">⏰ Timeline</Label>
                      <Textarea
                        id="_timeline"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_urgency">🚨 Urgency</Label>
                      <Textarea
                        id="_urgency"
                        rows={3}
                        placeholder=""
                        className="bg-gray-900/50 border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="_special_features__requirements">🎯 Special Features & Requirements</Label>
                      <Textarea
                        id="_special_features__requirements"
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

export default AiRealEstateAgentTeamPage;
