import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, Tablet } from 'lucide-react';

interface SimulatorProps {
  className?: string;
}

const industries = [
  { id: 'saas', name: 'SaaSS', color: 'blue', example: 'Software demo' },
  { id: 'ecommerce', name: 'E-Commerce', color: 'green', example: 'Product recommendation' },
  { id: 'bfsi', name: 'Financial', color: 'purple', example: 'Investment advice' },
  { id: 'healthcare', name: 'Healthcare', color: 'red', example: 'Patient education' },
];

const genericContent = {
  headline: 'Transform Your Business Today',
  subheadline: 'Discover our amazing solutions for your needs',
  cta: 'Learn More',
};

const personalizedContent: Record<string, { headline: string; subheadline: string; cta: string }> = {
  saas: {
    headline: 'Boost Your Team\'s Productivity by 47%',
    subheadline: 'SaaSS teams using our platform see 3x faster deployment',
    cta: 'See SaaSS Demo',
  },
  ecommerce: {
    headline: 'Complete Your Kitchen with Matching Items',
    subheadline: 'Based on your cart: 89% buyers also purchased...',
    cta: 'View Recommendations',
  },
  bfsi: {
    headline: 'Grow Your Portfolio by $50K This Year',
    subheadline: 'Investment strategies tailored to your risk profile',
    cta: 'Get Financial Plan',
  },
  healthcare: {
    headline: 'Manage Diabetes with Personalized Care',
    subheadline: 'Treatment plan customized for your lifestyle',
    cta: 'Schedule Consultation',
  },
};

const PersonalizationSimulator: React.FC<SimulatorProps> = ({ className = '' }) => {
  const [selectedIndustry, setSelectedIndustry] = useState('saas');
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showPersonalized, setShowPersonalized] = useState(false);

  const content = showPersonalized
    ? personalizedContent[selectedIndustry]
    : genericContent;

  const colorMap: Record<string, string> = {
    blue: 'border-blue-500 bg-blue-900/20',
    green: 'border-green-500 bg-green-900/20',
    purple: 'border-purple-500 bg-purple-900/20',
    red: 'border-red-500 bg-red-900/20',
  };

  const industry = industries.find((i) => i.id === selectedIndustry)!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white">Personalization Simulator</h3>
          <p className="text-gray-400">See the difference personalization makes</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPersonalized(!showPersonalized)}
          className={`px-4 py-2 rounded-lg font-bold ${
            showPersonalized
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          {showPersonalized ? 'Showing: Personalized' : 'Showing: Generic'}
        </motion.button>
      </div>

      {/* Industry Selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {industries.map((ind) => (
          <motion.button
            key={ind.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedIndustry(ind.id)}
            className={`px-4 py-2 rounded-lg text-sm ${
              selectedIndustry === ind.id
                ? `bg-${ind.color}-900/40 text-${ind.color}-400 border border-${ind.color}-500/50`
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
          >
            {ind.name}
          </motion.button>
        ))}
      </div>

      {/* Device Preview */}
      <div className="flex justify-center mb-4">
        <div className="flex gap-2">
          {[
            { mode: 'desktop', icon: Monitor, label: 'Desktop' },
            { mode: 'tablet', icon: Tablet, label: 'Tablet' },
            { mode: 'mobile', icon: Smartphone, label: 'Mobile' },
          ].map(({ mode, icon: Icon, label }) => (
            <motion.button
              key={mode}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode(mode as any)}
              className={`p-2 rounded-lg ${
                viewMode === mode ? 'bg-primary-900/40 text-primary-400' : 'text-gray-500'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs ml-1">{label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Preview Window */}
      <motion.div
        layout
        className={`mx-auto bg-gray-900 rounded-xl border-2 overflow-hidden ${
          colorMap[industry.color]
        }`}
        style={{
          width: viewMode === 'desktop' ? '100%' : viewMode === 'tablet' ? '768px' : '375px',
          maxWidth: '100%',
        }}
      >
        <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs text-gray-500">preview.videoremix.vip</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedIndustry}-${showPersonalized}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="p-8 text-center"
          >
            <div className={`inline-block px-3 py-1 rounded-full text-xs mb-4 ${
              showPersonalized ? `bg-${industry.color}-900/40 text-${industry.color}-400` : 'bg-gray-800 text-gray-400'
            }`}>
              {showPersonalized ? `Personalized for ${industry.name}` : 'Generic Content'}
            </div>
            <h4 className="text-2xl font-bold text-white mb-4">{content.headline}</h4>
            <p className="text-gray-400 mb-6">{content.subheadline}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className={`px-6 py-3 rounded-lg font-bold ${
                showPersonalized
                  ? `bg-${industry.color}-600 text-white`
                  : 'bg-primary-600 text-white'
              }`}
            >
              {content.cta}
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Stats */}
      {showPersonalized && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-4 mt-6"
        >
          {[
            { label: 'Engagement', value: '2.3x', color: 'text-blue-400' },
            { label: 'Conversion', value: '80%', color: 'text-green-400' },
            { label: 'ROI Lift', value: '5-8x', color: 'text-purple-400' },
          ].map((stat) => (
            <div key={stat.label} className="text-center bg-black/20 rounded-lg p-3">
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default PersonalizationSimulator;
