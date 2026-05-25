import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Shield, DollarSign } from "lucide-react";
import { SmartInput } from "@/components/agent-ui/SmartInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ResultCard, ResultGrid } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";
import { EmptyState } from "@/components/agent-ui/EmptyState";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { SelectDropdown } from "@/components/agent-ui/SelectDropdown";

const STORAGE_KEY = 'ai-life-insurance-advisor-agent';

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CHF", label: "CHF - Swiss Franc" },
  { value: "INR", label: "INR - Indian Rupee" },
];

const INCOME_REPLACEMENT_OPTIONS = [
  { value: "3_years", label: "3 Years" },
  { value: "5_years", label: "5 Years" },
  { value: "7_years", label: "7 Years" },
  { value: "10_years", label: "10 Years" },
  { value: "15_years", label: "15 Years" },
  { value: "20_years", label: "20 Years" },
];

const AiLifeInsuranceAdvisorAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [firecrawlApiKey, setFirecrawlApiKey] = useState("");
  const [e2bApiKey, setE2bApiKey] = useState("");
  const [age, setAge] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [dependents, setDependents] = useState("");
  const [countryState, setCountryState] = useState("");
  const [totalDebt, setTotalDebt] = useState("");
  const [savingsInvestments, setSavingsInvestments] = useState("");
  const [existingInsurance, setExistingInsurance] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [incomeReplacementHorizon, setIncomeReplacementHorizon] = useState("10_years");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setOpenaiApiKey(parsed.openaiApiKey || "");
        setFirecrawlApiKey(parsed.firecrawlApiKey || "");
        setE2bApiKey(parsed.e2bApiKey || "");
        setAge(parsed.age || "");
        setAnnualIncome(parsed.annualIncome || "");
        setDependents(parsed.dependents || "");
        setCountryState(parsed.countryState || "");
        setTotalDebt(parsed.totalDebt || "");
        setSavingsInvestments(parsed.savingsInvestments || "");
        setExistingInsurance(parsed.existingInsurance || "");
        setCurrency(parsed.currency || "USD");
        setIncomeReplacementHorizon(parsed.incomeReplacementHorizon || "10_years");
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      openaiApiKey, firecrawlApiKey, e2bApiKey, age, annualIncome, dependents,
      countryState, totalDebt, savingsInvestments, existingInsurance, currency, incomeReplacementHorizon
    }));
  }, [openaiApiKey, firecrawlApiKey, e2bApiKey, age, annualIncome, dependents,
      countryState, totalDebt, savingsInvestments, existingInsurance, currency, incomeReplacementHorizon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!age || !annualIncome) {
      setError("Please fill in required fields");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-life-insurance-advisor-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openai_api_key: openaiApiKey,
          firecrawl_api_key: firecrawlApiKey,
          e2b_api_key: e2bApiKey,
          age,
          annual_income: annualIncome,
          dependents,
          country__state: countryState,
          total_outstanding_debt_incl_mortgage: totalDebt,
          savings__investments_available_to_dependents: savingsInvestments,
          existing_life_insurance: existingInsurance,
          currency,
          income_replacement_horizon: incomeReplacementHorizon,
          userId: user?.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOpenaiApiKey("");
    setFirecrawlApiKey("");
    setE2bApiKey("");
    setAge("");
    setAnnualIncome("");
    setDependents("");
    setCountryState("");
    setTotalDebt("");
    setSavingsInvestments("");
    setExistingInsurance("");
    setCurrency("USD");
    setIncomeReplacementHorizon("10_years");
    setResult(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-20">
        <LoadingIndicator message="Analysing your insurance needs..." subtext="Calculating optimal coverage based on your financial profile" />
      </div>
    );
  }

  if (result && result.status === 'completed') {
    return (
      <>
        <Helmet>
          <title>Insurance Analysis - AiLifeInsuranceAdvisorAgent</title>
        </Helmet>
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-3xl mb-6">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Analysis Complete</h1>
              <p className="text-xl text-gray-400">Your personalised life insurance recommendations</p>
            </motion.div>

            <ResultGrid columns={3}>
              <ResultCard
                icon={<DollarSign />}
                title="Recommended Coverage"
                value={result.recommendedCoverage || result.coverage || "—"}
                subtext={currency}
                variant="success"
              />
              <ResultCard
                icon={<Shield />}
                title="Policy Type"
                value={result.policyType || "Term Life"}
                variant="info"
              />
              <ResultCard
                icon={<DollarSign />}
                title="Estimated Premium"
                value={result.estimatedPremium || "—"}
                subtext={`${currency}/year`}
                variant="info"
              />
            </ResultGrid>

            <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Full Analysis</h3>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{result.result}</p>
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
        <title>AiLifeInsuranceAdvisorAgent - VideoRemix.vip</title>
        <meta name="description" content="Get personalised life insurance recommendations based on your financial profile." />
      </Helmet>
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-3xl mb-6">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Ai Life Insurance Advisor Agent</h1>
            <p className="text-xl text-gray-400">Get personalised life insurance recommendations</p>
          </motion.div>

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>Your Information</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SmartInput
                    label="OpenAI API Key"
                    name="openaiApiKey"
                    value={openaiApiKey}
                    onChange={setOpenaiApiKey}
                    type="password"
                    placeholder="sk-..."
                    helperText="Required for analysis"
                  />
                  <SmartInput
                    label="Firecrawl API Key"
                    name="firecrawlApiKey"
                    value={firecrawlApiKey}
                    onChange={setFirecrawlApiKey}
                    type="password"
                    placeholder="fc-..."
                    helperText="For market research"
                  />
                  <SmartInput
                    label="E2B API Key"
                    name="e2bApiKey"
                    value={e2bApiKey}
                    onChange={setE2bApiKey}
                    type="password"
                    placeholder="e2b-..."
                    helperText="For insurance data"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SmartInput
                    label="Age *"
                    name="age"
                    value={age}
                    onChange={setAge}
                    type="number"
                    placeholder="35"
                    helperText="Your current age"
                    required
                  />
                  <SmartInput
                    label="Annual Income *"
                    name="annualIncome"
                    value={annualIncome}
                    onChange={setAnnualIncome}
                    type="number"
                    placeholder="85000"
                    helperText="Your yearly gross income"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SmartInput
                    label="Number of Dependents"
                    name="dependents"
                    value={dependents}
                    onChange={setDependents}
                    type="number"
                    placeholder="2"
                    helperText="Family members who rely on your income"
                  />
                  <SmartInput
                    label="Country / State"
                    name="countryState"
                    value={countryState}
                    onChange={setCountryState}
                    placeholder="USA / California"
                    helperText="Your location for regional recommendations"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SmartInput
                    label="Total Outstanding Debt"
                    name="totalDebt"
                    value={totalDebt}
                    onChange={setTotalDebt}
                    type="number"
                    placeholder="250000"
                    helperText="Including mortgage"
                  />
                  <SmartInput
                    label="Savings & Investments"
                    name="savingsInvestments"
                    value={savingsInvestments}
                    onChange={setSavingsInvestments}
                    type="number"
                    placeholder="150000"
                    helperText="Available to dependents"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SmartInput
                    label="Existing Life Insurance"
                    name="existingInsurance"
                    value={existingInsurance}
                    onChange={setExistingInsurance}
                    type="number"
                    placeholder="100000"
                    helperText="Current coverage amount"
                  />
                  <SelectDropdown
                    label="Currency"
                    value={currency}
                    onValueChange={setCurrency}
                    options={CURRENCY_OPTIONS}
                    helperText="Currency for calculations"
                  />
                </div>

                <SelectDropdown
                  label="Income Replacement Horizon"
                  value={incomeReplacementHorizon}
                  onValueChange={setIncomeReplacementHorizon}
                  options={INCOME_REPLACEMENT_OPTIONS}
                  helperText="Years of income to replace if you pass away"
                />

                {error && <ErrorMessage message={error} onRetry={handleSubmit} retryLoading={loading} />}

                <div className="flex gap-3">
                  <ActionButton type="submit" loading={loading} size="lg" className="flex-1" disabled={!age || !annualIncome}>
                    <Shield className="h-4 w-4" />
                    Get Recommendations
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={handleReset}>
                    Clear
                  </ActionButton>
                </div>
              </form>
            </CardContent>
          </Card>

          <EmptyState
            icon={<Shield className="h-16 w-16 text-gray-600" />}
            title="No recommendations yet"
            description="Enter your financial information to receive personalised life insurance advice"
            tips={[
              "Have your income and debt figures ready",
              "Consider your dependents' financial needs",
              "Factor in mortgage and outstanding loans",
              "Think about how many years of income you'd want to replace"
            ]}
          />
        </div>
      </main>
    </>
  );
};

export default AiLifeInsuranceAdvisorAgentPage;