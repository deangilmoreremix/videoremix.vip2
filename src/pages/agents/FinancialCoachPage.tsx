import React, { useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Target,
  Lightbulb,
  Loader2,
  Upload,
  FileSpreadsheet,
  DollarSign,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Calculator,
  PiggyBank,
  Shield,
  LineChart as LineChartIcon
} from "lucide-react";

interface Transaction {
  date: string;
  description: string;
  category: string;
  amount: number;
  type: "income" | "expense";
}

interface BudgetCategory {
  category: string;
  amount: number;
  percentage: number;
  isEssential: boolean;
}

interface Recommendation {
  category: string;
  description: string;
  potentialSavings: number;
  priority: "high" | "medium" | "low";
}

interface FinancialAnalysis {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  categories: BudgetCategory[];
  recommendations: Recommendation[];
  emergencyFundMonths: number;
  savingsRate: number;
}

const FinancialCoachPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analysis, setAnalysis] = useState<FinancialAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upload");

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        // Parse CSV (simple implementation)
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const parsed: Transaction[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx];
          });
          
          // Convert amount
          let amount = parseFloat(row.amount?.replace(/[^0-9.-]/g, '') || '0');
          // Determine type based on amount sign or explicit type field
          const type = row.type?.toLowerCase() === 'income' || amount > 0 ? 'income' : 'expense';
          if (amount < 0) amount = Math.abs(amount);
          
          parsed.push({
            date: row.date || new Date().toISOString(),
            description: row.description || 'Unknown',
            category: row.category || 'Uncategorized',
            amount,
            type: type as any
          });
        }
        
        setTransactions(parsed);
        setActiveTab("analysis");
      } catch (err) {
        setError("Failed to parse CSV. Please ensure it has columns: date, description, category, amount, type (optional)");
      }
    };
    reader.readAsText(file);
  };

  const analyzeFinances = useCallback(async () => {
    if (transactions.length === 0) {
      setError("Please upload transactions first");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/financial-coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions,
          userId: user?.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysis(data.analysis);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze finances');
      console.error('Financial coach error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [transactions, user]);

  // Calculate totals
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netCashFlow = totalIncome - totalExpenses;

  return (
    <>
      <Helmet>
        <title>AI Financial Coach - Personal Finance Planning | VideoRemix.vip</title>
        <meta
          name="description"
          content="AI-powered personal finance coach. Upload expenses, get budget analysis, savings strategies, and debt reduction plans tailored to your financial situation."
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl mb-6 shadow-lg shadow-green-500/20">
              <Wallet className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
              AI Financial Coach
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Your personal AI financial advisor. Upload expenses, get personalized budget analysis,
              savings strategies, and debt reduction plans.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tabs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex gap-2 mb-6 border-b border-gray-700 pb-2">
                  {[
                    { id: "upload", label: "Upload Data", icon: Upload },
                    { id: "analysis", label: "Analysis", icon: BarChart3 },
                    { id: "recommendations", label: "Recommendations", icon: Lightbulb },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                        activeTab === id
                          ? "bg-green-600/20 text-green-400 border-b-2 border-green-500"
                          : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Upload Tab */}
              {activeTab === "upload" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 text-center"
                >
                  <Upload className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">Upload Your Financial Data</h3>
                  <p className="text-gray-300 mb-6 max-w-md mx-auto">
                    Upload a CSV file with your transactions to get started. The file should include:
                    date, description, category, amount, and optionally type (income/expense).
                  </p>
                  
                  <label className="inline-flex items-center justify-center bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-3 px-8 rounded-lg cursor-pointer transition-all">
                    <FileSpreadsheet className="h-5 w-5 mr-2" />
                    Choose CSV File
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="mt-6 text-sm text-gray-400">
                    <p className="mb-2"><strong>Sample CSV format:</strong></p>
                    <pre className="bg-gray-900/50 p-3 rounded-lg text-xs text-left overflow-x-auto">
{`date,description,category,amount,type
2024-01-15,Salary,Income,5000,income
2024-01-16,Rent,Housing,1500,expense
2024-01-17,Groceries,Food,300,expense`}
                    </pre>
                  </div>

                  {transactions.length > 0 && (
                    <div className="mt-6 p-4 bg-green-900/20 border border-green-500/20 rounded-lg">
                      <p className="text-green-300 font-medium">
                        ✓ Loaded {transactions.length} transactions
                      </p>
                      <p className="text-sm text-green-200 mt-1">
                        Total Income: ${totalIncome.toLocaleString()} | Expenses: ${totalExpenses.toLocaleString()}
                      </p>
                      <button
                        onClick={() => setActiveTab("analysis")}
                        className="mt-3 text-green-400 hover:text-green-300 text-sm font-medium"
                      >
                        Continue to Analysis →
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Analysis Tab */}
              {activeTab === "analysis" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {transactions.length === 0 ? (
                    <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 text-center">
                      <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">No Data Yet</h3>
                      <p className="text-gray-300">Upload a CSV file to begin analysis</p>
                    </div>
                  ) : (
                    <>
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <p className="text-sm text-gray-400 mb-1">Total Income</p>
                          <p className="text-2xl font-bold text-green-400">${totalIncome.toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <p className="text-sm text-gray-400 mb-1">Total Expenses</p>
                          <p className="text-2xl font-bold text-red-400">${totalExpenses.toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <p className="text-sm text-gray-400 mb-1">Net Cash Flow</p>
                          <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {netCashFlow >= 0 ? '+' : ''}${netCashFlow.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Run AI Analysis Button */}
                      <button
                        onClick={analyzeFinances}
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            AI Analyzing Your Finances...
                          </>
                        ) : (
                          <>
                            <Lightbulb className="h-5 w-5" />
                            Generate AI Analysis & Recommendations
                          </>
                        )}
                      </button>

                      {/* Error */}
                      {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300">
                          {error}
                        </div>
                      )}

                      {/* Analysis Results */}
                      {analysis && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/20 rounded-xl p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                              <PieChart className="h-5 w-5 text-green-400" />
                              Budget Overview
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                              <div>
                                <p className="text-sm text-gray-400">Savings Rate</p>
                                <p className="text-xl font-bold text-white">{analysis.savingsRate.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">Emergency Fund</p>
                                <p className="text-xl font-bold text-white">{analysis.emergencyFundMonths} months</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">Essential Spending</p>
                                <p className="text-xl font-bold text-white">
                                  {((analysis.categories.filter(c => c.isEssential).reduce((sum, c) => sum + c.amount, 0) / totalExpenses) * 100).toFixed(0)}%
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">Discretionary</p>
                                <p className="text-xl font-bold text-white">
                                  {((analysis.categories.filter(c => !c.isEssential).reduce((sum, c) => sum + c.amount, 0) / totalExpenses) * 100).toFixed(0)}%
                                </p>
                              </div>
                            </div>

                            <h4 className="text-sm font-semibold text-gray-300 mb-2">Spending by Category</h4>
                            <div className="space-y-2">
                              {analysis.categories
                                .sort((a, b) => b.amount - a.amount)
                                .map(cat => (
                                  <div key={cat.category} className="bg-gray-900/50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm text-white">{cat.category}</span>
                                      <span className="text-sm font-bold text-white">${cat.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                      <div
                                        className="bg-green-500 h-2 rounded-full"
                                        style={{ width: `${cat.percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                ))
                              }
                            </div>
                          </div>

                          <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                              <Target className="h-5 w-5 text-blue-400" />
                              AI Recommendations
                            </h3>
                            <div className="space-y-4">
                              {analysis.recommendations.map((rec, idx) => (
                                <div key={idx} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="text-white font-semibold">{rec.category}</h4>
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                                      rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                      rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                      'bg-green-500/20 text-green-400'
                                    }`}>
                                      {rec.priority.toUpperCase()}
                                    </span>
                                  </div>
                                  <p className="text-gray-300 text-sm mb-2">{rec.description}</p>
                                  {rec.potentialSavings > 0 && (
                                    <p className="text-green-400 text-sm font-medium flex items-center gap-1">
                                      <TrendingUp className="h-3 w-3" />
                                      Potential savings: ${rec.potentialSavings.toLocaleString()}/month
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {/* Recommendations Tab */}
              {activeTab === "recommendations" && analysis && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {/* Already shown in analysis tab */}
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4">Full AI Recommendations</h3>
                    <p className="text-gray-300">
                      Analysis complete. View your personalized budget recommendations above in the Analysis tab.
                    </p>
                    <button
                      onClick={() => setActiveTab("analysis")}
                      className="mt-4 text-green-400 hover:text-green-300 font-medium"
                    >
                      ← Back to Analysis
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                  Your Financial Snapshot
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Transactions</span>
                    <span className="text-white font-bold">{transactions.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Categories</span>
                    <span className="text-white font-bold">
                      {new Set(transactions.map(t => t.category)).size}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Avg Transaction</span>
                    <span className="text-white font-bold">
                      ${(transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length).toFixed(0)}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 rounded-xl p-6 border border-green-500/20"
              >
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-400" />
                  What You Get
                </h3>
                <ul className="space-y-2.5 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                    <span><strong>Budget Analysis:</strong> AI categorizes spending and identifies patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                    <span><strong>Smart Recommendations:</strong> Personalized savings strategies with quantified impact</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                    <span><strong>Debt Reduction:</strong> Avalanche vs snowball comparison with payoff plans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                    <span><strong>Emergency Fund:</strong> Recommends optimal fund size based on your expenses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                    <span><strong>Visualizations:</strong> Charts showing spending breakdown and trends</span>
                  </li>
                </ul>
              </motion.div>

              {/* Use Cases */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <h3 className="text-lg font-bold text-white mb-3">Use Cases</h3>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {[
                    { icon: '💰', text: 'Personal budgeting' },
                    { icon: '💳', text: 'Debt payoff planning' },
                    { icon: '🎯', text: 'Savings goal tracking' },
                    { icon: '📊', text: 'Expense categorization' },
                    { icon: '🏠', text: 'Financial independence planning' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-300">
                      <span>{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default FinancialCoachPage;
