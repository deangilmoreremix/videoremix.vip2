import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, Gift, ChevronDown, Shield, FileVideo } from "lucide-react";
import { useLandingPageContent } from "../context/LandingPageContext";
import MagicSparkles from "./MagicSparkles";

export const PricingSection: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<
    "monthly" | "yearly" | "lifetime"
  >("yearly");
  const { pricingPlans, isLoading } = useLandingPageContent();

  // Default pricing data structure as fallback
  const defaultPlans = [
    {
      name: "Free",
      price_monthly: 0,
      price_yearly: 0,
      price_lifetime: 0,
      description: "Perfect for trying out the platform",
      features: [
        "5 video exports per month",
        "720p video quality",
        "Basic editing features",
        "2GB cloud storage",
        "Standard templates",
        "Watermarked videos",
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
        "Unlimited video exports",
        "4K video quality",
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

  // Use dynamic data from Supabase if available
  const plans =
    !isLoading && pricingPlans && pricingPlans.length > 0
      ? pricingPlans
      : defaultPlans;

  // Find the popular plan
  const popularPlan = plans.find((plan) => plan.is_popular) || plans[1];

  // Find the basic plan
  const basicPlan = plans.find((plan) => plan.price_monthly === 0) || plans[0];

  // Categorized features for expanded display
  const featureCategories = [
    {
      title: "Video Creation & Editing",
      features: [
        {
          title: "AI Video Creation",
          basic: "Limited to 5 videos",
          pro: "Unlimited",
          business: "Unlimited with priority processing",
        },
        {
          title: "Video Quality",
          basic: "720p",
          pro: "4K",
          business: "4K",
        },
        {
          title: "AI Editing Tools",
          basic: "Basic editing",
          pro: "Advanced editing",
          business: "Professional suite",
        },
        {
          title: "Smart Templates",
          basic: "5 templates",
          pro: "500+ templates",
          business: "500+ templates + custom",
        },
        {
          title: "Content Repurposing",
          basic: "✕",
          pro: "✓",
          business: "✓ Advanced",
        },
        {
          title: "Auto Captions",
          basic: "✕",
          pro: "✓ 40+ languages",
          business: "✓ 100+ languages",
        },
      ],
    },
    {
      title: "Personalization Tools",
      features: [
        {
          title: "Audience Segmentation",
          basic: "2 segments",
          pro: "Unlimited segments",
          business: "Unlimited with AI segmentation",
        },
        {
          title: "Marketing Personalization",
          basic: "Basic",
          pro: "Advanced",
          business: "Enterprise-level",
        },
        {
          title: "Personalized Video Creation",
          basic: "✕",
          pro: "✓",
          business: "✓ Advanced",
        },
        {
          title: "Dynamic Content",
          basic: "✕",
          pro: "✓",
          business: "✓ Advanced",
        },
        {
          title: "AI Content Suggestions",
          basic: "✕",
          pro: "Basic",
          business: "Advanced",
        },
        {
          title: "Custom Branding",
          basic: "Limited",
          pro: "Full branding kit",
          business: "Multiple brand profiles",
        },
      ],
    },
    {
      title: "Collaboration & Workflow",
      features: [
        {
          title: "Team Members",
          basic: "1 user",
          pro: "2 users",
          business: "10 users",
        },
        {
          title: "Collaboration Tools",
          basic: "✕",
          pro: "✓",
          business: "✓ Advanced",
        },
        {
          title: "Approval Workflows",
          basic: "✕",
          pro: "Basic",
          business: "Advanced",
        },
        {
          title: "Version History",
          basic: "Limited",
          pro: "30 days",
          business: "Unlimited",
        },
        {
          title: "Role-Based Permissions",
          basic: "✕",
          pro: "Basic roles",
          business: "Advanced custom roles",
        },
        {
          title: "Team Projects",
          basic: "✕",
          pro: "Up to 5",
          business: "Unlimited",
        },
      ],
    },
    {
      title: "Storage & Publishing",
      features: [
        {
          title: "Cloud Storage",
          basic: "2GB",
          pro: "50GB",
          business: "500GB",
        },
        {
          title: "Direct Publishing",
          basic: "2 platforms",
          pro: "All major platforms",
          business: "All platforms + scheduling",
        },
        {
          title: "Video Analytics",
          basic: "Basic",
          pro: "Advanced",
          business: "Enterprise",
        },
        {
          title: "API Access",
          basic: "✕",
          pro: "Limited",
          business: "Full access",
        },
        {
          title: "Scheduled Publishing",
          basic: "✕",
          pro: "Basic",
          business: "Advanced with calendar",
        },
        {
          title: "Batch Processing",
          basic: "✕",
          pro: "Up to 5 videos",
          business: "Unlimited",
        },
      ],
    },
    {
      title: "AI Features & Personalization",
      features: [
        {
          title: "AI Voice Generation",
          basic: "2 voices",
          pro: "30+ voices",
          business: "100+ voices + custom voices",
        },
        {
          title: "AI Background Removal",
          basic: "5 per month",
          pro: "Unlimited",
          business: "Unlimited with batch processing",
        },
        {
          title: "AI Scene Detection",
          basic: "Basic",
          pro: "Advanced",
          business: "Professional",
        },
        {
          title: "AI Music Generation",
          basic: "✕",
          pro: "✓",
          business: "✓ Custom mood profiles",
        },
        {
          title: "AI Video Enhancer",
          basic: "✕",
          pro: "Basic enhancement",
          business: "Professional enhancement",
        },
        {
          title: "Personalized Thumbnails",
          basic: "✕",
          pro: "AI-generated options",
          business: "Advanced A/B testing",
        },
      ],
    },
    {
      title: "Support & Training",
      features: [
        {
          title: "Support Channels",
          basic: "Email",
          pro: "Email + Chat",
          business: "Email + Chat + Phone",
        },
        {
          title: "Response Time",
          basic: "48 hours",
          pro: "24 hours",
          business: "4 hours",
        },
        {
          title: "Onboarding",
          basic: "Self-service",
          pro: "Guided setup",
          business: "Dedicated onboarding specialist",
        },
        {
          title: "Training Resources",
          basic: "Knowledge base",
          pro: "Tutorials + Webinars",
          business: "Custom training sessions",
        },
        {
          title: "Dedicated Account Manager",
          basic: "✕",
          pro: "✕",
          business: "✓",
        },
        {
          title: "SLA",
          basic: "✕",
          pro: "✕",
          business: "✓",
        },
      ],
    },
  ];

  // Features that are restricted in the basic plan but available in Pro
  const restrictedFeatures = [
    "Advanced AI effects",
    "Brand kit integration",
    "Multi-platform optimization",
    "Bulk export capabilities",
    "API access",
  ];

  // Bonuses to add value to the offer
  const bonuses = [
    {
      title: "Video Marketing Blueprint",
      value: "$297",
      description:
        "Learn how to create videos that convert viewers into customers.",
    },
    {
      title: "Viral Video Templates Pack",
      value: "$197",
      description:
        "10 exclusive templates proven to increase engagement and shares.",
    },
    {
      title: "Social Media Calendar",
      value: "$97",
      description:
        "12-month content planning calendar with video ideas for every platform.",
    },
  ];

  // State for expanded features section
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  // Effect for discount timer
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newSeconds = prev.seconds - 1;

        if (newSeconds >= 0) {
          return { ...prev, seconds: newSeconds };
        }

        const newMinutes = prev.minutes - 1;

        if (newMinutes >= 0) {
          return { minutes: newMinutes, seconds: 59 };
        }

        const newHours = prev.hours - 1;

        if (newHours >= 0) {
          return { hours: newHours, minutes: 59, seconds: 59 };
        }

        clearInterval(interval);
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Get pricing based on billing cycle
  const getPrice = (plan) => {
    switch (billingCycle) {
      case "monthly":
        return plan.price_monthly;
      case "yearly":
        return plan.price_yearly;
      case "lifetime":
        return plan.price_lifetime || plan.price_yearly * 3.5; // Fallback if no lifetime price
      default:
        return plan.price_monthly;
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Pricing Section</h2>
          <p className="text-gray-300">Coming soon...</p>
        </div>
      </div>
    </section>
  );
};
