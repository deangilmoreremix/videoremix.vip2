import React from "react";
import { motion } from "framer-motion";
import {
  Video,
  Users,
  Image as ImageIcon,
  Palette,
  UserCircle,
  Package,
  Sparkles,
  ArrowRight,
  Lock,
  TrendingUp,
  FileText,
  Database,
  Home,
  UserCheck,
  DollarSign,
  Shield,
  Settings,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Public categories that are visible to everyone
const publicCategories = [
  {
    id: "sales-lead-gen",
    name: "Sales & Lead Gen",
    description: "AI tools for sales, lead generation, and prospecting",
    icon: TrendingUp,
    public: true,
    featured: true,
    appsCount: 10,
  },
  {
    id: "content-marketing",
    name: "Content & Marketing",
    description: "Create marketing content with AI",
    icon: FileText,
    public: true,
    featured: true,
    appsCount: 10,
  },
  {
    id: "video-audio-voice",
    name: "Video, Audio & Voice",
    description: "AI-powered video, audio and voice tools",
    icon: Video,
    public: true,
    featured: true,
    appsCount: 9,
  },
  {
    id: "rag-knowledgebase",
    name: "RAG & Knowledgebase",
    description: "Document chat and knowledge management",
    icon: Database,
    public: false, // Requires login
    featured: true,
    appsCount: 13,
  },
  {
    id: "realestate-local",
    name: "Real Estate & Local",
    description: "Tools for real estate and local businesses",
    icon: Home,
    public: false, // Requires login
    featured: true,
    appsCount: 7,
  },
  {
    id: "hr-hiring",
    name: "HR & Hiring",
    description: "AI recruitment and hiring tools",
    icon: UserCheck,
    public: false, // Requires login
    featured: false,
    appsCount: 6,
  },
  {
    id: "finance-business",
    name: "Finance & Business",
    description: "Business planning and financial analysis",
    icon: DollarSign,
    public: false, // Requires login
    featured: false,
    appsCount: 7,
  },
  {
    id: "legal-compliance",
    name: "Legal & Compliance",
    description: "Legal document analysis and compliance",
    icon: Shield,
    public: false, // Requires login
    featured: false,
    appsCount: 6,
  },
  {
    id: "coding-developer",
    name: "Coding & SaaS",
    description: "Development tools and SaaS builders",
    icon: Settings,
    public: false, // Requires login
    featured: false,
    appsCount: 10,
  },
  {
    id: "design-uiux",
    name: "Design & UI/UX",
    description: "Design tools and UI/UX assistants",
    icon: Palette,
    public: false, // Requires login
    featured: false,
    appsCount: 6,
  },
  {
    id: "research-education",
    name: "Research & Training",
    description: "Research assistants and training tools",
    icon: Search,
    public: false, // Requires login
    featured: false,
    appsCount: 8,
  },
  {
    id: "productivity-personal",
    name: "Productivity & Personal",
    description: "Personal assistants and productivity tools",
    icon: UserCircle,
    public: true,
    featured: false,
    appsCount: 10,
  },
];

const CategoryBrowser: React.FC = () => {
  const { user } = useAuth();

  // Filter categories based on user access
  const visibleCategories = publicCategories.filter(
    (category) => category.public || user,
  );

  return (
    <section className="py-16 bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Explore Our
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">
              {" "}
              Tool Categories
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto"
          >
            Discover tools organized by category. Find exactly what you need for
            your creative projects.
          </motion.p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleCategories.map((category, index) => {
            const IconComponent = category.icon;
            const isLocked = !category.public && !user;

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className={`group relative bg-gray-800/50 backdrop-blur-sm rounded-xl border transition-all duration-300 overflow-hidden ${
                  isLocked
                    ? "border-gray-700/50 opacity-75"
                    : "border-gray-700/50 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10"
                }`}
              >
                <div className="p-6">
                  {/* Icon and Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 rounded-lg ${
                        isLocked
                          ? "bg-gray-700/50"
                          : "bg-primary-500/10 group-hover:bg-primary-500/20"
                      } transition-colors`}
                    >
                      <IconComponent
                        className={`h-6 w-6 ${
                          isLocked ? "text-gray-500" : "text-primary-400"
                        }`}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      {category.featured && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Featured
                        </span>
                      )}
                      {isLocked && <Lock className="h-4 w-4 text-gray-500" />}
                    </div>
                  </div>

                  {/* Content */}
                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      isLocked
                        ? "text-gray-400"
                        : "text-white group-hover:text-primary-400"
                    } transition-colors`}
                  >
                    {category.name}
                  </h3>

                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {category.description}
                  </p>

                  {/* Stats and Action */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {category.appsCount} tools
                    </span>

                    {isLocked ? (
                      <Link
                        to="/signin"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-400 bg-gray-700/50 border border-gray-600/50 rounded-lg hover:bg-gray-700/70 transition-colors"
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Sign In
                      </Link>
                    ) : (
                      <Link
                        to={`/category/${category.id}`}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-400 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 rounded-lg transition-colors group-hover:shadow-md group-hover:shadow-primary-500/20"
                      >
                        Explore
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Hover Effect */}
                {!isLocked && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Login Prompt for Hidden Categories */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12 text-center"
          >
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/50 p-8 max-w-2xl mx-auto">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Unlock All Categories
              </h3>
              <p className="text-gray-400 mb-6">
                Sign in to access our complete toolkit including marketing
                tools, branding suites, and advanced creative features.
              </p>
              <Link
                to="/signin"
                className="inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-lg hover:shadow-xl hover:shadow-primary-500/25"
              >
                Sign In to Explore All
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default CategoryBrowser;
