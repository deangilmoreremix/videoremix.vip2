import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up.js';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign.js';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3.js';
import Target from 'lucide-react/dist/esm/icons/target.js';

interface ROICalculatorProps {
  className?: string;
}

const ROICalculator: React.FC<ROICalculatorProps> = ({ className = '' }) => {
  const [budget, setBudget] = useState(10000);
  const [conversionRate, setConversionRate] = useState(2.23);
  const [personalizationLevel, setPersonalizationLevel] = useState(50);
  const [showResults, setShowResults] = useState(false);

  const results = useMemo(() => {
    const baseConversions = budget * conversionRate / 100;
    const personalizedMultiplier = 1 + (personalizationLevel / 100) * 1.2; // Up to 2.2x at 100%
    const personalizedConversions = baseConversions * personalizedMultiplier;
    const revenue = personalizedConversions * 500; // Average order value
    const baseRevenue = baseConversions * 500;
    const roi = ((revenue - budget) / budget) * 100;
    const baseRoi = ((baseRevenue - budget) / budget) * 100;

    return {
      baseConversions: Math.round(baseConversions),
      personalizedConversions: Math.round(personalizedConversions),
      revenue: Math.round(revenue),
      baseRevenue: Math.round(baseRevenue),
      roi: Math.round(roi * 10) / 10,
      baseRoi: Math.round(baseRoi * 10) / 10,
      lift: Math.round((personalizedMultiplier - 1) * 100),
    };
  }, [budget, conversionRate, personalizationLevel]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 ${className}`}
    >
      <div className="flex items-center mb-6">
        <div className="bg-primary-900/50 p-3 rounded-xl mr-4">
          <BarChart3 className="h-6 w-6 text-primary-400" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Marketing ROI Calculator</h3>
          <p className="text-gray-400">See the impact of personalization</p>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        {/* Budget Slider */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm text-gray-300">Monthly Budget</label>
            <span className="text-primary-400 font-bold">${budget.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="1000"
            max="100000"
            step="1000"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Conversion Rate Slider */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm text-gray-300">Base Conversion Rate</label>
            <span className="text-primary-400 font-bold">{conversionRate}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.1"
            value={conversionRate}
            onChange={(e) => setConversionRate(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Personalization Level Slider */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm text-gray-300">Personalization Level</label>
            <span className="text-green-400 font-bold">{personalizationLevel}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={personalizationLevel}
            onChange={(e) => setPersonalizationLevel(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* Results */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showResults ? 1 : 0 }}
        className="bg-black/30 rounded-xl p-6 mb-6"
      >
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">${results.revenue.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Personalized Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-400">${results.baseRevenue.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Base Revenue</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg p-4 border border-green-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-400 mr-2" />
              <span className="text-white font-bold">+{results.lift}% Lift</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">{results.roi}%</div>
              <div className="text-xs text-gray-400">ROI</div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowResults(!showResults)}
        className="w-full bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold py-3 rounded-xl"
      >
        {showResults ? 'Hide Results' : 'Calculate ROI'}
      </motion.button>
    </motion.div>
  );
};

export default ROICalculator;
