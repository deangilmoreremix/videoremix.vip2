import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, TrendingUp, DollarSign, Users, BarChart3 } from 'lucide-react';

interface ROICalculatorProps {
  className?: string;
}

const ROICalculator: React.FC<ROICalculatorProps> = ({ className = '' }) => {
  const [monthlySpend, setMonthlySpend] = useState<number>(50000);
  const [conversionRate, setConversionRate] = useState<number>(2.5);
  const [averageOrderValue, setAverageOrderValue] = useState<number>(150);
  const [personalizationLift, setPersonalizationLift] = useState<number>(80);

  // Calculate ROI
  const monthlyVisitors = monthlySpend / 10; // Assuming $10 per visitor
  const currentConversions = (monthlyVisitors * conversionRate) / 100;
  const personalizedConversions = currentConversions * (1 + personalizationLift / 100);
  const additionalRevenue = (personalizedConversions - currentConversions) * averageOrderValue;
  const roi = ((additionalRevenue - monthlySpend * 0.1) / (monthlySpend * 0.1)) * 100; // Assuming 10% of spend on personalization

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 ${className}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-900/40 rounded-lg">
          <Calculator className="h-6 w-6 text-primary-400" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">ROI Calculator</h3>
          <p className="text-gray-400">Calculate your personalization ROI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Monthly Marketing Spend ($)
            </label>
            <input
              type="range"
              min="10000"
              max="500000"
              step="5000"
              value={monthlySpend}
              onChange={(e) => setMonthlySpend(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>$10K</span>
              <span className="font-bold text-white">${monthlySpend.toLocaleString()}</span>
              <span>$500K</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Current Conversion Rate (%)
            </label>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.1"
              value={conversionRate}
              onChange={(e) => setConversionRate(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.5%</span>
              <span className="font-bold text-white">{conversionRate}%</span>
              <span>10%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Average Order Value ($)
            </label>
            <input
              type="range"
              min="25"
              max="1000"
              step="25"
              value={averageOrderValue}
              onChange={(e) => setAverageOrderValue(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>$25</span>
              <span className="font-bold text-white">${averageOrderValue}</span>
              <span>$1000</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Personalization Lift (%)
            </label>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={personalizationLift}
              onChange={(e) => setPersonalizationLift(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>10%</span>
              <span className="font-bold text-white">{personalizationLift}%</span>
              <span>200%</span>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <div className="bg-black/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-sm text-gray-300">Additional Monthly Revenue</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              ${additionalRevenue.toLocaleString()}
            </div>
          </div>

          <div className="bg-black/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-300">ROI</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
            </div>
          </div>

          <div className="bg-black/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-gray-300">Additional Conversions</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {Math.round(personalizedConversions - currentConversions)}
            </div>
          </div>

          <div className="bg-black/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-gray-300">Cost of Personalization</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              ${(monthlySpend * 0.1).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {roi > 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mt-6 bg-gradient-to-r from-green-900/40 to-blue-900/40 rounded-lg p-4 border border-green-500/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <span className="text-lg font-bold text-green-400">Excellent ROI!</span>
            </div>
            <p className="text-gray-300 text-sm">
              Your personalization investment is paying off significantly. Consider scaling up your personalization efforts.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ROICalculator;
