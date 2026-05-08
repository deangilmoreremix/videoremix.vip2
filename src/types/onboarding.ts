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
