import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Mail, Send } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { SelectDropdown } from "@/components/agent-ui/SelectDropdown";

const STORAGE_KEY = 'ai-email-gtm-outreach-agent';

const EMAIL_STYLE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "persuasive", label: "Persuasive" },
];

const AiEmailGtmOutreachAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [targetCompanies, setTargetCompanies] = useState("");
  const [productOffering, setProductOffering] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [calendarLink, setCalendarLink] = useState("");
  const [numberOfCompanies, setNumberOfCompanies] = useState("10");
  const [emailStyle, setEmailStyle] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTargetCompanies(parsed.targetCompanies || "");
        setProductOffering(parsed.productOffering || "");
        setName(parsed.name || "");
        setCompany(parsed.company || "");
        setCalendarLink(parsed.calendarLink || "");
        setNumberOfCompanies(parsed.numberOfCompanies || "10");
        setEmailStyle(parsed.emailStyle || "professional");
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      targetCompanies, productOffering, name, company, calendarLink, numberOfCompanies, emailStyle
    }));
  }, [targetCompanies, productOffering, name, company, calendarLink, numberOfCompanies, emailStyle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCompanies.trim()) {
      setError("Please describe your target companies");
      return;
    }
    if (!productOffering.trim()) {
      setError("Please describe your product or service");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-email-gtm-outreach-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_companies_industry_size_region_tech_etc: targetCompanies,
          your_productservice_offering_13_sentences: productOffering,
          your_name: name,
          your_company: company,
          calendar_link_optional: calendarLink,
          number_of_companies: numberOfCompanies,
          email_style: emailStyle,
          userId: user?.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Email generation failed');
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTargetCompanies("");
    setProductOffering("");
    setName("");
    setCompany("");
    setCalendarLink("");
    setNumberOfCompanies("10");
    setEmailStyle("professional");
    setResult(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-20">
        <LoadingIndicator message="Generating personalised outreach emails..." subtext="Creating custom emails for each target company" />
      </div>
    );
  }

  if (result && result.status === 'completed') {
    return (
      <>
        <Helmet>
          <title>Email Results - AiEmailGtmOutreachAgent</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-coral-600 to-orange-500 rounded-3xl mb-6">
                <Mail className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Emails Generated</h1>
              <p className="text-xl text-gray-400">Your personalised outreach emails are ready</p>
            </motion.div>

            <ResultGrid columns={3}>
              <ResultCard
                icon={<Mail />}
                title="Emails Created"
                value={result.emails?.length || result.count || numberOfCompanies}
                variant="success"
              />
              <ResultCard
                icon={<Send />}
                title="Style"
                value={emailStyle}
                variant="info"
              />
              <ResultCard
                icon={<Mail />}
                title="Status"
                value="Ready to Send"
                variant="success"
              />
            </ResultGrid>

            <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Generated Emails</h3>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{result.result || result.emails?.map((e: any) => e.body).join('\n\n---\n\n')}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                Generate More Emails
              </ActionButton>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>AiEmailGtmOutreachAgent - VideoRemix.vip</title>
        <meta name="description" content="Generate personalised cold outreach emails for B2B GTM campaigns using AI." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-600 to-coral-500 rounded-3xl mb-6">
              <Mail className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Ai Email Gtm Outreach Agent</h1>
            <p className="text-xl text-gray-400">Generate personalised B2B outreach emails</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Campaign Configuration</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <SmartTextarea
                  label="Target Companies"
                  name="targetCompanies"
                  value={targetCompanies}
                  onChange={setTargetCompanies}
                  placeholder="Describe your ideal customer profile: industry, company size, region, tech stack, etc. e.g., 'SaaS companies in fintech, 50-200 employees, US-based, using Stripe'"
                  helperText="Be specific about industry, size, location, and any other qualifying criteria"
                  required
                  rows={4}
                />

                <SmartTextarea
                  label="Your Product/Service"
                  name="productOffering"
                  value={productOffering}
                  onChange={setProductOffering}
                  placeholder="Describe what you're offering in 1-3 sentences. e.g., 'AI-powered contract analysis tool that reduces legal review time by 80% and costs 60% less than traditional methods'"
                  helperText="Focus on value proposition and key benefits. What problem do you solve?"
                  required
                  rows={3}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SmartInput
                    label="Your Name"
                    name="name"
                    value={name}
                    onChange={setName}
                    placeholder="John Smith"
                    helperText="The sender's name for personalised emails"
                    required
                  />
                  <SmartInput
                    label="Your Company"
                    name="company"
                    value={company}
                    onChange={setCompany}
                    placeholder="Acme Corp"
                    helperText="Your company name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SmartInput
                    label="Number of Companies"
                    name="numberOfCompanies"
                    value={numberOfCompanies}
                    onChange={setNumberOfCompanies}
                    type="number"
                    placeholder="10"
                    helperText="How many personalised emails to generate"
                  />
                  <SelectDropdown
                    label="Email Style"
                    value={emailStyle}
                    onValueChange={setEmailStyle}
                    options={EMAIL_STYLE_OPTIONS}
                    helperText="Tone and language style for the emails"
                  />
                </div>

                <SmartInput
                  label="Calendar Link (Optional)"
                  name="calendarLink"
                  value={calendarLink}
                  onChange={setCalendarLink}
                  placeholder="https://calendly.com/your-name/30min"
                  helperText="Optional meeting booking link to include in emails"
                />

                {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

                <div className="flex gap-3">
                  <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={!targetCompanies.trim() || !productOffering.trim()}>
                    <Send className="h-4 w-4" />
                    Generate Emails
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          <EmptyState
            icon={<Mail className="h-16 w-16 text-gray-600" />}
            title="No emails generated yet"
            description="Configure your campaign and let AI generate personalised outreach emails"
            tips={[
              "Be specific about your target ICP for better results",
              "Focus on value proposition, not features",
              "Include any relevant social proof",
              "Consider mentioning a specific pain point"
            ]}
          />
        </div>
      </main>
    </>
  );
};

export default AiEmailGtmOutreachAgentPage;