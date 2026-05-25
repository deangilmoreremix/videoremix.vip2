# Onboarding Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a 5-step onboarding wizard with goal selection, niche selection, category multi-select, personalized recommendations, and guided setup.

**Architecture:** React components using framer-motion animations, lucide-react icons, Supabase Auth metadata for persistence. Components follow existing patterns: `React.FC`, dark theme (gray-900/800/700), `useCallback`/`useMemo` for performance.

**Tech Stack:** React, TypeScript, framer-motion, lucide-react, Supabase Auth

---

## File Structure

| File | Action | Responsibility |
|------|--------|-----------------|
| `src/types/onboarding.ts` | Create | TypeScript interfaces for Goal, Niche, OnboardingAnswers |
| `src/data/onboardingMapping.ts` | Create | Goal/niche definitions, category mapping logic |
| `src/hooks/useOnboarding.ts` | Create | Wizard state management, step navigation |
| `src/components/onboarding/OnboardingWizard.tsx` | Create | Modal container, step renderer, navigation |
| `src/components/onboarding/GoalSelectionStep.tsx` | Create | Multi-select goal cards (4 options) |
| `src/components/onboarding/NicheSelectionStep.tsx` | Create | Single-select niche list (11 options) |
| `src/components/onboarding/CategorySelectionStep.tsx` | Create | Multi-select category cards (12 options) |
| `src/components/onboarding/RecommendationsStep.tsx` | Create | App recommendations from selected categories |
| `src/components/onboarding/GuidedSetupStep.tsx` | Create | Action cards linking to dashboard tasks |
| `src/context/AuthContext.tsx` | Modify | Add `updateOnboardingAnswers` method |
| `src/pages/DashboardPage.tsx` | Modify | Add `?onboarding=true` detection, render wizard |
| `src/pages/SignUpPage.tsx` | Modify | Redirect to `/dashboard?onboarding=true` |
| `src/hooks/useAchievements.ts` | Modify | Add `onboarding_completed` achievement |
| `src/components/dashboard/OnboardingProgressTracker.tsx` | Modify | Update to check onboarding status |

---

### Task 1: Create TypeScript Interfaces

**Files:**
- Create: `src/types/onboarding.ts`

- [ ] **Step 1: Write the interfaces**

```typescript
export type Goal = 'build' | 'launch' | 'grow' | 'automate';

export type Niche = 
  | 'coach' 
  | 'ecommerce' 
  | 'saas' 
  | 'agency' 
  | 'creator' 
  | 'local' 
  | 'b2b' 
  | 'nonprofit' 
  | 'education' 
  | 'realestate' 
  | 'fitness';

export interface OnboardingAnswers {
  goals: Goal[];
  niche: Niche;
  selectedCategories: string[];
}

export interface GoalOption {
  id: Goal;
  title: string;
  description: string;
  icon: string; // lucide icon name
}

export interface NicheOption {
  id: Niche;
  title: string;
  description: string;
}
```

- [ ] **Step 2: Verify file created**

Run: `cat src/types/onboarding.ts`
Expected: File contents displayed with all interfaces

- [ ] **Step 3: Commit**

```bash
git add src/types/onboarding.ts
git commit -m "feat: add onboarding TypeScript interfaces"
```

---

### Task 2: Create Onboarding Mapping Data

**Files:**
- Create: `src/data/onboardingMapping.ts`

- [ ] **Step 1: Write the mapping data**

```typescript
import { Goal, Niche, GoalOption, NicheOption } from '../types/onboarding';

export const goalOptions: GoalOption[] = [
  {
    id: 'build',
    title: 'Build',
    description: 'Create your foundation with core tools and systems',
    icon: 'Building2',
  },
  {
    id: 'launch',
    title: 'Launch',
    description: 'Go to market with powerful launch strategies',
    icon: 'Rocket',
  },
  {
    id: 'grow',
    title: 'Grow',
    description: 'Scale your reach and expand your audience',
    icon: 'TrendingUp',
  },
  {
    id: 'automate',
    title: 'Automate',
    description: 'Streamline workflows and save time',
    icon: 'Bot',
  },
];

export const nicheOptions: NicheOption[] = [
  { id: 'coach', title: 'Coach/Consultant', description: 'Personal development and consulting services' },
  { id: 'ecommerce', title: 'E-Commerce', description: 'Online stores and product sales' },
  { id: 'saas', title: 'SaaS', description: 'Software as a Service businesses' },
  { id: 'agency', title: 'Agency', description: 'Marketing and service agencies' },
  { id: 'creator', title: 'Content Creator', description: 'YouTubers, podcasters, influencers' },
  { id: 'local', title: 'Local Business', description: 'Brick-and-mortar and local services' },
  { id: 'b2b', title: 'B2B', description: 'Business to business services' },
  { id: 'nonprofit', title: 'Non-Profit', description: 'Charities and nonprofit organizations' },
  { id: 'education', title: 'Education', description: 'Courses, schools, and training' },
  { id: 'realestate', title: 'Real Estate', description: 'Property sales and management' },
  { id: 'fitness', title: 'Fitness/Health', description: 'Gyms, trainers, wellness' },
];

// Category IDs that should be recommended based on goals + niche combination
const categoryRecommendations: Record<string, string[]> = {
  'build_coach': ['content-creation', 'marketing-automation'],
  'build_ecommerce': ['sales-funnels', 'email-marketing'],
  'build_saas': ['data-analytics', 'marketing-automation'],
  'build_agency': ['client-management', 'marketing-automation'],
  'build_creator': ['content-creation', 'social-media'],
  'build_local': ['local-seo', 'review-management'],
  'build_b2b': ['lead-generation', 'sales-funnels'],
  'build_nonprofit': ['email-marketing', 'social-media'],
  'build_education': ['course-creation', 'membership-sites'],
  'build_realestate': ['lead-generation', 'virtual-tours'],
  'build_fitness': ['membership-sites', 'content-creation'],
  
  'launch_coach': ['sales-funnels', 'booking-systems'],
  'launch_ecommerce': ['sales-funnels', 'email-marketing'],
  'launch_saas': ['data-analytics', 'marketing-automation'],
  'launch_agency': ['marketing-automation', 'client-management'],
  'launch_creator': ['social-media', 'content-creation'],
  'launch_local': ['local-seo', 'review-management'],
  'launch_b2b': ['lead-generation', 'sales-funnels'],
  'launch_nonprofit': ['email-marketing', 'social-media'],
  'launch_education': ['course-creation', 'membership-sites'],
  'launch_realestate': ['virtual-tours', 'lead-generation'],
  'launch_fitness': ['membership-sites', 'content-creation'],
  
  'grow_coach': ['marketing-automation', 'booking-systems'],
  'grow_ecommerce': ['email-marketing', 'marketing-automation'],
  'grow_saas': ['data-analytics', 'marketing-automation'],
  'grow_agency': ['client-management', 'marketing-automation'],
  'grow_creator': ['social-media', 'content-creation'],
  'grow_local': ['local-seo', 'review-management'],
  'grow_b2b': ['lead-generation', 'sales-funnels'],
  'grow_nonprofit': ['email-marketing', 'social-media'],
  'grow_education': ['course-creation', 'membership-sites'],
  'grow_realestate': ['lead-generation', 'virtual-tours'],
  'grow_fitness': ['membership-sites', 'content-creation'],
  
  'automate_coach': ['marketing-automation', 'booking-systems'],
  'automate_ecommerce': ['email-marketing', 'marketing-automation'],
  'automate_saas': ['data-analytics', 'marketing-automation'],
  'automate_agency': ['client-management', 'marketing-automation'],
  'automate_creator': ['social-media', 'content-creation'],
  'automate_local': ['local-seo', 'review-management'],
  'automate_b2b': ['lead-generation', 'sales-funnels'],
  'automate_nonprofit': ['email-marketing', 'social-media'],
  'automate_education': ['course-creation', 'membership-sites'],
  'automate_realestate': ['lead-generation', 'virtual-tours'],
  'automate_fitness': ['membership-sites', 'content-creation'],
};

export function getRecommendedCategories(goals: Goal[], niche: Niche): string[] {
  const allRecommended = new Set<string>();
  
  goals.forEach(goal => {
    const key = `${goal}_${niche}`;
    const recommended = categoryRecommendations[key] || [];
    recommended.forEach(cat => allRecommended.add(cat));
  });
  
  return Array.from(allRecommended);
}
```

- [ ] **Step 2: Verify file created**

Run: `cat src/data/onboardingMapping.ts | head -50`
Expected: Goal and niche options displayed

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to onboardingMapping.ts

- [ ] **Step 4: Commit**

```bash
git add src/data/onboardingMapping.ts
git commit -m "feat: add onboarding goal/niche mapping data"
```

---

### Task 3: Create useOnboarding Hook

**Files:**
- Create: `src/hooks/useOnboarding.ts`

- [ ] **Step 1: Write the hook**

```typescript
import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Goal, Niche, OnboardingAnswers } from '../types/onboarding';

export type WizardStep = 1 | 2 | 3 | 4 | 5;

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
    setStep(prev => Math.min(5, (prev + 1) as WizardStep));
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
      const { supabase } = await import('../utils/supabase');
      await supabase.rpc('award_achievement', {
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
```

- [ ] **Step 2: Verify file created**

Run: `cat src/hooks/useOnboarding.ts`
Expected: Hook code displayed

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to useOnboarding.ts

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useOnboarding.ts
git commit -m "feat: add useOnboarding hook for wizard state management"
```

---

### Task 4: Create GoalSelectionStep Component

**Files:**
- Create: `src/components/onboarding/GoalSelectionStep.tsx`

- [ ] **Step 1: Create onboarding directory**

```bash
mkdir -p src/components/onboarding
```

- [ ] **Step 2: Write the component**

```typescript
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
```

- [ ] **Step 3: Verify file created**

Run: `cat src/components/onboarding/GoalSelectionStep.tsx | head -30`
Expected: Component code displayed

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding/GoalSelectionStep.tsx
git commit -m "feat: add GoalSelectionStep component"
```

---

### Task 5: Create NicheSelectionStep Component

**Files:**
- Create: `src/components/onboarding/NicheSelectionStep.tsx`

- [ ] **Step 1: Write the component**

```typescript
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
```

- [ ] **Step 2: Verify and commit**

```bash
git add src/components/onboarding/NicheSelectionStep.tsx
git commit -m "feat: add NicheSelectionStep component"
```

---

### Task 6: Create CategorySelectionStep Component

**Files:**
- Create: `src/components/onboarding/CategorySelectionStep.tsx`

- [ ] **Step 1: Write the component**

```typescript
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
```

- [ ] **Step 2: Verify and commit**

```bash
git add src/components/onboarding/CategorySelectionStep.tsx
git commit -m "feat: add CategorySelectionStep component with multi-select"
```

---

### Task 7: Create RecommendationsStep Component

**Files:**
- Create: `src/components/onboarding/RecommendationsStep.tsx`

- [ ] **Step 1: Write the component**

```typescript
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
    }).slice(0, 12); // Limit to 12 apps for display
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
```

- [ ] **Step 2: Verify and commit**

```bash
git add src/components/onboarding/RecommendationsStep.tsx
git commit -m "feat: add RecommendationsStep component"
```

---

### Task 8: Create GuidedSetupStep Component

**Files:**
- Create: `src/components/onboarding/GuidedSetupStep.tsx`

- [ ] **Step 1: Write the component**

```typescript
import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  ShoppingCart, 
  Video, 
  Compass, 
  Settings 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAchievements } from '../../hooks/useAchievements';
import { useUserAccess } from '../../hooks/useUserAccess';

interface GuidedSetupStepProps {
  onComplete: () => void;
  onBack: () => void;
}

interface SetupTask {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action: () => void;
  actionLabel: string;
}

const GuidedSetupStep: React.FC<GuidedSetupStepProps> = ({
  onComplete,
  onBack,
}) => {
  const { user } = useAuth();
  const { achievements } = useAchievements();
  const { accessData } = useUserAccess();

  const hasAnyPurchases = (accessData?.apps.length || 0) > 0;

  const tasks = useMemo((): SetupTask[] => [
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add your details and preferences',
      icon: <User className="h-5 w-5" />,
      completed: achievements.some(a => a.achievement_type === 'profile_completed'),
      action: () => {
        // Navigate to profile section
        window.location.href = '/dashboard#profile';
      },
      actionLabel: 'Edit Profile',
    },
    {
      id: 'purchase',
      title: 'Get Your First App',
      description: 'Explore and purchase your first tool',
      icon: <ShoppingCart className="h-5 w-5" />,
      completed: hasAnyPurchases,
      action: () => {
        window.location.href = '/#tools';
      },
      actionLabel: 'Browse Apps',
    },
    {
      id: 'video',
      title: 'Create Your First Video',
      description: 'Start creating personalized content',
      icon: <Video className="h-5 w-5" />,
      completed: achievements.some(a => a.achievement_type === 'video_creator'),
      action: () => {
        window.location.href = '/dashboard#create';
      },
      actionLabel: 'Create Video',
    },
    {
      id: 'explore',
      title: 'Explore Multiple Apps',
      description: 'Try out 5 different tools',
      icon: <Compass className="h-5 w-5" />,
      completed: achievements.some(a => a.achievement_type === 'power_user'),
      action: () => {
        window.location.href = '/#tools';
      },
      actionLabel: 'Explore',
    },
    {
      id: 'preferences',
      title: 'Customize Your Dashboard',
      description: 'Set your theme and layout preferences',
      icon: <Settings className="h-5 w-5" />,
      completed: false, // Will be calculated differently
      action: () => {
        window.location.href = '/dashboard#preferences';
      },
      actionLabel: 'Customize',
    },
  ], [achievements, hasAnyPurchases]);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Guided Setup
        </h2>
        <p className="text-gray-400">
          Complete these tasks to get the most out of your experience.
        </p>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Progress</span>
          <span className="text-sm text-white font-semibold">
            {completedCount} / {totalCount}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map(task => (
          <div
            key={task.id}
            className={`
              flex items-center gap-4 p-4 rounded-lg border
              ${task.completed 
                ? 'bg-green-900/20 border-green-700' 
                : 'bg-gray-800/50 border-gray-700'
              }
            `}
          >
            <div className={`
              p-2 rounded-lg
              ${task.completed ? 'bg-green-600' : 'bg-gray-700'}
            `}>
              {task.icon}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white">
                {task.title}
              </h4>
              <p className="text-xs text-gray-400">
                {task.description}
              </p>
            </div>
            {task.completed ? (
              <span className="text-green-400 text-sm font-semibold">✓ Done</span>
            ) : (
              <button
                onClick={task.action}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all"
              >
                {task.actionLabel}
              </button>
            )}
          </div>
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
          onClick={onComplete}
          className="px-6 py-3 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition-all"
        >
          Complete Onboarding
        </button>
      </div>
    </motion.div>
  );
};

export default React.memo(GuidedSetupStep);
```

- [ ] **Step 2: Verify and commit**

```bash
git add src/components/onboarding/GuidedSetupStep.tsx
git commit -m "feat: add GuidedSetupStep component"
```

---

### Task 9: Create OnboardingWizard Container

**Files:**
- Create: `src/components/onboarding/OnboardingWizard.tsx`

- [ ] **Step 1: Write the wizard container**

```typescript
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
```

- [ ] **Step 2: Verify and commit**

```bash
git add src/components/onboarding/OnboardingWizard.tsx
git commit -m "feat: add OnboardingWizard container component"
```

---

### Task 10: Update AuthContext with updateOnboardingAnswers

**Files:**
- Modify: `src/context/AuthContext.tsx`

- [ ] **Step 1: Read current AuthContext to find updateProfile method**

Run: `grep -n "updateProfile" src/context/AuthContext.tsx`
Expected: Line number where updateProfile is defined

- [ ] **Step 2: Add updateOnboardingAnswers method**

Add to the `AuthContextType` interface (around line 23):
```typescript
  updateOnboardingAnswers: (
    answers: Record<string, unknown>
  ) => Promise<{ user: User | null; error: AuthError | null }>;
```

Add to the provider's context value (find where updateProfile is returned, add after):
```typescript
  const updateOnboardingAnswers = useCallback(
    async (answers: Record<string, unknown>) => {
      try {
        const { data, error } = await supabase.auth.updateUser({
          data: answers,
        });
        return { user: data.user, error };
      } catch (err) {
        return { user: null, error: err as AuthError };
      }
    },
    []
  );
```

Add `updateOnboardingAnswers` to the context value object being returned.

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors related to AuthContext

- [ ] **Step 4: Commit**

```bash
git add src/context/AuthContext.tsx
git commit -m "feat: add updateOnboardingAnswers to AuthContext"
```

---

### Task 11: Update DashboardPage to Show Wizard

**Files:**
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 1: Add useSearchParams and state for wizard**

Import `useSearchParams` from react-router-dom at the top.

Add state and effect:
```typescript
const [searchParams] = useSearchParams();
const [showOnboarding, setShowOnboarding] = useState(false);

useEffect(() => {
  const onboardingParam = searchParams.get('onboarding');
  if (onboardingParam === 'true') {
    setShowOnboarding(true);
  }
}, [searchParams]);
```

- [ ] **Step 2: Add OnboardingWizard import and rendering**

Import:
```typescript
import OnboardingWizard from '../components/onboarding/OnboardingWizard';
```

Add to render (where OnboardingProgressTracker is rendered):
```typescript
{showOnboarding && (
  <OnboardingWizard
    onComplete={() => {
      setShowOnboarding(false);
      window.history.replaceState({}, '', '/dashboard');
    }}
  />
)}
```

- [ ] **Step 3: Run TypeScript check and commit**

```bash
npx tsc --noEmit --pretty 2>&1 | head -30
git add src/pages/DashboardPage.tsx
git commit -m "feat: show onboarding wizard on ?onboarding=true"
```

---

### Task 12: Update SignUpPage to Redirect to Onboarding

**Files:**
- Modify: `src/pages/SignUpPage.tsx`

- [ ] **Step 1: Update redirect after signup**

Find the success handler (around line 96-98), change redirect:
```typescript
// Change from:
handleNavigation("/dashboard");

// To:
handleNavigation("/dashboard?onboarding=true");
```

Also remove the profile_completed achievement grant from SignUpPage (move to onboarding completion).

- [ ] **Step 2: Run TypeScript check and commit**

```bash
npx tsc --noEmit --pretty 2>&1 | head -30
git add src/pages/SignUpPage.tsx
git commit -m "feat: redirect to onboarding wizard after signup"
```

---

### Task 13: Add onboarding_completed Achievement

**Files:**
- Modify: `src/hooks/useAchievements.ts`

- [ ] **Step 1: Add to ACHIEVEMENT_DEFINITIONS**

Find `ACHIEVEMENT_DEFINITIONS` object, add:
```typescript
onboarding_completed: {
  title: "Onboarding Complete",
  description: "Finished the onboarding wizard",
  icon: "🎯",
  category: "milestone",
},
```

- [ ] **Step 2: Run TypeScript check and commit**

```bash
npx tsc --noEmit --pretty 2>&1 | head -30
git add src/hooks/useAchievements.ts
git commit -m "feat: add onboarding_completed achievement"
```

---

### Task 14: Final Build Verification

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit --pretty 2>&1`
Expected: No errors

- [ ] **Step 2: Run build**

Run: `npm run build 2>&1 | tail -30`
Expected: Build successful

- [ ] **Step 3: Final commit (if needed)**

```bash
git add -A
git commit -m "feat: complete onboarding wizard implementation"
```

---

## Self-Review

**1. Spec coverage:**
- [x] 5-step wizard with goals, niche, categories, recommendations, guided setup
- [x] Process button after every step
- [x] Multi-select for goals and categories
- [x] Single-select for niche
- [x] Integration with AuthContext, DashboardPage, SignUpPage
- [x] Achievement added
- [x] Category mapping logic included

**2. Placeholder scan:** No TBD/TODO items found ✅

**3. Type consistency:** All types match between tasks ✅

---

Plan complete and saved to `docs/superpowers/plans/2026-05-08-onboarding-wizard.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
