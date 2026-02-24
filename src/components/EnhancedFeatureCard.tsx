import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Heart,
  Eye,
  Star,
  TrendingUp,
  ExternalLink,
  Info,
  Check,
  Sparkles,
  Users,
  Clock,
  Award,
} from "lucide-react";
import { Link } from "react-router-dom";
import { type FeatureWithDetails } from "../hooks/useFeatures";

interface EnhancedFeatureCardProps {
  feature: FeatureWithDetails;
  onDemoClick?: () => void;
  onFavoriteClick?: () => void;
  isFavorite?: boolean;
  viewMode?: "compact" | "detailed" | "minimal";
  showStats?: boolean;
  showPreview?: boolean;
}

const EnhancedFeatureCard: React.FC<EnhancedFeatureCardProps> = ({
  feature,
  onDemoClick,
  onFavoriteClick,
  isFavorite = false,
  viewMode = "detailed",
  showStats = true,
  showPreview = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  const renderStatsBar = () => {
    if (!showStats || !feature.analytics) return null;

    const stats = [
      {
        icon: <Eye className="h-3 w-3" />,
        value: feature.analytics.view_count,
        label: "Views",
      },
      {
        icon: <Play className="h-3 w-3" />,
        value: feature.analytics.demo_play_count,
        label: "Demos",
      },
      {
        icon: <Star className="h-3 w-3" />,
        value: feature.averageRating?.toFixed(1) || "0.0",
        label: "Rating",
      },
    ];

    return (
      <div className="flex items-center gap-4 text-xs text-gray-400">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center gap-1">
            {stat.icon}
            <span className="font-medium">{stat.value}</span>
            <span className="hidden sm:inline">{stat.label}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderBenefitsPreview = () => {
    if (!showPreview || !feature.benefits || feature.benefits.length === 0)
      return null;

    return (
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-black/80 p-6 flex flex-col justify-end z-10"
          >
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-400" />
              Key Benefits
            </h4>
            <div className="space-y-2">
              {feature.benefits.slice(0, 3).map((benefit, index) => (
                <motion.div
                  key={benefit.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2 text-sm text-gray-300"
                >
                  <Check className="h-4 w-4 text-primary-400 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{benefit.benefit_text}</span>
                </motion.div>
              ))}
            </div>
            {feature.benefits.length > 3 && (
              <p className="text-xs text-gray-400 mt-2">
                +{feature.benefits.length - 3} more benefits
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const renderQuickViewModal = () => {
    return (
      <AnimatePresence>
        {showQuickView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowQuickView(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {feature.title}
                    </h2>
                    <p className="text-gray-300">{feature.description}</p>
                  </div>
                  <button
                    onClick={() => setShowQuickView(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
                {renderStatsBar()}
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Benefits */}
                {feature.benefits && feature.benefits.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary-400" />
                      Benefits
                    </h3>
                    <div className="space-y-2">
                      {feature.benefits.map((benefit) => (
                        <div
                          key={benefit.id}
                          className="flex items-start gap-2 text-gray-300"
                        >
                          <Check className="h-4 w-4 text-primary-400 flex-shrink-0 mt-1" />
                          <span>{benefit.benefit_text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Steps */}
                {feature.steps && feature.steps.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary-400" />
                      How It Works
                    </h3>
                    <div className="space-y-3">
                      {feature.steps.map((step, index) => (
                        <div key={step.id} className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="text-white font-medium mb-1">
                              {step.title}
                            </h4>
                            <p className="text-gray-400 text-sm">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Use Cases */}
                {feature.useCases && feature.useCases.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary-400" />
                      Use Cases
                    </h3>
                    <div className="space-y-3">
                      {feature.useCases.map((useCase) => (
                        <div
                          key={useCase.id}
                          className="bg-gray-800 rounded-lg p-4"
                        >
                          <h4 className="text-white font-medium mb-2">
                            {useCase.title}
                          </h4>
                          <p className="text-gray-400 text-sm mb-2">
                            {useCase.description}
                          </p>
                          {useCase.points && useCase.points.length > 0 && (
                            <ul className="space-y-1">
                              {useCase.points.map((point, index) => (
                                <li
                                  key={index}
                                  className="text-gray-400 text-sm flex items-start gap-2"
                                >
                                  <span className="text-primary-400">•</span>
                                  {point}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-700 flex gap-3">
                {onDemoClick && feature.demo_video_url && (
                  <button
                    onClick={onDemoClick}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Watch Demo
                  </button>
                )}
                <Link
                  to={`/features/${feature.id}`}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 border border-gray-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  Full Details
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  if (viewMode === "minimal") {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-primary-500/50 transition-all cursor-pointer"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-semibold">{feature.title}</h3>
          {feature.is_premium && (
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          )}
        </div>
        <p className="text-gray-400 text-sm line-clamp-1">
          {feature.description}
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="bg-gray-800 rounded-xl border border-gray-700 hover:border-primary-500/50 transition-all overflow-hidden group cursor-pointer"
      >
        {/* Feature Image/Preview */}
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900">
          {feature.demo_image_url ? (
            <img
              src={feature.demo_image_url}
              alt={feature.title}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-16 w-16 text-primary-400/20" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {feature.is_premium && (
              <div className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                <Star className="h-3 w-3 fill-black" />
                PRO
              </div>
            )}
            {feature.analytics && feature.analytics.view_count > 100 && (
              <div className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Popular
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-3 right-3 flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowQuickView(true);
              }}
              className="p-2 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-colors"
            >
              <Info className="h-4 w-4 text-white" />
            </motion.button>
            {onFavoriteClick && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onFavoriteClick();
                }}
                className="p-2 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-colors"
              >
                <Heart
                  className={`h-4 w-4 ${
                    isFavorite ? "text-red-500 fill-red-500" : "text-white"
                  }`}
                />
              </motion.button>
            )}
          </div>

          {/* Demo Play Button */}
          {feature.demo_video_url && onDemoClick && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onDemoClick();
              }}
              className="absolute bottom-3 left-3 p-3 bg-primary-600 rounded-full hover:bg-primary-700 transition-colors"
            >
              <Play className="h-5 w-5 text-white fill-white" />
            </motion.button>
          )}

          {/* Benefits Overlay */}
          {renderBenefitsPreview()}
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">
            {feature.title}
          </h3>

          <p className="text-gray-300 text-sm mb-4 line-clamp-2">
            {feature.description}
          </p>

          {/* Tags */}
          {feature.tags && feature.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {feature.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {feature.tags.length > 3 && (
                <span className="text-xs text-gray-400 px-2 py-1">
                  +{feature.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          {renderStatsBar()}

          {/* Rating */}
          {feature.averageRating && feature.averageRating > 0 && (
            <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-700">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.round(feature.averageRating || 0)
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-600"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-400">
                {feature.averageRating.toFixed(1)} ({feature.ratingCount}{" "}
                reviews)
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick View Modal */}
      {renderQuickViewModal()}
    </>
  );
};

export default EnhancedFeatureCard;
