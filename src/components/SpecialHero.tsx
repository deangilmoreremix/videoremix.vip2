import React from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Play,
  TrendingUp,
} from "lucide-react";
import MagicSparkles from "./MagicSparkles";
import { useLandingPageContent } from "../context/LandingPageContext";

const SpecialHero: React.FC = () => {
  const { hero } = useLandingPageContent();

  return (
    <section className="relative pt-32 pb-24 overflow-hidden bg-[#030303]">
      {/* Premium ambient background */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-primary-600/30 via-accent-500/10 to-transparent rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-gradient-to-tr from-accent-500/20 via-primary-600/10 to-transparent rounded-full blur-[100px]"></div>

        {/* Mesh gradient overlay */}
        <div className="absolute inset-0 opacity-30 bg-gradient-to-b from-primary-900/20 via-transparent to-accent-900/20"></div>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:60px_60px]"></div>

        {/* Moving light streaks */}
        <motion.div
          className="absolute top-1/4 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500/20 to-transparent"
          animate={{
            x: ["-100%", "200%"],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatDelay: 5,
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-left"
            >
              {/* Premium badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mb-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary-900/40 to-accent-900/30 border border-primary-500/20 backdrop-blur-sm"
              >
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                </div>
                <span className="text-sm font-semibold text-white tracking-wide uppercase">
                  AI-Powered Video Platform
                </span>
              </motion.div>

              {/* Hero headline - massive typography */}
              <motion.h1
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[0.95] mb-8 tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <span className="block text-gray-100 mb-2">
                  Create Videos
                </span>
                <span className="block text-transparent bg-gradient-to-r from-primary-400 via-accent-400 to-primary-300 bg-clip-text animate-gradient-shift" style={{backgroundSize: '200% auto'}}>
                  That Convert
                </span>
                <span className="block text-gray-100 mt-2">
                  Like Magic ✨
                </span>
              </motion.h1>

              {/* Hero subtext */}
              <motion.p
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed max-w-2xl font-light border-l-4 border-primary-500/50 pl-6"
              >
                The world's most advanced AI video platform. Create personalized,
                high-converting videos in minutes — not hours.
              </motion.p>

              {/* Benefit pills */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-wrap gap-3 mb-10"
              >
                {[
                  "AI-Powered",
                  "No Experience Needed",
                  "5-Minute Setup",
                  "Enterprise Results",
                ].map((benefit, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 backdrop-blur-sm"
                  >
                    {benefit}
                  </div>
                ))}
              </motion.div>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.a
                  href="/signup"
                  whileHover={{
                    scale: 1.03,
                    y: -3,
                    boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.4)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="relative inline-flex items-center justify-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold text-xl px-10 py-5 rounded-2xl shadow-2xl overflow-hidden group"
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                  <span className="relative z-10 flex items-center">
                    Start Creating Free
                    <motion.span
                      animate={{ x: [0, 6, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="ml-3"
                    >
                      →
                    </motion.span>
                  </span>
                </motion.a>

                <motion.a
                  href="#demo"
                  whileHover={{
                    scale: 1.03,
                    y: -3,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center justify-center glass-button text-white font-semibold text-lg px-10 py-5 rounded-2xl border border-white/10"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Watch Demo
                </motion.a>
              </motion.div>

              {/* Social proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="mt-12 pt-8 border-t border-white/10"
              >
                <p className="text-sm text-gray-500 mb-4 uppercase tracking-widest">
                  Trusted by 12,000+ creators & companies
                </p>
                <div className="flex flex-wrap gap-6 items-center opacity-60">
                  {[
                    "Netflix",
                    "Adobe",
                    "Spotify",
                    "Airbnb",
                    "Meta",
                    "Stripe",
                  ].map((brand, i) => (
                    <span
                      key={i}
                      className="text-xl font-bold text-gray-500 tracking-tight"
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column - Hero Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* Main dashboard mockup */}
              <div className="relative">
                {/* Glow behind card */}
                <div className="absolute -inset-8 bg-gradient-to-br from-primary-600/20 via-accent-500/10 to-primary-600/20 rounded-[2rem] blur-3xl"></div>

                {/* Card */}
                <motion.div
                  className="relative bg-gradient-to-b from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-2xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Card header */}
                  <div className="bg-black/30 px-6 py-4 border-b border-gray-700/50 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-xs text-gray-500">VideoRemix Studio</span>
                    </div>
                  </div>

                  {/* Card content */}
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[
                        "Personalization",
                        "AI Editing",
                        "Analytics",
                      ].map((feature, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                          className="bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-primary-500/20 rounded-xl p-3 text-center text-xs font-medium text-gray-300"
                        >
                          {feature}
                        </motion.div>
                      ))}
                    </div>

                    {/* Preview image */}
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-950">
                      <img
                        src={
                          hero?.background_image_url ||
                          "https://images.unsplash.com/photo-1556155092-490a1ba16284?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
                        }
                        alt="VideoRemix Dashboard"
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>

                      {/* Floating play button */}
                      <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        whileHover={{ scale: 1.1 }}
                      >
                        <div className="w-14 h-14 rounded-full bg-primary-600/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                          <Play className="h-7 w-7 text-white ml-1" />
                        </div>
                      </motion.div>

                      {/* Floating badge */}
                      <motion.div
                        initial={{ x: 20, y: -20, opacity: 0 }}
                        animate={{ x: 0, y: 0, opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                        className="absolute top-4 left-4 bg-primary-600/90 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2 text-white text-sm"
                      >
                        <Sparkles className="h-4 w-4" />
                        AI Active
                      </motion.div>

                      {/* Stats pill */}
                      <motion.div
                        initial={{ x: -20, y: 20, opacity: 0 }}
                        animate={{ x: 0, y: 0, opacity: 1 }}
                        transition={{ delay: 1, duration: 0.5 }}
                        className="absolute bottom-4 right-4 bg-green-500/90 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2 text-white text-sm font-semibold"
                      >
                        <TrendingUp className="h-4 w-4" />
                        +247% ROI
                      </motion.div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">10M+</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Videos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">150+</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Countries</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">4.9★</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Rating</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating achievement card */}
                <motion.div
                  initial={{ x: 30, y: -30, opacity: 0 }}
                  animate={{ x: 0, y: 0, opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                  className="absolute -left-8 top-1/4 bg-gradient-to-br from-yellow-900/40 to-amber-900/30 backdrop-blur-xl border border-yellow-500/30 rounded-xl p-4 shadow-xl w-40"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    <span className="text-xs font-bold text-yellow-200 uppercase tracking-wider">Achievement</span>
                  </div>
                  <p className="text-sm text-white leading-tight">
                    First video created! 🎉
                  </p>
                </motion.div>

                {/* Floating notification */}
                <motion.div
                  initial={{ x: -20, y: 20, opacity: 0 }}
                  animate={{ x: 0, y: 0, opacity: 1 }}
                  transition={{ delay: 1.4, duration: 0.6 }}
                  className="absolute -right-4 bottom-1/4 bg-gradient-to-br from-green-900/40 to-emerald-900/30 backdrop-blur-xl border border-green-500/30 rounded-xl p-4 shadow-xl flex items-center gap-3 max-w-[200px]"
                >
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-400">Video Ready</p>
                    <p className="text-xs text-gray-300">Your personalized video is ready to export</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpecialHero;
