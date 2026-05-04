import React from "react";
import { motion } from "framer-motion";
import {
  Wand2,
  Check,
  X,
  Zap,
  Clock,
  Monitor,
  Copy,
  ArrowRight,
  Sparkles,
  Users,
  BarChart,
  Target,
  UserRoundX,
  MessageSquareOff,
  TrendingDown,
  Coins,
  EyeOff,
  Share2,
  LineChart,
  HandCoins,
} from "lucide-react";
import MagicSparkles from "./MagicSparkles";
import SparkleEffect from "./SparkleEffect";

// Comparison data
const comparisonPoints = [
  {
    traditional: "One-size-fits-all marketing for everyone",
    videoRemix: "Personalized marketing videos for each audience segment",
    icon: <Users className="h-5 w-5" />,
  },
  {
    traditional: "Manual customization takes hours per campaign",
    videoRemix: "AI personalizes marketing in minutes",
    icon: <Clock className="h-5 w-5" />,
  },
  {
    traditional: "Same messaging regardless of prospect stage",
    videoRemix: "Dynamic marketing adapts to each buyer journey stage",
    icon: <Target className="h-5 w-5" />,
  },
  {
    traditional: "Static templates with limited marketing options",
    videoRemix: "20+ personalized marketing apps for any campaign",
    icon: <Wand2 className="h-5 w-5" />,
  },
];

const SolutionSection: React.FC = () => {
  return (
    <section id="solution" className="py-32 bg-[#050505] relative overflow-hidden">
      {/* Premium background */}
      <div className="absolute inset-0">
        {/* Primary gradient orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-600/15 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[100px]"></div>

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/10 via-transparent to-accent-900/10"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-5xl mx-auto text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <MagicSparkles minSparkles={6} maxSparkles={12} speed="medium">
              <div className="relative inline-block">
                <div className="absolute -inset-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full blur-lg opacity-60"></div>
                <div className="relative bg-gradient-to-r from-primary-600 to-accent-500 text-white font-bold px-8 py-3 rounded-full flex items-center gap-3 shadow-lg">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-sm tracking-wide">THE SOLUTION</span>
                </div>
              </div>
            </MagicSparkles>
          </motion.div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}>
            Introducing{" "}
            <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-primary-300 bg-clip-text text-transparent animate-gradient-shift"
              style={{ backgroundSize: '200% auto' }}>
              VideoRemix.vip
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
            The world's most advanced AI video personalization platform. Create,
            customize, and launch high-converting videos in minutes — not days.
          </p>
        </motion.div>

        {/* Main content grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          {/* Left - Visual showcase */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            {/* Main demo card */}
            <div className="relative">
              {/* Animated glow border */}
              <div className="absolute -inset-1 bg-gradient-to-br from-primary-500 via-accent-500 to-primary-600 rounded-2xl opacity-50 blur-lg animate-pulse-slow"></div>

              <div className="relative bg-gradient-to-b from-gray-900 via-gray-800/90 to-gray-900 rounded-2xl border border-gray-700/50 overflow-hidden">
                {/* Header */}
                <div className="bg-black/40 px-6 py-4 border-b border-gray-700/50 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-gray-500 font-mono">video-remix-studio</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  {/* Feature badges */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {["Personalization Engine", "AI Video Editing", "Analytics Dashboard"].map((badge, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-lg bg-primary-900/30 border border-primary-500/30 text-primary-300 text-xs font-medium"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>

                  {/* Mock interface */}
                  <div className="bg-black/60 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center">
                          <Wand2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-bold text-lg">Personalization Active</div>
                          <div className="text-gray-400 text-xs">AI is customizing your video</div>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                        LIVE
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary-600 to-accent-500"
                        animate={{ width: ["0%", "75%", "75%"] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                      ></motion.div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Processing 12 personalization targets...</span>
                      <span>92% complete</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">247%</div>
                      <div className="text-xs text-gray-500">ROI Boost</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">3.2x</div>
                      <div className="text-xs text-gray-500">Engagement</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">10min</div>
                      <div className="text-xs text-gray-500">Creation Time</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge - testing */}
            <motion.div
              initial={{ x: -30, y: 30, opacity: 0 }}
              whileInView={{ x: 0, y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute -left-6 top-1/3 w-36 bg-gradient-to-br from-emerald-900/40 to-green-900/30 backdrop-blur-xl border border-emerald-500/30 rounded-xl p-4 shadow-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-emerald-300 uppercase">Live Result</span>
              </div>
              <p className="text-sm text-white font-semibold">+247% conversions</p>
            </motion.div>
          </motion.div>

          {/* Right - Text content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col justify-center"
          >
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-8">
              How{" "}
              <span className="text-primary-400">VideoRemix.vip</span>{" "}
              Transforms Your Marketing
            </h3>

            {/* Feature comparison */}
            <div className="space-y-5">
              {[
                {
                  traditional: "Generic one-size-fits-all videos",
                  vr: "Personalized videos for each audience segment",
                  icon: <Users />,
                },
                {
                  traditional: "Hours of manual editing per video",
                  vr: "AI-powered personalization in minutes",
                  icon: <Clock />,
                },
                {
                  traditional: "Static content that doesn't adapt",
                  vr: "Dynamic content that adjusts to buyer journey",
                  icon: <Target />,
                },
                {
                  traditional: "Limited templates and tools",
                  vr: "20+ AI-powered personalization apps",
                  icon: <Wand2 />,
                },
              ].map((point, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="grid grid-cols-2 gap-4 items-center"
                >
                  {/* Before - red */}
                  <div className="flex items-center gap-3 bg-red-950/20 rounded-xl p-4 border border-red-900/20">
                    <div className="p-2 bg-red-900/40 rounded-lg flex-shrink-0">
                      <X className="h-5 w-5 text-red-500" />
                    </div>
                    <span className="text-gray-300 text-sm">{point.traditional}</span>
                  </div>

                  {/* After - green */}
                  <div className="flex items-center gap-3 bg-green-950/20 rounded-xl p-4 border border-green-900/20">
                    <div className="p-2 bg-green-900/40 rounded-lg flex-shrink-0">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <span className="text-gray-300 text-sm">{point.vr}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Highlight CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="mt-10"
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity"></div>
                <a
                  href="#pricing"
                  className="relative block bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold text-center px-8 py-4 rounded-xl shadow-lg"
                >
                  <span className="flex items-center justify-center gap-2">
                    Get Personalized Marketing Access
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/10 to-accent-900/10"></div>
            <div className="relative z-10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Personalized Marketing By The Numbers</h3>
                <p className="text-gray-400">The data is clear: personalization dramatically outperforms generic content</p>
              </div>

              <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
                {[
                  { value: "215%", label: "Higher Engagement" },
                  { value: "183%", label: "Better Conversions" },
                  { value: "3x", label: "Marketing ROI" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -8 }}
                    className="text-center"
                  >
                    <div className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-primary-400 to-accent-400 bg-clip-text text-transparent mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SolutionSection;
