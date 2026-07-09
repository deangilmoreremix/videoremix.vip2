import React, { useState, useEffect } from "react";
import {
  Video,
  ChevronDown,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GlobalSearch from "./GlobalSearch";
import { appGroups } from "../data/appGroups";

const clerkAppearance = {
  variables: { colorPrimary: "#6366f1", borderRadius: "0.5rem" },
};

interface SpecialHeaderProps {
  topOffset?: number;
}

const SpecialHeader: React.FC<SpecialHeaderProps> = ({ topOffset = 0 }) => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

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

  // Grouped tools for the dropdown
  const getGroupedTools = () => {
    return appGroups.map(group => ({
      ...group,
      tools: rawAppsData.filter(app => app.group === group.id).slice(0, 6) // Show 6 per group
    })).filter(group => group.tools.length > 0);
  };

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
                AI MARKETING PLATFORM
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

          {/* Tools Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown("tools")}
            onMouseLeave={closeDropdowns}
          >
            <Link
              to="/tools"
              className="text-white/80 hover:text-white px-3 py-2 text-sm font-medium flex items-center"
              onMouseEnter={() => setActiveDropdown("tools")}
              onMouseLeave={closeDropdowns}
            >
              Tools
              <ChevronDown
                className={`ml-1 h-4 w-4 transition-transform duration-200 ${activeDropdown === "tools" ? "rotate-180" : ""}`}
              />
            </Link>

            <AnimatePresence>
              {activeDropdown === "tools" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 mt-1 w-[400px] bg-black/90 backdrop-blur-md border border-gray-700 rounded-lg shadow-lg overflow-hidden z-[100]"
                >
                  <div className="p-4">
                    <h3 className="text-primary-400 font-medium text-sm mb-3 flex items-center">
                      <Sparkles className="h-4 w-4 mr-1" /> Our AI Tools
                    </h3>

                    <div className="max-h-[400px] overflow-y-auto pr-2">
                      {getGroupedTools().map((group) => (
                        <div key={group.id} className="mb-4 last:mb-0">
                          <div className="flex items-center mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            <span className="mr-2 w-3 h-3 flex items-center justify-center">{group.icon}</span>
                            {group.label}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                             {group.tools.map((tool: Record<string, unknown>) => (
                              <a
                                key={tool.id}
                                href={`https://${tool.id}.videoremix.vip`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-2 hover:bg-gray-800 rounded text-white transition-colors group"
                              >
                                <div className="flex items-center mb-1">
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
                        </div>
                      ))}
                    </div>

                    <Link
                      to="/tools"
                      className="block text-center bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors mt-3"
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

          {user ? (
            <div className="ml-3 flex items-center">
              <UserButton
                appearance={clerkAppearance}
                afterSignOutUrl="/"
              />
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
              {/* Mobile Tools Dropdown */}
              <div>
                <Link
                  to="/tools"
                  className="flex justify-between items-center w-full text-white hover:bg-gray-800 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)} // Close mobile menu when navigating
                >
                  <span>Tools</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
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

              {user ? (
                <div className="border-t border-gray-700 pt-2 mt-2 flex items-center gap-3">
                  <UserButton
                    appearance={clerkAppearance}
                    afterSignOutUrl="/"
                  />
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
