import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { Goal, GoalOption } from '../../types/onboarding';
import { goalOptions } from '../../data/onboardingMapping';

interface GoalSelectionStepProps {
  selectedGoals: Goal[];
  onToggleGoal: (goal: Goal) => void;
  onContinue: () => void;
}

const GoalSelectionStep: React.FC<GoalSelectionStepProps> = ({
  selectedGoals,
  onToggleGoal,
  onContinue,
}) => {
  const handleToggle = useCallback((goal: Goal) => {
    onToggleGoal(goal);
  }, [onToggleGoal]);

  const goals = useMemo(() => goalOptions, []);

  const isSelected = useCallback((goalId: Goal) => {
    return selectedGoals.includes(goalId);
  }, [selectedGoals]);

  const canContinue = selectedGoals.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          What are your goals?
        </h2>
        <p className="text-gray-400">
          Select all that apply. We'll personalize your experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => (
          <motion.div
            key={goal.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleToggle(goal.id)}
            className={`
              cursor-pointer rounded-xl p-6 border-2 transition-all
              ${isSelected(goal.id)
                ? 'bg-blue-900/30 border-blue-500'
                : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
              }
            `}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {goal.title}
                </h3>
                <p className="text-sm text-gray-400">
                  {goal.description}
                </p>
              </div>
              {isSelected(goal.id) && (
                <CheckCircle2 className="h-6 w-6 text-blue-500 flex-shrink-0 ml-2" />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className={`
            px-6 py-3 rounded-lg font-semibold transition-all
            ${canContinue
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }
          `}
          aria-disabled={!canContinue}
        >
          Continue to Niche →
        </button>
      </div>
    </motion.div>
  );
};

export default React.memo(GoalSelectionStep);