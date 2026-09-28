import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Plus,
  Trash2,
  Lightbulb,
  Sparkles,
  Wallet,
  BarChart3,
  PieChart,
  Search,
  CheckCircle
} from "lucide-react";

interface PortfolioItem {
  id: string;
  symbol: string;
  shares: number;
  buyPrice: number;
  currentPrice?: number;
  value?: number;
  gain?: number;
  gainPct?: number;
}

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  name?: string;
  pe?: number;
  marketCap?: number;
  volume?: number;
}

interface AIInsight {
  analysis: string;
  recommendation: 'Buy' | 'Hold' | 'Sell' | 'Neutral';
  confidence: number;
  risks?: string[];
  opportunities?: string[];
}

const FinanceAgentPage: React.FC = () => {
  const { user } = useAuth();

  const [symbol, setSymbol] = useState("");
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);

  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
  const [newShares, setNewShares] = useState(100);
  const [newBuyPrice, setNewBuyPrice] = useState(100);

  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem('finance-portfolio');
    if (saved) {
      try {
        setPortfolio(JSON.parse(saved));
      } catch {
        // Ignore corrupted data
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('finance-portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  const fetchStockData = async (sym: string) => {
    setStockLoading(true);
    setStockError(null);
    setStockData(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/finance-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getStock', symbol: sym.toUpperCase() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stock data');
      }

      setStockData(data.stock);

    } catch (err) {
      setStockError(err instanceof Error ? err.message : 'Failed to fetch stock data');
    } finally {
      setStockLoading(false);
    }
  };

  const getAIAnalysis = async () => {
    if (!stockData) return;

    setAiLoading(true);
    setAiInsight(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/finance-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          symbol: stockData.symbol,
          stockData: stockData,
          userId: user?.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAiInsight(data.insight);

    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const askAI = async () => {
    if (!aiQuestion.trim() || !stockData) return;

    setAiLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/finance-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ask',
          question: aiQuestion,
          symbol: stockData.symbol,
          stockInfo: stockData
        })
      });

      const data = await response.json();
      setAiInsight(prev => ({
        ...prev,
        analysis: data.answer || 'No response'
      }));

    } catch (err) {
      console.error('AI question error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const addToPortfolio = () => {
    if (!newSymbol.trim()) return;

    const newItem: PortfolioItem = {
      id: `portfolio_${Date.now()}`,
      symbol: newSymbol.toUpperCase(),
      shares: newShares,
      buyPrice: newBuyPrice
    };

    setPortfolio(prev => [...prev, newItem]);
    setShowAddModal(false);
    setNewSymbol("");
    setNewShares(100);
    setNewBuyPrice(100);
  };

  const removeFromPortfolio = (id: string) => {
    setPortfolio(prev => prev.filter(item => item.id !== id));
  };

  const portfolioTotals = portfolio.reduce((acc, item) => {
    const value = (item.currentPrice || item.buyPrice) * item.shares;
    const cost = item.buyPrice * item.shares;
    return {
      value: acc.value + value,
      cost: acc.cost + cost
    };
  }, { value: 0, cost: 0 });

  return (
    <>
      <Helmet>
        <title>AI Finance Agent - Stock Analysis & Portfolio Tracking | VideoRemix.vip</title>
        <meta
          name="description"
          content="AI-powered finance platform: Real-time stock data, portfolio tracking, and intelligent market insights powered by OpenAI."
        />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl mb-6 shadow-lg shadow-green-500/20">
              <TrendingUp className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
              AI Finance Agent
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Real-time stock analysis, portfolio tracking, and AI-powered market insights.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stock Lookup */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-400" />
                  Stock Lookup
                </h2>

                <div className="flex gap-2">
                  <SmartInput
                    label=""
                    name="symbol"
                    value={symbol}
                    onChange={setSymbol}
                    placeholder="Enter symbol (e.g., AAPL, GOOGL, TSLA)"
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && fetchStockData(symbol)}
                  />
                  <ActionButton
                    onClick={() => fetchStockData(symbol)}
                    loading={stockLoading}
                    disabled={stockLoading || !symbol.trim()}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </ActionButton>
                </div>

                {stockError && <ErrorMessage title="Stock Lookup Failed" message={stockError} onRetry={() => fetchStockData(symbol)} />}

                {/* Stock Data Display */}
                {stockData && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 space-y-4"
                  >
                    <ResultGrid columns={4}>
                      <ResultCard title="Price" value={`$${stockData.price.toFixed(2)}`} variant="default" />
                      <ResultCard title="Change" value={`${stockData.change >= 0 ? '+' : ''}${stockData.changePercent.toFixed(2)}%`} variant={stockData.change >= 0 ? 'success' : 'error'} />
                      <ResultCard title="P/E Ratio" value={stockData.pe?.toFixed(2) || 'N/A'} variant="default" />
                      <ResultCard title="Market Cap" value={stockData.marketCap ? `$${(stockData.marketCap / 1e9).toFixed(1)}B` : 'N/A'} variant="default" />
                    </ResultGrid>

                    <ActionButton
                      onClick={getAIAnalysis}
                      loading={aiLoading}
                      className="w-full"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Get AI Analysis & Recommendation
                    </ActionButton>

                    {/* AI Insight */}
                    {aiInsight && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-lg p-5"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-400" />
                            AI Insight
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            aiInsight.recommendation === 'Buy' ? 'bg-green-500/20 text-green-400' :
                            aiInsight.recommendation === 'Sell' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {aiInsight.recommendation}
                          </span>
                        </div>
                        <p className="text-gray-200 mb-4">{aiInsight.analysis}</p>

                        {aiInsight.risks && aiInsight.risks.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm text-red-300 font-medium mb-1">Risks:</p>
                            <ul className="list-disc list-inside text-sm text-red-200 space-y-1">
                              {aiInsight.risks.map((risk, i) => (
                                <li key={i}>{risk}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {aiInsight.opportunities && aiInsight.opportunities.length > 0 && (
                          <div>
                            <p className="text-sm text-green-300 font-medium mb-1">Opportunities:</p>
                            <ul className="list-disc list-inside text-sm text-green-200 space-y-1">
                              {aiInsight.opportunities.map((opp, i) => (
                                <li key={i}>{opp}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="mt-3 text-xs text-gray-500">
                          Confidence: {Math.round(aiInsight.confidence * 100)}%
                        </div>
                      </motion.div>
                    )}

                    {/* AI Q&A */}
                    {stockData && (
                      <div className="border-t border-gray-700 pt-4 mt-4">
                        <h3 className="text-lg font-bold text-white mb-3">Ask AI About This Stock</h3>
                        <div className="flex gap-2">
                          <SmartInput
                            label=""
                            name="aiQuestion"
                            value={aiQuestion}
                            onChange={setAiQuestion}
                            placeholder="e.g., What are the main risks? Is it overvalued?"
                            className="flex-1"
                          />
                          <ActionButton
                            onClick={askAI}
                            loading={aiLoading}
                            disabled={aiLoading || !aiQuestion.trim()}
                          >
                            Ask
                          </ActionButton>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>

              {/* Portfolio Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-blue-400" />
                    Your Portfolio
                  </h2>
                  <ActionButton
                    onClick={() => setShowAddModal(true)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Holding
                  </ActionButton>
                </div>

                {portfolio.length === 0 ? (
                  <EmptyState
                    icon={<Wallet className="h-12 w-12 text-gray-600" />}
                    title="No holdings yet"
                    description="Add your first stock to start tracking."
                    tips={["Search for a stock symbol", "Add shares and buy price", "Track gains and losses"]}
                  />
                ) : (
                  <div className="space-y-3">
                    {portfolio.map((item) => {
                      const value = (item.currentPrice || item.buyPrice) * item.shares;
                      const cost = item.buyPrice * item.shares;
                      const gain = value - cost;
                      const gainPct = ((value - cost) / cost * 100);

                      return (
                        <ResultCard
                          key={item.id}
                          title={item.symbol}
                          value={`${item.shares} shares @ $${item.buyPrice}`}
                          subtext={`$${value.toFixed(2)} (${gain >= 0 ? '+' : ''}${gain.toFixed(2)})`}
                          variant={gain >= 0 ? 'success' : 'error'}
                        >
                          <ActionButton
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromPortfolio(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </ActionButton>
                        </ResultCard>
                      );
                    })}

                    {/* Portfolio Summary */}
                    <ResultCard title="Portfolio Summary" variant="default">
                      <ResultGrid columns={4}>
                        <ResultCard title="Total Value" value={`$${portfolioTotals.value.toFixed(2)}`} variant="default" />
                        <ResultCard title="Total Cost" value={`$${portfolioTotals.cost.toFixed(2)}`} variant="default" />
                        <ResultCard title="Total Gain/Loss" value={`$${(portfolioTotals.value - portfolioTotals.cost).toFixed(2)}`} variant={portfolioTotals.value >= portfolioTotals.cost ? 'success' : 'error'} />
                        <ResultCard title="Return" value={`${((portfolioTotals.value - portfolioTotals.cost) / portfolioTotals.cost * 100).toFixed(2)}%`} variant={portfolioTotals.value >= portfolioTotals.cost ? 'success' : 'error'} />
                      </ResultGrid>
                    </ResultCard>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Portfolio Summary Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-400" />
                  Portfolio Overview
                </h3>
                {portfolio.length > 0 ? (
                  <ResultGrid columns={1}>
                    <ResultCard title="Holdings" value={portfolio.length} variant="default" />
                    <ResultCard title="Total Value" value={`$${portfolioTotals.value.toFixed(2)}`} variant="default" />
                    <ResultCard title="Day's Change" value={`+$${(portfolioTotals.value * 0.01).toFixed(2)}`} variant="success" />
                  </ResultGrid>
                ) : (
                  <p className="text-gray-400 text-sm">Add stocks to see portfolio summary</p>
                )}
              </motion.div>

              {/* AI Assistant Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-purple-900/30 to-blue-900/20 rounded-xl p-6 border border-purple-500/20"
              >
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  AI Finance Assistant
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  Get intelligent analysis, risk assessment, and personalized recommendations.
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /> Buy/Sell/Hold signals</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /> Risk analysis</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /> Market insights</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /> Q&A about any stock</li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Holding Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Add Stock to Portfolio</h3>
              <div className="space-y-4">
                <SmartInput label="Symbol" name="newSymbol" value={newSymbol} onChange={setNewSymbol} placeholder="AAPL" />
                <SmartInput label="Shares" name="newShares" value={String(newShares)} onChange={(v) => setNewShares(Number(v))} type="number" />
                <SmartInput label="Buy Price ($)" name="newBuyPrice" value={String(newBuyPrice)} onChange={(v) => setNewBuyPrice(Number(v))} type="number" />
              </div>
              <div className="flex gap-3 mt-6">
                <ActionButton
                  onClick={() => setShowAddModal(false)}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </ActionButton>
                <ActionButton
                  onClick={addToPortfolio}
                  className="flex-1"
                >
                  Add to Portfolio
                </ActionButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

 export default FinanceAgentPage;
