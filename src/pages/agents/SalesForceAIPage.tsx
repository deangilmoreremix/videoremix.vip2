import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import AgentInputForm from "../../components/agents/AgentInputForm";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { 
  Search, 
  Building2, 
  Users, 
  DollarSign, 
  Target,
  Sparkles,
  FileText,
  ArrowRight,
  AlertCircle
} from "lucide-react";

interface SalesIntelligenceResult {
  id: string;
  competitor: string;
  product: string;
  timestamp: string;
  status: 'processing' | 'completed' | 'error';
  competitorProfile?: {
    companyOverview?: {
      name?: string;
      founded?: string;
      hq?: string;
      size?: string;
    };
    targetMarket?: {
      customers?: string[];
      industries?: string[];
      companySize?: string;
    };
    products?: {
      offerings?: string[];
      pricing?: string[];
    };
    customerSentiment?: {
      reviews?: string;
      rating?: number;
    };
  };
  error?: string;
}

interface FormData {
  competitor: string;
  product: string;
  industry?: string;
  context?: string;
}

const STORAGE_KEY = 'salesforce-ai-form-data';

const SalesForceAIPage: React.FC = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [result, setResult] = useState<SalesIntelligenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedFormData, setSavedFormData] = useState<FormData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedFormData(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleAgentSubmit = async (formData: FormData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    setSavedFormData(formData);
    
    setIsProcessing(true);
    setCurrentStage(0);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/salesforce-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: user?.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: SalesIntelligenceResult = await response.json();

      if (data.status === 'error') {
        throw new Error(data.error || 'Processing failed');
      }

      setResult(data);

      for (let i = 1; i <= 7; i++) {
        setTimeout(() => setCurrentStage(i), i * 5000);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('SalesForce AI error:', err);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 35000);
    }
  };

  const handleRetry = () => {
    if (savedFormData) {
      handleAgentSubmit(savedFormData);
    }
  };

  const renderEmptyState = () => (
    <EmptyState
      icon={<Search className="h-12 w-12 text-blue-400" />}
      title="Generate Your Battle Card"
      description="Enter a competitor name and your product details to generate a comprehensive sales battle card with SWOT analysis, objection handling scripts, and competitive positioning."
      tips={[
        "Enter the competitor you're facing in the deal",
        "Specify your product or service name",
        "Add industry context for more accurate analysis",
        "Include any specific competitive concerns or deal context"
      ]}
    />
  );

  const renderResults = () => {
    if (!result || result.status !== 'completed') return null;

    const profile = result.competitorProfile;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12 max-w-5xl mx-auto space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">Battle Card Results</h3>
            <p className="text-gray-400 text-sm mt-1">
              Competitor analysis for {result.competitor}
            </p>
          </div>
          <ActionButton
            variant="primary"
            icon={<FileText className="h-4 w-4" />}
            onClick={() => {}}
          >
            Export PDF
          </ActionButton>
        </div>

        <ResultGrid columns={2}>
          <ResultCard
            icon={<Building2 className="h-5 w-5" />}
            title="Company Overview"
            variant="default"
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Name</span>
                <span className="text-white">{profile?.companyOverview?.name || result.competitor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Founded</span>
                <span className="text-white">{profile?.companyOverview?.founded || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Headquarters</span>
                <span className="text-white">{profile?.companyOverview?.hq || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Company Size</span>
                <span className="text-white">{profile?.companyOverview?.size || 'Unknown'}</span>
              </div>
            </div>
          </ResultCard>

          <ResultCard
            icon={<Target className="h-5 w-5" />}
            title="Target Market"
            variant="info"
          >
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Customers</span>
                <p className="text-white mt-1">{profile?.targetMarket?.customers?.join(', ') || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-gray-400">Industries</span>
                <p className="text-white mt-1">{profile?.targetMarket?.industries?.join(', ') || 'Unknown'}</p>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Company Size</span>
                <span className="text-white">{profile?.targetMarket?.companySize || 'Unknown'}</span>
              </div>
            </div>
          </ResultCard>

          <ResultCard
            icon={<DollarSign className="h-5 w-5" />}
            title="Products & Pricing"
            variant="default"
          >
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Offerings</span>
                <p className="text-white mt-1">{profile?.products?.offerings?.join(', ') || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-gray-400">Pricing</span>
                <p className="text-white mt-1">{profile?.products?.pricing?.join(', ') || 'Unknown'}</p>
              </div>
            </div>
          </ResultCard>

          <ResultCard
            icon={<Users className="h-5 w-5" />}
            title="Customer Sentiment"
            variant={profile?.customerSentiment?.rating && profile.customerSentiment.rating >= 4 ? "success" : "warning"}
            subtext={profile?.customerSentiment?.rating ? `${profile.customerSentiment.rating}/5 rating` : undefined}
          >
            <p className="text-sm text-gray-300 mt-2">
              {profile?.customerSentiment?.reviews || 'Analysis in progress...'}
            </p>
          </ResultCard>
        </ResultGrid>

        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-blue-400" />
            <h4 className="text-lg font-semibold text-white">Next Steps</h4>
          </div>
          <p className="text-blue-200 text-sm">
            Full battle card with SWOT analysis, objection scripts, and visual comparison will be available in the complete implementation.
          </p>
          <div className="mt-4 flex gap-3">
            <ActionButton
              variant="secondary"
              icon={<ArrowRight className="h-4 w-4" />}
              onClick={() => {}}
            >
              View Full Analysis
            </ActionButton>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <Helmet>
        <title>SalesForce AI - Competitive Intelligence | VideoRemix.vip</title>
        <meta
          name="description"
          content="Generate comprehensive sales battle cards against competitors. AI-powered competitive intelligence with research, SWOT analysis, and objection handling scripts."
        />
        <meta property="og:title" content="SalesForce AI - Competitive Intelligence" />
        <meta
          property="og:description"
          content="Create professional battle cards against any competitor with AI research, positioning analysis, and sales-ready content."
        />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl mb-4">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">SalesForce AI</h1>
              <p className="text-gray-300">
                Generate comprehensive sales battle cards against any competitor
              </p>
            </motion.div>

            {!isProcessing && !result && savedFormData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg"
              >
                <p className="text-cyan-300 text-sm">
                  <strong>Previously analyzed:</strong> {savedFormData.competitor} vs {savedFormData.product}
                </p>
              </motion.div>
            )}

            {error && (
              <ErrorMessage
                title="Analysis Failed"
                message={error}
                onRetry={handleRetry}
                variant="error"
              />
            )}

            <AgentInputForm
              onSubmit={handleAgentSubmit}
              isProcessing={isProcessing}
              currentStage={currentStage}
              error={undefined}
            />
          </div>

          {isProcessing && (
            <div className="max-w-2xl mx-auto mt-8">
              <LoadingIndicator 
                message="Analyzing competitor..."
                subtext="This may take 2-3 minutes for a comprehensive battle card"
                progress={Math.round(((currentStage + 1) / 7) * 100)}
                size="lg"
              />
            </div>
          )}

          {!isProcessing && !result && !error && (
            <div className="max-w-2xl mx-auto mt-8">
              {renderEmptyState()}
            </div>
          )}

          {renderResults()}
        </div>
      </main>
    </>
  );
};

export default SalesForceAIPage;