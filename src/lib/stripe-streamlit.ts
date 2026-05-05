import { stripe } from './stripe';

export interface StreamlitCheckoutData {
  appId: string;
  appName: string;
  tier: 'basic' | 'pro' | 'enterprise';
  price: number;
  userId: string;
  userEmail: string;
  metadata?: Record<string, any>;
}

export const createStreamlitCheckoutSession = async (data: StreamlitCheckoutData) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-streamlit-checkout-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          appId: data.appId,
          appName: data.appName,
          tier: data.tier,
          price: data.price,
          userId: data.userId,
          userEmail: data.userEmail,
          metadata: {
            ...data.metadata,
            purchase_type: 'streamlit_app',
            tier: data.tier,
            app_category: 'streamlit'
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create checkout session");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating Streamlit checkout session:', error);
    throw error;
  }
};

export const getStreamlitPricingTiers = () => {
  return {
    basic: {
      name: "Basic Access",
      price: 29,
      originalPrice: 49,
      features: [
        "Core Streamlit app functionality",
        "Basic customer support",
        "All future updates included",
        "Community access"
      ],
      description: "Perfect for individual users and small projects"
    },
    pro: {
      name: "Pro Access",
      price: 79,
      originalPrice: 129,
      features: [
        "Everything in Basic",
        "Advanced features unlocked",
        "Priority email support",
        "API access included",
        "Custom integrations",
        "Performance optimizations"
      ],
      description: "Ideal for teams and growing businesses"
    },
    enterprise: {
      name: "Enterprise",
      price: 199,
      originalPrice: 299,
      features: [
        "Everything in Pro",
        "White-label options",
        "Dedicated account manager",
        "SLA guarantee (99.9% uptime)",
        "Custom development",
        "On-premise deployment",
        "Advanced security features"
      ],
      description: "For large organizations with custom needs"
    }
  };
};

export const getStreamlitAppPricing = (appId: string, tier: 'basic' | 'pro' | 'enterprise' = 'basic') => {
  const tiers = getStreamlitPricingTiers();
  return tiers[tier];
};

export const calculateStreamlitDiscount = (tier: 'basic' | 'pro' | 'enterprise') => {
  const tierData = getStreamlitPricingTiers()[tier];
  const savings = tierData.originalPrice - tierData.price;
  const savingsPercent = Math.round((savings / tierData.originalPrice) * 100);

  return {
    savings,
    savingsPercent,
    finalPrice: tierData.price,
    originalPrice: tierData.originalPrice
  };
};