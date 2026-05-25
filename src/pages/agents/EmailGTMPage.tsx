import React, { useState } from "react";
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
  AlertCircle,
  RefreshCw
} from "lucide-react";

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
          {/* Hero */}
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
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Configuration Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
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

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g., Notion, Salesforce, HubSpot"
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Website URL *
                      </label>
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://company.com"
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Contact Name *
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g., John Smith"
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Position/Title *
                      </label>
                      <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="e.g., VP of Sales, CMO, Head of Marketing"
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
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
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
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
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Researching & Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Generate Personalized Email
                      </>
                    )}
                  </button>
                </form>
              </motion.div>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 flex items-start gap-3"
                >
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Results Section */}
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(result.email)}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                      >
                        {copied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {/* Research Summary */}
                  <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4 mb-6">
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

                  {/* Email Content */}
                  <div className="bg-gray-900/50 rounded-lg p-5 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-300">Personalized Email</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{result.department}</span>
                        <span>•</span>
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

            {/* Sidebar */}
            <div className="space-y-6">
              {/* How It Works */}
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

              {/* Features */}
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

              {/* Example Output */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <h3 className="text-lg font-bold text-white mb-3">💡 Example Output</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <p>For target: <strong className="text-white">Notion</strong> (Ivan Zhao, CEO)</p>
                  <p className="text-xs text-gray-400 line-clamp-3">
                    "Hey Ivan, I've been following Notion's journey and noticed your recent launch of Notion AI...
                    We help teams integrate AI-powered analytics directly into their workflows...
                    Would you be open to a quick demo?"
                  </p>
                </div>
              </motion.div>

              {/* CTA */}
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

export default EmailGTMPage;
