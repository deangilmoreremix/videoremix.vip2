import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Niche, NicheOption } from '../../types/onboarding';
import { nicheOptions } from '../../data/onboardingMapping';

interface NicheSelectionStepProps {
  selectedNiche: Niche | null;
  onSelectNiche: (niche: Niche) => void;
  onContinue: () => void;
  onBack: () => void;
}

const NicheSelectionStep: React.FC<NicheSelectionStepProps> = ({
  selectedNiche,
  onSelectNiche,
  onContinue,
  onBack,
}) => {
  const handleSelect = useCallback((niche: Niche) => {
    onSelectNiche(niche);
  }, [onSelectNiche]);

  const niches = useMemo(() => nicheOptions, []);

  const isSelected = useCallback((nicheId: Niche) => {
    return selectedNiche === nicheId;
  }, [selectedNiche]);

  const canContinue = selectedNiche !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          What's your niche?
        </h2>
        <p className="text-gray-400">
          This helps us recommend the most relevant tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {niches.map((niche) => (
          <motion.div
            key={niche.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(niche.id)}
            className={`
              cursor-pointer rounded-lg p-4 border-2 transition-all
              ${isSelected(niche.id)
                ? 'bg-purple-900/30 border-purple-500'
                : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                ${isSelected(niche.id) ? 'border-purple-500 bg-purple-500' : 'border-gray-500'}
              `}>
                {isSelected(niche.id) && <Check className="w-3 h-3 text-white" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {niche.title}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {niche.description}
                </p>
              </div>
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
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }
          `}
          aria-disabled={!canContinue}
        >
          Continue to Categories →
        </button>
      </div>
    </motion.div>
  );
};

export default React.memo(NicheSelectionStep);