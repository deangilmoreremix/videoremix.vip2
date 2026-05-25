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
  LineChart as LineChartIcon,
  FileText,
  RefreshCw,
  CreditCard
} from "lucide-react";
import {
  SmartInput,
  EmptyState,
  ExamplePrompt,
  ResultCard,
  ResultGrid,
  ErrorMessage,
  ActionButton,
  FileUploadZone,
  LoadingIndicator,
  FormSection
} from "@/components/agent-ui/";

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

const SAMPLE_CSV = `date,description,category,amount,type
2024-01-15,Salary,Income,5000,income
2024-01-16,Rent,Housing,1500,expense
2024-01-17,Groceries,Food,300,expense
2024-01-20,Netflix,Subscriptions,15,expense
2024-01-22,Freelance Work,Income,800,income`;

const FinancialCoachPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analysis, setAnalysis] = useState<FinancialAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [retryLoading, setRetryLoading] = useState(false);

  const handleCSVUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const parsed: Transaction[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx];
          });
          
          let amount = parseFloat(row.amount?.replace(/[^0-9.-]/g, '') || '0');
          const type = row.type?.toLowerCase() === 'income' || amount > 0 ? 'income' : 'expense';
          if (amount < 0) amount = Math.abs(amount);
          
          parsed.push({
            date: row.date || new Date().toISOString(),
            description: row.description || 'Unknown',
            category: row.category || 'Uncategorized',
            amount,
            type: type as "income" | "expense"
          });
        }
        
        setTransactions(parsed);
        setError(null);
        setActiveTab("analysis");
      } catch {
        setError("Failed to parse CSV. Please ensure it has columns: date, description, category, amount, type (optional)");
      }
    };
    reader.readAsText(file);
  }, []);

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

  const handleRetry = useCallback(async () => {
    setRetryLoading(true);
    await analyzeFinances();
    setRetryLoading(false);
  }, [analyzeFinances]);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netCashFlow = totalIncome - totalExpenses;

  const examplePrompts = [
    "Upload your bank statement CSV",
    "View spending breakdown",
    "Get debt payoff strategies"
  ];

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
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {examplePrompts.map((prompt, i) => (
                <ExamplePrompt key={i} text={prompt} />
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
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
                      role="tab"
                      aria-selected={activeTab === id}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </motion.div>

              {activeTab === "upload" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700"
                >
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
                      <FileSpreadsheet className="h-8 w-8 text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Upload Your Financial Data</h3>
                    <p className="text-gray-300 max-w-md mx-auto">
                      Upload a CSV file with your transactions to get personalized budget analysis and savings recommendations.
                    </p>
                  </div>
                  
                  <div className="max-w-md mx-auto">
                    <FormSection title="" description="">
                      <FileUploadZone
                        accept=".csv"
                        maxSize={10 * 1024 * 1024}
                        onFileSelect={handleCSVUpload}
                        selectedFile={null}
                      >
                        <div className="text-center">
                          <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-sm font-medium text-white">Drop your CSV file here, or click to browse</p>
                          <p className="text-xs text-gray-500 mt-1">CSV files up to 10MB</p>
                        </div>
                      </FileUploadZone>
                    </FormSection>
                  </div>

                  <div className="mt-6 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                    <p className="text-sm font-medium text-gray-300 mb-3">Required CSV format:</p>
                    <div className="bg-gray-900/70 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-xs text-gray-400 font-mono whitespace-pre">
{SAMPLE_CSV}
                      </pre>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Columns: date, description, category, amount, type (income/expense). 
                      The type column is optional - if omitted, positive amounts are treated as income.
                    </p>
                  </div>

                  {transactions.length > 0 && (
                    <div className="mt-6 p-4 bg-green-900/20 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-green-300 font-medium">
                        <CheckCircle className="h-5 w-5" />
                        Loaded {transactions.length} transactions
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Total Income:</span>
                          <span className="text-green-400 ml-2 font-medium">${totalIncome.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Expenses:</span>
                          <span className="text-red-400 ml-2 font-medium">${totalExpenses.toLocaleString()}</span>
                        </div>
                      </div>
                      <ActionButton
                        variant="ghost"
                        onClick={() => setActiveTab("analysis")}
                        className="mt-3 text-green-400 hover:text-green-300"
                      >
                        Continue to Analysis →
                      </ActionButton>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "analysis" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {transactions.length === 0 ? (
                    <EmptyState
                      icon={<BarChart3 className="h-16 w-16 text-gray-600" />}
                      title="No transaction data yet"
                      description="Upload your bank statement or expense CSV file to begin receiving AI-powered financial insights and personalized recommendations."
                      tips={[
                        "Export a CSV from your bank's website or app",
                        "Ensure the file has date, description, category, and amount columns",
                        "Include a type column (income/expense) for best results"
                      ]}
                      action={
                        <ActionButton variant="primary" onClick={() => setActiveTab("upload")}>
                          <Upload className="h-4 w-4" />
                          Upload Transactions
                        </ActionButton>
                      }
                    />
                  ) : (
                    <>
                      <ResultGrid columns={3}>
                        <ResultCard
                          icon={<TrendingUp className="h-5 w-5" />}
                          title="Total Income"
                          value={`$${totalIncome.toLocaleString()}`}
                          variant="success"
                        />
                        <ResultCard
                          icon={<TrendingDown className="h-5 w-5" />}
                          title="Total Expenses"
                          value={`$${totalExpenses.toLocaleString()}`}
                          variant="error"
                        />
                        <ResultCard
                          icon={<DollarSign className="h-5 w-5" />}
                          title="Net Cash Flow"
                          value={`${netCashFlow >= 0 ? '+' : ''}$${netCashFlow.toLocaleString()}`}
                          variant={netCashFlow >= 0 ? "success" : "error"}
                        />
                      </ResultGrid>

                      <ActionButton
                        variant="primary"
                        onClick={analyzeFinances}
                        loading={isProcessing}
                        disabled={isProcessing}
                        className="w-full"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            AI Analyzing Your Finances...
                          </>
                        ) : (
                          <>
                            <Lightbulb className="h-4 w-4" />
                            Generate AI Analysis & Recommendations
                          </>
                        )}
                      </ActionButton>

                      {isProcessing && (
                        <LoadingIndicator
                          message="Analyzing your financial data..."
                          subtext="This may take a moment while our AI examines your spending patterns"
                        />
                      )}

                      {error && (
                        <ErrorMessage
                          title="Analysis Failed"
                          message={error}
                          onRetry={handleRetry}
                          retryLoading={retryLoading}
                        />
                      )}

                      {analysis && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          <ResultGrid columns={2}>
                            <ResultCard
                              icon={<PiggyBank className="h-5 w-5" />}
                              title="Savings Rate"
                              value={`${analysis.savingsRate.toFixed(1)}%`}
                              subtext={analysis.savingsRate >= 20 ? "Excellent!" : "Could be improved"}
                              variant={analysis.savingsRate >= 20 ? "success" : "warning"}
                            />
                            <ResultCard
                              icon={<Shield className="h-5 w-5" />}
                              title="Emergency Fund"
                              value={`${analysis.emergencyFundMonths} months`}
                              subtext="of expenses covered"
                              variant={analysis.emergencyFundMonths >= 6 ? "success" : "warning"}
                            />
                          </ResultGrid>

                          <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/20 rounded-xl p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                              <PieChart className="h-5 w-5 text-green-400" />
                              Budget Overview
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                              <div>
                                <p className="text-sm text-gray-400">Categories</p>
                                <p className="text-xl font-bold text-white">{analysis.categories.length}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">Recommendations</p>
                                <p className="text-xl font-bold text-white">{analysis.recommendations.length}</p>
                              </div>
                            </div>

                            <h4 className="text-sm font-semibold text-gray-300 mb-3">Spending by Category</h4>
                            <div className="space-y-3">
                              {analysis.categories
                                .sort((a, b) => b.amount - a.amount)
                                .map(cat => (
                                  <div key={cat.category} className="bg-gray-900/50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm text-white font-medium">{cat.category}</span>
                                      <span className="text-sm font-bold text-white">${cat.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                      <div
                                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${cat.percentage}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-gray-500 mt-1">{cat.percentage.toFixed(1)}% of expenses</span>
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

              {activeTab === "recommendations" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {!analysis ? (
                    <EmptyState
                      icon={<Lightbulb className="h-16 w-16 text-gray-600" />}
                      title="No recommendations yet"
                      description="Upload your transaction data and run the AI analysis to receive personalized financial recommendations."
                      action={
                        <ActionButton variant="primary" onClick={() => setActiveTab("analysis")}>
                          <BarChart3 className="h-4 w-4" />
                          Go to Analysis
                        </ActionButton>
                      }
                    />
                  ) : (
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                      <h3 className="text-xl font-bold text-white mb-4">Full AI Recommendations</h3>
                      <p className="text-gray-300 mb-4">
                        Your analysis is complete. View your personalized budget recommendations in the Analysis tab.
                      </p>
                      <ActionButton variant="secondary" onClick={() => setActiveTab("analysis")}>
                        ← Back to Analysis
                      </ActionButton>
                    </div>
                  )}
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
                      ${transactions.length > 0 ? (transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length).toFixed(0) : 0}
                    </span>
                  </div>
                  {analysis && (
                    <>
                      <div className="border-t border-gray-700 pt-4 mt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Analysis Status</span>
                          <span className="text-green-400 font-bold flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" /> Complete
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>

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
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Budget Analysis:</strong> AI categorizes spending and identifies patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Smart Recommendations:</strong> Personalized savings strategies with quantified impact</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Debt Reduction:</strong> Avalanche vs snowball comparison with payoff plans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Emergency Fund:</strong> Recommends optimal fund size based on your expenses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Visualizations:</strong> Charts showing spending breakdown and trends</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <h3 className="text-lg font-bold text-white mb-3">Use Cases</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { icon: DollarSign, text: 'Personal budgeting' },
                    { icon: CreditCard, text: 'Debt payoff planning' },
                    { icon: Target, text: 'Savings goal tracking' },
                    { icon: PieChart, text: 'Expense categorization' },
                    { icon: TrendingUp, text: 'Financial independence planning' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-300">
                      <item.icon className="h-4 w-4 text-green-400" />
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
