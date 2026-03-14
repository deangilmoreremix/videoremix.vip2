import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  Users,
  Check,
  Lock,
  Play,
  Award,
  TrendingUp,
  Target,
  Zap,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useUserAccess } from "../hooks/useUserAccess";
import { getEnhancedAppData } from "../data/enhancedAppsData";
import PurchaseModal from "./PurchaseModal";
import { AppThumbnail } from "./AppThumbnail";

interface AppDetailModalProps {
  app: any;
  isOpen: boolean;
  onClose: () => void;
}

const AppDetailModal: React.FC<AppDetailModalProps> = ({
  app,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { hasAccessToApp } = useUserAccess();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "features" | "use-cases" | "testimonials"
  >("overview");

  // Get enhanced app data
  const enhancedApp = getEnhancedAppData(app.id, app);
  const isOwned = user && hasAccessToApp(app.id);

  // Handle escape key
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

  return (
    <>
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative h-64 bg-gradient-to-br from-primary-600 to-primary-800">
                <div className="w-full h-full opacity-20">
                  <AppThumbnail
                    id={app.id}
                    name={app.name}
                    category={app.category}
                    icon={app.icon}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

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
                      </div>
                      <p className="text-gray-200 text-lg mb-4">
                        {app.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-300">
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
                          href={app.url}
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

              {/* Content */}
              <div className="p-6">
                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-gray-800 p-1 rounded-lg">
                  {[
                    { id: "overview", label: "Overview" },
                    { id: "features", label: "Features" },
                    { id: "use-cases", label: "Use Cases" },
                    { id: "testimonials", label: "Reviews" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-primary-600 text-white"
                          : "text-gray-300 hover:text-white hover:bg-gray-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      {/* Benefits */}
                      {enhancedApp.benefits && (
                        <div>
                          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary-400" />
                            Key Benefits
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {enhancedApp.benefits.map(
                              (benefit: string, index: number) => (
                                <div
                                  key={index}
                                  className="bg-gray-800 p-4 rounded-lg"
                                >
                                  <p className="text-gray-300">{benefit}</p>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {/* Steps */}
                      {enhancedApp.steps && (
                        <div>
                          <h3 className="text-xl font-bold text-white mb-4">
                            How It Works
                          </h3>
                          <div className="space-y-4">
                            {enhancedApp.steps.map(
                              (step: any, index: number) => (
                                <div key={index} className="flex gap-4">
                                  <div className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <h4 className="text-white font-semibold">
                                      {step.title}
                                    </h4>
                                    <p className="text-gray-400">
                                      {step.description}
                                    </p>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "features" && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary-400" />
                        Powerful Features
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {enhancedApp.features?.map(
                          (feature: any, index: number) => (
                            <div
                              key={index}
                              className="bg-gray-800 p-6 rounded-lg"
                            >
                              <div className="flex items-start gap-3">
                                <div className="bg-primary-600 p-2 rounded-lg flex-shrink-0">
                                  {feature.icon}
                                </div>
                                <div>
                                  <h4 className="text-white font-semibold mb-2">
                                    {feature.title}
                                  </h4>
                                  <p className="text-gray-400 text-sm">
                                    {feature.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "use-cases" && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary-400" />
                        Perfect For
                      </h3>
                      {enhancedApp.useCases?.map(
                        (useCase: any, index: number) => (
                          <div
                            key={index}
                            className="bg-gray-800 p-6 rounded-lg"
                          >
                            <h4 className="text-white font-semibold mb-3">
                              {useCase.title}
                            </h4>
                            <p className="text-gray-400 mb-4">
                              {useCase.description}
                            </p>
                            <ul className="space-y-2">
                              {useCase.points.map(
                                (point: string, idx: number) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-gray-300"
                                  >
                                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    {point}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  {activeTab === "testimonials" && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary-400" />
                        What Users Say
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {enhancedApp.testimonials?.map(
                          (testimonial: any, index: number) => (
                            <div
                              key={index}
                              className="bg-gray-800 p-6 rounded-lg"
                            >
                              <div className="flex items-center gap-1 mb-3">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className="h-4 w-4 text-yellow-500 fill-yellow-500"
                                  />
                                ))}
                              </div>
                              <blockquote className="text-gray-300 mb-4 italic">
                                "{testimonial.quote}"
                              </blockquote>
                              <div className="flex items-center gap-3">
                                <img
                                  src={testimonial.avatar}
                                  alt={testimonial.name}
                                  className="w-10 h-10 rounded-full"
                                />
                                <div>
                                  <div className="text-white font-semibold">
                                    {testimonial.name}
                                  </div>
                                  <div className="text-gray-400 text-sm">
                                    {testimonial.role}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purchase Modal */}
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        app={{
          id: app.id,
          name: app.name,
          description: app.description,
          image: app.image,
          icon: app.icon,
          price: enhancedApp.price || 97,
        }}
      />
    </>
  );
};

export default AppDetailModal;
