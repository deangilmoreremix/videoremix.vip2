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
import ParticleBackground from '../premium/ParticleBackground';
import GradientOrb from '../premium/GradientOrb';

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#030303]">
      {/* Premium ambient background matching landing page */}
        <ParticleBackground className="z-0" particleCount={60} />
        <GradientOrb size={800} colorFrom="#cc785c" colorTo="#e6dfd8" blur={120} mouseFollow={true} />
        
        <div className="absolute inset-0">
          {/* Animated gradient orbs with Claude coral tones */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-[#cc785c]/30 via-[#cc785c]/10 to-transparent rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-gradient-to-tr from-[#cc785c]/20 via-[#faf9f5]/10 to-transparent rounded-full blur-[100px]"></div>
          
          {/* Mesh gradient overlay with Claude ink/dark surfaces */}
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#141413_1px,transparent_1px),linear-gradient(to_bottom,#141413_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl"
        >
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <motion.h1 
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[0.95] tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {STEP_TITLES[step]}
              </motion.h1>
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
                  className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                    stepNum <= step ? 'bg-primary-500' : 'bg-gray-800'
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <AnimatePresence mode="wait">
              {renderStep}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default React.memo(OnboardingWizard);
