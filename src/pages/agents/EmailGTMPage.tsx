import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  Mail,
  Search,
  Users,
  Target,
  FileText,
  Loader2,
  Copy,
  CheckCircle,
  Sparkles,
  Building2,
  Calendar,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ExamplePrompt } from "@/components/agent-ui/ExamplePrompt";

interface Lead {
  name: string;
  website: string;
  contactName: string;
  position: string;
  department?: string;
  email?: string;
  linkedin?: string;
}

interface EmailResult {
  lead: Lead;
  department: string;
  campaignType: string;
  email: string;
  research: {
    companyDescription: string;
    recentNews: string[];
    decisionMakerBackground: string;
    gtmStrategy?: string;
    specificAchievement?: string;
  };
  timestamp: string;
}

const STORAGE_KEY = "email-gtm-form-data";

const EmailGTMPage: React.FC = () => {
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [contactName, setContactName] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("GTM (Sales & Marketing)");
  const [campaignType, setCampaignType] = useState("Software Solution");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<EmailResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const departments = [
    "GTM (Sales & Marketing)",
    "Human Resources",
    "Marketing Professional",
    "Product",
    "Engineering",
    "Finance",
    "Executive"
  ];

  const campaignTypes = {
    "GTM (Sales & Marketing)": ["Software Solution", "Consulting Services", "Partnership Opportunity"],
    "Human Resources": ["HR Tech Solution", "Consulting Services", "Investment Opportunity"],
    "Marketing Professional": ["Product Demo", "Service Offering", "Collaboration"],
    "Product": ["Tool Integration", "Platform Partnership", "Co-development"],
    "Engineering": ["DevTools", "Infrastructure", "Consulting"],
    "Finance": ["FinTech Solution", "Analytics Platform", "Consulting"],
    "Executive": ["Strategic Partnership", "Investment", "Business Development"]
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.companyName) setCompanyName(parsed.companyName);
        if (parsed.websiteUrl) setWebsiteUrl(parsed.websiteUrl);
        if (parsed.contactName) setContactName(parsed.contactName);
        if (parsed.position) setPosition(parsed.position);
        if (parsed.department) setDepartment(parsed.department);
        if (parsed.campaignType) setCampaignType(parsed.campaignType);
      } catch (e) {
        console.warn("Failed to parse saved form data");
      }
    }
  }, []);

  useEffect(() => {
    const formData = { companyName, websiteUrl, contactName, position, department, campaignType };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [companyName, websiteUrl, contactName, position, department, campaignType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !websiteUrl.trim() || !contactName.trim() || !position.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-gtm-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          websiteUrl: websiteUrl.trim(),
          contactName: contactName.trim(),
          position: position.trim(),
          department,
          campaignType,
          userId: user?.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate email');
      }

      setResult(data);
      localStorage.removeItem(STORAGE_KEY);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Email GTM agent error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fillDemoData = () => {
    setCompanyName("Notion");
    setWebsiteUrl("https://www.notion.so");
    setContactName("Ivan Zhao");
    setPosition("CEO");
    setDepartment("GTM (Sales & Marketing)");
    setCampaignType("Software Solution");
  };

  const contactNameExamples = ["Ivan Zhao", "John Smith", "Sarah Chen", "Michael Johnson"];
  const positionExamples = ["CEO", "VP of Sales", "Head of Marketing", "Chief Revenue Officer"];

  return (
    <>
      <Helmet>
        <title>AI Email GTM Reachout - Sales Prospecting Automation | VideoRemix.vip</title>
        <meta
          name="description"
          content="Generate personalized sales emails with AI research. Automate GTM outreach with company intelligence, decision-maker research, and dynamic email templates."
        />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-500 rounded-2xl mb-6 shadow-lg shadow-blue-500/20">
              <Mail className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              AI Email GTM Reachout
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Research companies, discover decision-makers, and generate personalized sales emails in seconds.
              Let AI handle the prospecting so you can focus on closing deals.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-400" />
                    Target Configuration
                  </h2>
                  <button
                    type="button"
                    onClick={fillDemoData}
                    className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Fill Demo Data
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SmartInput
                      label="Company Name"
                      name="companyName"
                      value={companyName}
                      onChange={setCompanyName}
                      placeholder="Enter company name (e.g., Notion, Salesforce, HubSpot, Shopify)"
                      helperText="The official registered name of the company you're targeting"
                      required
                    />

                    <SmartInput
                      label="Website URL"
                      name="websiteUrl"
                      type="url"
                      value={websiteUrl}
                      onChange={setWebsiteUrl}
                      placeholder="https://www.company.com"
                      helperText="Full URL including https:// for the company's main website"
                      required
                    />

                    <div className="space-y-2">
                      <SmartInput
                        label="Contact Name"
                        name="contactName"
                        value={contactName}
                        onChange={setContactName}
                        placeholder="Enter the decision-maker's full name"
                        helperText="Full name of the person you want to reach (first and last name)"
                        required
                      />
                      <ExamplePrompt
                        examples={contactNameExamples}
                        onSelect={setContactName}
                        title="Try an example contact:"
                      />
                    </div>

                    <div className="space-y-2">
                      <SmartInput
                        label="Position/Title"
                        name="position"
                        value={position}
                        onChange={setPosition}
                        placeholder="Enter job title (e.g., VP of Sales, CMO, Head of Growth)"
                        helperText="Their official job title or role at the company"
                        required
                      />
                      <ExamplePrompt
                        examples={positionExamples}
                        onSelect={setPosition}
                        title="Try an example position:"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-200">
                        Department
                      </label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      >
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-cyan-500" />
                        Select the department most relevant to your offering
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-200">
                        Campaign Type
                      </label>
                      <select
                        value={campaignType}
                        onChange={(e) => setCampaignType(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      >
                        {campaignTypes[department as keyof typeof campaignTypes]?.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-cyan-500" />
                        Determines the tone and approach of the email
                      </p>
                    </div>
                  </div>

                  <ActionButton
                    type="submit"
                    variant="primary"
                    loading={isProcessing}
                    loadingText="Researching & Generating..."
                    disabled={!companyName.trim() || !websiteUrl.trim() || !contactName.trim() || !position.trim()}
                    className="w-full"
                  >
                    <Sparkles className="h-5 w-5" />
                    Generate Personalized Email
                  </ActionButton>
                </form>
              </motion.div>

              {error && (
                <ErrorMessage
                  title="Failed to generate email"
                  message={error}
                  onRetry={handleSubmit}
                />
              )}

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Mail className="h-5 w-5 text-green-400" />
                      Generated Email
                    </h2>
                    <button
                      onClick={() => copyToClipboard(result.email)}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                      {copied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  <ResultGrid columns={2} className="mb-4">
                    <ResultCard
                      icon={<Building2 className="h-5 w-5" />}
                      title="Company"
                      value={result.lead.companyName || companyName}
                      subtext={result.department}
                      variant="default"
                    />
                    <ResultCard
                      icon={<Users className="h-5 w-5" />}
                      title="Contact"
                      value={result.lead.contactName || contactName}
                      subtext={result.lead.position || position}
                      variant="default"
                    />
                  </ResultGrid>

                  <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4 mb-4">
                    <h3 className="text-sm font-semibold text-blue-300 mb-3 flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Research Summary
                    </h3>
                    <div className="space-y-3 text-sm text-gray-200">
                      {result.research.companyDescription && (
                        <p><span className="text-gray-400">Company:</span> {result.research.companyDescription}</p>
                      )}
                      {result.research.recentNews && result.research.recentNews.length > 0 && (
                        <div>
                          <p className="text-gray-400 mb-1">Recent News:</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            {result.research.recentNews.slice(0, 3).map((news, i) => (
                              <li key={i} className="text-gray-300">{news}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.research.decisionMakerBackground && (
                        <p><span className="text-gray-400">Background:</span> {result.research.decisionMakerBackground}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-900/50 rounded-lg p-5 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-300">Personalized Email</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{result.campaignType}</span>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-200">
                      {result.email}
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    Generated at {new Date(result.timestamp).toLocaleString()}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Search className="h-5 w-5 text-green-400" />
                  How It Works
                </h3>
                <div className="space-y-4">
                  {[
                    { step: 1, title: 'Enter Target', desc: 'Company name, website, and decision-maker details' },
                    { step: 2, title: 'AI Research', desc: 'Scrapes website, news, and public data for insights' },
                    { step: 3, title: 'Personalize', desc: 'Generates custom email based on department and campaign type' },
                    { step: 4, title: 'Review & Send', desc: 'Copy the email and send from your client' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-blue-900/30 to-purple-900/20 rounded-xl p-6 border border-blue-500/20"
              >
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                  Key Features
                </h3>
                <ul className="space-y-2.5 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                    <span><strong>Smart Research:</strong> AI discovers company news, initiatives, and pain points</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                    <span><strong>Personalization:</strong> Emails reference specific achievements and initiatives</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                    <span><strong>Department Templates:</strong> Tailored messaging for GTM, HR, Engineering, etc.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                    <span><strong>Campaign Types:</strong> Software pitch, consulting, partnerships, investment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                    <span><strong>Ready-to-Send:</strong> Professional email format with signature placeholder</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <h3 className="text-lg font-bold text-white mb-3">Example Output</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <p>For target: <strong className="text-white">Notion</strong> (Ivan Zhao, CEO)</p>
                  <p className="text-xs text-gray-400 line-clamp-3">
                    "Hey Ivan, I've been following Notion's journey and noticed your recent launch of Notion AI...
                    We help teams integrate AI-powered analytics directly into their workflows...
                    Would you be open to a quick demo?"
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl p-6 border border-blue-500/30 text-center"
              >
                <Building2 className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">Scale Your Outreach</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Generate dozens of personalized emails in minutes, not hours.
                </p>
                <a
                  href="/pricing"
                  className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium px-6 py-2.5 rounded-lg transition-all"
                >
                  View Pricing
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

const Info = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

export default EmailGTMPage;