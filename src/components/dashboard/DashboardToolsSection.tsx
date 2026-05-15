import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Video,
  Users,
  Image as ImageIcon,
  Sparkles,
  Palette,
  CircleUser as UserCircle,
  Package,
  Layers,
  FileText,
  Mic,
  Search,
  ArrowRight,
  Filter,
  Play,
  Star,
  PanelTop,
  Zap,
  Camera,
  Share,
  Megaphone,
  Database,
  Monitor,
  DollarSign,
  Ligature as FileSignature,
  LayoutTemplate,
  ShoppingBag,
  Store,
  UserCheck,
  Rocket,
  Settings,
  BarChart2,
  Briefcase,
  Wand2,
  Scissors,
  Edit,
  Heart,
  MessageSquare,
  ShoppingCart,
  CreditCard,
  Mail,
  Radio,
  Send,
  Plane,
  Wrench,
  Droplets as Drop,
  Car,
  Truck,
  Home,
  Shield,
  Utensils,
  TrendingUp,
  Code,
  BookOpen,
  Globe,
  MapPin,
  X,
  Brain,
  Check,
  Lock,
} from "lucide-react";
import MagicSparkles from "../MagicSparkles";
import { useInView } from "react-intersection-observer";
import { useAuth } from "../../context/AuthContext";
import { useUserAccess } from "../../hooks/useUserAccess";
import { useApps } from "../../hooks/useApps";
import LockedAppOverlay from "../LockedAppOverlay";
import PurchaseModal from "../PurchaseModal";
import LazyIcon from "../LazyIcon";
import { SalesDropdown } from '../ui/SalesDropdown';
import SalesDropdownErrorBoundary from '../ui/SalesDropdownErrorBoundary';
import { appSalesCopy } from '../../data/appSalesCopy';
import { getBundleForApp } from '../../data/appsData';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";

// Define TrendingUp component
const TrendingUp: React.FC<{ className?: string }> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

// App categories
const toolCategories = [
  {
    id: "all",
    label: "All Apps",
    icon: React.createElement(Layers, { className: "w-4 h-4" }),
  },
  {
    id: "sales-lead-gen",
    label: "Sales & Lead Gen",
    icon: React.createElement(TrendingUp, { className: "w-4 h-4" }),
  },
  {
    id: "content-marketing",
    label: "Content & Marketing",
    icon: React.createElement(FileText, { className: "w-4 h-4" }),
  },
  {
    id: "video-audio-voice",
    label: "Video, Audio & Voice",
    icon: React.createElement(Video, { className: "w-4 h-4" }),
  },
  {
    id: "rag-knowledgebase",
    label: "RAG & Knowledgebase",
    icon: React.createElement(Database, { className: "w-4 h-4" }),
  },
  {
    id: "realestate-local",
    label: "Real Estate & Local",
    icon: React.createElement(Home, { className: "w-4 h-4" }),
  },
  {
    id: "hr-hiring",
    label: "HR & Hiring",
    icon: React.createElement(UserCheck, { className: "w-4 h-4" }),
  },
  {
    id: "finance-business",
    label: "Finance & Business",
    icon: React.createElement(DollarSign, { className: "w-4 h-4" }),
  },
  {
    id: "legal-compliance",
    label: "Legal & Compliance",
    icon: React.createElement(Shield, { className: "w-4 h-4" }),
  },
  {
    id: "coding-developer",
    label: "Coding & SaaS",
    icon: React.createElement(Settings, { className: "w-4 h-4" }),
  },
  {
    id: "design-uiux",
    label: "Design & UI/UX",
    icon: React.createElement(Palette, { className: "w-4 h-4" }),
  },
  {
    id: "research-education",
    label: "Research & Training",
    icon: React.createElement(Search, { className: "w-4 h-4" }),
  },
  {
    id: "productivity-personal",
    label: "Productivity & Personal",
    icon: React.createElement(UserCircle, { className: "w-4 h-4" }),
  },
];

// Featured apps to highlight
const featuredApps = [
  "video-creator",
  "landing-page",
  "thumbnail-generator",
  "ai-art",
  "storyboard",
  "rebrander-ai",
];

// Fallback image URLs to use when an app image fails to load
const fallbackImages = [
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
];

// Personalization benefits
const personalizationBenefits = [
  {
    title: "47% Higher Engagement",
    description:
      "Personalized content drives significantly more engagement than generic content",
    icon: <Zap className="h-5 w-5 text-primary-400" />,
  },
  {
    title: "3.5x More Conversions",
    description:
      "Personalized videos convert at rates up to 3.5x higher than standard videos",
    icon: <TrendingUp className="h-5 w-5 text-primary-400" />,
  },
  {
    title: "92% Message Retention",
    description:
      "Viewers remember personalized content longer and more accurately",
    icon: <Brain className="h-5 w-5 text-primary-400" />,
  },
  {
    title: "Global Audience Ready",
    description:
      "Personalize content for different regions, languages, and cultures",
    icon: <Globe className="h-5 w-5 text-primary-400" />,
  },
];

// Helper function to get app URL
const getAppUrl = (appId: string, apps: any[] = []) => {
  if (!apps || apps.length === 0) {
    return `/app/${appId}`;
  }
  const app = apps.find((a) => a.id === appId);
  return app?.url || `/app/${appId}`;
};

const DashboardToolsSection: React.FC = () => {
  const { user } = useAuth();
  const {
    hasAccessToApp,
    accessData,
    loading: accessLoading,
  } = useUserAccess();
  const { apps: appsData, loading: appsLoading } = useApps();

  const purchasedApps = accessData?.apps.map((app) => app.appSlug) || [];
  const hasAnyPurchases = purchasedApps.length > 0;
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedAppForPurchase, setSelectedAppForPurchase] =
    useState<any>(null);
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  // Image loading error handling state
  const [imageErrors, setImageErrors] = useState<Record<string, number>>({});



  // Handle image load errors
  const handleImageError = (appId: string) => {
    setImageErrors((prev) => {
      // Get the current error count or 0 if first error
      const currentErrorCount = prev[appId] || 0;

      // Increment error count for this app
      return {
        ...prev,
        [appId]: currentErrorCount + 1,
      };
    });
  };

  // Get a fallback image URL based on app ID
  const getFallbackImage = (appId: string, errorCount: number = 0) => {
    // Start with a deterministic fallback based on app ID
    const index = appId.charCodeAt(0) % fallbackImages.length;

    // If multiple errors, cycle through fallbacks
    const adjustedIndex = (index + errorCount) % fallbackImages.length;

    return fallbackImages[adjustedIndex];
  };





  // Get featured apps
  const getFeaturedApps = () => {
    if (!appsData || appsData.length === 0) {
      return [];
    }
    return appsData.filter((app) => featuredApps.includes(app.id));
  };



  return (
    <section id="tools" className="py-20 bg-black relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px]"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px]"></div>

      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <MagicSparkles
            minSparkles={5}
            maxSparkles={10}
            colors={["#6366f1", "#818cf8", "#f472b6", "#ec4899"]}
          >
            <div className="inline-block mb-4">
              <div className="bg-gradient-to-r from-primary-600 to-primary-400 text-white font-bold px-6 py-2 rounded-full">
                <Sparkles className="inline-block mr-2 h-5 w-5" />
                PERSONALIZED TOOLS COLLECTION
              </div>
            </div>
          </MagicSparkles>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            {user ? (
              <>
                Your{" "}
                <span className="text-primary-400">Personalized Tools</span>
              </>
            ) : (
              <>
                Create Content That{" "}
                <span className="text-primary-400">Speaks Directly</span> To
                Your Audience
              </>
            )}
          </h2>

          <p className="text-xl text-gray-300 mb-8">
            {user && hasAnyPurchases ? (
              <>
                You have access to {purchasedApps.length} personalization{" "}
                {purchasedApps.length === 1 ? "tool" : "tools"}
              </>
            ) : user ? (
              <>Browse available tools and start personalizing your content</>
            ) : (
              <>
                VideoRemix.vip offers 50+ personalization tools that help you
                create highly targeted, engaging content that resonates with
                each specific viewer segment.
              </>
            )}
          </p>

          {/* Personalization benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {personalizationBenefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-5 border border-gray-700"
              >
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2.5 rounded-full bg-primary-900/50">
                    {benefit.icon}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  {benefit.title}
                </h3>
                <p className="text-gray-400 text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Categories */}
        <div className="relative mb-10">
          <div className="flex justify-center overflow-x-auto hide-scrollbar">
            <div className="flex space-x-3">
              {toolCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "secondary"}
                  size="sm"
                  className={`min-w-[140px] h-auto py-3 px-4 ${
                    selectedCategory === category.id
                      ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md"
                      : ""
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <div className="flex flex-col items-center">
                    <div className="mb-1">
                      {category.icon}
                    </div>
                    <span className="text-xs">{category.label}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Search and filter controls */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0">
            <div className="relative md:w-1/3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tools..."
                className="pl-10 pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Category Sections */}
        <div className="space-y-16">
          {toolCategories.slice(1).map((category, categoryIndex) => {
            let categoryApps = appsData.filter(app => app.category === category.id);

            // Apply search filter
            if (searchQuery.trim()) {
              const query = searchQuery.toLowerCase();
              categoryApps = categoryApps.filter(
                (app) =>
                  app.name.toLowerCase().includes(query) ||
                  app.description.toLowerCase().includes(query)
              );
            }

            if (categoryApps.length === 0) return null;

            // Only show this category section if "all" is selected or this category is selected
            if (selectedCategory !== "all" && selectedCategory !== category.id) return null;

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.7, delay: 0.3 + categoryIndex * 0.1 }}
                className="max-w-6xl mx-auto"
              >
                <div className="flex items-center mb-8">
                  <div className="p-3 bg-primary-900/50 rounded-lg mr-4">
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{category.label}</h3>
                    <p className="text-gray-400 text-sm">
                      {categoryApps.length} {categoryApps.length === 1 ? 'tool' : 'tools'} available
                      {searchQuery && ` (filtered)`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categoryApps.slice(0, 8).map((app, index) => {
                    const isPurchased = user && hasAccessToApp(app.id);
                    const handleAppClick = (e: React.MouseEvent) => {
                      if (!isPurchased) {
                        e.preventDefault();
                        setSelectedAppForPurchase(app);
                        setPurchaseModalOpen(true);
                      }
                    };

                    return (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                        whileHover={{ y: -8, transition: { duration: 0.2 } }}
                        className="cursor-pointer"
                        onClick={handleAppClick}
                      >
                        <Card className="relative overflow-hidden group hover:border-primary-500/50 transition-colors">
                          {/* App image */}
                          <div className="w-full aspect-video relative">
                            <img
                              src={imageErrors[app.id] ? getFallbackImage(app.id, imageErrors[app.id]) : app.image}
                              alt={app.name}
                              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
                              onError={() => handleImageError(app.id)}
                            />

                            {/* Status badges */}
                            <div className="absolute top-3 right-3 flex flex-col space-y-1 items-end">
                              {isPurchased ? (
                                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded font-bold flex items-center">
                                  <Check className="h-3 w-3 mr-1" /> OWNED
                                </span>
                              ) : (
                                <span className="bg-gray-600 text-white text-xs px-2 py-0.5 rounded font-bold flex items-center">
                                  <Lock className="h-3 w-3 mr-1" /> LOCKED
                                </span>
                              )}
                              {app.popular && (
                                <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded font-bold">
                                  POPULAR
                                </span>
                              )}
                              {app.new && (
                                <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded font-bold">
                                  NEW
                                </span>
                              )}
                            </div>

                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                          </div>

                          <CardContent className="p-4">
                            <h4 className="text-white font-bold text-lg group-hover:text-primary-400 transition-colors mb-2">
                              {app.name}
                            </h4>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                              {app.description}
                            </p>

                            <div className="flex justify-between items-center">
                              <div className="flex items-center text-gray-500 text-xs">
                                <LazyIcon name={app.iconName} className="w-4 h-4 text-primary-400 mr-1" />
                                <span>{category.label}</span>
                              </div>

                              <span className="text-primary-400 text-sm font-medium flex items-center">
                                {isPurchased ? "Open" : "Purchase"}
                                <ArrowRight className="ml-1 h-3 w-3" />
                              </span>
                            </div>
                          </CardContent>

                          {/* Hover overlay */}
                          {!isPurchased && (
                            <div className="absolute inset-0 bg-primary-900/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-white text-gray-900 px-6 py-3 rounded-lg font-bold flex items-center"
                                onClick={handleAppClick}
                              >
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                Purchase Now
                              </motion.button>
                            </div>
                          )}
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                {categoryApps.length > 8 && (
                  <div className="text-center mt-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary-400 hover:text-primary-300"
                      onClick={() => {
                        // Could implement "show more" functionality
                        console.log(`Show more ${category.label} apps`);
                      }}
                    >
                      View all {categoryApps.length} {category.label.toLowerCase()} tools →
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Empty state when user has no purchases */}
        {user && !accessLoading && purchasedApps.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-3xl mx-auto mb-16 text-center"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 border border-gray-700">
              <div className="w-20 h-20 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-10 w-10 text-primary-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Welcome to VideoRemix.vip! 🎉
              </h3>
              <p className="text-gray-300 mb-6">
                You've taken the first step toward creating highly personalized
                content that converts. Browse our collection of 50+ AI-powered
                personalization tools and see how they can transform your
                marketing.
              </p>
              <div className="bg-primary-900/20 border border-primary-500/30 rounded-lg p-4 mb-8">
                <p className="text-primary-200 text-sm">
                  💡 <strong>Pro tip:</strong> Personalization can increase
                  engagement by up to 47% and boost conversions by 3.5x
                </p>
              </div>
              <Link
                to="/tools"
                className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg shadow-lg shadow-primary-600/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary-600/30"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Explore Personalization Tools
              </Link>
            </div>
          </motion.div>
        )}

        {/* Featured personalization tools - only show if user has purchases */}
        {(!user || hasAnyPurchases) && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-6xl mx-auto mb-16"
          >
            <h3 className="text-2xl font-bold text-white mb-6">
              {user && hasAnyPurchases
                ? "Your Apps"
                : "Featured Personalization Tools"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFeaturedApps().map((app, index) => {
                const isPurchased = user && hasAccessToApp(app.id);
                const handleAppClick = (e: React.MouseEvent) => {
                  if (!isPurchased) {
                    e.preventDefault();
                    setSelectedAppForPurchase(app);
                    setPurchaseModalOpen(true);
                  }
                };

                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={
                      inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                    }
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    whileHover={{
                      y: -10,
                      transition: { duration: 0.2 },
                    }}
                    className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden group border border-gray-700 shadow-lg"
                    onClick={handleAppClick}
                  >
                    {/* App label and status */}
                    <div className="absolute top-0 left-0 right-0 px-4 py-3 bg-gradient-to-b from-black/70 to-transparent z-20 flex justify-between items-start">
                      <div className="max-w-[70%]">
                        <h4 className="text-white font-bold truncate">
                          Personalized {app.name}
                        </h4>
                        <p className="text-gray-300 text-sm truncate">
                          Tailored {app.description.toLowerCase()}
                        </p>
                      </div>

                      <div className="flex flex-col space-y-1 items-end">
                        {isPurchased && (
                          <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center">
                            <Check className="h-3 w-3 mr-1" /> OWNED
                          </span>
                        )}
                        {!isPurchased && (
                          <span className="bg-gray-600 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center">
                            <Lock className="h-3 w-3 mr-1" /> LOCKED
                          </span>
                        )}
                        {app.popular && (
                          <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">
                            POPULAR
                          </span>
                        )}
                        {app.new && (
                          <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            NEW
                          </span>
                        )}
                      </div>
                    </div>

                    {/* App image */}
                    <div className="w-full aspect-video">
                      <img
                        src={
                          imageErrors[app.id]
                            ? getFallbackImage(app.id, imageErrors[app.id])
                            : app.image
                        }
                        alt={app.name}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
                        onError={() => handleImageError(app.id)}
                      />

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                    </div>

                    {/* Hover overlay with action button */}
                    {!isPurchased && (
                      <div className="absolute inset-0 bg-primary-900/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-30">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-white text-gray-900 px-6 py-3 rounded-lg font-bold flex items-center"
                          onClick={handleAppClick}
                        >
                          <ShoppingCart className="mr-2 h-5 w-5" />
                          Purchase Now
                        </motion.button>
                      </div>
                    )}
                    {isPurchased && (
                      <div className="absolute inset-0 bg-primary-900/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-30">
                        <a
                          href={getAppUrl(app.id, appsData)}
                          className="bg-white text-gray-900 px-6 py-3 rounded-lg font-bold flex items-center"
                        >
                          <Wand2 className="mr-2 h-5 w-5" />
                          Open App
                        </a>
                      </div>
                    )}

                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent z-10">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-800/80 rounded-full mr-3">
                          <LazyIcon
                            name={app.iconName}
                            className="w-5 h-5 text-primary-400"
                          />
                        </div>

                        <div className="flex items-center text-gray-300 text-sm overflow-hidden">
                          <span className="truncate">
                            Personalized{" "}
                            {
                              toolCategories.find((c) => c.id === app.category)
                                ?.label
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}







        {/* Bottom CTA - show for non-logged-in users or users without purchases */}
        {(!user || !hasAnyPurchases) && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center bg-gradient-to-r from-primary-900/40 to-primary-700/40 p-8 rounded-xl border border-primary-500/30"
          >
            <MagicSparkles minSparkles={5} maxSparkles={8}>
              <h3 className="text-2xl font-bold text-white mb-4">
                Unlock All Personalization Tools
              </h3>
            </MagicSparkles>

            <p className="text-gray-300 mb-8">
              Get unlimited access to all 50+ personalization tools and create
              content that delivers 3x better results than generic videos.
            </p>

            <motion.a
              href="#pricing"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg shadow-lg shadow-primary-600/20"
            >
              <span>Start Personalizing Today</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </motion.a>
          </motion.div>
        )}
      </div>

      {/* Purchase Modal */}
      {selectedAppForPurchase && (
        <PurchaseModal
          isOpen={purchaseModalOpen}
          onClose={() => {
            setPurchaseModalOpen(false);
            setSelectedAppForPurchase(null);
          }}
          app={selectedAppForPurchase}
          bundleInfo={getBundleForApp(selectedAppForPurchase.id)}
        />
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
};

export default DashboardToolsSection;
