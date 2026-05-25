import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Mail, Send } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";

const STORAGE_KEY = 'ai-email-gtm-reachout-agent';

const AiEmailGtmReachoutAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("main");
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    companyType: "",
    companySize: "",
    numCompanies: "",
    name: "",
    email: "",
    organization: "",
    linkedin: "",
    phone: "",
    website: "",
    calendar: "",
    offering: "",
    category: "",
    departments: "",
    emailContent: "",
    contactInfo: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(activeTab);
    setErrors(prev => ({ ...prev, [activeTab]: "" }));
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-email-gtm-reachout-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, mode: activeTab, userId: user?.id })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed');
      setResults(prev => ({ ...prev, [activeTab]: result }));
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [activeTab]: err.message }));
    } finally {
      setLoading(null);
    }
  };

  const handleReset = () => {
    setFormData({
      companyType: "",
      companySize: "",
      numCompanies: "",
      name: "",
      email: "",
      organization: "",
      linkedin: "",
      phone: "",
      website: "",
      calendar: "",
      offering: "",
      category: "",
      departments: "",
      emailContent: "",
      contactInfo: "",
    });
    setResults({});
    setErrors({});
  };

  const renderForm = (tabKey: string) => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SmartTextarea
        label="Company Type"
        name="companyType"
        value={formData.companyType}
        onChange={(v) => updateField("companyType", v)}
        placeholder="e.g., Fintech startups, Healthcare providers, E-commerce brands"
        helperText="Describe the type of companies to target"
        rows={3}
      />

      <SmartTextarea
        label="Company Size"
        name="companySize"
        value={formData.companySize}
        onChange={(v) => updateField("companySize", v)}
        placeholder="e.g., 50-200 employees, Series A-C, $1M-$10M ARR"
        helperText="Specify size, funding stage, or revenue range"
        rows={2}
      />

      <SmartTextarea
        label="Number of Companies"
        name="numCompanies"
        value={formData.numCompanies}
        onChange={(v) => updateField("numCompanies", v)}
        placeholder="e.g., Find 20 companies matching my criteria"
        helperText="How many companies to research and email"
        rows={2}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SmartInput
          label="Your Name *"
          name="name"
          value={formData.name}
          onChange={(v) => updateField("name", v)}
          placeholder="Jane Doe"
          required
        />
        <SmartInput
          label="Your Email *"
          name="email"
          value={formData.email}
          onChange={(v) => updateField("email", v)}
          type="email"
          placeholder="jane@company.com"
          required
        />
      </div>

      <SmartInput
        label="Your Organisation *"
        name="organization"
        value={formData.organization}
        onChange={(v) => updateField("organization", v)}
        placeholder="Acme Inc"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SmartInput
          label="LinkedIn Profile (Optional)"
          name="linkedin"
          value={formData.linkedin}
          onChange={(v) => updateField("linkedin", v)}
          placeholder="https://linkedin.com/in/janedoe"
          helperText="For personalised outreach"
        />
        <SmartInput
          label="Phone (Optional)"
          name="phone"
          value={formData.phone}
          onChange={(v) => updateField("phone", v)}
          placeholder="+1 555-123-4567"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SmartInput
          label="Company Website (Optional)"
          name="website"
          value={formData.website}
          onChange={(v) => updateField("website", v)}
          placeholder="https://targetcompany.com"
        />
        <SmartInput
          label="Calendar Link (Optional)"
          name="calendar"
          value={formData.calendar}
          onChange={(v) => updateField("calendar", v)}
          placeholder="https://calendly.com/jane/30min"
        />
      </div>

      <SmartTextarea
        label="Your Offering *"
        name="offering"
        value={formData.offering}
        onChange={(v) => updateField("offering", v)}
        placeholder="Describe what you're offering and the key benefits..."
        helperText="Focus on value proposition. What problem do you solve?"
        required
        rows={3}
      />

      <SmartInput
        label="Service/Product Category"
        name="category"
        value={formData.category}
        onChange={(v) => updateField("category", v)}
        placeholder="e.g., AI Software, Marketing Services, CRM Tool"
      />

      <SmartTextarea
        label="Target Departments"
        name="departments"
        value={formData.departments}
        onChange={(v) => updateField("departments", v)}
        placeholder="e.g., VP of Engineering, CTO, Head of Marketing"
        helperText="Which roles should receive these emails?"
        rows={2}
      />

      <SmartTextarea
        label="Email Content"
        name="emailContent"
        value={formData.emailContent}
        onChange={(v) => updateField("emailContent", v)}
        placeholder="Any specific content, talking points, or requirements for the emails..."
        helperText="Optional specific instructions for email content"
        rows={3}
      />

      <SmartTextarea
        label="Contact Information"
        name="contactInfo"
        value={formData.contactInfo}
        onChange={(v) => updateField("contactInfo", v)}
        placeholder="Additional contact details to include..."
        rows={2}
      />

      {errors[tabKey] && <ErrorMessage message={errors[tabKey]} onRetry={handleSubmit} retryLoading={loading === tabKey} />}

      <div className="flex gap-3">
        <ActionButton type="submit" loading={loading === tabKey} size="lg" className="flex-1">
          <Send className="h-4 w-4" />
          Run {tabKey === 'main' ? 'Main' : 'Advanced'} Mode
        </ActionButton>
        <ActionButton variant="ghost" onClick={handleReset}>
          Clear
        </ActionButton>
      </div>
    </form>
  );

  return (
    <>
      <Helmet>
        <title>AiEmailGtmReachoutAgent - VideoRemix.vip</title>
        <meta name="description" content="Find target companies and generate personalised GTM outreach emails with AI." />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-500 rounded-3xl mb-6">
              <Mail className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Ai Email Gtm Reachout Agent</h1>
            <p className="text-xl text-gray-400">Find companies and generate personalised outreach</p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="main">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>Main Configuration</CardTitle></CardHeader>
                <CardContent>
                  {renderForm("main")}
                </CardContent>
              </Card>

              {results['main'] && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader><CardTitle>Results</CardTitle></CardHeader>
                    <CardContent>
                      <ResultGrid columns={2}>
                        <ResultCard
                          icon={<Send />}
                          title="Emails Generated"
                          value={results['main'].emails?.length || results['main'].count || "—"}
                          variant="success"
                        />
                        <ResultCard
                          icon={<Mail />}
                          title="Companies Found"
                          value={results['main'].companies?.length || "—"}
                          variant="info"
                        />
                      </ResultGrid>
                      {results['main'].result && (
                        <div className="mt-4 bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                          <pre className="whitespace-pre-wrap text-sm text-gray-300">{typeof results['main'].result === 'string' ? results['main'].result : JSON.stringify(results['main'], null, 2)}</pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="advanced">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>Advanced Configuration</CardTitle></CardHeader>
                <CardContent>
                  {renderForm("advanced")}
                </CardContent>
              </Card>

              {results['advanced'] && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader><CardTitle>Results</CardTitle></CardHeader>
                    <CardContent>
                      <ResultGrid columns={2}>
                        <ResultCard
                          icon={<Send />}
                          title="Emails Generated"
                          value={results['advanced'].emails?.length || results['advanced'].count || "—"}
                          variant="success"
                        />
                        <ResultCard
                          icon={<Mail />}
                          title="Companies Found"
                          value={results['advanced'].companies?.length || "—"}
                          variant="info"
                        />
                      </ResultGrid>
                      {results['advanced'].result && (
                        <div className="mt-4 bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                          <pre className="whitespace-pre-wrap text-sm text-gray-300">{typeof results['advanced'].result === 'string' ? results['advanced'].result : JSON.stringify(results['advanced'], null, 2)}</pre>
                        </div>
                      )}
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

export default AiEmailGtmReachoutAgentPage;