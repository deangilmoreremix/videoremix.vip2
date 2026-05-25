import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  Search,
  Globe,
  FileText,
  Database,
  Loader2,
  Copy,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Settings,
  HelpCircle
} from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { ExamplePrompt } from "@/components/agent-ui/ExamplePrompt";
import { FormSection } from "@/components/agent-ui/FormSection";

const STORAGE_KEY = "web-scraping-agent-form";

interface ScrapeResult {
  url: string;
  extractedData: any;
  summary?: string;
  keyPoints?: string[];
  timestamp: string;
  mode: string;
}

const WebScrapingAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [url, setUrl] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).url || "" : "";
  });
  const [prompt, setPrompt] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).prompt || "" : "";
  });
  const [mode, setMode] = useState<"extract" | "summarize" | "qa" | "list">("extract");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.url) setUrl(parsed.url);
        if (parsed.prompt) setPrompt(parsed.prompt);
        if (parsed.mode) setMode(parsed.mode);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, prompt, mode }));
  }, [url, prompt, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !prompt.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/web-scraping-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          prompt: prompt.trim(),
          mode,
          userId: user?.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Scraping failed');
      }

      setResult({
        ...data,
        timestamp: new Date().toISOString()
      });

      localStorage.removeItem(STORAGE_KEY);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Scraping error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderExtractedData = () => {
    if (!result?.extractedData) return null;

    if (typeof result.extractedData === 'string') {
      return <pre className="bg-gray-900/50 p-4 rounded-lg text-sm text-gray-200 whitespace-pre-wrap font-mono">{result.extractedData}</pre>;
    }

    if (Array.isArray(result.extractedData)) {
      return (
        <ul className="space-y-2">
          {result.extractedData.map((item: any, i: number) => (
            <li key={i} className="bg-gray-900/50 p-3 rounded-lg text-sm text-gray-200">
              {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <pre className="bg-gray-900/50 p-4 rounded-lg text-sm text-gray-200 whitespace-pre-wrap font-mono">
        {JSON.stringify(result.extractedData, null, 2)}
      </pre>
    );
  };

  const examplePrompts = {
    extract: [
      "Extract all product names, prices, and descriptions",
      "Get all article titles and their publication dates",
      "Extract contact information (email, phone, address)",
      "List all links with their anchor text"
    ],
    summarize: [
      "Summarize the main points in 3 sentences",
      "What is this page about?",
      "Extract the key takeaways"
    ],
    qa: [
      "What is the main topic of this page?",
      "Who is the author?",
      "What are the key facts presented?"
    ],
    list: [
      "List all items in the table",
      "Extract all headings (h1, h2, h3)",
      "Get all image URLs and alt text"
    ]
  };

  return (
    <>
      <Helmet>
        <title>AI Web Scraping Agent - Smart Data Extraction | VideoRemix.vip</title>
        <meta
          name="description"
          content="AI-powered web scraping: extract structured data from any website using natural language prompts. Supports summarization, Q&A, listing."
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-600 to-red-500 rounded-2xl mb-6 shadow-lg shadow-orange-500/20">
              <Globe className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400">
              AI Web Scraping Agent
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Extract structured data from any website using natural language.
              AI understands what you want and pulls the exact information.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Search className="h-5 w-5 text-orange-400" />
                  Scrape Configuration
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <FormSection
                    title="Website Configuration"
                    description="Enter the URL and extraction parameters"
                  >
                    <SmartInput
                      id="website-url"
                      label="Website URL"
                      name="url"
                      type="url"
                      value={url}
                      onChange={setUrl}
                      placeholder="https://example.com or https://example.com/products"
                      helperText="Enter the full URL including https://. The page must be publicly accessible."
                      required
                    />
                  </FormSection>

                  {/* Mode Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Extraction Mode
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { value: 'extract', icon: Database, label: 'Extract' },
                        { value: 'summarize', icon: FileText, label: 'Summarize' },
                        { value: 'qa', icon: Search, label: 'Q&A' },
                        { value: 'list', icon: Settings, label: 'List' }
                      ].map(({ value, icon: Icon, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setMode(value as any)}
                          className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                            mode === value
                              ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                              : 'border-gray-600 text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <FormSection
                    title="Extraction Prompt"
                    description="Describe what data you want to extract from the page"
                  >
                    <SmartTextarea
                      id="extraction-prompt"
                      label="What to Extract / Ask"
                      name="prompt"
                      value={prompt}
                      onChange={setPrompt}
                      placeholder="e.g., 'Extract all product names, prices, and descriptions from this page'"
                      helperText="Be specific about what data you need. Include field names when possible."
                      rows={4}
                      required
                    />

                    <div className="mt-3">
                      <ExamplePrompt
                        examples={examplePrompts[mode]}
                        onSelect={setPrompt}
                      />
                    </div>
                  </FormSection>

                  <ActionButton
                    type="submit"
                    loading={isProcessing}
                    disabled={isProcessing || !url.trim() || !prompt.trim()}
                    loadingText="Scraping & Analyzing..."
                    icon={<Sparkles className="h-4 w-4" />}
                    className="w-full"
                  >
                    Start Scraping
                  </ActionButton>
                </form>
              </motion.div>

              {/* Results Section */}
              <AnimatePresence>
                {(result || isProcessing) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        Extraction Results
                      </h2>
                      {result && (
                        <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                          Mode: {result.mode}
                        </span>
                      )}
                    </div>

                    {isProcessing && (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-12 w-12 animate-spin text-orange-500 mb-4" />
                        <p className="text-gray-300 font-medium">Scraping and analyzing...</p>
                        <p className="text-sm text-gray-500 mt-1">Fetching page and extracting data with AI</p>
                      </div>
                    )}

                    {result && !isProcessing && (
                      <div className="space-y-4">
                        {/* Source URL */}
                        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                          <p className="text-xs text-gray-400 mb-1">Source</p>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-400 hover:text-orange-300 text-sm truncate block"
                          >
                            {result.url}
                          </a>
                        </div>

                        {/* Summary if available */}
                        {result.summary && (
                          <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-blue-300 mb-2">Summary</h3>
                            <p className="text-gray-200 text-sm">{result.summary}</p>
                          </div>
                        )}

                        {/* Key Points */}
                        {result.keyPoints && result.keyPoints.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-300 mb-2">Key Points</h3>
                            <ul className="space-y-2">
                              {result.keyPoints.map((point, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-200">
                                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Extracted Data */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-gray-300">Extracted Data</h3>
                            <button
                              onClick={() => copyToClipboard(JSON.stringify(result.extractedData, null, 2))}
                              className="text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded flex items-center gap-1"
                            >
                              {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              {copied ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          {renderExtractedData()}
                        </div>

                        {/* Timestamp */}
                        <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
                          Scraped at {new Date(result.timestamp).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 flex items-start gap-3"
                >
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Scraping Failed</p>
                    <p className="text-sm">{error}</p>
                    <p className="text-xs mt-1 text-red-200">
                      Tip: Check the URL is accessible and the site allows scraping
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Tips Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-400" />
                  How to Use
                </h3>
                <div className="space-y-3 text-sm text-gray-300">
                  {[
                    { step: 1, text: 'Enter a full URL (including https://)' },
                    { step: 2, text: 'Choose extraction mode based on your need' },
                    { step: 3, text: 'Write a clear prompt describing what to extract' },
                    { step: 4, text: 'Click "Start Scraping" and wait for results' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-600/20 text-orange-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {item.step}
                      </div>
                      <p>{item.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Mode Explanations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <h3 className="text-lg font-bold text-white mb-4">Mode Guide</h3>
                <div className="space-y-3">
                  {[
                    { mode: 'Extract', desc: 'Pull specific data fields like names, prices, dates', icon: Database },
                    { mode: 'Summarize', desc: 'Get a concise summary of the page content', icon: FileText },
                    { mode: 'Q&A', desc: 'Ask specific questions about the page', icon: Search },
                    { mode: 'List', desc: 'Extract all items matching a pattern', icon: Settings }
                  ].map(({ mode: m, desc, icon: Icon }) => (
                    <div key={m} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{m}</p>
                        <p className="text-xs text-gray-400">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Limitations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-6"
              >
                <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Limitations
                </h3>
                <ul className="space-y-2 text-sm text-yellow-200">
                  <li>• JavaScript-heavy sites may not render fully</li>
                  <li>• Authentication-required pages cannot be accessed</li>
                  <li>• Very large pages may be truncated</li>
                  <li>• Respect robots.txt and site terms of service</li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default WebScrapingAgentPage;
