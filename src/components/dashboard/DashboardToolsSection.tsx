import React, { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowRight,
  Play,
  Check,
  TrendingUp,
  Zap,
  Target,
  Sparkles,
} from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useApps } from "../../hooks/useApps";
import PurchaseModal from "../PurchaseModal";
const ProductDetailModal = lazy(() => import("../ProductDetailModal"));
import { extendedSalesCopy } from "../../data/extendedSalesCopy";
import { appGroups } from "../../data/appGroups";



// Helper to get group label from group ID
const getGroupLabel = (groupId: string) => {
  const group = appGroups.find(g => g.id === groupId);
  return group ? group.label : groupId.replace('-', ' ');
};


// Fallback image URLs
const fallbackImages = [
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
];

// Story-driven card benefits based on group
const getGroupBenefits = (group: string) => {
  const benefits = {
    "sales-lead-gen": [
      "AI-powered sales intelligence and lead generation",
      "Personalized outreach and follow-up campaigns",
      "CRM integration for seamless workflows",
    ],
    "content-creation": [
      "Transform content across multiple formats",
      "AI-powered content generation at scale",
      "Multi-channel publishing automation",
    ],
    "video-audio-voice": [
      "Professional video and audio editing in minutes",
      "AI-powered voice agents and transformations",
      "Multiple export formats for any platform",
    ],
    "rag-knowledgebase": [
      "Private AI assistant trained on your docs",
      "Instant answers from your knowledge base",
      "Secure document chat with RAG technology",
    ],
    "realestate-local": [
      "AI tools for local business growth",
      "Real estate marketing and client engagement",
      "Local market analysis and insights",
    ],
    "hr-recruiting": [
      "Streamlined hiring and recruitment workflows",
      "AI-powered candidate matching and scoring",
      "Automated interview scheduling and follow-up",
    ],
    "finance-business": [
      "AI-driven financial analysis and forecasting",
      "Business planning and investment insights",
      "Data-driven decision making tools",
    ],
    "legal-compliance": [
      "Plain-English contract summaries",
      "Risk assessment and compliance checking",
      "Legal document analysis and insights",
    ],
    "coding-developer": [
      "AI-powered code generation and debugging",
      "Architecture planning and best practices",
      "Automated testing and documentation",
    ],
    "design-uiux": [
      "AI-powered design feedback and optimization",
      "Conversion-focused UI/UX improvements",
      "Rapid prototyping and wireframing",
    ],
    "research-education": [
      "Deep research with AI-powered synthesis",
      "Educational content generation and curation",
      "Data-driven insights and analysis",
    ],
    "productivity-personal": [
      "AI personal assistant for daily workflows",
      "Smart task management and prioritization",
      "Automated follow-ups and reminders",
    ],
  };
  return benefits[group as keyof typeof benefits] || [
    "Streamlined workflow automation",
    "Professional results with minimal effort",
    "Scalable solutions for growing businesses",
  ];
};

// Minimal App type for component props
type AppForCard = {
  id: string;
  name: string;
  description: string;
  group: string;
  popular?: boolean;
  new?: boolean;
  image: string;
};

// Enhanced App Card Component with story-driven design
const StoryDrivenAppCard: React.FC<{
  app: AppForCard;
  viewMode: "grid" | "list";
  onClick: () => void;
  imageErrors: Record<string, number>;
  handleImageError: (appId: string) => void;
  getFallbackImage: (appId: string, errorCount?: number) => string;
  priority?: boolean;
}> = ({ app, viewMode, onClick, imageErrors, handleImageError, getFallbackImage, priority = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const benefits = getGroupBenefits(app.group);

  const renderHoverPreview = () => (
    <AnimatePresence>
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-gradient-to-br from-primary-900/95 via-black/90 to-accent-900/95 backdrop-blur-sm z-20 rounded-2xl p-6 flex flex-col justify-end"
        >
          {/* Story header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-5 w-5 text-primary-400" />
              </motion.div>
              <h4 className="text-white font-bold text-lg">Transform Your Workflow</h4>
            </div>
            <p className="text-gray-200 text-sm leading-relaxed">
                            Discover how {app.name} revolutionizes {getGroupLabel(app.group)} with cutting-edge AI technology.
            </p>
          </div>

          {/* Key benefits */}
          <div className="space-y-3 mb-4">
            <h5 className="text-white font-semibold text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary-400" />
              Key Benefits
            </h5>
            {benefits.slice(0, 3).map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 text-sm"
              >
                <Check className="h-4 w-4 text-primary-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200 leading-relaxed">{benefit}</span>
              </motion.div>
            ))}
          </div>

          {/* Call to action */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary-600/30 transition-all"
          >
            <Zap className="h-4 w-4" />
            Start Your Story
            <ArrowRight className="h-4 w-4 ml-1" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderEnhancedBadges = () => (
    <div className="absolute top-3 right-3 flex flex-col space-y-1.5 items-end">
      {/* Status badges with storytelling */}
      {app.popular && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[10px] font-bold px-2 py-1.5 rounded-full flex items-center shadow-lg shadow-amber-900/30 backdrop-blur-sm border border-amber-400/30"
        >
          <TrendingUp className="h-3 w-3 mr-1" />
          TRENDING
        </motion.div>
      )}
      {app.new && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-2 py-1.5 rounded-full flex items-center shadow-lg shadow-emerald-900/30 backdrop-blur-sm border border-emerald-400/30"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          NEW
        </motion.div>
      )}

      {/* Category badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-black/60 text-gray-200 text-[10px] font-semibold px-2 py-1 rounded-full backdrop-blur-sm border border-gray-600/40 uppercase tracking-wider"
      >
        {getGroupLabel(app.group)}
      </motion.div>
    </div>
  );

  const renderEngagementMetrics = () => (
    <div className="absolute bottom-3 left-3 flex items-center gap-3">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 text-xs text-gray-300"
      >
        <Eye className="h-3 w-3" />
        <span>{Math.floor(Math.random() * 500) + 100}</span>
      </motion.div>
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 text-xs text-gray-300"
      >
        <Heart className="h-3 w-3" />
        <span>{Math.floor(Math.random() * 50) + 10}</span>
      </motion.div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={`
        relative cursor-pointer group overflow-hidden
        ${viewMode === "grid"
          ? "bg-gradient-to-br from-gray-900/95 via-gray-800/80 to-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 hover:border-primary-500/70 transition-all duration-300 shadow-2xl hover:shadow-primary-900/20"
          : "flex bg-gradient-to-r from-gray-900/95 via-gray-800/80 to-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 hover:border-primary-500/70 transition-all duration-300 shadow-xl"
        }
      `}
    >
      {/* App image container with enhanced effects */}
      <div className={`
        relative overflow-hidden
        ${viewMode === "grid" ? "w-full aspect-video" : "w-48 h-full flex-shrink-0"}
      `}>
        <motion.div className="relative h-full">
          <motion.img
            src={
              imageErrors[app.id]
                ? getFallbackImage(app.id, imageErrors[app.id])
                : app.image
            }
            alt={app.name}
            loading={priority ? "eager" : "lazy"}
            className={`
              object-cover transition-all duration-500 group-hover:scale-105
              ${viewMode === "grid" ? "w-full h-full" : "w-full h-full"}
            `}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            onError={() => handleImageError(app.id)}
          />

          {/* Enhanced gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-transparent to-accent-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Floating particles effect */}
          <motion.div
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)",
            }}
          />

          {renderEnhancedBadges()}
          {renderEngagementMetrics()}

          {/* Play button overlay on hover */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={isHovered ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="bg-primary-600/90 hover:bg-primary-500 backdrop-blur-sm rounded-full p-4 shadow-lg shadow-primary-600/30"
            >
              <Play className="h-6 w-6 text-white fill-white" />
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* Content section with enhanced typography */}
      <div className={`${viewMode === "grid" ? "p-6" : "p-6 flex-grow flex flex-col justify-center"}`}>
        <motion.h3
          className={`
            font-bold text-white mb-3 group-hover:text-primary-400 transition-all duration-300
            ${viewMode === "grid" ? "text-xl" : "text-xl"}
          `}
          whileHover={{ scale: 1.02 }}
        >
          {app.name}
        </motion.h3>

        <motion.p
          className="text-gray-300 text-sm mb-4 leading-relaxed line-clamp-2"
          initial={{ opacity: 0.8 }}
          whileHover={{ opacity: 1 }}
        >
          {app.description}
        </motion.p>

        {/* Enhanced action section */}
        <div className="flex justify-between items-center mt-auto">
          <motion.div
            className="flex items-center text-xs text-gray-400 uppercase tracking-wider font-medium"
            whileHover={{ scale: 1.05 }}
          >
            <span className="bg-gray-800/60 px-2 py-1 rounded-full">{getGroupLabel(app.group)}</span>
          </motion.div>

          <motion.span
            className="text-primary-400 hover:text-primary-300 text-sm font-semibold flex items-center group-hover:translate-x-2 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
          >
            Explore
            <motion.div
              animate={isHovered ? { x: [0, 5, 0] } : { x: 0 }}
              transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
            >
              <ArrowRight className="ml-2 h-4 w-4" />
            </motion.div>
          </motion.span>
        </div>

        {/* Rating preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isHovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-700/50"
        >
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < 4 ? "text-yellow-500 fill-yellow-500" : "text-gray-600"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400">4.8 (2.1k reviews)</span>
        </motion.div>
      </div>

      {/* Story-driven hover preview */}
      {renderHoverPreview()}

      {/* Ambient hover effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-accent-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        animate={isHovered ? {
          background: [
            "linear-gradient(to bottom right, rgba(139, 92, 246, 0.1), transparent, rgba(236, 72, 153, 0.1))",
            "linear-gradient(to bottom right, rgba(236, 72, 153, 0.1), transparent, rgba(139, 92, 246, 0.1))",
            "linear-gradient(to bottom right, rgba(139, 92, 246, 0.1), transparent, rgba(236, 72, 153, 0.1))",
          ],
        } : {}}
        transition={{ duration: 3, repeat: isHovered ? Infinity : 0 }}
      />
    </motion.div>
  );
};

const DashboardToolsSection: React.FC = () => {
  const { apps: appsData, loading: appsLoading } = useApps();
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredApps, setFilteredApps] = useState<AppForCard[]>([]);
  const [sortOrder, setSortOrder] = useState<"popular" | "new" | "a-z">("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedApp, setSelectedApp] = useState<AppForCard | null>(null);
  const [purchaseApp, setPurchaseApp] = useState<AppForCard | null>(null);
  const { ref, inView } = useInView({
    threshold: 0.05,
    triggerOnce: true,
  });

  const [imageErrors, setImageErrors] = useState<Record<string, number>>({});

  // Update filtered tools when category, search query, or access data change
  useEffect(() => {
    console.log('[DashboardToolsSection] useEffect triggered', {
      appsDataLength: appsData?.length || 0,
      appsLoading,
      selectedGroup,
      searchQuery,
      sortOrder
    });

    if (!appsData || appsData.length === 0) {
      console.log('[DashboardToolsSection] No apps data, setting empty filtered apps');
      setFilteredApps([]);
      return;
    }

    let result = [...appsData];

    // Show all apps to everyone - access control is handled in the UI (locked/unlocked state)
    // No filtering by access here - all apps are visible

    // Apply category filter
    if (selectedGroup !== "all") {
      result = result.filter((app) => app.group === selectedGroup);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (app) =>
          app.name.toLowerCase().includes(query) ||
          app.description.toLowerCase().includes(query),
      );
    }

    // Apply sorting
    switch (sortOrder) {
      case "popular":
        result.sort((a, b) => {
          if (a.popular && !b.popular) return -1;
          if (!a.popular && b.popular) return 1;
          return 0;
        });
        break;
      case "new":
        result.sort((a, b) => {
          if (a.new && !b.new) return -1;
          if (!a.new && b.new) return 1;
          return 0;
        });
        break;
      case "a-z":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    console.log('[DashboardToolsSection] Setting filtered apps:', result.length);
    setFilteredApps(result);
  }, [selectedGroup, searchQuery, sortOrder, appsData, appsLoading]);

  // Handle image load errors
  const handleImageError = (appId: string) => {
    setImageErrors((prev) => ({
      ...prev,
      [appId]: (prev[appId] || 0) + 1,
    }));
  };

  // Get a fallback image URL based on app ID
  const getFallbackImage = (appId: string, errorCount: number = 0) => {
    const index = appId.charCodeAt(0) % fallbackImages.length;
    const adjustedIndex = (index + errorCount) % fallbackImages.length;
    return fallbackImages[adjustedIndex];
  };

  // Handle group change
  const handleGroupChange = (group: string) => {
    setSelectedGroup(group);
  };

  console.log('[DashboardToolsSection] About to render, filteredApps:', filteredApps.length);

  return (
    <section id="tools" className="py-24 bg-[#050505] relative overflow-hidden">
      {/* Ambient background elements */}
      <div className="absolute inset-0">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-gradient-to-br from-primary-600/20 to-accent-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] bg-gradient-to-tr from-accent-500/10 to-primary-600/15 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 opacity-30 bg-gradient-to-b from-transparent via-primary-900/10 to-transparent"></div>
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5"
            style={{ fontFamily: 'var(--font-display)' }}>
            Personalization <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-primary-300 bg-clip-text text-transparent">Tools</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Explore our curated collection of AI-powered tools designed to transform your video content and amplify your brand.
          </p>
        </motion.div>

        {/* Category filters */}
        <div className="relative mb-12">
          <div className="flex justify-center overflow-x-auto hide-scrollbar pb-2">
            <div className="flex space-x-3">
              <button
                key="all"
                onClick={() => handleGroupChange("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  selectedGroup === "all"
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                    : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
                }`}
              >
                All Tools
              </button>
              {appGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleGroupChange(group.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap flex items-center space-x-2 ${
                    selectedGroup === group.id
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                      : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
                  }`}
                >
                  <span className="w-4 h-4">{group.icon}</span>
                  <span>{group.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search and filter controls */}
        <div className="max-w-6xl mx-auto mb-14">
          <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 gap-4">
            {/* Search input */}
            <div className="relative md:w-2/3">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search tools by name or function... (e.g., 'video editor', 'AI art')"
                className="w-full pl-11 pr-4 py-3 bg-gray-900/70 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 focus:bg-gray-900 transition-all outline-none text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Sort dropdown */}
              <div className="relative">
                <select
                  className="appearance-none pl-4 pr-10 py-2.5 bg-gray-900/70 border border-gray-700/50 rounded-lg text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all outline-none text-sm cursor-pointer hover:bg-gray-900"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "popular" | "new" | "a-z")}
                >
                  <option value="popular">Most Popular</option>
                  <option value="new">Newest First</option>
                  <option value="a-z">A to Z</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* View toggle */}
              <div className="bg-gray-900/70 rounded-lg p-1 flex border border-gray-700/50">
                <button
                  className={`p-1.5 rounded transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-primary-600 text-white shadow-md"
                      : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                  }`}
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  className={`p-1.5 rounded transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-primary-600 text-white shadow-md"
                      : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                  }`}
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main tools grid/list */}
        <div className="max-w-7xl mx-auto">
          {filteredApps.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {filteredApps.map((app, index) => (
                <StoryDrivenAppCard
                  key={app.id}
                  app={app}
                  viewMode={viewMode}
                  onClick={() => setSelectedApp(app)}
                  imageErrors={imageErrors}
                  handleImageError={handleImageError}
                  getFallbackImage={getFallbackImage}
                  priority={index < 4}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-xl rounded-2xl p-10 text-center border border-gray-700/50"
            >
              <div className="text-gray-400 text-lg mb-4 font-medium">No tools found matching your criteria</div>
              <button
                onClick={() => {
                  setSelectedGroup("all");
                  setSearchQuery("");
                }}
                className="text-primary-400 hover:text-primary-300 font-semibold px-4 py-2 rounded-lg bg-primary-900/20 hover:bg-primary-900/30 transition-all"
              >
                Clear filters
              </button>
            </motion.div>
          )}
        </div>
        </div>

        {/* Product Detail Modal */}
      {selectedApp && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] p-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          </div>
        }>
          <ProductDetailModal
            app={{
              ...selectedApp,
              extendedCopy: extendedSalesCopy[selectedApp.id]
            }}
            isOpen={true}
            onClose={() => setSelectedApp(null)}
            onPurchase={(_appId) => {
              setSelectedApp(null); // Close detail modal
              setPurchaseApp(selectedApp); // Open purchase modal
            }}
          />
        </Suspense>
      )}

      {/* Purchase Modal */}
      {purchaseApp && (
        <PurchaseModal
          isOpen={true}
          onClose={() => setPurchaseApp(null)}
          app={purchaseApp}
        />
      )}
    </section>
  );
};

export default DashboardToolsSection;
