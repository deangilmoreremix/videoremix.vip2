import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  Check,
  ExternalLink,
  Loader,
  Star,
  Users,
  Code,
  Zap,
  Shield,
  Clock,
  DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Analytics, PerformanceMonitor } from "../utils/analytics";
import { ABTestUtils } from "../utils/abTesting";
import { createStreamlitCheckoutSession } from "../lib/stripe-streamlit";

interface StreamlitApp {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  icon: React.ReactNode;
  price: number;
  features: string[];
  longDescription?: string;
  demoImage?: string;
  tags?: string[];
  complexity?: 'basic' | 'intermediate' | 'advanced';
  estimatedUsage?: string;
}

interface StreamlitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: StreamlitApp;
  selectedTier?: 'basic' | 'pro' | 'enterprise';
  onTierChange?: (tier: 'basic' | 'pro' | 'enterprise') => void;
}

const pricingTiers = {
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
    description: "Perfect for individual users and small projects",
    badge: "Most Popular",
    popular: true
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
    description: "Ideal for teams and growing businesses",
    badge: "Best Value",
    popular: false
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
    description: "For large organizations with custom needs",
    badge: "Enterprise",
    popular: false
  }
};

const StreamlitPaymentModal: React.FC<StreamlitPaymentModalProps> = ({
  isOpen,
  onClose,
  app,
  selectedTier = 'basic',
  onTierChange
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpenTime, setModalOpenTime] = useState<number | null>(null);
  const [ctaVariant, setCtaVariant] = useState<string>('Get Instant Access');

  const currentTier = pricingTiers[selectedTier];
  const savings = currentTier.originalPrice - currentTier.price;
  const savingsPercent = Math.round((savings / currentTier.originalPrice) * 100);

  // Track modal open/close
  useEffect(() => {
    if (isOpen) {
      setModalOpenTime(Date.now());
      const variant = ABTestUtils.getCtaButtonText(user?.id);
      setCtaVariant(variant);
      Analytics.trackModalOpen(app.id, 'streamlit_purchase');
      PerformanceMonitor.trackAnimationSmoothness(app.id, 'streamlit_modal_open');
    } else if (modalOpenTime) {
      const duration = Date.now() - modalOpenTime;
      Analytics.trackModalClose(app.id, 'streamlit_purchase', duration);
      setModalOpenTime(null);
    }
  }, [isOpen, app.id, modalOpenTime, user?.id]);

  // Track modal load time
  useEffect(() => {
    if (isOpen) {
      const endTracking = PerformanceMonitor.trackModalLoadTime(app.id);
      return endTracking;
    }
  }, [isOpen, app.id]);

  const handlePurchase = async (tier: keyof typeof pricingTiers = selectedTier) => {
    const tierData = pricingTiers[tier];

    // Track CTA click with A/B test variant
    Analytics.trackCtaClick(app.id, 'streamlit_purchase_now', {
      price: tierData.price,
      tier,
      user_logged_in: !!user,
      cta_variant: ctaVariant,
      test_id: 'streamlit_cta_button_text'
    });
    ABTestUtils.trackCtaClick('streamlit_cta_button_text', ctaVariant);

    if (!user) {
      Analytics.trackEvent('signin_redirect', {
        from_modal: true,
        app_id: app.id,
        purchase_type: 'streamlit'
      });
      onClose();
      document.dispatchEvent(new CustomEvent("open-signin-modal"));
      return;
    }

    // Track purchase start
    Analytics.trackPurchaseStart(app.id, tierData.price, { tier, type: 'streamlit' });

    setLoading(true);
    setError(null);

    try {
      const { url } = await createStreamlitCheckoutSession({
        appId: app.id,
        appName: app.name,
        tier,
        price: tierData.price,
        userId: user.id,
        userEmail: user.email || '',
      });

      if (url) {
        Analytics.trackPurchaseComplete(app.id, tierData.price, { tier, type: 'streamlit' });
        ABTestUtils.trackPurchase('streamlit_cta_button_text', ctaVariant, tierData.price);
        window.location.href = url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err: any) {
      console.error("Error creating Streamlit checkout session:", err);
      Analytics.trackError(`Streamlit purchase failed: ${err.message}`, 'streamlit_checkout_error', app.id);
      setError(err.message || "Failed to start checkout. Please try again.");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden border border-gray-700/50"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-full transition-colors backdrop-blur-sm"
            >
              <X className="h-5 w-5 text-gray-300" />
            </button>

            <div className="overflow-y-auto max-h-[95vh]">
              {/* Hero Section with App Preview */}
              <div className="relative h-64 md:h-80 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600/30 via-accent-500/20 to-purple-600/30" />
                <div className="absolute inset-0 bg-black/40" />

                {/* Floating elements for visual interest */}
                <div className="absolute top-8 left-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 bg-primary-500/20 rounded-full blur-xl"
                  />
                </div>
                <div className="absolute bottom-8 right-8">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-12 h-12 bg-accent-500/30 rounded-full blur-lg"
                  />
                </div>

                <div className="relative h-full flex items-center">
                  <div className="container mx-auto px-8">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      {/* App Info */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-3 bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-600/30">
                            {React.isValidElement(app.icon)
                              ? React.cloneElement(app.icon as React.ReactElement, {
                                  className: "h-8 w-8 text-primary-400",
                                })
                              : <Code className="h-8 w-8 text-primary-400" />}
                          </div>
                          <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white">
                              {app.name}
                            </h2>
                            <p className="text-primary-300 font-medium uppercase text-sm tracking-wider">
                              {app.category.replace('-', ' ')}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-300 text-lg leading-relaxed">
                          {app.description}
                        </p>
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                            <span className="text-gray-300 text-sm ml-2">4.9/5</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-400">
                            <Users className="h-4 w-4" />
                            <span className="text-sm">1,200+ users</span>
                          </div>
                        </div>
                      </motion.div>

                      {/* App Preview */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="relative"
                      >
                        <div className="relative bg-gray-800/40 backdrop-blur-sm rounded-xl p-4 border border-gray-600/30">
                          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                            <img
                              src={app.demoImage || app.image}
                              alt={`${app.name} preview`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4">
                              <div className="flex items-center gap-2 text-white">
                                <Code className="h-4 w-4" />
                                <span className="text-sm font-medium">Streamlit App Preview</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="p-8">
                {/* Pricing Tiers */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-8"
                >
                  <h3 className="text-2xl font-bold text-white mb-6 text-center">
                    Choose Your Access Level
                  </h3>

                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    {(Object.keys(pricingTiers) as Array<keyof typeof pricingTiers>).map((tierKey) => {
                      const tier = pricingTiers[tierKey];
                      const isSelected = selectedTier === tierKey;

                      return (
                        <motion.div
                          key={tierKey}
                          whileHover={{ scale: 1.02 }}
                          className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary-500 bg-primary-900/20 shadow-lg shadow-primary-500/20'
                              : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                          }`}
                          onClick={() => onTierChange?.(tierKey)}
                        >
                          {tier.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <span className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                {tier.badge}
                              </span>
                            </div>
                          )}

                          <div className="text-center mb-4">
                            <h4 className="text-lg font-bold text-white mb-2">{tier.name}</h4>
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <span className="text-3xl font-bold text-white">${tier.price}</span>
                              <span className="text-gray-400 line-through">${tier.originalPrice}</span>
                            </div>
                            <span className="text-green-400 text-sm font-medium">
                              Save ${savings} ({savingsPercent}% off)
                            </span>
                          </div>

                          <p className="text-gray-300 text-sm text-center mb-4">
                            {tier.description}
                          </p>

                          <ul className="space-y-2">
                            {tier.features.slice(0, 3).map((feature, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm">
                                <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">{feature}</span>
                              </li>
                            ))}
                            {tier.features.length > 3 && (
                              <li className="text-primary-400 text-sm font-medium">
                                +{tier.features.length - 3} more features
                              </li>
                            )}
                          </ul>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Selected Plan Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-primary-900/40 to-accent-700/40 border border-primary-500/30 rounded-xl p-6 mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-white mb-1">
                        {currentTier.name}
                      </h4>
                      <p className="text-gray-300">{currentTier.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-4xl font-bold text-white">${currentTier.price}</span>
                        <span className="text-gray-400 line-through text-lg">${currentTier.originalPrice}</span>
                      </div>
                      <span className="text-green-400 text-sm font-medium">
                        Save ${savings} ({savingsPercent}% off)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase()}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-500 hover:to-accent-400 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-4"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5" />
                        <span>{ctaVariant}</span>
                        <span className="text-sm opacity-90">• ${currentTier.price} one-time</span>
                      </>
                    )}
                  </button>

                  {error && (
                    <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm">
                      {error}
                    </div>
                  )}

                  <p className="text-center text-gray-400 text-sm">
                    Secure payment powered by Stripe • Instant access after payment
                  </p>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid md:grid-cols-2 gap-6 mb-8"
                >
                  <div>
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary-400" />
                      What's Included
                    </h4>
                    <ul className="space-y-3">
                      {currentTier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-primary-600/20 rounded-full flex items-center justify-center mt-0.5">
                            <Check className="h-4 w-4 text-primary-400" />
                          </div>
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-400" />
                      Why Choose This App
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-600/20 rounded-full flex items-center justify-center mt-0.5">
                          <Clock className="h-4 w-4 text-green-400" />
                        </div>
                        <span className="text-gray-300">30-day money-back guarantee</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-600/20 rounded-full flex items-center justify-center mt-0.5">
                          <Zap className="h-4 w-4 text-green-400" />
                        </div>
                        <span className="text-gray-300">Instant access after purchase</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-600/20 rounded-full flex items-center justify-center mt-0.5">
                          <Shield className="h-4 w-4 text-green-400" />
                        </div>
                        <span className="text-gray-300">Secure payment processing</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-600/20 rounded-full flex items-center justify-center mt-0.5">
                          <Users className="h-4 w-4 text-green-400" />
                        </div>
                        <span className="text-gray-300">24/7 customer support</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>

                {/* Trust Indicators */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid md:grid-cols-3 gap-4"
                >
                  <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-yellow-400" />
                      <span className="text-yellow-400 font-bold">4.9/5</span>
                    </div>
                    <div className="text-gray-300 text-sm">Average Rating</div>
                  </div>
                  <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-primary-400" />
                      <span className="text-white font-bold">1,200+</span>
                    </div>
                    <div className="text-gray-300 text-sm">Happy Customers</div>
                  </div>
                  <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-green-400" />
                      <span className="text-green-400 font-bold">100%</span>
                    </div>
                    <div className="text-gray-300 text-sm">Money Back</div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StreamlitPaymentModal;