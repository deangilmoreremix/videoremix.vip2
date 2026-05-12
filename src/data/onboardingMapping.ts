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
