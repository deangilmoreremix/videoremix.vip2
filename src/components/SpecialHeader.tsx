import React, { useState, useEffect } from "react";
import {
  Video,
  ArrowRight,
} from "lucide-react";
import { UserButton } from "@clerk/react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GlobalSearch from "./GlobalSearch";

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

          <Link
            to="/apps"
            className="text-white/80 hover:text-white px-3 py-2 text-sm font-medium"
          >
            Apps
          </Link>

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
                  to="/apps"
                  className="flex justify-between items-center w-full text-white hover:bg-gray-800 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)} // Close mobile menu when navigating
                >
                  <span>Apps</span>
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
