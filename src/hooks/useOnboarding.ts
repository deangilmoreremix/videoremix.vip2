import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { Goal, Niche, OnboardingAnswers } from '../types/onboarding';

export type WizardStep = 1 | 2 | 3 | 4;

export interface UseOnboardingReturn {
  step: WizardStep;
  answers: Partial<OnboardingAnswers>;
  setGoals: (goals: Goal[]) => void;
  setNiche: (niche: Niche) => void;
  setSelectedCategories: (categories: string[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeOnboarding: () => Promise<void>;
}

export const useOnboarding = (): UseOnboardingReturn => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<WizardStep>(1);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({
    goals: [],
    selectedCategories: [],
  });

  const setGoals = useCallback((goals: Goal[]) => {
    setAnswers(prev => ({ ...prev, goals }));
  }, []);

  const setNiche = useCallback((niche: Niche) => {
    setAnswers(prev => ({ ...prev, niche }));
  }, []);

  const setSelectedCategories = useCallback((selectedCategories: string[]) => {
    setAnswers(prev => ({ ...prev, selectedCategories }));
  }, []);

  const nextStep = useCallback(() => {
    setStep(prev => Math.min(4, (prev + 1) as WizardStep));
  }, []);

  const prevStep = useCallback(() => {
    setStep(prev => Math.max(1, (prev - 1) as WizardStep));
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (!user) return;
    
    try {
      await updateProfile({
        onboarding: answers,
        onboarding_completed: true,
      });
      
      // Award onboarding achievement via Supabase
      await supabase.rpc('award_achievement', {
        p_user_id: user.id,
        p_achievement_type: 'onboarding_completed',
        p_metadata: { completed_at: new Date().toISOString() },
      });
      
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      throw error;
    }
  }, [user, answers, updateProfile, navigate]);

  return useMemo(() => ({
    step,
    answers,
    setGoals,
    setNiche,
    setSelectedCategories,
    nextStep,
    prevStep,
    completeOnboarding,
  }), [step, answers, setGoals, setNiche, setSelectedCategories, nextStep, prevStep, completeOnboarding]);
};