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
    description: "Perfect for trying out the platform",
    features: [
      "5 marketing campaigns per month",
      "Standard content quality",
      "Basic editing features",
      "2GB cloud storage",
      "Standard templates",
      "Watermarked campaigns",
    ],
    is_popular: false,
  },
  {
    name: "Pro",
    price_monthly: 29,
    price_yearly: 290,
    price_lifetime: 699,
    description: "Ideal for content creators and small teams",
    features: [
      "Unlimited campaigns",
      "High-quality content",
      "All editing features",
      "50GB cloud storage",
      "Premium templates",
      "No watermarks",
      "Basic AI features",
      "Auto subtitle generation",
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
    description: "For teams and professionals with advanced needs",
    features: [
      "Everything in Pro",
      "500GB cloud storage",
      "All AI features",
      "Advanced analytics",
      "White-label exports",
      "10 team members",
      "Custom templates",
      "API access",
      "Dedicated account manager",
      "24/7 priority support",
    ],
    is_popular: false,
  },
];
