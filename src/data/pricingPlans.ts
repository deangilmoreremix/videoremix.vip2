// src/data/pricingPlans.ts
//
// The fallback pricing tiers, used when Supabase has no pricing_plans rows.
// Shared by PricingSection and the landing page so the two never drift.

export interface PricingPlan {
  name: string;
  price_monthly: number;
  price_yearly: number;
  price_lifetime: number;
  description: string;
  features: string[];
  is_popular: boolean;
}

export const defaultPlans: PricingPlan[] = [
  {
    name: "Free",
    price_monthly: 0,
    price_yearly: 0,
    price_lifetime: 0,
    description: "Browse and preview the whole library",
    features: [
      "Browse all 117 apps",
      "See what each app does",
      "Search and filter by category",
      "Upgrade any time",
    ],
    is_popular: false,
  },
  {
    name: "Pro",
    price_monthly: 29,
    price_yearly: 290,
    price_lifetime: 699,
    description: "Run every app, for creators and small teams",
    features: [
      "Run all 117 apps",
      "Bring your own API keys",
      "Save and download results",
      "50GB cloud storage",
      "2 team members",
      "Priority email support",
    ],
    is_popular: true,
  },
  {
    name: "Business",
    price_monthly: 79,
    price_yearly: 790,
    price_lifetime: 1999,
    description: "For teams that need seats, API access and support",
    features: [
      "Everything in Pro",
      "500GB cloud storage",
      "10 team members",
      "API access",
      "White-label exports",
      "Dedicated account manager",
      "24/7 priority support",
    ],
    is_popular: false,
  },
];
