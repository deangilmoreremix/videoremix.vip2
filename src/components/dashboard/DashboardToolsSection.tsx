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

// =====================================================
// PRODUCTION BATCHES — Single source of truth for grouping
// These match the 10 production batches shipped across 2026
// =====================================================
const productionBatches = [
  {
    id: "batch-1",
    number: 1,
    name: "Sales, Lead Gen & Prospecting",
    description: "AI that turns cold outreach into closed deals at scale",
    categories: ["sales-lead-gen", "sales"],
    accent: "#6366f1",
  },
  {
    id: "batch-2",
    number: 2,
    name: "Content Creation & Marketing",
    description: "High-velocity content engines that 3-5x engagement",
    categories: ["content-marketing"],
    accent: "#ec4899",
  },
  {
    id: "batch-3",
    number: 3,
    name: "Video, Audio & Voice AI",
    description: "Cinematic video, voice, and audio production in minutes",
    categories: ["video-audio-voice", "video"],
    accent: "#8b5cf6",
  },
  {
    id: "batch-4",
    number: 4,
    name: "RAG, Knowledgebase & Document Intelligence",
    description: "Enterprise-grade retrieval and document reasoning",
    categories: ["rag-knowledgebase"],
    accent: "#14b8a6",
  },
  {
    id: "batch-5",
    number: 5,
    name: "Research, Analysis & Education",
    description: "Deep research and insight generation at unprecedented speed",
    categories: ["research-education"],
    accent: "#f59e0b",
  },
  {
    id: "batch-6",
    number: 6,
    name: "Developer, Code & SaaS Tools",
    description: "AI pair programmers and full-stack acceleration",
    categories: ["coding-developer"],
    accent: "#3b82f6",
  },
  {
    id: "batch-7",
    number: 7,
    name: "Design, UI/UX & Creative Systems",
    description: "Professional-grade design and interface intelligence",
    categories: ["design-uiux", "ai-image", "personalizer"],
    accent: "#a855f7",
  },
  {
    id: "batch-8",
    number: 8,
    name: "Finance, Legal & Compliance",
    description: "Risk, contracts, due diligence, and financial intelligence",
    categories: ["finance-business", "legal-compliance"],
    accent: "#10b981",
  },
  {
    id: "batch-9",
    number: 9,
    name: "HR, Hiring & Talent",
    description: "Recruiting, interviewing, and workforce optimization",
    categories: ["hr-hiring"],
    accent: "#ef4444",
  },
  {
    id: "batch-10",
    number: 10,
    name: "Local, Real Estate & Travel",
    description: "Hyper-local intelligence and experience design",
    categories: ["realestate-local", "productivity-personal", "page", "lead-gen"],
    accent: "#06b6d4",
  },
];

// Legacy category filter (kept for backward compat in other parts)
const toolCategories = [
  { id: "all", label: "All Batches", iconName: "layers" },
  ...productionBatches.map((b) => ({
    id: b.id,
    label: b.name,
    iconName: "layers",
  })),
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

// =====================================================
// Batch resolution — maps any app to its production batch
// =====================================================
const getBatchForApp = (app: any) => {
  if (!app) return null;
  const cat = app.category;

  for (const batch of productionBatches) {
    if (batch.categories.includes(cat)) {
      return batch;
    }
  }
  // Fallback for unknown categories
  return {
    id: "batch-uncategorized",
    number: 99,
    name: "Other Tools",
    description: "Additional powerful utilities",
    accent: "#64748b",
  };
};

// Group apps by their production batch (used for the main layout)
const groupAppsByBatch = (apps: any[]) => {
  const groups: Record<string, { batch: any; apps: any[] }> = {};

  productionBatches.forEach((batch) => {
    groups[batch.id] = { batch, apps: [] };
  });
  // Fallback bucket
  groups["batch-uncategorized"] = {
    batch: {
      id: "batch-uncategorized",
      number: 99,
      name: "Other Tools",
      description: "Additional powerful utilities",
      accent: "#64748b",
    },
    apps: [],
  };

  apps.forEach((app) => {
    const batch = getBatchForApp(app);
    const key = batch.id;
    if (groups[key]) {
      groups[key].apps.push(app);
    }
  });

  // Return only batches that have apps (or always show all 10 for marketing)
  return Object.values(groups).filter((g) => g.apps.length > 0 || g.batch.number < 11);
};

// Toggle GTM expansion for a specific app card (premium micro-interaction)
const toggleGTM = (appId: string) => {
  setExpandedGTM((prev) => ({
    ...prev,
    [appId]: !prev[appId],
  }));
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
  // Per-card GTM expansion state (for premium dashboard experience)
  const [expandedGTM, setExpandedGTM] = useState<Record<string, boolean>>({});

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

        {/* =====================================================
             PREMIUM BATCH FILTER — 1M-dollar dashboard level
             Elegant, scrollable, confident
          ===================================================== */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <div className="text-xs font-semibold tracking-[3px] text-primary-400/70 uppercase">Production Batches</div>
              <div className="text-2xl font-semibold text-white tracking-tight">Organized by the 10 batches we actually shipped</div>
            </div>
            <div className="hidden md:block text-sm text-gray-500">
              {appsData.length} tools across 10 production batches
            </div>
          </div>

          {/* Elegant batch pills */}
          <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`snap-start px-5 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all border ${
                selectedCategory === "all"
                  ? "bg-white text-black border-white shadow-lg"
                  : "bg-gray-900/60 border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              All Batches
            </button>
            {productionBatches.map((batch) => (
              <button
                key={batch.id}
                onClick={() => setSelectedCategory(batch.id)}
                className={`snap-start px-5 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 border ${
                  selectedCategory === batch.id
                    ? "bg-white text-black border-white shadow-lg"
                    : "bg-gray-900/60 border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span className="font-mono text-[10px] opacity-60">BATCH</span>
                <span className="font-semibold tabular-nums">{String(batch.number).padStart(2, "0")}</span>
                <span className="hidden lg:inline text-xs opacity-70">— {batch.name.split(" & ")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="max-w-6xl mx-auto mb-10">
          <div className="relative max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search across all batches..."
              className="pl-12 h-12 bg-gray-900/50 border-gray-800 focus:border-primary-500 rounded-3xl text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* =====================================================
             BATCH-GROUPED APP GRID — The heart of the premium dashboard
             This is what makes it feel like a $1M product
          ===================================================== */}
        <div className="max-w-7xl mx-auto space-y-20">
          {groupAppsByBatch(appsData).map(({ batch, apps: batchApps }, batchIndex) => {
            // Apply search filter within the batch
            let filteredApps = batchApps;
            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              filteredApps = batchApps.filter(
                (app) =>
                  app.name.toLowerCase().includes(q) ||
                  app.description.toLowerCase().includes(q)
              );
            }

            // Filter by selected batch
            if (selectedCategory !== "all" && selectedCategory !== batch.id) {
              return null;
            }

            if (filteredApps.length === 0) return null;

            return (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ duration: 0.6, delay: 0.05 * batchIndex }}
                className="group"
              >
                {/* Luxurious Batch Header with delight */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-8 px-1">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-2xl font-mono text-sm font-semibold tracking-[1px] text-white shadow-inner"
                      style={{ backgroundColor: `${batch.accent}22`, color: batch.accent }}
                    >
                      {String(batch.number).padStart(2, "0")}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold tracking-[3px] text-white/50">PRODUCTION BATCH {batch.number}</div>
                      <h3 className="text-3xl font-semibold tracking-tighter text-white">{batch.name}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400 md:pb-1">
                    <span>{filteredApps.length} tools</span>
                    <span className="text-white/30">·</span>
                    <span className="font-medium text-emerald-400">
                      {filteredApps.filter((a) => user && hasAccessToApp(a.id)).length} owned
                    </span>
                    <span className="hidden md:inline text-white/30">·</span>
                    <span className="hidden md:inline">{batch.description}</span>
                  </div>
                </div>

                {/* Premium Card Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                  {filteredApps.slice(0, 12).map((app, index) => {
                    const isPurchased = user && hasAccessToApp(app.id);
                    const currentBatch = getBatchForApp(app);
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
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.03 * index }}
                        whileHover={{ y: -6 }}
                        onClick={handleAppClick}
                        className="group/card relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-white/10 bg-gray-950/60 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:shadow-2xl"
                      >
                        {/* Refined Image Treatment */}
                        <div className="relative aspect-video w-full overflow-hidden">
                          <img
                            src={imageErrors[app.id] ? getFallbackImage(app.id, imageErrors[app.id]) : app.image}
                            alt={app.name}
                            className="h-full w-full object-cover transition-transform duration-[800ms] group-hover/card:scale-[1.06]"
                            onError={() => handleImageError(app.id)}
                          />
                          {/* Sophisticated gradient + subtle vignette */}
                          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/70 to-black" />

                          {/* Premium Status Row */}
                          <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
                            {isPurchased ? (
                              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-0.5 text-[10px] font-semibold tracking-widest text-white shadow">
                                <Check className="h-3 w-3" /> OWNED
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-0.5 text-[10px] font-medium tracking-widest text-white/90 backdrop-blur">
                                <Lock className="h-3 w-3" /> AVAILABLE
                              </div>
                            )}
                            {app.popular && (
                              <div className="rounded-full bg-amber-400 px-2.5 py-px text-[9px] font-bold tracking-[1px] text-black">POPULAR</div>
                            )}
                            {app.new && (
                              <div className="rounded-full bg-primary-500 px-2.5 py-px text-[9px] font-bold tracking-[1px] text-white">NEW</div>
                            )}
                          </div>

                          {/* Subtle batch indicator on image */}
                          <div
                            className="absolute bottom-4 left-4 rounded-full px-2.5 py-px text-[10px] font-medium tracking-[1.5px] text-white/70"
                            style={{ backgroundColor: `${currentBatch.accent}30` }}
                          >
                            BATCH {currentBatch.number}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex flex-1 flex-col p-6">
                          <div className="mb-3">
                            <h4 className="text-[17px] font-semibold leading-tight tracking-[-0.2px] text-white group-hover/card:text-primary-400 transition-colors">
                              {app.name}
                            </h4>
                            <p className="mt-2 line-clamp-3 text-[13.5px] leading-snug text-gray-400">
                              {app.description}
                            </p>
                          </div>

                          {/* Premium GTM / Monetization Section — expandable per card */}
                          <div className="mt-auto pt-4 border-t border-white/10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGTM(app.id);
                              }}
                              className="mb-2 flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-[1.5px] text-primary-400/80 hover:text-primary-400 transition-colors"
                            >
                              <span>Monetization &amp; GTM Insights</span>
                              <span className="text-[10px] font-normal opacity-60">
                                {expandedGTM[app.id] ? "HIDE" : "SHOW"}
                              </span>
                            </button>

                            <SalesDropdownErrorBoundary>
                              <SalesDropdown
                                salesCopy={appSalesCopy[app.id]}
                                isExpanded={!!expandedGTM[app.id]}
                                onToggle={() => toggleGTM(app.id)}
                                appId={app.id}
                              />
                            </SalesDropdownErrorBoundary>

                            <div className="mt-4 flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <LazyIcon name={app.iconName} className="h-4 w-4 text-primary-400" />
                                <span>{currentBatch.name.split(" & ")[0]}</span>
                              </div>

                              <span className="flex items-center gap-1 text-primary-400 font-medium group-hover/card:gap-1.5 transition-all">
                                {isPurchased ? "Open workspace" : "View details"}
                                <ArrowRight className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Hover purchase state — very refined */}
                        {!isPurchased && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/80 opacity-0 backdrop-blur-sm transition-all duration-200 group-hover/card:opacity-100 z-10">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.985 }}
                              onClick={handleAppClick}
                              className="rounded-2xl bg-white px-8 py-3 text-sm font-semibold text-black shadow-xl active:bg-gray-200"
                            >
                              Purchase • Lifetime Access
                            </motion.button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Elegant "more in this batch" footer */}
                {filteredApps.length > 12 && (
                  <div className="mt-5 text-center text-sm text-primary-400/70 hover:text-primary-400 transition-colors cursor-pointer">
                    +{filteredApps.length - 12} more tools in this batch →
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* =====================================================
             Elegant Final CTA — only when needed
             Kept minimal and premium
          ===================================================== */}
        {(!user || !hasAnyPurchases) && (
          <div className="max-w-2xl mx-auto pt-8 text-center">
            <div className="inline-flex items-center gap-2 text-xs tracking-[3px] text-primary-400/70 font-medium mb-3">START YOUR COLLECTION</div>
            <h4 className="text-3xl font-semibold tracking-tighter text-white mb-3">Own the complete 10-batch library</h4>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Every tool above is available as a lifetime purchase. Unlock the full system and start delivering personalized work at scale.
            </p>
            <a
              href="/pricing"
              className="inline-flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-sm font-semibold text-black transition hover:bg-gray-200 active:scale-[0.985]"
            >
              View Lifetime Pricing <ArrowRight className="h-4 w-4" />
            </a>
          </div>
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
