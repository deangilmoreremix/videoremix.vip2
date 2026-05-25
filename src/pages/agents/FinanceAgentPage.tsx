import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
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

  // Stock lookup state
  const [symbol, setSymbol] = useState("");
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);

  // Portfolio state
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
  const [newShares, setNewShares] = useState(100);
  const [newBuyPrice, setNewBuyPrice] = useState(100);

  // AI Analysis state
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");

  // Load portfolio from localStorage
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

  // Save portfolio
  useEffect(() => {
    localStorage.setItem('finance-portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  // Fetch stock data
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

  // Get AI Analysis
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

  // Ask AI question
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

  // Add to portfolio
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

  // Remove from portfolio
  const removeFromPortfolio = (id: string) => {
    setPortfolio(prev => prev.filter(item => item.id !== id));
  };

  // Calculate portfolio totals
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
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="Enter symbol (e.g., AAPL, GOOGL, TSLA)"
                    className="flex-1 bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    onKeyPress={(e) => e.key === 'Enter' && fetchStockData(symbol)}
                  />
                  <button
                    onClick={() => fetchStockData(symbol)}
                    disabled={stockLoading || !symbol.trim()}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2"
                  >
                    {stockLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Search
                  </button>
                </div>

                {/* Stock Data Display */}
                {stockData && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 space-y-4"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                        <p className="text-sm text-gray-400 mb-1">Price</p>
                        <p className="text-2xl font-bold text-white">${stockData.price.toFixed(2)}</p>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                        <p className="text-sm text-gray-400 mb-1">Change</p>
                        <p className={`text-2xl font-bold flex items-center gap-1 ${stockData.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {stockData.change >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                          {stockData.change >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%
                        </p>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                        <p className="text-sm text-gray-400 mb-1">P/E Ratio</p>
                        <p className="text-2xl font-bold text-white">{stockData.pe?.toFixed(2) || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                        <p className="text-sm text-gray-400 mb-1">Market Cap</p>
                        <p className="text-lg font-bold text-white">
                          {stockData.marketCap ? `$${(stockData.marketCap / 1e9).toFixed(1)}B` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* AI Analysis Button */}
                    <button
                      onClick={getAIAnalysis}
                      disabled={aiLoading}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          AI Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5" />
                          Get AI Analysis & Recommendation
                        </>
                      )}
                    </button>

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
                            <p className="text-sm text-red-300 font-medium mb-1">⚠️ Risks:</p>
                            <ul className="list-disc list-inside text-sm text-red-200 space-y-1">
                              {aiInsight.risks.map((risk, i) => (
                                <li key={i}>{risk}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {aiInsight.opportunities && aiInsight.opportunities.length > 0 && (
                          <div>
                            <p className="text-sm text-green-300 font-medium mb-1">💡 Opportunities:</p>
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
                          <input
                            type="text"
                            value={aiQuestion}
                            onChange={(e) => setAiQuestion(e.target.value)}
                            placeholder="e.g., What are the main risks? Is it overvalued?"
                            className="flex-1 bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                            onKeyPress={(e) => e.key === 'Enter' && askAI()}
                          />
                          <button
                            onClick={askAI}
                            disabled={aiLoading || !aiQuestion.trim()}
                            className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                          >
                            Ask
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {stockError && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">
                    {stockError}
                  </div>
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
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Holding
                  </button>
                </div>

                {portfolio.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No holdings yet. Add your first stock to start tracking.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {portfolio.map((item) => {
                      const value = (item.currentPrice || item.buyPrice) * item.shares;
                      const cost = item.buyPrice * item.shares;
                      const gain = value - cost;
                      const gainPct = ((value - cost) / cost * 100);

                      return (
                        <div key={item.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-bold text-white">{item.symbol}</h4>
                            <p className="text-sm text-gray-400">{item.shares} shares @ ${item.buyPrice}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-white">${value.toFixed(2)}</p>
                            <p className={`text-sm flex items-center justify-end gap-1 ${gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {gain >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                              {gain >= 0 ? '+' : ''}{gain.toFixed(2)} ({gainPct.toFixed(2)}%)
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromPortfolio(item.id)}
                            className="ml-4 text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Portfolio Summary */}
                    <div className="bg-gradient-to-r from-blue-900/20 to-green-900/20 rounded-lg p-4 border border-blue-500/20 mt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-400">Total Value</p>
                          <p className="text-xl font-bold text-white">${portfolioTotals.value.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Total Cost</p>
                          <p className="text-xl font-bold text-white">${portfolioTotals.cost.toFixed(2)}</p>
                        </div>
                         <div>
                           <p className="text-sm text-gray-400">Total Gain/Loss</p>
                           <p className={`text-xl font-bold ${portfolioTotals.value >= portfolioTotals.cost ? 'text-green-400' : 'text-red-400'}`}>
                             ${(portfolioTotals.value - portfolioTotals.cost).toFixed(2)}
                           </p>
                         </div>
                        <div>
                          <p className="text-sm text-gray-400">Return</p>
                          <p className={`text-xl font-bold ${portfolioTotals.value >= portfolioTotals.cost ? 'text-green-400' : 'text-red-400'}`}>
                            {((portfolioTotals.value - portfolioTotals.cost) / portfolioTotals.cost * 100).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
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
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Holdings</span>
                      <span className="text-white font-bold">{portfolio.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Value</span>
                      <span className="text-white font-bold">${portfolioTotals.value.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Day's Change</span>
                      <span className="text-green-400 font-bold">+${(portfolioTotals.value * 0.01).toFixed(2)}</span>
                    </div>
                  </div>
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
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Symbol</label>
                  <input
                    type="text"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    placeholder="AAPL"
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Shares</label>
                  <input
                    type="number"
                    value={newShares}
                    onChange={(e) => setNewShares(Number(e.target.value))}
                    min="1"
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Buy Price ($)</label>
                  <input
                    type="number"
                    value={newBuyPrice}
                    onChange={(e) => setNewBuyPrice(Number(e.target.value))}
                    min="0"
                    step="0.01"
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addToPortfolio}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Add to Portfolio
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FinanceAgentPage;
