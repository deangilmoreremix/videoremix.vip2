import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Play,
  ChevronRight,
  Video,
  Check,
  Star,
  ArrowRight,
  Sparkles,
  Users,
  Clock,
  Award,
  Zap,
  MessageSquare,
  Share2,
  Plus,
  Minus,
  Bookmark,
  Heart,
  ThumbsUp,
  MousePointer,
  PenTool,
  Layers,
  Code,
  Moon,
  Sun,
  Mail,
  Gift,
  ExternalLink,
} from "lucide-react";
import MagicSparkles from "./MagicSparkles";
import { useApps } from "../hooks/useApps";
import { useAuth } from "../context/AuthContext";
import { useUserAccess } from "../hooks/useUserAccess";
import { getEnhancedAppData } from "../data/enhancedAppsData";
import { getAppUrl, isExternalUrl } from "../config/appUrls";
import PurchaseModal from "./PurchaseModal";

// Floating Icon component to add visual interest
const FloatingIcon: React.FC<{
  icon: React.ReactNode;
  size?: number;
  color?: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  delay?: number;
  duration?: number;
  distance?: number;
}> = ({
  icon,
  size = 24,
  color = "rgba(99, 102, 241, 0.2)",
  top,
  left,
  right,
  bottom,
  delay = 0,
  duration = 3,
  distance = 10,
}) => {
  return (
    <motion.div
      className="absolute z-0 pointer-events-none"
      style={{
        top,
        left,
        right,
        bottom,
        color,
      }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0.4, 0.8, 0.4],
        y: [-distance, 0, -distance],
      }}
      transition={{
        repeat: Infinity,
        repeatType: "reverse",
        duration,
        delay,
        ease: "easeInOut",
      }}
    >
      {React.cloneElement(icon as React.ReactElement, {
        size,
        strokeWidth: 1,
      })}
    </motion.div>
  );
};

// Floating particle effect
const FloatingParticles: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary-400"
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.3 + 0.1,
          }}
          animate={{
            y: [-100, 100],
            x: [Math.random() * 20 - 10, Math.random() * 20 - 10],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 15 + Math.random() * 15,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
};

const AppDetailPage: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const { apps: appsData, loading: appsLoading } = useApps();
  const { user } = useAuth();
  const { hasAccessToApp, isLoading: accessLoading } = useUserAccess();
  const [app, setApp] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "features" | "how-it-works" | "faq"
  >("overview");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!appsLoading && appsData.length > 0) {
      // Find the app data matching the appId
      const foundApp = appsData.find((app) => app.id === appId);
      // Merge with enhanced data if available
      let enhancedApp = foundApp
        ? getEnhancedAppData(appId || "", foundApp)
        : null;

      // Ensure the app has a URL from centralized config
      if (enhancedApp && !enhancedApp.url) {
        enhancedApp = {
          ...enhancedApp,
          url: getAppUrl(appId || ""),
        };
      }

      setApp(enhancedApp);
      setIsLoading(false);

      // Scroll to top when app changes
      window.scrollTo(0, 0);
    }
  }, [appId, appsData, appsLoading]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-40 text-white">
        <div className="relative">
          <div className="w-20 h-20 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-primary-500 font-medium">Loading</span>
          </div>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-white mb-6">App Not Found</h1>
        <p className="text-gray-300 mb-8">
          The app you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-3 rounded-lg"
        >
          <ChevronRight className="mr-2 h-5 w-5 rotate-180" />
          Return to Home
        </Link>
      </div>
    );
  }

  // Function to toggle FAQ item
  const toggleFaq = (index: number) => {
    if (activeFaq === index) {
      setActiveFaq(null);
    } else {
      setActiveFaq(index);
    }
  };

  return (
    <div className="pt-32 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden mb-16">
        {/* Background gradient elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black z-0"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] z-0"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-700/20 rounded-full blur-[100px] z-0"></div>

        {/* Floating particles background effect */}
        <FloatingParticles />

        {/* Floating icons */}
        <FloatingIcon
          icon={<Video />}
          top="15%"
          left="5%"
          color="rgba(99, 102, 241, 0.15)"
          size={32}
          duration={4}
        />
        <FloatingIcon
          icon={<Sparkles />}
          top="25%"
          right="8%"
          color="rgba(236, 72, 153, 0.12)"
          size={28}
          delay={1.5}
        />
        <FloatingIcon
          icon={<Star />}
          bottom="15%"
          left="12%"
          color="rgba(234, 179, 8, 0.15)"
          size={24}
          delay={0.8}
          duration={3.5}
        />
        <FloatingIcon
          icon={<Zap />}
          bottom="20%"
          right="10%"
          color="rgba(99, 102, 241, 0.18)"
          size={26}
          delay={2.2}
          duration={4.2}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <div className="mb-6">
                <Link
                  to="/"
                  className="inline-flex items-center text-primary-400 hover:text-primary-300 font-medium"
                >
                  <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                  Back to All Apps
                </Link>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-block mb-4">
                  <motion.div
                    className="bg-primary-600/20 text-primary-400 px-4 py-1.5 rounded-full text-sm font-semibold flex items-center"
                    whileHover={{
                      backgroundColor: "rgba(99, 102, 241, 0.25)",
                      transition: { duration: 0.2 },
                    }}
                  >
                    <motion.span
                      animate={{
                        rotate: [0, -5, 0, 5, 0],
                        scale: [1, 1.1, 1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 5,
                      }}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                    </motion.span>
                    VIDEOREMIX.IO APP
                  </motion.div>
                </div>

                <MagicSparkles
                  minSparkles={5}
                  maxSparkles={10}
                  colors={["#6366f1", "#818cf8", "#f472b6", "#ec4899"]}
                >
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 break-words">
                    {app.name}
                  </h1>
                </MagicSparkles>

                <p className="text-xl text-gray-300 mb-8 break-words leading-relaxed">
                  {app.description}
                </p>

                {app.tags && (
                  <div className="flex flex-wrap gap-4 mb-8">
                    {app.tags.map((tag: string, index: number) => (
                      <motion.span
                        key={index}
                        className="bg-gray-800 px-3 py-1 rounded-full text-gray-300 text-sm"
                        whileHover={{ backgroundColor: "#374151", y: -2 }}
                        transition={{ duration: 0.2 }}
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  {app.url && isExternalUrl(appId || "") ? (
                    user && hasAccessToApp(app.slug || app.id) ? (
                      <motion.a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{
                          scale: 1.05,
                          boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)",
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center justify-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg shadow-lg relative overflow-hidden"
                      >
                        {/* Glowing effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-20"
                          animate={{
                            x: ["-100%", "200%"],
                          }}
                          transition={{
                            repeat: Infinity,
                            repeatDelay: 3,
                            duration: 1.5,
                            ease: "easeInOut",
                          }}
                        />
                        <span className="relative z-10">Launch {app.name}</span>
                        <motion.div
                          className="relative z-10 ml-2"
                          animate={{
                            x: [0, 5, 0],
                            opacity: [1, 0.8, 1],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.5,
                            repeatDelay: 1,
                          }}
                        >
                          <ExternalLink className="h-5 w-5" />
                        </motion.div>
                      </motion.a>
                    ) : (
                      <motion.button
                        onClick={() => setShowPurchaseModal(true)}
                        whileHover={{
                          scale: 1.05,
                          boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)",
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center justify-center bg-gradient-to-r from-gray-600 to-gray-500 hover:from-primary-600 hover:to-primary-500 text-white font-bold px-8 py-4 rounded-lg shadow-lg relative overflow-hidden"
                      >
                        <Lock className="h-5 w-5 mr-2" />
                        <span className="relative z-10">
                          Get Access to {app.name}
                        </span>
                      </motion.button>
                    )
                  ) : (
                    <motion.button
                      whileHover={{
                        scale: 1.05,
                        boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)",
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center justify-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg shadow-lg relative overflow-hidden"
                      onClick={() => navigate("/pricing")}
                    >
                      {/* Glowing effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-20"
                        animate={{
                          x: ["-100%", "200%"],
                        }}
                        transition={{
                          repeat: Infinity,
                          repeatDelay: 3,
                          duration: 1.5,
                          ease: "easeInOut",
                        }}
                      />
                      <span className="relative z-10">Try {app.name} Now</span>
                      <motion.div
                        className="relative z-10 ml-2"
                        animate={{
                          x: [0, 5, 0],
                          opacity: [1, 0.8, 1],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                          repeatDelay: 1,
                        }}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.div>
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: "rgba(31, 41, 55, 0.8)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white font-medium px-8 py-4 rounded-lg border border-gray-700 backdrop-blur-sm"
                    onClick={() => {
                      const demoSection = document.getElementById("demo");
                      if (demoSection) {
                        demoSection.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.8, 1],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        repeatDelay: 3,
                      }}
                    >
                      <Play className="mr-2 h-5 w-5" />
                    </motion.div>
                    Watch Demo
                  </motion.button>
                </div>

                <div className="flex flex-wrap gap-6">
                  {[
                    {
                      icon: <Users className="h-5 w-5 text-primary-400" />,
                      label: "10,000+ active users",
                    },
                    {
                      icon: (
                        <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      ),
                      label: "4.9/5 rating",
                    },
                    {
                      icon: <Clock className="h-5 w-5 text-green-400" />,
                      label: "Save 5+ hours per project",
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center"
                      whileHover={{ x: 3 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          rotate: index === 1 ? [0, 10, 0] : [0, 0, 0],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2 + index * 0.5,
                          repeatDelay: 4,
                        }}
                      >
                        {item.icon}
                      </motion.div>
                      <span className="ml-2 text-gray-300 text-sm">
                        {item.label}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Quick action buttons */}
                <div className="mt-6 flex space-x-2">
                  <motion.button
                    className={`p-2 rounded-full ${isLiked ? "bg-primary-600/20 text-primary-500" : "bg-gray-800 text-gray-400"} transition-colors`}
                    onClick={() => setIsLiked(!isLiked)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={isLiked ? "Unlike" : "Like"}
                  >
                    <Heart
                      className={`h-5 w-5 ${isLiked ? "fill-primary-500" : ""}`}
                    />
                  </motion.button>

                  <motion.button
                    className={`p-2 rounded-full ${isBookmarked ? "bg-primary-600/20 text-primary-500" : "bg-gray-800 text-gray-400"} transition-colors`}
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
                  >
                    <Bookmark
                      className={`h-5 w-5 ${isBookmarked ? "fill-primary-500" : ""}`}
                    />
                  </motion.button>

                  <motion.button
                    className="p-2 rounded-full bg-gray-800 text-gray-400 transition-colors hover:text-gray-300 hover:bg-gray-700"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Share"
                    onClick={() => {
                      if (navigator.share) {
                        navigator
                          .share({
                            title: `${app.name} | VideoRemix.vip`,
                            text: app.description,
                            url: window.location.href,
                          })
                          .catch((error) =>
                            console.log("Sharing failed", error),
                          );
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Link copied to clipboard!");
                      }
                    }}
                  >
                    <Share2 className="h-5 w-5" />
                  </motion.button>
                </div>
              </motion.div>
            </div>

            <div className="lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
                className="bg-gradient-to-br from-gray-800 to-black p-1.5 rounded-xl overflow-hidden shadow-2xl relative"
              >
                {/* Glow effect around the image */}
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-primary-500/30 via-secondary-500/20 to-primary-500/30 rounded-xl blur-xl z-0 opacity-0"
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    repeatDelay: 2,
                  }}
                />

                <img
                  src={app.demoImage || app.image}
                  alt={app.name}
                  className="w-full aspect-video object-cover rounded-lg relative z-10"
                />

                {/* Floating icons specific to the current app type */}
                <motion.div
                  className="absolute top-2 right-2 bg-gray-900/50 backdrop-blur-sm p-2 rounded-lg z-20 flex space-x-2 border border-gray-700"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {/* Icons based on app category - add animation to each */}
                  {app.category === "video" && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        repeatDelay: 2,
                      }}
                    >
                      <Video className="h-4 w-4 text-primary-400" />
                    </motion.div>
                  )}
                  {app.category === "ai-image" && (
                    <motion.div
                      animate={{ rotate: [0, 15, 0, -15, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 3,
                        repeatDelay: 1,
                      }}
                    >
                      <Sparkles className="h-4 w-4 text-primary-400" />
                    </motion.div>
                  )}
                  {app.category === "lead-gen" && (
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        repeatDelay: 1,
                      }}
                    >
                      <Users className="h-4 w-4 text-primary-400" />
                    </motion.div>
                  )}
                  {app.category === "branding" && (
                    <motion.div
                      animate={{ rotateY: [0, 180, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.5,
                        repeatDelay: 3,
                      }}
                    >
                      <PenTool className="h-4 w-4 text-primary-400" />
                    </motion.div>
                  )}
                  {app.category === "personalizer" && (
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.8,
                        repeatDelay: 2,
                      }}
                    >
                      <MousePointer className="h-4 w-4 text-primary-400" />
                    </motion.div>
                  )}
                  {app.category === "creative" && (
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{
                        repeat: Infinity,
                        duration: 5,
                        ease: "linear",
                      }}
                    >
                      <Layers className="h-4 w-4 text-primary-400" />
                    </motion.div>
                  )}
                </motion.div>

                {/* Play button overlay with enhanced animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.button
                    whileHover={{
                      scale: 1.1,
                      boxShadow: "0 0 25px 5px rgba(99, 102, 241, 0.4)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white/10 backdrop-blur-sm p-5 rounded-full relative"
                    id="demo"
                  >
                    {/* Pulsing circle animation */}
                    <motion.div
                      className="absolute -inset-3 rounded-full border-2 border-primary-500/40"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.7, 0, 0.7],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.5,
                        ease: "easeInOut",
                      }}
                    />

                    {/* Second pulsing circle with different timing */}
                    <motion.div
                      className="absolute -inset-1 rounded-full border-2 border-primary-400/30"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        delay: 0.5,
                        ease: "easeInOut",
                      }}
                    />

                    <div className="bg-primary-600 rounded-full p-3 flex items-center justify-center relative z-10">
                      <Play className="h-8 w-8 text-white" fill="white" />
                    </div>
                  </motion.button>
                </div>

                {/* Status badges */}
                <div className="absolute top-4 left-4 flex flex-col items-start gap-2 z-20">
                  {app.popular && (
                    <motion.span
                      className="bg-yellow-500 text-black px-3 py-1 rounded-full font-bold text-sm flex items-center"
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                    >
                      <Star className="h-4 w-4 mr-1 fill-black" />
                      POPULAR
                    </motion.span>
                  )}
                  {app.new && (
                    <motion.span
                      className="bg-green-500 text-black px-3 py-1 rounded-full font-bold text-sm flex items-center"
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      NEW
                    </motion.span>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <div className="overflow-x-auto no-scrollbar border-b border-gray-800">
            <div className="flex space-x-8 min-w-max py-2">
              {[
                {
                  id: "overview",
                  label: "Overview",
                  icon: <Layers className="h-4 w-4" />,
                },
                {
                  id: "features",
                  label: "Features",
                  icon: <Sparkles className="h-4 w-4" />,
                },
                {
                  id: "how-it-works",
                  label: "How It Works",
                  icon: <Zap className="h-4 w-4" />,
                },
                {
                  id: "faq",
                  label: "FAQ",
                  icon: <MessageSquare className="h-4 w-4" />,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`pb-3 px-1 relative font-medium text-base ${
                    activeTab === tab.id
                      ? "text-white"
                      : "text-gray-500 hover:text-gray-300"
                  } flex items-center gap-2`}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  <motion.div
                    initial={{ y: 0 }}
                    animate={activeTab === tab.id ? { y: [0, -3, 0] } : {}}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      repeatDelay: 2,
                    }}
                  >
                    {tab.icon}
                  </motion.div>
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500"
                      initial={false}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Content Based on Active Tab */}
      {/* Overview Tab */}
      {activeTab === "overview" && (
        <section className="mb-16 relative">
          {/* Background elements */}
          <FloatingIcon
            icon={<Moon />}
            top="10%"
            left="3%"
            color="rgba(99, 102, 241, 0.1)"
            size={40}
            duration={5}
          />
          <FloatingIcon
            icon={<Sun />}
            bottom="15%"
            right="5%"
            color="rgba(236, 72, 153, 0.08)"
            size={48}
            delay={1}
            duration={6}
          />
          <FloatingIcon
            icon={<Code />}
            top="30%"
            right="10%"
            color="rgba(99, 102, 241, 0.12)"
            size={32}
            delay={2}
          />

          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {/* App Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-16"
              >
                <h2 className="text-3xl font-bold text-white mb-6 break-words">
                  About {app.name}
                </h2>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed break-words">
                  {app.description} With {app.name}, you can create
                  professional-quality content in minutes instead of hours,
                  without requiring any technical expertise or expensive
                  equipment. Our innovative AI-powered platform handles the
                  complex aspects of video creation so you can focus on what
                  matters most - your message and creativity.
                </p>

                {/* Key Benefits with enhanced animations */}
                <h3 className="text-2xl font-bold text-white mb-6 break-words relative">
                  Key Benefits
                  <motion.div
                    className="absolute -bottom-1 left-0 h-1 bg-primary-500/30 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "4rem" }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  {(
                    app.benefits || [
                      "Save 90% of your production time",
                      "No technical skills required",
                      "Professional quality results",
                      "Consistent brand identity",
                      "Multi-platform optimization",
                      "Automatic AI enhancements",
                      // @ts-expect-error
                    ]
                  ).map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                      whileHover={{
                        x: 5,
                        backgroundColor: "rgba(55, 65, 81, 0.1)",
                        transition: { duration: 0.2 },
                      }}
                      className="flex items-start rounded-lg p-2"
                    >
                      <div className="bg-primary-900/50 p-2 rounded-full mr-3 mt-1 flex-shrink-0">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: index * 0.3,
                          }}
                        >
                          <Check className="h-5 w-5 text-primary-400" />
                        </motion.div>
                      </div>
                      <span className="text-gray-300 text-lg break-words">
                        {benefit}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Call to action with enhanced effects */}
                <div className="bg-gradient-to-br from-primary-900/40 to-primary-700/40 rounded-xl border border-primary-500/30 p-8 text-center relative overflow-hidden">
                  {/* Animated sparkle effects in the background */}
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full bg-primary-400/30 blur-xl"
                      style={{
                        width: `${20 + i * 5}px`,
                        height: `${20 + i * 5}px`,
                        left: `${10 + i * 20}%`,
                        top: `${20 + (i % 3) * 20}%`,
                      }}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.1, 0.3, 0.1],
                      }}
                      transition={{
                        duration: 3 + i,
                        repeat: Infinity,
                        delay: i * 0.5,
                      }}
                    />
                  ))}

                  {/* Gift icon animation */}
                  <motion.div
                    className="absolute top-4 right-4"
                    initial={{ rotate: 0 }}
                    animate={{
                      rotate: [0, 15, 0, -15, 0],
                      y: [0, -5, 0],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.5,
                      repeatDelay: 3,
                    }}
                  >
                    <Gift className="h-10 w-10 text-primary-400/40" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-white mb-4 break-words relative z-10">
                    Ready to try {app.name}?
                  </h3>
                  <p className="text-xl text-gray-300 mb-6 break-words relative z-10">
                    Join thousands of creators who are already using {app.name}{" "}
                    to transform their video content.
                  </p>
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 15px 30px -5px rgba(99, 102, 241, 0.4)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg shadow-lg inline-flex items-center relative z-10 overflow-hidden"
                    onClick={() => navigate("/pricing")}
                  >
                    {/* Button shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-20"
                      animate={{
                        x: ["-100%", "200%"],
                      }}
                      transition={{
                        repeat: Infinity,
                        repeatDelay: 2,
                        duration: 1.2,
                        ease: "easeInOut",
                      }}
                    />
                    <span className="relative z-10">Get Started Now</span>
                    <motion.div
                      animate={{
                        x: [0, 5, 0],
                        transition: { repeat: Infinity, duration: 1.5 },
                      }}
                      className="relative z-10 ml-2"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </motion.div>
                  </motion.button>
                </div>
              </motion.div>

              {/* Testimonials with enhanced effects */}
              {app.testimonials && app.testimonials.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7 }}
                >
                  <h2 className="text-3xl font-bold text-white mb-8 text-center break-words">
                    What Users Say About {app.name}
                  </h2>

                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 relative">
                    {/* Floating testimonial icons */}
                    <FloatingIcon
                      icon={<MessageSquare />}
                      top="10%"
                      left="5%"
                      color="rgba(99, 102, 241, 0.15)"
                      size={20}
                    />
                    <FloatingIcon
                      icon={<ThumbsUp />}
                      bottom="15%"
                      right="5%"
                      color="rgba(236, 72, 153, 0.12)"
                      size={18}
                      delay={1.2}
                    />
                    // @ts-expect-error
                    {app.testimonials.map((testimonial, index) => (
                      <motion.div
                        key={index}
                        className="p-8 border-b border-gray-700 last:border-b-0"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                      >
                        <div className="flex flex-col md:flex-row md:items-center">
                          <div className="md:w-1/4 mb-4 md:mb-0">
                            <motion.div
                              whileHover={{ scale: 1.05, y: -5 }}
                              transition={{ duration: 0.2 }}
                            >
                              <img
                                src={testimonial.avatar}
                                alt={testimonial.name}
                                className="w-20 h-20 rounded-full object-cover mx-auto md:mx-0 border-2 border-primary-500/30 shadow-lg"
                              />
                            </motion.div>
                          </div>
                          <div className="md:w-3/4 md:pl-6">
                            <motion.div
                              className="flex mb-3"
                              initial={{ opacity: 0 }}
                              whileInView={{ opacity: 1 }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.3 + index * 0.1 }}
                            >
                              {[...Array(5)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{
                                    delay: 0.4 + index * 0.05 + i * 0.1,
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 15,
                                  }}
                                >
                                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 mr-1" />
                                </motion.div>
                              ))}
                            </motion.div>
                            <blockquote className="text-xl text-white italic mb-4 break-words relative">
                              <span className="absolute -left-2 -top-2 text-primary-400/20 text-4xl font-serif">
                                "
                              </span>
                              <span className="relative z-10">
                                {testimonial.quote}
                              </span>
                              <span className="absolute -right-2 bottom-0 text-primary-400/20 text-4xl font-serif">
                                "
                              </span>
                            </blockquote>
                            <div>
                              <div className="font-bold text-white">
                                {testimonial.name}
                              </div>
                              <div className="text-gray-400">
                                {testimonial.role}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Features Tab */}
      {activeTab === "features" && (
        <section className="mb-16 relative">
          {/* Background elements */}
          <FloatingIcon
            icon={<Star />}
            top="5%"
            left="8%"
            color="rgba(234, 179, 8, 0.1)"
            size={38}
          />
          <FloatingIcon
            icon={<Mail />}
            bottom="10%"
            left="15%"
            color="rgba(99, 102, 241, 0.08)"
            size={28}
            delay={1.5}
          />
          <FloatingIcon
            icon={<Bookmark />}
            top="20%"
            right="5%"
            color="rgba(236, 72, 153, 0.1)"
            size={34}
            delay={0.8}
          />

          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center mb-12"
            >
              <motion.h2
                className="text-3xl font-bold text-white mb-6 break-words relative inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Powerful Features of {app.name}
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary-500/20 via-primary-500/80 to-primary-500/20 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </motion.h2>
              <p className="text-xl text-gray-300 break-words">
                Explore the innovative capabilities that make {app.name} an
                essential tool in your creative arsenal.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {(
                app.features || [
                  {
                    title: "AI-Powered Creation",
                    description:
                      "Create professional videos automatically with our advanced artificial intelligence technology",
                    icon: React.createElement(Sparkles),
                  },
                  {
                    title: "Intuitive Interface",
                    description:
                      "Easy-to-use controls designed for non-technical users to create stunning videos",
                    icon: React.createElement(Zap),
                  },
                  {
                    title: "Time-Saving Automation",
                    description:
                      "Reduce video production time by up to 90% with intelligent automation features",
                    icon: React.createElement(Clock),
                  },
                  {
                    title: "Professional Templates",
                    description:
                      "Choose from hundreds of professionally designed templates for any purpose",
                    icon: React.createElement(Award),
                  },
                  {
                    title: "Multi-Platform Optimization",
                    description:
                      "Automatically format your videos for all major social media platforms",
                    icon: React.createElement(Share2),
                  },
                  {
                    title: "Collaboration Tools",
                    description:
                      "Work together with your team in real-time with powerful collaboration features",
                    icon: React.createElement(Users),
                  },
                  // @ts-expect-error
                ]
              ).map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  whileHover={{
                    y: -8,
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
                    borderColor: "rgba(99, 102, 241, 0.3)",
                  }}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-primary-500/30 transition-all duration-300 h-full relative overflow-hidden"
                >
                  {/* Animated gradient corner */}
                  <motion.div
                    className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary-500/10 to-transparent rounded-full"
                    animate={{
                      rotate: [0, 90],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 8,
                      repeatType: "reverse",
                    }}
                  />

                  {/* Feature icon with animation */}
                  <motion.div
                    className="bg-primary-900/50 p-3 rounded-xl w-14 h-14 flex items-center justify-center mb-4 relative z-10"
                    whileHover={{
                      rotate: [0, 10, 0, -10, 0],
                      transition: { duration: 1, repeat: Infinity },
                    }}
                  >
                    {feature.icon || (
                      <motion.div
                        animate={{
                          rotate: [0, 360],
                          transition: {
                            repeat: Infinity,
                            duration: 8,
                            ease: "linear",
                          },
                        }}
                      >
                        <Sparkles className="h-7 w-7 text-primary-400" />
                      </motion.div>
                    )}
                  </motion.div>

                  <h3 className="text-xl font-bold text-white mb-3 break-words relative z-10">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 break-words relative z-10">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Feature comparison with animations */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-6xl mx-auto mt-16"
            >
              <motion.h2
                className="text-3xl font-bold text-white mb-8 break-words text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <span className="relative">
                  Why Choose {app.name}?
                  <motion.div
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 h-1 bg-primary-500/40 rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </span>
              </motion.h2>

              <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg border border-gray-700 relative">
                {/* Animated background elements */}
                <motion.div
                  className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary-500/5 to-transparent rounded-full"
                  animate={{
                    rotate: 360,
                    transition: {
                      repeat: Infinity,
                      duration: 15,
                      ease: "linear",
                    },
                  }}
                />
                <motion.div
                  className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-secondary-500/5 to-transparent rounded-full"
                  animate={{
                    rotate: -360,
                    transition: {
                      repeat: Infinity,
                      duration: 20,
                      ease: "linear",
                    },
                  }}
                />

                <div className="overflow-x-auto relative z-10">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr className="bg-gradient-to-r from-primary-900 to-primary-800">
                        <th className="py-4 px-6 text-left text-sm font-medium text-white uppercase tracking-wider">
                          Feature
                        </th>
                        <th className="py-4 px-6 text-center text-sm font-medium text-white uppercase tracking-wider">
                          <motion.span
                            className="flex flex-col items-center"
                            whileHover={{ y: -2 }}
                          >
                            <span className="text-lg font-bold text-primary-300 mb-1">
                              VideoRemix.vip
                            </span>
                            <span className="text-xs text-gray-300">
                              AI-Powered Platform
                            </span>
                          </motion.span>
                        </th>
                        <th className="py-4 px-6 text-center text-sm font-medium text-white uppercase tracking-wider">
                          <span className="flex flex-col items-center">
                            <span className="text-lg font-bold mb-1">
                              Traditional Editors
                            </span>
                            <span className="text-xs text-gray-300">
                              Adobe, Final Cut, etc.
                            </span>
                          </span>
                        </th>
                        <th className="py-4 px-6 text-center text-sm font-medium text-white uppercase tracking-wider">
                          <span className="flex flex-col items-center">
                            <span className="text-lg font-bold mb-1">
                              Other Online Tools
                            </span>
                            <span className="text-xs text-gray-300">
                              Basic web-based editors
                            </span>
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          feature: "AI-powered automation",
                          videoRemix: true,
                          traditional: false,
                          others: false,
                        },
                        {
                          feature: "No technical skills required",
                          videoRemix: true,
                          traditional: false,
                          others: true,
                        },
                        {
                          feature: "Create videos in minutes",
                          videoRemix: true,
                          traditional: false,
                          others: false,
                        },
                        {
                          feature: "Professional templates",
                          videoRemix: true,
                          traditional: false,
                          others: true,
                        },
                        {
                          feature: "Multi-platform export",
                          videoRemix: true,
                          traditional: true,
                          others: false,
                        },
                        {
                          feature: "Team collaboration",
                          videoRemix: true,
                          traditional: true,
                          others: false,
                        },
                      ].map((row, index) => (
                        <motion.tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-gray-800" : "bg-gray-850"
                          }
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.4,
                            delay: 0.2 + index * 0.1,
                          }}
                          whileHover={{
                            backgroundColor: "rgba(55, 65, 81, 0.7)",
                          }}
                        >
                          <td className="py-4 px-6 text-sm text-gray-300 break-words">
                            {row.feature}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {row.videoRemix ? (
                              <motion.div
                                animate={{
                                  scale: [1, 1.2, 1],
                                  color: [
                                    "rgb(34, 197, 94)",
                                    "rgb(74, 222, 128)",
                                    "rgb(34, 197, 94)",
                                  ],
                                }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 2,
                                  repeatDelay: 3,
                                }}
                              >
                                <Check className="h-5 w-5 text-green-500 mx-auto" />
                              </motion.div>
                            ) : (
                              <Minus className="h-5 w-5 text-gray-500 mx-auto" />
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {row.traditional ? (
                              <Check className="h-5 w-5 text-gray-400 mx-auto" />
                            ) : (
                              <motion.div
                                animate={{ rotate: [0, 10, 0, -10, 0] }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 2,
                                  repeatDelay: 5,
                                }}
                              >
                                <Minus className="h-5 w-5 text-red-500 mx-auto" />
                              </motion.div>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {row.others ? (
                              <Check className="h-5 w-5 text-gray-400 mx-auto" />
                            ) : (
                              <motion.div
                                animate={{ rotate: [0, 10, 0, -10, 0] }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 2,
                                  repeatDelay: 6,
                                }}
                              >
                                <Minus className="h-5 w-5 text-red-500 mx-auto" />
                              </motion.div>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* How It Works Tab */}
      {activeTab === "how-it-works" && (
        <section className="mb-16 relative">
          {/* Background elements */}
          <FloatingIcon
            icon={<PenTool />}
            top="10%"
            left="5%"
            color="rgba(99, 102, 241, 0.12)"
            size={32}
          />
          <FloatingIcon
            icon={<Clock />}
            bottom="15%"
            left="8%"
            color="rgba(234, 179, 8, 0.15)"
            size={28}
            delay={1}
          />
          <FloatingIcon
            icon={<Gift />}
            top="25%"
            right="5%"
            color="rgba(236, 72, 153, 0.12)"
            size={30}
            delay={2}
          />

          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center mb-12"
            >
              <motion.h2
                className="text-3xl font-bold text-white mb-6 break-words inline-block relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                How {app.name} Works
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </motion.h2>
              <p className="text-xl text-gray-300 break-words">
                Get started quickly and easily with our simple process.
              </p>
            </motion.div>

            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 relative">
                {/* Timeline connector */}
                <motion.div
                  className="absolute top-12 left-[40px] h-[calc(100%-2.5rem)] md:left-1/2 md:transform md:-translate-x-1/2 w-[1px] bg-primary-600/30 hidden md:block lg:hidden"
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  style={{ transformOrigin: "top" }}
                />

                {(
                  app.steps || [
                    {
                      title: "Choose Your Starting Point",
                      description:
                        "Select a template, start with text, or upload your own media",
                    },
                    {
                      title: "Customize Content",
                      description:
                        "Add your text, images, and videos using our intuitive interface",
                    },
                    {
                      title: "Apply AI Enhancements",
                      description:
                        "Let our AI optimize your content automatically for best results",
                    },
                    {
                      title: "Preview & Export",
                      description:
                        "Review your creation and export in your preferred format",
                    },
                    // @ts-expect-error
                  ]
                ).map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
                    whileHover={{
                      y: -8,
                      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
                      borderColor: "rgba(99, 102, 241, 0.3)",
                    }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 relative"
                  >
                    {/* Step number with animated glow effect */}
                    <div className="relative">
                      <motion.div
                        className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary-600/40 blur-md"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 3,
                          delay: index * 0.5,
                        }}
                      />

                      <div className="absolute -top-3 -left-3 bg-primary-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white z-10">
                        {index + 1}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3 pt-2 break-words">
                      {step.title}
                    </h3>
                    <p className="text-gray-300 break-words">
                      {step.description}
                    </p>

                    {/* Animated connector lines between steps */}
                    {index < (app.steps?.length || 4) - 1 && (
                      <>
                        {/* Horizontal connector (desktop) */}
                        <motion.div
                          className="hidden lg:block absolute top-1/2 -right-4 w-8 h-1 bg-primary-600/40"
                          initial={{ scaleX: 0 }}
                          whileInView={{ scaleX: 1 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.6,
                            delay: 0.7 + index * 0.2,
                          }}
                          style={{ transformOrigin: "left" }}
                        />

                        {/* Arrow at the end of horizontal connector */}
                        <motion.div
                          className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 translate-x-[calc(100%-4px)]"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.3,
                            delay: 0.9 + index * 0.2,
                          }}
                        >
                          <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-primary-600/40 border-b-[5px] border-b-transparent" />
                        </motion.div>
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Use Cases with enhanced animations */}
            {app.useCases && app.useCases.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="max-w-6xl mx-auto mt-16"
              >
                <motion.h2
                  className="text-3xl font-bold text-white mb-8 text-center break-words"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  What Can You Create With {app.name}?
                </motion.h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  // @ts-expect-error
                  {app.useCases.map((useCase, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                      whileHover={{
                        y: -10,
                        boxShadow: "0 25px 30px -15px rgba(0, 0, 0, 0.3)",
                        borderColor: "rgba(99, 102, 241, 0.3)",
                      }}
                      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 h-full"
                    >
                      {/* Decorative top border */}
                      <motion.div
                        className="h-1 bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600 w-full"
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.4 + index * 0.2 }}
                        style={{ transformOrigin: "left" }}
                      />

                      <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-3 break-words">
                          {useCase.title}
                        </h3>
                        <p className="text-gray-300 mb-4 break-words">
                          {useCase.description}
                        </p>

                        <ul className="space-y-2">
                          // @ts-expect-error
                          {useCase.points.map((point, i) => (
                            <motion.li
                              key={i}
                              className="flex items-start"
                              initial={{ opacity: 0, x: -10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{
                                duration: 0.3,
                                delay: 0.6 + index * 0.1 + i * 0.1,
                              }}
                              whileHover={{ x: 3 }}
                            >
                              <div className="bg-primary-900/50 p-1 rounded-full mr-2 mt-1.5 flex-shrink-0">
                                <Check className="h-3 w-3 text-primary-400" />
                              </div>
                              <span className="text-gray-400 text-sm break-words">
                                {point}
                              </span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Demo Video with enhanced animations */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto mt-16"
            >
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl overflow-hidden shadow-xl border border-gray-700 relative">
                {/* Animated glow effect */}
                <motion.div
                  className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/20 via-secondary-500/20 to-primary-500/20 rounded-xl blur-lg z-0"
                  animate={{
                    opacity: [0.2, 0.5, 0.2],
                    background: [
                      "linear-gradient(to right, rgba(99,102,241,0.2), rgba(236,72,153,0.2), rgba(99,102,241,0.2))",
                      "linear-gradient(to right, rgba(236,72,153,0.2), rgba(99,102,241,0.2), rgba(236,72,153,0.2))",
                      "linear-gradient(to right, rgba(99,102,241,0.2), rgba(236,72,153,0.2), rgba(99,102,241,0.2))",
                    ],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 5,
                  }}
                />

                <div className="aspect-video relative z-10">
                  <img
                    src={app.demoImage || app.image}
                    alt={`${app.name} Demo`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <motion.button
                      whileHover={{
                        scale: 1.1,
                        boxShadow: "0 0 30px 5px rgba(99, 102, 241, 0.5)",
                      }}
                      whileTap={{ scale: 0.9 }}
                      className="bg-primary-600 rounded-full p-5 text-white relative"
                    >
                      {/* Animated circles */}
                      <motion.div
                        className="absolute -inset-4 rounded-full border border-primary-500/40"
                        animate={{
                          scale: [1, 1.5],
                          opacity: [0.7, 0],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2,
                        }}
                      />
                      <motion.div
                        className="absolute -inset-2 rounded-full border border-primary-500/60"
                        animate={{
                          scale: [1, 1.3],
                          opacity: [0.8, 0],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2,
                          delay: 0.5,
                        }}
                      />

                      <Play className="h-10 w-10" fill="white" />
                    </motion.button>
                  </div>
                </div>
                <div className="p-6 text-center">
                  <motion.h3
                    className="text-xl font-bold text-white mb-2 break-words"
                    whileInView={{
                      textShadow: [
                        "0 0 0px rgba(99,102,241,0)",
                        "0 0 15px rgba(99,102,241,0.5)",
                        "0 0 0px rgba(99,102,241,0)",
                      ],
                    }}
                    viewport={{ once: true }}
                    transition={{
                      delay: 0.3,
                      duration: 2,
                      repeat: 2,
                      repeatDelay: 2,
                    }}
                  >
                    See {app.name} in Action
                  </motion.h3>
                  <p className="text-gray-300 break-words">
                    Watch how easy it is to create professional videos with{" "}
                    {app.name}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* FAQ Tab with animated elements */}
      {activeTab === "faq" && (
        <section className="mb-16 relative">
          {/* Floating icons */}
          <FloatingIcon
            icon={<MessageSquare />}
            top="5%"
            left="10%"
            color="rgba(99, 102, 241, 0.1)"
            size={30}
          />
          <FloatingIcon
            icon={<Sparkles />}
            bottom="10%"
            right="8%"
            color="rgba(236, 72, 153, 0.1)"
            size={36}
            delay={0.5}
          />
          <FloatingIcon
            icon={<Mail />}
            top="30%"
            right="12%"
            color="rgba(99, 102, 241, 0.08)"
            size={24}
            delay={1.5}
          />

          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center mb-12"
            >
              <MagicSparkles
                minSparkles={3}
                maxSparkles={6}
                colors={["#6366f1", "#818cf8", "#f472b6", "#ec4899"]}
              >
                <h2 className="text-3xl font-bold text-white mb-6 break-words">
                  Frequently Asked Questions
                </h2>
              </MagicSparkles>
              <p className="text-xl text-gray-300 break-words">
                Get answers to common questions about {app.name}
              </p>
            </motion.div>

            <div className="max-w-3xl mx-auto">
              <div className="space-y-4">
                {(
                  app.faqs || [
                    {
                      question: `What is ${app.name}?`,
                      answer: `${app.name} is a specialized app within the VideoRemix.vip platform that focuses on ${app.description.toLowerCase()}. It provides a streamlined workflow for this specific use case, making it easier than ever to create professional content.`,
                    },
                    {
                      question:
                        "Do I need any technical skills to use this app?",
                      answer:
                        "Not at all! Our app is designed to be user-friendly and intuitive. You don't need any prior video editing experience or technical skills to create professional-quality content.",
                    },
                    {
                      question: "How long does it take to create a video?",
                      answer:
                        "Most videos can be created in just minutes, compared to hours or days with traditional methods. The exact time depends on the complexity of your project, but our AI-powered tools dramatically speed up the process.",
                    },
                    {
                      question: "Can I use my own branding and assets?",
                      answer:
                        "Absolutely! You can upload your logo, fonts, colors, and other brand elements to ensure your videos maintain consistent branding. You can also use your own media assets alongside our stock library.",
                    },
                    {
                      question: "What formats can I export in?",
                      answer:
                        "You can export your videos in all standard formats including MP4, MOV, and more. We also offer presets optimized for different platforms like YouTube, Instagram, TikTok, Facebook, and LinkedIn.",
                    },
                    {
                      question:
                        "Is this included in my VideoRemix.vip subscription?",
                      answer:
                        "Yes! All apps are included in the Pro and Business subscription plans. The Free plan offers limited access to certain apps and features.",
                    },
                    // @ts-expect-error
                  ]
                ).map((faq, index) => {
                  const faqId = `faq-${index}`;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 relative"
                    >
                      {/* Subtle animated highlight around the active FAQ */}
                      {activeFaq === index && (
                        <motion.div
                          className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary-500/20 via-secondary-500/20 to-primary-500/20 blur-sm z-0"
                          animate={{
                            opacity: [0.3, 0.7, 0.3],
                            background: [
                              "linear-gradient(to right, rgba(99,102,241,0.2), rgba(236,72,153,0.2), rgba(99,102,241,0.2))",
                              "linear-gradient(to right, rgba(236,72,153,0.2), rgba(99,102,241,0.2), rgba(236,72,153,0.2))",
                              "linear-gradient(to right, rgba(99,102,241,0.2), rgba(236,72,153,0.2), rgba(99,102,241,0.2))",
                            ],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 3,
                          }}
                        />
                      )}

                      <button
                        className="w-full text-left p-6 flex justify-between items-center focus:outline-none relative z-10"
                        onClick={() => toggleFaq(index)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleFaq(index);
                          }
                        }}
                        aria-expanded={activeFaq === index}
                        aria-controls={faqId}
                        tabIndex={0}
                      >
                        <h3 className="text-lg font-semibold text-white break-words pr-8">
                          {faq.question}
                        </h3>
                        <motion.div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
                            activeFaq === index
                              ? "bg-primary-600/60 text-white"
                              : "bg-gray-700 text-gray-300"
                          }`}
                          animate={
                            activeFaq === index
                              ? {
                                  rotate: 180,
                                }
                              : {
                                  rotate: 0,
                                }
                          }
                          transition={{ duration: 0.3 }}
                        >
                          {activeFaq === index ? (
                            <Minus className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </motion.div>
                      </button>

                      {/* Answer with animation */}
                      <motion.div
                        id={faqId}
                        initial={{ opacity: 0, height: 0 }}
                        animate={
                          activeFaq === index
                            ? { opacity: 1, height: "auto", marginBottom: 16 }
                            : { opacity: 0, height: 0, marginBottom: 0 }
                        }
                        transition={{ duration: 0.3 }}
                        className="px-6 pb-0 overflow-hidden relative z-10"
                      >
                        <p className="text-gray-300 break-words">{faq.answer}</p>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-12 text-center"
              >
                <p className="text-gray-300 mb-6 break-words">
                  Have more questions about {app.name}?
                </p>

                <motion.div
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4)",
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/help"
                    className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Visit Help Center
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Related Apps with enhanced animations */}
      <section className="relative">
        {/* Floating icons */}
        <FloatingIcon
          icon={<Layers />}
          top="15%"
          left="5%"
          color="rgba(99, 102, 241, 0.08)"
          size={30}
        />
        <FloatingIcon
          icon={<Video />}
          bottom="20%"
          left="10%"
          color="rgba(236, 72, 153, 0.1)"
          size={28}
          delay={1.5}
        />
        <FloatingIcon
          icon={<MousePointer />}
          top="25%"
          right="8%"
          color="rgba(99, 102, 241, 0.1)"
          size={24}
          delay={0.8}
          duration={4}
        />

        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto text-center mb-12"
          >
            <MagicSparkles
              minSparkles={3}
              maxSparkles={6}
              colors={["#6366f1", "#818cf8", "#f472b6", "#ec4899"]}
            >
              <h2 className="text-3xl font-bold text-white mb-6 break-words">
                Explore More Apps
              </h2>
            </MagicSparkles>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto break-words">
              Discover other powerful tools in the VideoRemix.vip ecosystem
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {appsData
              .filter((a) => a.id !== app.id)
              .slice(0, 4)
              .map((relatedApp, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  whileHover={{
                    y: -10,
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
                    borderColor: "rgba(99, 102, 241, 0.3)",
                  }}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:border-primary-500/30 transition-colors group h-full relative"
                >
                  {/* Animated gradient border */}
                  <motion.div
                    className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100"
                    style={{
                      background:
                        "linear-gradient(90deg, #6366f180, #ec489980, #6366f180)",
                      backgroundSize: "200% 200%",
                      zIndex: -1,
                    }}
                    animate={{
                      backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      repeatType: "mirror",
                    }}
                  />

                  {/* App image with animated hover effect */}
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={relatedApp.image}
                      alt={relatedApp.name}
                      className="w-full h-full object-cover transform transition-transform duration-700 ease-in-out group-hover:scale-110"
                    />
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary-400 transition-colors break-words">
                      {relatedApp.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 break-words">
                      {relatedApp.description}
                    </p>

                    <motion.div
                      whileHover={{ x: 3 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link
                        to={`/app/${relatedApp.id}`}
                        className="inline-flex items-center text-primary-400 hover:text-primary-300 font-medium text-sm"
                      >
                        Learn More
                        <motion.div
                          animate={{
                            x: [0, 3, 0],
                            transition: {
                              repeat: Infinity,
                              duration: 1.5,
                              repeatDelay: 2,
                            },
                          }}
                          className="ml-1"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </motion.div>
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
          </div>

          <div className="text-center mt-8">
            <motion.div
              whileHover={{ scale: 1.05, x: 3 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/#apps"
                className="inline-flex items-center text-primary-400 hover:text-primary-300 font-medium"
              >
                View All Apps
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA with enhanced visual elements */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="mt-16 container mx-auto px-4"
      >
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary-900/40 to-primary-700/40 rounded-xl border border-primary-500/30 p-8 text-center relative overflow-hidden">
          {/* Animated background elements */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent"
            animate={{
              opacity: [0.3, 0.8, 0.3],
              backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
            }}
          />

          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary-500 to-transparent"
            animate={{
              opacity: [0.3, 0.8, 0.3],
              backgroundPosition: ["100% 0%", "0% 0%", "100% 0%"],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
            }}
          />

          {/* Animated particles */}
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-primary-500/20"
              style={{
                width: `${Math.random() * 8 + 4}px`,
                height: `${Math.random() * 8 + 4}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -Math.random() * 100 - 50],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}

          <MagicSparkles
            maxSparkles={10}
            minSparkles={5}
            minSize={5}
            maxSize={12}
          >
            <h2 className="text-3xl font-bold text-white mb-6 break-words relative z-10">
              Ready to Transform Your Video Creation?
            </h2>
          </MagicSparkles>

          <p className="text-xl text-gray-300 mb-8 break-words relative z-10">
            Join thousands of creators and businesses who have revolutionized
            their workflow with {app.name}.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 30px -10px rgba(255, 255, 255, 0.3)",
              }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-primary-600 hover:bg-gray-100 font-bold px-8 py-4 rounded-lg shadow-lg inline-flex items-center justify-center relative overflow-hidden"
              onClick={() => navigate("/pricing")}
            >
              {/* Button shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-100/30 to-transparent -skew-x-20"
                animate={{
                  x: ["-100%", "200%"],
                }}
                transition={{
                  repeat: Infinity,
                  repeatDelay: 2,
                  duration: 1.2,
                  ease: "easeInOut",
                }}
              />
              <span className="relative z-10">Start Free Trial</span>
              <motion.div
                animate={{
                  x: [0, 5, 0],
                  transition: {
                    repeat: Infinity,
                    duration: 1.5,
                    repeatDelay: 2,
                  },
                }}
                className="relative z-10 ml-2"
              >
                <ArrowRight className="h-5 w-5" />
              </motion.div>
            </motion.button>

            <motion.div
              whileHover={{
                scale: 1.05,
                borderColor: "rgba(255, 255, 255, 0.3)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/contact"
                className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-8 py-4 rounded-lg border border-gray-700 inline-flex items-center justify-center h-full relative overflow-hidden"
              >
                {/* Button subtle pulse effect */}
                <motion.div
                  className="absolute inset-0 bg-primary-600/10"
                  animate={{
                    opacity: [0, 0.3, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                  }}
                />
                <span className="relative z-10">Contact Sales</span>
                <MessageSquare className="ml-2 h-5 w-5 relative z-10" />
              </Link>
            </motion.div>
          </div>

          <p className="mt-4 text-gray-500 text-sm relative z-10 flex items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, 0, -10, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                repeatDelay: 5,
              }}
              className="mr-1"
            >
              <Gift className="h-4 w-4 text-gray-500 inline-block" />
            </motion.div>
            No credit card required. Start with all premium features.
          </p>
        </div>
      </motion.div>

      {/* Purchase Modal */}
      {app && (
        <PurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          app={app}
        />
      )}
    </div>
  );
};

export default AppDetailPage;
