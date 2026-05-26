import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Sparkles, DollarSign, TrendingUp, CreditCard } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ResultCard, ResultGrid, ResultIcons } from "@/components/agent-ui/ResultCard";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { ActionButton } from "@/components/agent-ui/ActionButton";

const STORAGE_KEY = 'ai-financial-coach-agent-form';

const EXPENSE_ENTRY_OPTIONS = [
  { value: "manual", label: "Manual Entry" },
  { value: "csv_upload", label: "CSV File Upload" },
  { value: "api_import", label: "API Import" },
];

const AiFinancialCoachAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    monthly_income_: "",
    number_of_dependants: "",
    how_would_you_like_to_enter_your_expenses: "",
    choose_your_csv_file: "",
    how_many_debts_do_you_have: "",
    name: "",
    amount_: "",
    interest_rate_: "",
    minimum_payment_: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [debtEntries, setDebtEntries] = useState<Array<{name: string, amount: string, interest_rate: string, minimum_payment: string}>>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed.formData || formData);
        setDebtEntries(parsed.debtEntries || []);
      } catch (e) {
        console.warn('Failed to parse saved form data');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, debtEntries }));
  }, [formData, debtEntries]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.monthly_income_.trim()) {
      setError("Please enter your monthly income");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-financial-coach-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          debts: debtEntries,
          userId: user?.id 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      monthly_income_: "",
      number_of_dependants: "",
      how_would_you_like_to_enter_your_expenses: "",
      choose_your_csv_file: "",
      how_many_debts_do_you_have: "",
      name: "",
      amount_: "",
      interest_rate_: "",
      minimum_payment_: ""
    });
    setDebtEntries([]);
    setResult(null);
    setError(null);
  };

  const addDebtEntry = () => {
    if (formData.name && formData.amount_ && formData.interest_rate_ && formData.minimum_payment_) {
      setDebtEntries([...debtEntries, {
        name: formData.name,
        amount: formData.amount_,
        interest_rate: formData.interest_rate_,
        minimum_payment: formData.minimum_payment_
      }]);
      setFormData({
        ...formData,
        name: "",
        amount_: "",
        interest_rate_: "",
        minimum_payment_: ""
      });
    }
  };

  const removeDebtEntry = (index: number) => {
    setDebtEntries(debtEntries.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="pt-24 pb-20">
        <LoadingIndicator message="Analysing your financial situation..." subtext="Our AI financial coach is reviewing your data" />
      </div>
    );
  }

  if (result && result.status === 'completed') {
    return (
      <>
        <Helmet>
          <title>Financial Analysis - AiFinancialCoachAgent</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-500 rounded-3xl mb-6">
                <DollarSign className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Financial Analysis Complete</h1>
              <p className="text-xl text-gray-400">Your AI financial coach has finished the analysis</p>
            </motion.div>

            <ResultGrid columns={3}>
              <ResultCard
                icon={<DollarSign />}
                title="Monthly Income"
                value={formData.monthly_income_ ? `$${parseFloat(formData.monthly_income_).toLocaleString()}` : "—"}
                variant="success"
              />
              <ResultCard
                icon={<TrendingUp />}
                title="Dependants"
                value={formData.number_of_dependants || "—"}
                variant="info"
              />
              <ResultCard
                icon={<CreditCard />}
                title="Debts Tracked"
                value={debtEntries.length.toString()}
                variant="info"
              />
            </ResultGrid>

            <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Financial Recommendations</h3>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{result.result || JSON.stringify(result, null, 2)}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <ActionButton onClick={handleReset} variant="secondary">
                New Analysis
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
        <title>AiFinancialCoachAgent - VideoRemix.vip</title>
        <meta name="description" content="AI-powered financial coach for budgeting, debt management, and financial planning." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-500 rounded-3xl mb-6">
              <DollarSign className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">AI Financial Coach Agent</h1>
            <p className="text-xl text-gray-400">Get personalised financial guidance and debt management advice</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Financial Information</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Income Details" description="Tell us about your monthly income and household">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SmartInput
                      label="Monthly Income ($)"
                      name="monthly_income_"
                      value={formData.monthly_income_}
                      onChange={(v) => updateField('monthly_income_', v)}
                      type="number"
                      placeholder="e.g., 7500"
                      helperText="Your total monthly take-home income"
                      required
                    />

                    <SmartInput
                      label="Number of Dependants"
                      name="number_of_dependants"
                      value={formData.number_of_dependants}
                      onChange={(v) => updateField('number_of_dependants', v)}
                      type="number"
                      placeholder="e.g., 2"
                      helperText="How many people depend on your income?"
                    />
                  </div>
                </FormSection>

                <FormSection title="Expense Tracking" description="How would you like to track your expenses?">
                  <SmartTextarea
                    label="Expense Entry Method"
                    name="how_would_you_like_to_enter_your_expenses"
                    value={formData.how_would_you_like_to_enter_your_expenses}
                    onChange={(v) => updateField('how_would_you_like_to_enter_your_expenses', v)}
                    placeholder="Describe how you'd like to enter expenses: manual entry, CSV upload, or API import..."
                    helperText="Choose how you want to track your expenses"
                    rows={3}
                  />

                  <SmartTextarea
                    label="CSV File / Expense Data"
                    name="choose_your_csv_file"
                    value={formData.choose_your_csv_file}
                    onChange={(v) => updateField('choose_your_csv_file', v)}
                    placeholder="Paste your expense data here in CSV format, or describe the data source..."
                    helperText="If using CSV, include columns: date, description, category, amount, type"
                    rows={4}
                  />
                </FormSection>

                <FormSection title="Debt Information" description="Track your current debts for personalised payoff advice">
                  <SmartInput
                    label="Number of Debts"
                    name="how_many_debts_do_you_have"
                    value={formData.how_many_debts_do_you_have}
                    onChange={(v) => updateField('how_many_debts_do_you_have', v)}
                    type="number"
                    placeholder="e.g., 3"
                    helperText="How many debts would you like to track?"
                  />

                  {debtEntries.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm font-medium text-gray-300">Added Debts:</p>
                      {debtEntries.map((debt, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-white">{debt.name}</p>
                            <p className="text-sm text-gray-400">
                              ${parseFloat(debt.amount).toLocaleString()} @ {debt.interest_rate}% APR
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDebtEntry(index)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SmartInput
                      label="Debt Name"
                      name="name"
                      value={formData.name}
                      onChange={(v) => updateField('name', v)}
                      placeholder="e.g., Credit Card, Student Loan"
                      helperText="Name or description of the debt"
                    />

                    <SmartInput
                      label="Amount ($)"
                      name="amount_"
                      value={formData.amount_}
                      onChange={(v) => updateField('amount_', v)}
                      type="number"
                      placeholder="e.g., 5000"
                      helperText="Total debt amount"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SmartInput
                      label="Interest Rate (%)"
                      name="interest_rate_"
                      value={formData.interest_rate_}
                      onChange={(v) => updateField('interest_rate_', v)}
                      type="number"
                      placeholder="e.g., 18.99"
                      helperText="Annual percentage rate (APR)"
                    />

                    <SmartInput
                      label="Minimum Payment ($)"
                      name="minimum_payment_"
                      value={formData.minimum_payment_}
                      onChange={(v) => updateField('minimum_payment_', v)}
                      type="number"
                      placeholder="e.g., 150"
                      helperText="Monthly minimum payment"
                    />
                  </div>

                  <ActionButton type="button" variant="secondary" onClick={addDebtEntry}>
                    Add Debt
                  </ActionButton>
                </FormSection>

                {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

                <div className="flex gap-3">
                  <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={loading || !formData.monthly_income_.trim()}>
                    <Sparkles className="h-4 w-4" />
                    Get Financial Advice
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          <EmptyState
            icon={<DollarSign className="h-16 w-16 text-gray-600" />}
            title="Ready to improve your finances"
            description="Enter your income and debts to get personalised financial coaching and debt payoff strategies"
            tips={[
              "Enter your total monthly take-home income",
              "Add all debts including credit cards, loans, and mortgages",
              "Include accurate interest rates for better recommendations",
              "The more data you provide, the better the advice"
            ]}
          />
        </div>
      </main>
    </>
  );
};

export default AiFinancialCoachAgentPage;
