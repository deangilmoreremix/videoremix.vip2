import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useOnboarding, WizardStep } from '../../hooks/useOnboarding';
import { Goal, Niche, OnboardingAnswers } from '../../types/onboarding';
import { getRecommendedCategories } from '../../data/onboardingMapping';
import GoalSelectionStep from './GoalSelectionStep';
import NicheSelectionStep from './NicheSelectionStep';
import CategorySelectionStep from './CategorySelectionStep';
import RecommendationsStep from './RecommendationsStep';
import GuidedSetupStep from './GuidedSetupStep';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const STEP_TITLES: Record<WizardStep, string> = {
  1: 'Select Goals',
  2: 'Choose Niche',
  3: 'Select Categories',
  4: 'Recommendations',
  5: 'Guided Setup',
};

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const {
    step,
    answers,
    setGoals,
    setNiche,
    setSelectedCategories,
    nextStep,
    prevStep,
    completeOnboarding,
  } = useOnboarding();

  const [isCompleting, setIsCompleting] = useState(false);

  const handleToggleGoal = useCallback((goal: Goal) => {
    const currentGoals = answers.goals || [];
    const newGoals = currentGoals.includes(goal)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal];
    setGoals(newGoals);
  }, [answers.goals, setGoals]);

  const handleSelectNiche = useCallback((niche: Niche) => {
    setNiche(niche);
  }, [setNiche]);

  const handleToggleCategory = useCallback((categoryId: string) => {
    const current = answers.selectedCategories || [];
    const newCategories = current.includes(categoryId)
      ? current.filter(c => c !== categoryId)
      : [...current, categoryId];
    setSelectedCategories(newCategories);
  }, [answers.selectedCategories, setSelectedCategories]);

  const recommendedCategories = useMemo(() => {
    return getRecommendedCategories(answers.goals || [], answers.niche!);
  }, [answers.goals, answers.niche]);

  const handleComplete = useCallback(async () => {
    setIsCompleting(true);
    try {
      await completeOnboarding();
      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setIsCompleting(false);
    }
  }, [completeOnboarding, onComplete]);

  const renderStep = useMemo(() => {
    switch (step) {
      case 1:
        return (
          <GoalSelectionStep
            selectedGoals={answers.goals || []}
            onToggleGoal={handleToggleGoal}
            onContinue={nextStep}
          />
        );
      case 2:
        return (
          <NicheSelectionStep
            selectedNiche={answers.niche || null}
            onSelectNiche={handleSelectNiche}
            onContinue={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <CategorySelectionStep
            selectedCategories={answers.selectedCategories || []}
            recommendedCategories={recommendedCategories}
            onToggleCategory={handleToggleCategory}
            onContinue={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <RecommendationsStep
            selectedCategories={answers.selectedCategories || []}
            onContinue={nextStep}
            onBack={prevStep}
          />
        );
      case 5:
        return (
          <GuidedSetupStep
            onComplete={handleComplete}
            onBack={prevStep}
          />
        );
      default:
        return null;
    }
  }, [step, answers, recommendedCategories, handleToggleGoal, handleSelectNiche, handleToggleCategory, nextStep, prevStep, handleComplete]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-gray-900 z-10 p-6 pb-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white">
              {STEP_TITLES[step]}
            </h1>
            <button
              onClick={onComplete}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close onboarding"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(stepNum => (
              <div
                key={stepNum}
                className={`
                  h-2 flex-1 rounded-full transition-all
                  ${stepNum <= step ? 'bg-blue-600' : 'bg-gray-700'}
                `}
              />
            ))}
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {renderStep}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default React.memo(OnboardingWizard);