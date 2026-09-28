import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { FormSection } from "@/components/agent-ui/FormSection";
import { ApiKeyInput } from "@/components/agent-ui/ApiKeyInput";
import { SmartTextarea } from "@/components/agent-ui/SmartTextarea";
import { ActionButton } from "@/components/agent-ui/ActionButton";
import { ResultCard } from "@/components/agent-ui/ResultCard";
import { LoadingIndicator } from "@/components/agent-ui/LoadingIndicator";
import { ErrorMessage } from "@/components/agent-ui/ErrorMessage";

const XaiFinanceAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("main");
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mainForm, setMainForm] = useState({
    openai_api_key: "", xai_grok_api_key: "", enter_stock_symbol_eg_aapl_googl_tsla: "", time_period: "", stock_symbol_for_news: "", symbol: "", shares: "", avg_buy_price_: "", symbol_to_analyze: "", ask_about_investing_markets_or_finance: ""
  });
  const [advancedForm, setAdvancedForm] = useState({
    openai_api_key: "", xai_grok_api_key: "", enter_stock_symbol_eg_aapl_googl_tsla: "", time_period: "", stock_symbol_for_news: "", symbol: "", shares: "", avg_buy_price_: "", symbol_to_analyze: "", ask_about_investing_markets_or_finance: ""
  });

  const updateMain = (field: string, value: string) => setMainForm(prev => ({ ...prev, [field]: value }));
  const updateAdvanced = (field: string, value: string) => setAdvancedForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (tabKey: string, data: any) => {
    setLoading(tabKey);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/finance-research-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, mode: tabKey, userId: user?.id })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed');
      setResults(prev => ({ ...prev, [tabKey]: result }));
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [tabKey]: err.message }));
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>XaiFinanceAgent - VideoRemix.vip</title>
        <meta name="description" content="Use finance-research-ai to automate tasks with AI." />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Xai Finance Agent</h1>
            <p className="text-xl text-gray-400">AI-powered xai finance agent.</p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="main">
              {errors['main'] && <ErrorMessage title="Request Failed" message={errors['main']} onRetry={() => handleSubmit('main', mainForm)} retryLoading={loading === 'main'} />}
              <FormSection title="API Configuration" description="Enter API keys">
                <ApiKeyInput label="OpenAI API Key" name="openai_api_key" value={mainForm.openai_api_key} onChange={(v) => updateMain('openai_api_key', v)} required helperText="Get your API key from OpenAI Platform" />
                <ApiKeyInput label="xAI (Grok) API Key" name="xai_grok_api_key" value={mainForm.xai_grok_api_key} onChange={(v) => updateMain('xai_grok_api_key', v)} required helperText="Get your API key from xAI Platform" />
              </FormSection>
              <FormSection title="Stock Analysis" description="Enter stock details">
                <SmartTextarea label="Enter Stock Symbol (e.g., AAPL, GOOGL, TSLA)" name="enter_stock_symbol_eg_aapl_googl_tsla" value={mainForm.enter_stock_symbol_eg_aapl_googl_tsla} onChange={(v) => updateMain('enter_stock_symbol_eg_aapl_googl_tsla', v)} placeholder="" required />
                <SmartTextarea label="Time Period" name="time_period" value={mainForm.time_period} onChange={(v) => updateMain('time_period', v)} placeholder="" required />
                <SmartTextarea label="Stock Symbol for News" name="stock_symbol_for_news" value={mainForm.stock_symbol_for_news} onChange={(v) => updateMain('stock_symbol_for_news', v)} placeholder="" required />
                <SmartTextarea label="Symbol" name="symbol" value={mainForm.symbol} onChange={(v) => updateMain('symbol', v)} placeholder="" required />
                <SmartTextarea label="Shares" name="shares" value={mainForm.shares} onChange={(v) => updateMain('shares', v)} placeholder="" required />
                <SmartTextarea label="Avg Buy Price ($)" name="avg_buy_price_" value={mainForm.avg_buy_price_} onChange={(v) => updateMain('avg_buy_price_', v)} placeholder="" required />
                <SmartTextarea label="Symbol to analyze" name="symbol_to_analyze" value={mainForm.symbol_to_analyze} onChange={(v) => updateMain('symbol_to_analyze', v)} placeholder="" required />
                <SmartTextarea label="Ask about investing, markets, or finance" name="ask_about_investing_markets_or_finance" value={mainForm.ask_about_investing_markets_or_finance} onChange={(v) => updateMain('ask_about_investing_markets_or_finance', v)} placeholder="" required />
              </FormSection>

              {loading === 'main' && <LoadingIndicator message="Processing..." subtext="Running main workflow" />}

              <ActionButton type="button" loading={loading === 'main'} onClick={() => handleSubmit('main', mainForm)} className="w-full mt-6">
                Run
              </ActionButton>

              {results['main'] && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                  <ResultCard title="Main Result" variant="success">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans mt-2">{JSON.stringify(results['main'], null, 2)}</pre>
                  </ResultCard>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="advanced">
              {errors['advanced'] && <ErrorMessage title="Request Failed" message={errors['advanced']} onRetry={() => handleSubmit('advanced', advancedForm)} retryLoading={loading === 'advanced'} />}
              <FormSection title="API Configuration" description="Enter API keys">
                <ApiKeyInput label="OpenAI API Key" name="openai_api_key" value={advancedForm.openai_api_key} onChange={(v) => updateAdvanced('openai_api_key', v)} required helperText="Get your API key from OpenAI Platform" />
                <ApiKeyInput label="xAI (Grok) API Key" name="xai_grok_api_key" value={advancedForm.xai_grok_api_key} onChange={(v) => updateAdvanced('xai_grok_api_key', v)} required helperText="Get your API key from xAI Platform" />
              </FormSection>
              <FormSection title="Stock Analysis" description="Enter stock details">
                <SmartTextarea label="Enter Stock Symbol (e.g., AAPL, GOOGL, TSLA)" name="enter_stock_symbol_eg_aapl_googl_tsla" value={advancedForm.enter_stock_symbol_eg_aapl_googl_tsla} onChange={(v) => updateAdvanced('enter_stock_symbol_eg_aapl_googl_tsla', v)} placeholder="" required />
                <SmartTextarea label="Time Period" name="time_period" value={advancedForm.time_period} onChange={(v) => updateAdvanced('time_period', v)} placeholder="" required />
                <SmartTextarea label="Stock Symbol for News" name="stock_symbol_for_news" value={advancedForm.stock_symbol_for_news} onChange={(v) => updateAdvanced('stock_symbol_for_news', v)} placeholder="" required />
                <SmartTextarea label="Symbol" name="symbol" value={advancedForm.symbol} onChange={(v) => updateAdvanced('symbol', v)} placeholder="" required />
                <SmartTextarea label="Shares" name="shares" value={advancedForm.shares} onChange={(v) => updateAdvanced('shares', v)} placeholder="" required />
                <SmartTextarea label="Avg Buy Price ($)" name="avg_buy_price_" value={advancedForm.avg_buy_price_} onChange={(v) => updateAdvanced('avg_buy_price_', v)} placeholder="" required />
                <SmartTextarea label="Symbol to analyze" name="symbol_to_analyze" value={advancedForm.symbol_to_analyze} onChange={(v) => updateAdvanced('symbol_to_analyze', v)} placeholder="" required />
                <SmartTextarea label="Ask about investing, markets, or finance" name="ask_about_investing_markets_or_finance" value={advancedForm.ask_about_investing_markets_or_finance} onChange={(v) => updateAdvanced('ask_about_investing_markets_or_finance', v)} placeholder="" required />
              </FormSection>

              {loading === 'advanced' && <LoadingIndicator message="Processing..." subtext="Running advanced workflow" />}

              <ActionButton type="button" loading={loading === 'advanced'} onClick={() => handleSubmit('advanced', advancedForm)} className="w-full mt-6">
                Run
              </ActionButton>

              {results['advanced'] && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                  <ResultCard title="Advanced Result" variant="success">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-900/50 p-4 rounded font-sans mt-2">{JSON.stringify(results['advanced'], null, 2)}</pre>
                  </ResultCard>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
};

 export default XaiFinanceAgentPage;
