import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

import {
  Search,
  ChevronRight,
  Clock,
  Sparkles,
  ArrowRight,
  Video as VideoIcon,
  FileImage,
  ShoppingCart,
  Users,
  Zap,
  PencilRuler,
  MessageSquare,
  Palette,
  BookOpen,
  BarChart,
  Globe,
  PanelTop,
  Bot,
  Activity,
  Layers,
  Filter,
  X,
  Star,
  Award,
  Check,
  Lock,
} from "lucide-react";
import MagicSparkles from "../components/MagicSparkles";
import { useAuth } from "../context/AuthContext";
import usePurchases from "../hooks/usePurchases";
import PurchaseModal from "../components/PurchaseModal";
import { useApps } from "../hooks/useApps";

// Tool categories mapped to database categories
const categories = [
  { id: "all", name: "All Tools" },
  { id: "video", name: "Video Creation" },
  { id: "ai-image", name: "AI Image" },
  { id: "branding", name: "Branding" },
  { id: "personalizer", name: "Personalizer" },
  { id: "lead-gen", name: "Lead Generation" },
  { id: "creative", name: "Creative Tools" },
];

// Legacy tool data - now loaded from Supabase
// This is kept for reference but not used
const _legacyTools = [
  // Content Creation
  {
    id: "ai-creative-studio",
    name: "Personalized AI Creative Studio",
    description:
      "Create AI-generated images, videos, and content tailored to your brand",
    url: "/editor",
    icon: <Sparkles className="h-6 w-6 text-purple-400" />,
    category: "content",
    popular: true,
    new: false,
  },
  {
    id: "gif-editor",
    name: "Personalized GIF Editor",
    description:
      "Create and customize animated GIFs for social media and marketing",
    url: "/gif-editor",
    icon: <FileImage className="h-6 w-6 text-blue-400" />,
    category: "content",
    popular: false,
    new: true,
  },
  {
    id: "ai-image",
    name: "Personalized AI Image Generation",
    description: "Generate unique images using advanced AI technology",
    url: "/features/ai-image",
    icon: <Palette className="h-6 w-6 text-indigo-400" />,
    category: "content",
    popular: true,
    new: false,
  },
  {
    id: "meme-generator",
    name: "Personalized Meme Generator",
    description: "Create viral-worthy memes tailored to your audience",
    url: "/features/meme-generator",
    icon: <MessageSquare className="h-6 w-6 text-pink-400" />,
    category: "content",
    popular: false,
    new: false,
  },

  // Visual Tools
  {
    id: "action-figures",
    name: "Personalized Action Figures",
    description: "Create custom action figures for marketing and engagement",
    url: "/features/action-figures",
    icon: <Layers className="h-6 w-6 text-yellow-400" />,
    category: "visual",
    popular: true,
    new: false,
  },
  {
    id: "retro-action-figures",
    name: "Personalized Retro Action Figures",
    description: "Generate retro-styled custom action figures",
    url: "/features/retro-action-figures",
    icon: <Layers className="h-6 w-6 text-orange-400" />,
    category: "visual",
    popular: false,
    new: false,
  },
  {
    id: "ghibli-style",
    name: "Personalized Studio Ghibli Style",
    description:
      "Transform photos into beautiful Studio Ghibli-inspired artwork",
    url: "/features/ghibli-style",
    icon: <Palette className="h-6 w-6 text-blue-400" />,
    category: "visual",
    popular: true,
    new: false,
  },
  {
    id: "cartoon-style",
    name: "Personalized Cartoon Style",
    description: "Convert images into personalized cartoon illustrations",
    url: "/features/cartoon-style",
    icon: <Palette className="h-6 w-6 text-green-400" />,
    category: "visual",
    popular: false,
    new: true,
  },

  // Sales Tools
  {
    id: "proposal-generator",
    name: "Personalized Proposal Generator",
    description: "Create tailored proposals for clients and prospects",
    url: "/generate",
    icon: <ShoppingCart className="h-6 w-6 text-green-400" />,
    category: "sales",
    popular: true,
    new: false,
  },
  {
    id: "realtime-proposal",
    name: "Personalized Realtime Proposal Generator",
    description: "Watch proposals generate character by character in real time",
    url: "/features/realtime-proposal",
    icon: <Clock className="h-6 w-6 text-blue-400" />,
    category: "sales",
    popular: false,
    new: true,
  },

  // Client Tools
  {
    id: "client-research",
    name: "Personalized Client Research",
    description: "Research clients to create personalized proposals",
    url: "/features/client-research",
    icon: <Users className="h-6 w-6 text-indigo-400" />,
    category: "client",
    popular: true,
    new: false,
  },
  {
    id: "smart-pricing",
    name: "Personalized Smart Pricing",
    description: "Generate client-specific pricing recommendations",
    url: "/features/smart-pricing",
    icon: <BarChart className="h-6 w-6 text-green-400" />,
    category: "client",
    popular: false,
    new: false,
  },
  {
    id: "competitive-analysis",
    name: "Personalized Competitive Analysis",
    description: "Create customized competitive analyses for clients",
    url: "/features/competitive-analysis",
    icon: <Activity className="h-6 w-6 text-red-400" />,
    category: "client",
    popular: false,
    new: false,
  },
  {
    id: "objection-handler",
    name: "Personalized Objection Handler",
    description: "Generate tailored responses to potential client objections",
    url: "/features/objection-handler",
    icon: <MessageSquare className="h-6 w-6 text-orange-400" />,
    category: "client",
    popular: false,
    new: false,
  },

  // Page Builder Tools
  {
    id: "page-planner",
    name: "Personalized Strategic Page Planner",
    description: "Plan high-converting landing pages with AI assistance",
    url: "/ai-generator-enhanced",
    icon: <PanelTop className="h-6 w-6 text-purple-400" />,
    category: "page",
    popular: true,
    new: false,
  },
  {
    id: "page-cloner",
    name: "Personalized Enhanced Page Cloner",
    description: "Clone and customize any landing page easily",
    url: "/clone-url",
    icon: <PencilRuler className="h-6 w-6 text-blue-400" />,
    category: "page",
    popular: false,
    new: true,
  },

  // Communication Tools
  {
    id: "follow-up-emails",
    name: "Personalized Follow-Up Emails",
    description: "Generate client-specific follow-up communications",
    url: "/features/follow-up-email",
    icon: <MessageSquare className="h-6 w-6 text-blue-400" />,
    category: "communication",
    popular: false,
    new: false,
  },
  {
    id: "multi-language",
    name: "Personalized Multi-Language Translation",
    description:
      "Translate proposals while preserving industry-specific terminology",
    url: "/features/multi-language",
    icon: <Globe className="h-6 w-6 text-green-400" />,
    category: "communication",
    popular: true,
    new: false,
  },
  {
    id: "streaming-translation",
    name: "Personalized Streaming Translation",
    description: "Character-by-character translation preserving terminology",
    url: "/features/streaming-translation",
    icon: <Globe className="h-6 w-6 text-indigo-400" />,
    category: "communication",
    popular: false,
    new: true,
  },

  // Advanced AI Tools
  {
    id: "multimodal-creator",
    name: "Personalized Multimodal AI Creator",
    description: "Create with cutting-edge multimodal AI models",
    url: "/gemini-features",
    icon: <Bot className="h-6 w-6 text-purple-400" />,
    category: "ai",
    popular: true,
    new: true,
  },
  {
    id: "hybrid-ai",
    name: "Personalized Hybrid AI Studio",
    description: "Leverage multiple AI models in a single workflow",
    url: "/hybrid-ai-studio",
    icon: <Zap className="h-6 w-6 text-yellow-400" />,
    category: "ai",
    popular: false,
    new: true,
  },
  {
    id: "gemini-features",
    name: "Personalized Gemini 2.5 Features",
    description: "Use the latest capabilities of Google Gemini AI",
    url: "/gemini-features/:templateId",
    icon: <Sparkles className="h-6 w-6 text-blue-400" />,
    category: "ai",
    popular: false,
    new: true,
  },
];

// Map legacy tool IDs to app slugs for featured collections
const featuredToolIds = [
  "ai-creative-studio",
  "ai-image",
  "action-figures",
  "ghibli-style",
  "proposal-generator",
  "client-research",
  "smart-pricing",
  "objection-handler",
  "page-planner",
  "multi-language",
  "meme-generator",
  "follow-up-emails",
];

// Featured collections of tools
const featuredCollections = [
  {
    title: "Visual Content Creation",
    description: "Transform ideas into stunning visual content",
    tools: ["ai-art", "bg-remover", "ai-video-image", "thumbnail-generator"],
    icon: <Palette className="h-10 w-10 text-purple-400" />,
  },
  {
    title: "Sales Acceleration",
    description: "Close more deals with intelligent sales tools",
    tools: [
      "smart-crm-closer",
      "funnelcraft-ai",
      "sales-assistant-app",
      "ai-referral-maximizer",
    ],
    icon: <ShoppingCart className="h-10 w-10 text-green-400" />,
  },
  {
    title: "Marketing Enhancers",
    description: "Supercharge your marketing efforts",
    tools: ["landing-page", "video-creator", "promo-generator", "storyboard"],
    icon: <Award className="h-10 w-10 text-blue-400" />,
  },
];

// Function to get tools by category
const getToolsByCategory = (category: string, allTools: any[]) => {
  if (category === "all") {
    return allTools;
  }
  return allTools.filter((tool) => tool.category === category);
};

// Function to get a tool by ID
const getToolById = (id: string, allTools: any[]) => {
  return allTools.find((tool) => tool.id === id);
};

const ToolsHubPage: React.FC = () => {
  const { user } = useAuth();
  const { hasPurchased, loading: purchasesLoading } = usePurchases();
  const { apps: allTools, loading: appsLoading } = useApps();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filteredTools, setFilteredTools] = useState<any[]>([]);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);

  // Update filtered tools when category, search query, or apps change
  useEffect(() => {
    let tools = getToolsByCategory(selectedCategory, allTools);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tools = tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query),
      );
    }

    setFilteredTools(tools);
  }, [selectedCategory, searchQuery, allTools]);

  return (
    <>
      <Helmet>
        <title>Tools Hub | VideoRemix.vip</title>
        <meta
          name="description"
          content="Explore all personalized tools offered by VideoRemix.vip. Find the perfect tools for your marketing personalization and campaign optimization needs."
        />
      </Helmet>

      <main className="pt-32 pb-20">
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary-600/10 rounded-full blur-[100px] -z-10"></div>
            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-primary-600/10 rounded-full blur-[100px] -z-10"></div>
          </div>

          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto mb-16 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <MagicSparkles minSparkles={5} maxSparkles={8}>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    Explore Our{" "}
                    <span className="text-primary-400">Personalized Tools</span>
                  </h1>
                </MagicSparkles>

                <p className="text-xl text-gray-300 mb-8">
                  Discover powerful tools to enhance your content creation,
                  sales, and marketing efforts
                </p>
              </motion.div>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative max-w-2xl mx-auto"
              >
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    className="bg-gray-800/70 backdrop-blur-sm w-full pl-12 pr-4 py-4 rounded-xl border border-gray-700 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-lg"
                    placeholder="Search for tools, solutions, or capabilities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setSearchQuery("")}
                    >
                      <span className="text-gray-400 hover:text-white">
                        <X className="h-5 w-5" />
                      </span>
                    </button>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Featured Collections */}
            {!searchQuery && selectedCategory === "all" && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="mb-16"
              >
                <h2 className="text-2xl font-bold text-white mb-8">
                  Featured Collections
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {featuredCollections.map((collection, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 group hover:border-primary-500/50 transition-colors"
                    >
                      <div className="p-6">
                        <div className="bg-gray-700/50 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                          {collection.icon}
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">
                          {collection.title}
                        </h3>

                        <p className="text-gray-400 mb-4">
                          {collection.description}
                        </p>

                        <div className="space-y-2">
                          {collection.tools.map((toolId, idx) => {
                            const tool = getToolById(toolId, allTools);
                            if (!tool) return null;

                            return (
                              <a
                                key={idx}
                                href={tool.url}
                                className="flex items-center bg-black/30 p-2 rounded-lg hover:bg-black/50 transition-colors"
                              >
                                <div className="mr-3 opacity-70">
                                  {tool.icon}
                                </div>
                                <div>
                                  <div className="text-white text-sm font-medium">
                                    {tool.name}
                                  </div>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Category filters */}
            <div className="mb-8 overflow-x-auto hide-scrollbar">
              <div className="flex space-x-2 p-1 min-w-max">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? "bg-primary-600 text-white shadow"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Applied filters */}
            {(selectedCategory !== "all" || searchQuery) && (
              <div className="mb-6 flex flex-wrap items-center gap-2 pb-2">
                <span className="text-gray-400 text-sm">Active filters:</span>

                {selectedCategory !== "all" && (
                  <div className="bg-primary-600/20 text-primary-400 px-3 py-1 rounded-full text-xs flex items-center">
                    {categories.find((c) => c.id === selectedCategory)?.name}
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className="ml-2 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {searchQuery && (
                  <div className="bg-primary-600/20 text-primary-400 px-3 py-1 rounded-full text-xs flex items-center">
                    Search: "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery("")}
                      className="ml-2 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchQuery("");
                  }}
                  className="text-primary-400 hover:text-primary-300 text-xs ml-auto"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Tools Grid */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">
                {searchQuery
                  ? `Search Results for "${searchQuery}"`
                  : selectedCategory !== "all"
                    ? categories.find((c) => c.id === selectedCategory)?.name
                    : "All Tools"}
              </h2>

              {filteredTools.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTools.map((tool, index) => (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                      className="bg-gray-800/70 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700 hover:border-primary-500/50 transition-colors group"
                    >
                      <div className="block p-6">
                        <div className="flex items-center mb-4">
                          <div className="bg-black/30 p-3 rounded-lg mr-4">
                            {tool.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">
                                {tool.name}
                              </h3>
                              {user && hasPurchased(tool.id) ? (
                                <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                                  <Check className="h-3 w-3" /> OWNED
                                </span>
                              ) : (
                                <span className="bg-gray-600 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                                  <Lock className="h-3 w-3" /> LOCKED
                                </span>
                              )}
                              {tool.new && (
                                <span className="bg-blue-600/70 text-white text-xs px-2 py-0.5 rounded">
                                  NEW
                                </span>
                              )}
                              {tool.popular && !tool.new && (
                                <span className="bg-yellow-600/70 text-white text-xs px-2 py-0.5 rounded">
                                  POPULAR
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm">
                              {
                                categories.find((c) => c.id === tool.category)
                                  ?.name
                              }
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-300 mb-4">{tool.description}</p>
                        <div className="flex justify-between items-center">
                          <div className="text-gray-400 text-sm font-medium">
                            $
                            {allTools.find((a) => a.id === tool.id)?.price ||
                              97}
                          </div>
                          {user && hasPurchased(tool.id) ? (
                            <a
                              href={tool.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-400 text-sm flex items-center font-medium group-hover:text-primary-300 transition-colors"
                            >
                              Open App
                              <ArrowRight className="ml-1 h-4 w-4" />
                            </a>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const appData = allTools.find(
                                  (a) => a.id === tool.id,
                                );
                                setSelectedApp({
                                  id: tool.id,
                                  name: tool.name,
                                  description: tool.description,
                                  image: appData?.image || tool.image || "",
                                  icon: tool.icon,
                                  price: appData?.price || 97,
                                });
                                setPurchaseModalOpen(true);
                              }}
                              className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 shadow-md"
                            >
                              <ShoppingCart className="h-4 w-4" />
                              Purchase
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center"
                >
                  <div className="inline-block mb-4">
                    <Search className="h-12 w-12 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    No Tools Found
                  </h3>
                  <p className="text-gray-400 mb-6">
                    We couldn't find any tools matching your filters
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="text-primary-400 hover:text-primary-300 font-medium"
                  >
                    Clear Filters
                  </button>
                </motion.div>
              )}
            </div>

            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-r from-primary-900/40 to-primary-700/40 p-8 rounded-xl border border-primary-500/30 relative z-10 text-center"
            >
              <div className="max-w-3xl mx-auto">
                <MagicSparkles minSparkles={3} maxSparkles={6}>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Unlock the Full Power of VideoRemix.vip
                  </h2>
                </MagicSparkles>

                <p className="text-xl text-gray-300 mb-8">
                  Get unlimited access to all 20+ personalization apps and
                  create content that delivers 3x better results than generic
                  content.
                </p>

                <motion.a
                  href="/pricing"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center bg-white text-primary-600 hover:bg-gray-100 font-bold py-3 px-6 rounded-lg"
                >
                  View Pricing Plans
                  <ArrowRight className="ml-2 h-5 w-5" />
                </motion.a>

                <p className="mt-4 text-gray-400 text-sm">
                  Get started with VideoRemix.vip today.
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Purchase Modal */}
      {selectedApp && (
        <PurchaseModal
          isOpen={purchaseModalOpen}
          onClose={() => {
            setPurchaseModalOpen(false);
            setSelectedApp(null);
          }}
          app={selectedApp}
        />
      )}

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default ToolsHubPage;
