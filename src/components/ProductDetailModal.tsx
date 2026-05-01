import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  Users,
  Check,
  Lock,
  Play,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  TrendingUp,
  Target,
  Zap,
  Award,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useUserAccess } from "../hooks/useUserAccess";
import { getAppUrl } from "../config/appUrls";
import { ExtendedSalesCopy } from "../types/extendedSalesCopy";

interface ProductDetailModalProps {
  app: {
    id: string;
    name: string;
    description: string;
    image: string;
    category: string;
    url?: string;
  };
  salesCopy?: ExtendedSalesCopy;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  app,
  salesCopy,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { hasAccessToApp } = useUserAccess();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isOwned = user && hasAccessToApp(app.id);
  const appUrl = getAppUrl(app.id);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!app) return null;

  // Category colors
  const getCategoryColor = (category: string) => {
    const colors: Record<string, { primary: string; accent: string }> = {
      video: { primary: "from-indigo-600", accent: "text-indigo-400" },
      "ai-image": { primary: "from-pink-600", accent: "text-pink-400" },
      creative: { primary: "from-teal-600", accent: "text-teal-400" },
      "lead-gen": { primary: "from-emerald-600", accent: "text-emerald-400" },
      personalizer: { primary: "from-violet-600", accent: "text-violet-400" },
      branding: { primary: "from-amber-600", accent: "text-amber-400" },
    };
    return colors[category] || { primary: "from-primary-600", accent: "text-primary-400" };
  };

  const colors = getCategoryColor(app.category);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-gray-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Hero Section */}
            <div className={`relative bg-gradient-to-br ${colors.primary} to-primary-800`}>
              {/* Thumbnail with overlay */}
              <div className="relative aspect-video">
                <img
                  src={app.image}
                  alt={app.name}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => setImageLoaded(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-black/40 to-transparent" />
                
                {/* App info overlay */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-white">
                          {app.name}
                        </h1>
                        {user && (
                          <>
                            {isOwned ? (
                              <span className="bg-green-600 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1">
                                <Check className="h-4 w-4" /> OWNED
                              </span>
                            ) : (
                              <span className="bg-gray-600 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1">
                                <Lock className="h-4 w-4" /> LOCKED
                              </span>
                            )}
                          </>
                        )}
                        {app.category && (
                          <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                            {app.category}
                          </span>
                        )}
                      </div>
                      {salesCopy?.tagline && (
                        <p className={`text-lg ${colors.accent} italic mb-4`}>
                          {salesCopy.tagline}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-200">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          1,200+ users
                        </span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className="h-4 w-4 text-yellow-500 fill-yellow-500"
                            />
                          ))}
                          <span className="ml-1">4.8/5</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      {isOwned ? (
                        <a
                          href={appUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white text-gray-900 px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors"
                        >
                          <Play className="h-5 w-5" />
                          Open App
                        </a>
                      ) : (
                        <button
                          onClick={() => setShowPurchaseModal(true)}
                          className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors"
                        >
                          <ShoppingCart className="h-5 w-5" />
                          Purchase Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-320px)]">
              {salesCopy ? (
                <div className="space-y-8">
                  {/* Summary */}
                  {salesCopy.summary && (
                    <section>
                      <p className="text-gray-300 text-lg leading-relaxed">
                        {salesCopy.summary}
                      </p>
                    </section>
                  )}

                  {/* What It Does */}
                  <section>
                    <h2 className={`text-2xl font-bold text-white mb-4 flex items-center gap-2`}>
                      <Zap className={`h-6 w-6 ${colors.accent}`} />
                      What It Does
                    </h2>
                    <p className="text-gray-300 leading-relaxed">
                      {salesCopy.whatItDoes}
                    </p>
                  </section>

                  {/* How It Works */}
                  <section>
                    <h2 className={`text-2xl font-bold text-white mb-4 flex items-center gap-2`}>
                      <Target className={`h-6 w-6 ${colors.accent}`} />
                      How It Works
                    </h2>
                    <p className="text-gray-300 leading-relaxed">
                      {salesCopy.howItWorks}
                    </p>
                  </section>

                  {/* How To Profit - Two Column */}
                  <section>
                    <h2 className={`text-2xl font-bold text-white mb-4 flex items-center gap-2`}>
                      <TrendingUp className={`h-6 w-6 ${colors.accent}`} />
                      How To Profit
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* For Local Businesses */}
                      <div className={`bg-gray-800/50 border-l-4 ${colors.accent.replace('text-', 'bg-')} p-5 rounded-lg`}>
                        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                          <span className="text-2xl">💼</span> For Local Businesses
                        </h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {salesCopy.howToProfit.forLocalBusinesses}
                        </p>
                      </div>

                      {/* For Individuals */}
                      <div className={`bg-gray-800/50 border-l-4 ${colors.accent.replace('text-', 'bg-')} p-5 rounded-lg`}>
                        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                          <span className="text-2xl">👤</span> For Individuals
                        </h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {salesCopy.howToProfit.forIndividuals}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Why You Need It */}
                  <section>
                    <h2 className={`text-2xl font-bold text-white mb-4 flex items-center gap-2`}>
                      <Award className={`h-6 w-6 ${colors.accent}`} />
                      Why You Need It
                    </h2>
                    <div className="space-y-4">
                      <p className="text-gray-300 leading-relaxed">
                        {salesCopy.whyYouNeedIt}
                      </p>
                    </div>
                  </section>

                  {/* Use Cases */}
                  {salesCopy.useCases && salesCopy.useCases.length > 0 && (
                    <section>
                      <h2 className={`text-2xl font-bold text-white mb-4`}>
                        Perfect For
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {salesCopy.useCases.map((uc, idx) => (
                          <div key={idx} className="bg-gray-800 p-4 rounded-lg">
                            <h4 className="text-white font-semibold mb-2">
                              {uc.industry}
                            </h4>
                            <p className="text-gray-400 text-sm mb-2">
                              {uc.scenario}
                            </p>
                            <p className="text-green-400 text-sm">
                              ✓ {uc.outcome}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Testimonials */}
                  {salesCopy.testimonials && salesCopy.testimonials.length > 0 && (
                    <section>
                      <h2 className={`text-2xl font-bold text-white mb-4`}>
                        What Users Say
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {salesCopy.testimonials.map((testimonial, idx) => (
                          <div key={idx} className="bg-gray-800 p-5 rounded-lg">
                            <div className="flex items-center gap-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < testimonial.rating
                                      ? "text-yellow-500 fill-yellow-500"
                                      : "text-gray-600"
                                  }`}
                                />
                              ))}
                            </div>
                            <blockquote className="text-gray-300 mb-3 italic">
                              "{testimonial.quote}"
                            </blockquote>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {testimonial.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-white font-medium text-sm">
                                  {testimonial.name}
                                </div>
                                <div className="text-gray-400 text-xs">
                                  {testimonial.role}, {testimonial.businessType}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Final CTA */}
                  <section className="text-center py-8">
                    <div className="bg-gradient-to-r from-primary-900/40 to-primary-700/40 p-8 rounded-xl border border-primary-500/30">
                      <h3 className="text-2xl font-bold text-white mb-4">
                        Ready to Get Started?
                      </h3>
                      <p className="text-gray-300 mb-6">
                        Join thousands of businesses using {app.name} to achieve better results.
                      </p>
                      {isOwned ? (
                        <a
                          href={appUrl}
                          className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg shadow-lg"
                        >
                          <Play className="mr-2 h-5 w-5" />
                          Open App
                        </a>
                      ) : (
                        <button
                          onClick={() => setShowPurchaseModal(true)}
                          className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg shadow-lg"
                        >
                          <ShoppingCart className="mr-2 h-5 w-5" />
                          Purchase Now – $97
                        </button>
                      )}
                    </div>
                  </section>
                </div>
              ) : (
                /* Fallback when no extended sales copy */
                <div className="text-center py-12">
                  <p className="text-gray-400">
                    Detailed information coming soon for this app.
                  </p>
                  <div className="mt-6">
                    {isOwned ? (
                      <a
                        href={appUrl}
                        className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold px-6 py-3 rounded-lg"
                      >
                        <Play className="mr-2 h-5 w-5" />
                        Open App
                      </a>
                    ) : (
                      <button
                        onClick={() => setShowPurchaseModal(true)}
                        className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold px-6 py-3 rounded-lg"
                      >
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Purchase Now
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Purchase Modal */}
            {showPurchaseModal && (
              // We'll use existing PurchaseModal component later
              // For now, placeholder
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="bg-gray-900 p-8 rounded-2xl max-w-md">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Purchase {app.name}
                  </h2>
                  <p className="text-gray-300 mb-6">
                    Price: $97 (one-time payment)
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowPurchaseModal(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-lg">
                      Proceed to Checkout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductDetailModal;
