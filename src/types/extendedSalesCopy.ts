/**
 * Extended Sales Copy Interface
 * Concise, LLM-friendly format with GTM Skills tonality
 */
export interface ExtendedSalesCopy {
  // Identity
  tonality: string;
  tagline: string;
  summary: string;

  // Core content (concise)
  whatItDoes: string;
  howItWorks: string;
  howToProfit: {
    forLocalBusinesses: string;
    forIndividuals: string;
  };
  whyYouNeedIt: string;

  // Supporting (concise)
  useCases: Array<{
    industry: string;
    scenario: string;
    outcome: string;
  }>;
  testimonials: Array<{
    quote: string;
    name: string;
    role: string;
    businessType: string;
    rating: number;
  }>;

  // Optional
  icon?: string;
}
