import React, { useState } from "react";
import {
  X,
  Lock,
  Check,
  ExternalLink,
  Loader,
  Star,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: {
    id: string;
    name: string;
    description: string;
    image: string;
    icon: React.ReactNode;
    price?: number;
    features?: string[];
  };
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  app,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultPrice = 97;
  const price = app.price || defaultPrice;

  const defaultFeatures = [
    "Lifetime access to the app",
    "All future updates included",
    "Priority customer support",
    "Commercial usage rights",
    "Money-back guarantee",
  ];

  const features = app.features || defaultFeatures;

  const handlePurchase = async () => {
    if (!user) {
      onClose();
      document.dispatchEvent(new CustomEvent("open-signin-modal"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            appId: app.id,
            appName: app.name,
            price: price,
            userId: user.id,
            userEmail: user.email,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err: any) {
      console.error("Error creating checkout session:", err);
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
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-800"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-300" />
            </button>

            <div className="overflow-y-auto max-h-[90vh]">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={app.image}
                  alt={app.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />

                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-gray-800/80 backdrop-blur-sm rounded-xl">
                      {React.isValidElement(app.icon)
                        ? React.cloneElement(app.icon as React.ReactElement, {
                            className: "h-6 w-6 text-primary-400",
                          })
                        : null}
                    </div>
                    <h2 className="text-3xl font-bold text-white">
                      {app.name}
                    </h2>
                  </div>
                  <p className="text-gray-300 text-lg">{app.description}</p>
                </div>
              </div>

              <div className="p-8">
                <div className="bg-gradient-to-br from-primary-900/40 to-primary-700/40 border border-primary-500/30 rounded-xl p-6 mb-6">
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <span className="text-gray-400 text-sm">
                        One-time payment
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-white">
                          ${price}
                        </span>
                        <span className="text-gray-400 text-lg">USD</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium mb-2">
                        Lifetime Access
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handlePurchase}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5" />
                        <span>Get Instant Access Now</span>
                      </>
                    )}
                  </button>

                  {error && (
                    <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm">
                      {error}
                    </div>
                  )}

                  <p className="text-center text-gray-400 text-sm mt-4">
                    Secure payment powered by Stripe
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-4">
                    What's included:
                  </h3>
                  <ul className="space-y-3">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary-600/20 rounded-full flex items-center justify-center mt-0.5">
                          <Check className="h-4 w-4 text-primary-400" />
                        </div>
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-primary-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                      1,200+
                    </div>
                    <div className="text-gray-400 text-sm">Happy customers</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <ExternalLink className="h-5 w-5 text-primary-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                      24/7
                    </div>
                    <div className="text-gray-400 text-sm">Instant access</div>
                  </div>
                </div>

                <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                  <h4 className="font-bold text-white mb-2">
                    30-Day Money-Back Guarantee
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Try {app.name} risk-free. If you're not completely satisfied
                    within 30 days, we'll refund your purchase—no questions
                    asked.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PurchaseModal;
