# Onboarding Wizard Design

**Date:** 2026-05-08  
**Status:** Approved  
**Plan Reference:** /workspaces/videoremix.vip2/.kilo/plans/1778199009848-stellar-river.md

## Overview

5-step onboarding wizard triggered after signup. Users select goals, niche, and categories to receive personalized app recommendations. Each step has a process button.

## Architecture & File Structure

```
src/
├── types/onboarding.ts          — Goal, Niche, OnboardingAnswers interfaces
├── data/
│   └── onboardingMapping.ts    — Goals (4), Niches (11), category mapping logic
├── hooks/
│   └── useOnboarding.ts       — Wizard state, step navigation, Supabase save
└── components/
    └── onboarding/
        ├── OnboardingWizard.tsx      — Modal container with step renderer
        ├── GoalSelectionStep.tsx     — Multi-select goals (4 cards)
        ├── NicheSelectionStep.tsx    — Single-select niche (11 options)
        ├── CategorySelectionStep.tsx  — Multi-select from 12 categories
        ├── RecommendationsStep.tsx   — Shows apps from selected categories
        └── GuidedSetupStep.tsx      — Maps to OnboardingProgressTracker tasks
```

## Data Models

```typescript
type Goal = 'build' | 'launch' | 'grow' | 'automate';
type Niche = 
  | 'coach' | 'ecommerce' | 'saas' | 'agency' | 'creator' 
  | 'local' | 'b2b' | 'nonprofit' | 'education' | 'realestate' | 'fitness';

interface OnboardingAnswers {
  goals: Goal[];
  niche: Niche;
  selectedCategories: string[]; // Category IDs from appCategories.ts
}
```

## Wizard Flow

| Step | Component | Selection | Process Button Label |
|------|-----------|-----------|---------------------|
| 1 | `GoalSelectionStep` | Multi-select (4 goals) | "Continue to Niche →" |
| 2 | `NicheSelectionStep` | Single-select (11 niches) | "Continue to Categories →" |
| 3 | `CategorySelectionStep` | Multi-select (12 categories, recommended pre-selected) | "Continue to Recommendations →" |
| 4 | `RecommendationsStep` | Auto-display apps from selected categories | "Continue to Setup →" |
| 5 | `GuidedSetupStep` | Action cards linking to dashboard tasks | "Complete Onboarding" |

## Category Mapping Logic

Goals + Niche → Recommended Categories (2-3):

```typescript
// onboardingMapping.ts
export function getRecommendedCategories(goals: Goal[], niche: Niche): string[] {
  const categoryMap: Record<string, string[]> = {
    'build_coach': ['content-creation', 'marketing-automation'],
    'launch_ecommerce': ['sales-funnels', 'email-marketing'],
    'grow_saas': ['data-analytics', 'marketing-automation'],
    'automate_agency': ['marketing-automation', 'sales-funnels', 'client-management'],
    // ... full mapping for all goal+niche combinations
  };

  const key = `${goals.sort().join('-')}_${niche}`;
  return categoryMap[key] || ['content-creation', 'marketing-automation'];
}
```

## Design Patterns (Matching Current App)

- **Components**: `React.FC` (not `React.FC<Props>`)
- **Animation**: framer-motion (`motion.div`, `AnimatePresence`)
- **Icons**: lucide-react
- **Theme**: Dark (gray-900/800/700 backgrounds), no gradients/glassmorphism
- **Performance**: `useCallback` for functions passed as props, `useMemo` for derived state, `React.memo` for pure components
- **Accessibility**: ARIA attributes on interactive elements
- **Navigation**: `window.location.href` (not `useNavigate`) per existing pattern

## Integration Points

### AuthContext.tsx
Add `updateOnboardingAnswers()` method:
```typescript
updateOnboardingAnswers: async (answers: OnboardingAnswers) => {
  const { error } = await supabase.auth.updateUser({
    data: { onboarding: answers, onboarding_completed: true }
  });
  return { error };
}
```

### DashboardPage.tsx
Detect `?onboarding=true` and render wizard:
```typescript
const [searchParams] = useSearchParams();
const showOnboarding = searchParams.get('onboarding') === 'true';

// In render:
{showOnboarding && <OnboardingWizard onComplete={() => navigate('/dashboard', { replace: true })} />}
```

### SignUpPage.tsx
Redirect to `/dashboard?onboarding=true` after signup (remove profile_completed achievement grant from here).

### useAchievements.ts
Add to `ACHIEVEMENT_DEFINITIONS`:
```typescript
onboarding_completed: {
  title: "Onboarding Complete",
  description: "Finished the onboarding wizard",
  icon: "🎯",
}
```

### OnboardingProgressTracker.tsx
Update to show "Complete Onboarding" task if `onboarding_completed` not in user metadata.

## Step Component Design

### GoalSelectionStep.tsx
- 4 cards in 2x2 grid
- Each card: icon, title, description
- Multi-select with checkmark indicator
- "Continue to Niche →" button (disabled if none selected)

### NicheSelectionStep.tsx
- 11 options in scrollable list or grid
- Single-select with radio-style indicator
- "Continue to Categories →" button (disabled if none selected)

### CategorySelectionStep.tsx
- 12 category cards with recommended badge
- Recommended categories pre-selected based on goals + niche
- Multi-select with checkmark
- Each card shows: name, offer angle, buyer persona
- "Continue to Recommendations →" button

### RecommendationsStep.tsx
- Display apps from `selectedCategories`
- Group by category
- Show app name, description, thumbnail
- "Continue to Setup →" button

### GuidedSetupStep.tsx
- Action cards matching `OnboardingProgressTracker` items:
  - Complete Your Profile
  - Get Your First App
  - Create Your First Video
  - Explore Multiple Apps
  - Customize Your Dashboard
- Each card links to relevant dashboard section
- "Complete Onboarding" button saves answers and awards achievement

## Error Handling

- Failed Supabase updates: Show toast notification, allow retry
- Missing categories: Fallback to default recommendations
- Network errors: Display error state with retry button

## Testing Strategy

- Unit tests for `onboardingMapping.ts` helper functions
- Component tests for each step (render, selection, navigation)
- Integration test: Full wizard flow with mocked Supabase
