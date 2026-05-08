import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Star } from 'lucide-react';
import { appCategories } from '../../data/appCategories';

interface CategorySelectionStepProps {
  selectedCategories: string[];
  recommendedCategories: string[];
  onToggleCategory: (categoryId: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

const CategorySelectionStep: React.FC<CategorySelectionStepProps> = ({
  selectedCategories,
  recommendedCategories,
  onToggleCategory,
  onContinue,
  onBack,
}) => {
  const handleToggle = useCallback((categoryId: string) => {
    onToggleCategory(categoryId);
  }, [onToggleCategory]);

  const categories = useMemo(() => appCategories, []);

  const isSelected = useCallback((categoryId: string) => {
    return selectedCategories.includes(categoryId);
  }, [selectedCategories]);

  const isRecommended = useCallback((categoryId: string) => {
    return recommendedCategories.includes(categoryId);
  }, [recommendedCategories]);

  const canContinue = selectedCategories.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Select your categories
        </h2>
        <p className="text-gray-400">
          Recommended categories are pre-selected based on your goals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <motion.div
            key={category.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleToggle(category.id)}
            className={`
              cursor-pointer rounded-xl p-5 border-2 transition-all relative
              ${isSelected(category.id)
                ? 'bg-green-900/30 border-green-500'
                : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
              }
            `}
          >
            {isRecommended(category.id) && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-semibold">
                <Star className="h-3 w-3" />
                Recommended
              </div>
            )}
            
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white mb-1">
                  {category.name}
                </h3>
                <p className="text-xs text-gray-400 mb-2">
                  {category.offerAngle}
                </p>
              </div>
              {isSelected(category.id) && (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 text-white transition-all"
        >
          ← Back
        </button>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className={`
            px-6 py-3 rounded-lg font-semibold transition-all
            ${canContinue
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }
          `}
          aria-disabled={!canContinue}
        >
          Continue to Recommendations →
        </button>
      </div>
    </motion.div>
  );
};

export default React.memo(CategorySelectionStep);
