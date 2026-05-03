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
  Wand2,
  Globe,
  MessageSquare,
  Brain,
  FileVideo,
  ShoppingCart,
  Lock,
  Check,
} from "lucide-react";
import MagicSparkles from "../MagicSparkles";
import { useInView } from "react-intersection-observer";
import { useApps } from "../../hooks/useApps";
import LockedAppOverlay from "../LockedAppOverlay";
import PurchaseModal from "../PurchaseModal";
import LazyIcon from "../LazyIcon";
import ProductDetailModal from "../ProductDetailModal";
import { extendedSalesCopy } from "../../data/extendedSalesCopy";

// App categories with personalization focus
const toolCategories = [
  {
    id: "all",
    label: "All Personalization Tools",
    icon: React.createElement(Layers, { className: "w-4 h-4" }),
  },
  {
    id: "ai-agents",
    label: "AI Agents",
    icon: React.createElement(Sparkles, { className: "w-4 h-4" }),
  },
  {
    id: "video",
    label: "Personalized Video",
    icon: React.createElement(Video, { className: "w-4 h-4" }),
  },
  {
    id: "lead-gen",
    label: "Personalized Marketing",
    icon: React.createElement(Users, { className: "w-4 h-4" }),
  },
  {
    id: "ai-image",
    label: "Personalized AI Image",
    icon: React.createElement(ImageIcon, { className: "w-4 h-4" }),
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

// Fallback image URLs
const fallbackImages = [
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
];

const DashboardToolsSection: React.FC = () => {
  const { apps: appsData, loading: appsLoading } = useApps();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredApps, setFilteredApps] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState<"popular" | "new" | "a-z">("popular");
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedApp, setSelectedApp] = useState<any>(null);
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
      selectedCategory,
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
    if (selectedCategory !== "all") {
      result = result.filter((app) => app.category === selectedCategory);
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
  }, [selectedCategory, searchQuery, sortOrder, appsData]);

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

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // Get featured apps
  const getFeaturedApps = () => {
    if (!appsData || appsData.length === 0) {
      return [];
    }
    return appsData.filter((app) => featuredApps.includes(app.id));
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
              {toolCategories.map((category, idx) => {
                const isActive = selectedCategory === category.id;
                return (
                  <motion.button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    initial={{ opacity: 0, y: 16 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.1 * idx }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className={`
                      px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 min-w-[150px]
                      ${isActive
                        ? 'bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-600/30 border border-primary-400/20'
                        : 'bg-gray-900/80 text-gray-300 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 backdrop-blur-sm'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className={`
                        p-2 rounded-full transition-colors
                        ${isActive ? 'bg-white/15' : 'bg-gray-800'}
                      `}>
                        {category.icon}
                      </div>
                      <span>{category.label}</span>
                    </div>
                  </motion.button>
                );
              })}
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
              {filteredApps.map((app, index) => {
                const appUrl = `/agent/${app.id}`;
                const isPurchased = false;

                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.5 }}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    className={`
                      relative cursor-pointer group
                      ${viewMode === "grid"
                        ? "bg-gradient-to-br from-gray-900/90 via-gray-800/70 to-gray-900/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-gray-700/40 hover:border-primary-500/60 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-primary-900/20"
                        : "flex bg-gradient-to-r from-gray-900/90 via-gray-800/70 to-gray-900/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-gray-700/40 hover:border-primary-500/60 transition-all duration-500 shadow-lg"
                      }
                    `}
                    onClick={() => setSelectedApp(app)}
                  >
                    {/* App image container */}
                    <div className={`
                      relative overflow-hidden
                      ${viewMode === "grid" ? "w-full aspect-video" : "w-40 h-full flex-shrink-0"}
                    `}>
                      <div className="relative h-full">
                        <img
                          src={
                            imageErrors[app.id]
                              ? getFallbackImage(app.id, imageErrors[app.id])
                              : app.image
                          }
                          alt={app.name}
                          className={`
                            object-cover transition-transform duration-700 group-hover:scale-110
                            ${viewMode === "grid" ? "w-full h-full" : "w-full h-full"}
                          `}
                          onError={() => handleImageError(app.id)}
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

                        {/* Status badges */}
                        <div className="absolute top-3 right-3 flex flex-col space-y-1.5 items-end">
                          {isPurchased ? (
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center shadow-lg shadow-emerald-900/30 backdrop-blur-sm border border-emerald-400/30">
                              <Check className="h-3 w-3 mr-1" /> OWNED
                            </div>
                          ) : (
                            <div className="bg-gray-800/80 text-gray-300 text-[10px] font-semibold px-2 py-1 rounded-full flex items-center backdrop-blur-sm border border-gray-600/40">
                              <Lock className="h-3 w-3 mr-1" /> LOCKED
                            </div>
                          )}
                          {app.popular && (
                            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-amber-900/20">
                              POPULAR
                            </div>
                          )}
                          {app.new && (
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-emerald-900/20">
                              NEW
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`${viewMode === "grid" ? "p-5" : "p-5 flex-grow flex flex-col justify-center"}`}>
                      <h3 className={`
                        font-bold text-white mb-2 group-hover:text-primary-400 transition-all duration-300
                        ${viewMode === "grid" ? "text-xl" : "text-xl"}
                      `}>
                        {app.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-2">
                        {app.description?.substring(0, 120)}...
                      </p>

                      <div className="flex justify-between items-center mt-auto">
                        <div className="flex items-center text-xs text-gray-500 uppercase tracking-wider">
                          <span>{app.category}</span>
                        </div>
                        <span className="text-primary-400 hover:text-primary-300 text-sm font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                          {isPurchased ? "Open App" : "Purchase"}
                          <ArrowRight className="ml-1.5 h-4 w-4" />
                        </span>
                      </div>
                    </div>

                    {/* Hover overlay effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-transparent to-accent-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  </motion.div>
                );
              })}
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
                  setSelectedCategory("all");
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
        <ProductDetailModal
          app={selectedApp}
          salesCopy={extendedSalesCopy[selectedApp.id]}
          isOpen={true}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </section>
  );
};

export default DashboardToolsSection;
