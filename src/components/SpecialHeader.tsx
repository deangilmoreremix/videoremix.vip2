import React, { useState, useEffect } from "react";
import {
  Video,
  ChevronDown,
  ArrowRight,
  Sparkles,
  User,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "./ui/toast";
import GlobalSearch from "./GlobalSearch";

interface SpecialHeaderProps {
  topOffset?: number;
}

const SpecialHeader: React.FC<SpecialHeaderProps> = ({ topOffset = 0 }) => {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDropdownToggle = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const closeDropdowns = () => {
    setActiveDropdown(null);
  };

  // Featured tools for the dropdown
  const featuredTools = [
    {
      name: "Personalized AI Image Generation",
      url: "/features/ai-image",
      description: "Create AI-generated images",
      icon: <span className="text-lg">🎨</span>,
    },
    {
      name: "Personalized Content Generator",
      url: "/editor/:templateId",
      description: "Generate personalized content",
      icon: <span className="text-lg">🎬</span>,
    },
    {
      name: "Personalized Multimodal AI Creator",
      url: "/gemini-features",
      description: "Create with text and visual inputs",
      icon: <span className="text-lg">🔮</span>,
    },
    {
      name: "Personalized Sales Proposal Generator",
      url: "https://proposal-ai.videoremix.vip",
      description: "Create tailored proposals",
      icon: <span className="text-lg">📝</span>,
    },
    {
      name: "Personalized Sales Page Builder",
      url: "https://sales-page-builder.videoremix.vip",
      description: "Build high-converting pages",
      icon: <span className="text-lg">🏗️</span>,
    },
    {
      name: "Personalized Client Research",
      url: "/features/client-research",
      description: "Research clients automatically",
      icon: <span className="text-lg">🔍</span>,
    },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className={`fixed left-0 right-0 z-40 py-3 ${isScrolled ? "bg-black/90 backdrop-blur-md" : "bg-transparent"}`}
      style={{ top: `${topOffset}px` }}
    >
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 10, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 5,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-primary-400 rounded-full blur-lg opacity-30 group-hover:opacity-60 transition-opacity"
              ></motion.div>
              <Video className="h-8 w-8 text-white relative z-10" />
            </div>
            <div>
              <span className="text-xl font-bold text-white leading-none">
                VideoRemix.vip
              </span>
              <div className="text-xs text-primary-300">
                PERSONALIZED MARKETING
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Navigation Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden md:flex items-center space-x-3"
        >
          <GlobalSearch />
          <Link
            to="/features"
            className="text-white/80 hover:text-white px-3 py-2 text-sm font-medium"
          >
            Features
          </Link>

          {/* Tools Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("tools")}
            onMouseLeave={closeDropdowns}
          >
            <button
              className="text-white/80 hover:text-white px-3 py-2 text-sm font-medium flex items-center"
              onClick={() => handleDropdownToggle("tools")}
            >
              Tools{" "}
              <ChevronDown
                className={`ml-1 h-4 w-4 transition-transform duration-200 ${activeDropdown === "tools" ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {activeDropdown === "tools" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 mt-1 w-[320px] bg-black/90 backdrop-blur-md border border-gray-700 rounded-lg shadow-lg overflow-hidden z-[100]"
                >
                  <div className="p-4">
                    <h3 className="text-primary-400 font-medium text-sm mb-3 flex items-center">
                      <Sparkles className="h-4 w-4 mr-1" /> Featured Tools
                    </h3>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {featuredTools.map((tool, index) => (
                        <a
                          key={index}
                          href={tool.url}
                          className="block p-2 hover:bg-gray-800 rounded text-white transition-colors group"
                        >
                          <div className="flex items-center mb-1">
                            <div className="mr-2">{tool.icon}</div>
                            <span className="font-medium group-hover:text-primary-400 transition-colors text-sm">
                              {tool.name}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs line-clamp-1">
                            {tool.description}
                          </p>
                        </a>
                      ))}
                    </div>

                    <Link
                      to="/tools"
                      className="block text-center bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors mt-2"
                    >
                      <span className="flex items-center justify-center">
                        Browse All Tools
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            to="/pricing"
            className="text-white/80 hover:text-white px-3 py-2 text-sm font-medium"
          >
            Pricing
          </Link>
          <Link
            to="/dashboard"
            className="text-white/80 hover:text-white px-3 py-2 text-sm font-medium"
          >
            Dashboard
          </Link>
          <Link
            to="/faq"
            className="text-white/80 hover:text-white px-3 py-2 text-sm font-medium"
          >
            FAQ
          </Link>
          <Link
            to="/help"
            className="text-white/80 hover:text-white px-3 py-2 text-sm font-medium"
          >
            Help Center
          </Link>

          {user ? (
            <div className="relative ml-3">
              <button
                onClick={() => handleDropdownToggle("user")}
                className="flex items-center space-x-2 text-white/80 hover:text-white px-3 py-2 text-sm font-medium"
              >
                <User className="h-4 w-4" />
                <span>{user.user_metadata?.first_name || user.email}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${activeDropdown === "user" ? "rotate-180" : ""}`}
                />
              </button>

              {activeDropdown === "user" && (
                <div className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur-md border border-gray-700 rounded-lg shadow-lg z-[100]">
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-white hover:bg-gray-800 transition-colors"
                      onClick={closeDropdowns}
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={async () => {
                        if (signingOut) return; // Prevent multiple clicks
                        setSigningOut(true);
                        try {
                          const { error } = await signOut();
                          if (error) {
                            toast({
                              title: "Sign Out Failed",
                              description: error.message,
                              variant: "destructive",
                            });
                          } else {
                            closeDropdowns();
                          }
                        } finally {
                          setSigningOut(false);
                        }
                      }}
                      disabled={signingOut}
                      className="w-full text-left px-4 py-2 text-white hover:bg-gray-800 transition-colors flex items-center disabled:opacity-50"
                    >
                      {signingOut ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <LogOut className="h-4 w-4 mr-2" />
                      )}
                      {signingOut ? "Signing Out..." : "Sign Out"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="ml-3 flex items-center space-x-2">
              <Link
                to="/signin"
                className="text-white/80 hover:text-white px-3 py-2 text-sm font-medium"
              >
                Sign In
              </Link>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 px-4 py-2 rounded-full text-sm font-medium text-white inline-block"
                >
                  Sign Up
                </Link>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            className="text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-black overflow-hidden"
          >
            <div className="container mx-auto px-4 py-2 space-y-1">
              <Link
                to="/features"
                className="block text-white hover:bg-gray-800 px-3 py-2 rounded-md"
              >
                Features
              </Link>

              {/* Mobile Tools Dropdown */}
              <div>
                <button
                  className="flex justify-between items-center w-full text-white hover:bg-gray-800 px-3 py-2 rounded-md"
                  onClick={() => handleDropdownToggle("mobile-tools")}
                >
                  <span>Tools</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${activeDropdown === "mobile-tools" ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {activeDropdown === "mobile-tools" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="py-2 px-4 bg-gray-900 rounded-md mt-1 mb-2 space-y-2">
                        {featuredTools.map((tool, index) => (
                          <a
                            key={index}
                            href={tool.url}
                            className="block text-white hover:bg-gray-800 px-2 py-2 rounded text-sm"
                          >
                            <div className="flex items-center">
                              <div className="mr-2">{tool.icon}</div>
                              <span>{tool.name}</span>
                            </div>
                          </a>
                        ))}

                        <Link
                          to="/tools"
                          className="block text-center bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded text-sm transition-colors mt-2"
                        >
                          Browse All Tools
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                to="/pricing"
                className="block text-white hover:bg-gray-800 px-3 py-2 rounded-md"
              >
                Pricing
              </Link>
              <Link
                to="/dashboard"
                className="block text-white hover:bg-gray-800 px-3 py-2 rounded-md"
              >
                Dashboard
              </Link>
              <Link
                to="/faq"
                className="block text-white hover:bg-gray-800 px-3 py-2 rounded-md"
              >
                FAQ
              </Link>
              <Link
                to="/help"
                className="block text-white hover:bg-gray-800 px-3 py-2 rounded-md"
              >
                Help Center
              </Link>

              {user ? (
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="px-3 py-2 text-white text-sm">
                    Signed in as: {user.user_metadata?.first_name || user.email}
                  </div>
                  <Link
                    to="/profile"
                    className="block text-white hover:bg-gray-800 px-3 py-2 rounded-md"
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={async () => {
                      if (signingOut) return; // Prevent multiple clicks
                      setSigningOut(true);
                      try {
                        const { error } = await signOut();
                        if (error) {
                          toast({
                            title: "Sign Out Failed",
                            description: error.message,
                            variant: "destructive",
                          });
                        } else {
                          setMobileMenuOpen(false);
                        }
                      } finally {
                        setSigningOut(false);
                      }
                    }}
                    disabled={signingOut}
                    className="w-full text-left text-white hover:bg-gray-800 px-3 py-2 rounded-md flex items-center disabled:opacity-50"
                  >
                    {signingOut ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <LogOut className="h-4 w-4 mr-2" />
                    )}
                    {signingOut ? "Signing Out..." : "Sign Out"}
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-700 pt-2 mt-2 space-y-2">
                  <Link
                    to="/signin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-left text-white hover:bg-gray-800 px-3 py-2 rounded-md"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-left text-white bg-primary-600 hover:bg-primary-700 px-3 py-2 rounded-md"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default SpecialHeader;
