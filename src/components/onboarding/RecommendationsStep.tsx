import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { appCategories } from '../../data/appCategories';
import { appsData } from '../../data/appsData';

interface RecommendationsStepProps {
  selectedCategories: string[];
  onContinue: () => void;
  onBack: () => void;
}

const RecommendationsStep: React.FC<RecommendationsStepProps> = ({
  selectedCategories,
  onContinue,
  onBack,
}) => {
  const recommendedApps = useMemo(() => {
    return appsData.filter(app => {
      const appCategoryIds = app.businessCategory || [];
      return selectedCategories.some(catId => appCategoryIds.includes(catId));
    }).slice(0, 12);
  }, [selectedCategories]);

  const categories = useMemo(() => 
    appCategories.filter(cat => selectedCategories.includes(cat.id)),
    [selectedCategories]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Recommended for You
        </h2>
        <p className="text-gray-400">
          Based on your selections, here are the tools we recommend.
        </p>
      </div>

      {categories.map(category => {
        const categoryApps = recommendedApps.filter(app => 
          (app.businessCategory || []).includes(category.id)
        );
        
        if (categoryApps.length === 0) return null;
        
        return (
          <div key={category.id} className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              {category.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryApps.map(app => (
                <div
                  key={app.id}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                >
                  <h4 className="text-sm font-semibold text-white mb-1">
                    {app.name}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {app.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 text-white transition-all"
        >
          ← Back
        </button>
        <button
          onClick={onContinue}
          className="px-6 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all"
        >
          Continue to Setup →
        </button>
      </div>
    </motion.div>
  );
};

export default React.memo(RecommendationsStep);