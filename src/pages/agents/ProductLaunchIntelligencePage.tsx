import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up.js';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square.js';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3.js';
import Rocket from 'lucide-react/dist/esm/icons/rocket.js';

const ProductLaunchIntelligencePage: React.FC = () => {
  const { user } = useAuth();
  const [company, setCompany] = useState('');
  const [activeTab, setActiveTab] = useState<'competitor' | 'sentiment' | 'metrics'>('competitor');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    competitor?: string;
    sentiment?: string;
    metrics?: string;
  }>({});

  const handleAnalyze = async (type: 'competitor' | 'sentiment' | 'metrics') => {
    if (!company.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/.netlify/functions/product-launch-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: company.trim(),
          type,
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setResults(prev => ({ ...prev, [type]: data.report }));
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'competitor' as const, label: 'Competitor Analysis', icon: TrendingUp },
    { id: 'sentiment' as const, label: 'Market Sentiment', icon: MessageSquare },
    { id: 'metrics' as const, label: 'Launch Metrics', icon: BarChart3 },
  ];

  return (
    <>
      <Helmet>
        <title>Product Launch Intelligence - VideoRemix</title>
        <meta name="description" content="AI-powered insights for GTM, Product Marketing & Growth Teams" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4"
          >
            <Rocket className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Product Launch Intelligence
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            AI-powered insights for GTM, Product Marketing & Growth Teams
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8"
        >
          <div className="mb-6">
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Name
            </label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Enter company name (e.g., OpenAI, Tesla, Spotify)"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
        >
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              if (!isActive) return null;

              return (
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <Icon className="w-6 h-6 text-purple-500 mr-3" />
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {tab.label}
                      </h2>
                    </div>
                    <button
                      onClick={() => handleAnalyze(tab.id)}
                      disabled={!company.trim() || loading}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {loading ? 'Analyzing...' : `Analyze ${company}`}
                    </button>
                  </div>

                  {results[tab.id] ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="prose prose-gray dark:prose-invert max-w-none"
                    >
                      <div
                        className="text-gray-700 dark:text-gray-300"
                        dangerouslySetInnerHTML={{
                          __html: results[tab.id]!.replace(/\n/g, '<br>'),
                        }}
                      />
                    </motion.div>
                  ) : (
                    <div className="text-center py-12">
                      <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {company ? `Click "Analyze ${company}" to get insights` : 'Enter a company name to start analysis'}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default ProductLaunchIntelligencePage;