import React from "react";
import { motion } from "framer-motion";
import {
  Clock,
  DollarSign,
  AlertTriangle,
  BarChart,
  Zap,
  Target,
  UserRoundX,
  MessageSquareOff,
  TrendingDown,
  Coins,
  EyeOff,
  Share2,
  LineChart,
  HandCoins,
  Presentation as PresentationChart,
  Megaphone,
  CircleDollarSign as CurrencyCircleDollar,
} from "lucide-react";

const ProblemSection: React.FC = () => {
  return (
    <section id="problem" className="py-32 bg-[#030303] relative overflow-hidden">
      {/* Dramatic background */}
      <div className="absolute inset-0">
        {/* Red danger zones */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-red-700/8 rounded-full blur-[100px]"></div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-5xl mx-auto text-center mb-24"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-900/30 border border-red-500/30 text-red-300 text-sm font-semibold mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            THE MARKETING CRISIS
          </motion.div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}>
            Are You Still Creating{" "}
            <span className="text-transparent bg-gradient-to-r from-red-400 via-red-500 to-rose-500 bg-clip-text">
              Generic
            </span>{" "}
            Marketing?
          </h2>

          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            In today's hyper-competitive landscape, generic content gets ignored.
            Personalized videos deliver <span className="text-red-400 font-semibold">3x higher engagement</span>{" "}
            and dramatically better conversion rates.
          </p>
        </motion.div>

        {/* Problem cards grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          {[
            {
              icon: <UserRoundX className="h-8 w-8" />,
              title: "Generic Content Gets Ignored",
              description: "73% of prospects skip generic videos within seconds",
              stat: "5x longer watch times",
              color: "red",
            },
            {
              icon: <Target className="h-8 w-8" />,
              title: "Wrong Message, Wrong Audience",
              description: "Different segments need different messaging",
              stat: "3x higher conversion",
              color: "amber",
            },
            {
              icon: <MessageSquareOff className="h-8 w-8" />,
              title: "No Personalization = No Connection",
              description: "86% say personalization impacts purchases",
              stat: "only 12% personalize",
              color: "orange",
            },
            {
              icon: <DollarSign className="h-8 w-8" />,
              title: "Poor Conversion Rates",
              description: "Generic videos convert 3X worse than personalized",
              stat: "19% vs 6%",
              color: "green",
            },
            {
              icon: <TrendingDown className="h-8 w-8" />,
              title: "Performance Declines Annually",
              description: "Generic marketing effectiveness drops 18% yearly",
              stat: "-18% annually",
              color: "blue",
            },
            {
              icon: <AlertTriangle className="h-8 w-8" />,
              title: "Competitors Are Ahead",
              description: "67% of competitors already use personalization",
              stat: "60% more market share",
              color: "purple",
            },
          ].map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              whileHover={{
                y: -8,
                transition: { duration: 0.2 }
              }}
              className="group relative"
            >
              {/* Glow background */}
              <div className={`absolute inset-0 bg-${problem.color}-600/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

              <div className="relative bg-gradient-to-br from-gray-900/90 via-gray-800/70 to-gray-900/90 backdrop-blur-xl rounded-2xl p-7 border border-gray-700/50 hover:border-red-500/40 transition-all duration-500 h-full">
                {/* Problem tag */}
                <div className="absolute top-4 right-4 bg-red-950/50 text-red-300 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider border border-red-900/50">
                  Problem {index + 1}
                </div>

                {/* Icon */}
                <div className="mb-5">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-900/40 to-red-800/20 border border-red-500/20 flex items-center justify-center text-red-400">
                    {problem.icon}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3 leading-tight group-hover:text-red-300 transition-colors">
                  {problem.title}
                </h3>
                <p className="text-gray-400 mb-5 leading-relaxed">
                  {problem.description}
                </p>

                {/* Impact stat */}
                <div className="pt-4 border-t border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Impact</span>
                    <span className={`text-sm font-bold text-red-400`}>{problem.stat}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA panel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative bg-gradient-to-br from-red-950/30 via-gray-900/50 to-red-950/30 rounded-3xl p-10 border border-red-900/30 overflow-hidden">
            {/* Animated background pulse */}
            <div className="absolute inset-0 bg-red-600/10 animate-pulse-slow"></div>

            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 text-center">
                The True Cost of Missing{" "}
                <span className="text-red-400">Personalization</span>
              </h3>

              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                {[
                  { value: "215%", label: "Higher Engagement" },
                  { value: "183%", label: "Better Conversions" },
                  { value: "157%", label: "Longer View Time" },
                  { value: "287%", label: "More Social Shares" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    whileHover={{ y: -5, scale: 1.05 }}
                    className="bg-black/40 rounded-xl p-5 border border-red-900/20 text-center"
                  >
                    <div className={`text-3xl md:text-4xl font-bold mb-1 bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent`}>
                      {stat.value}
                    </div>
                    <div className="text-xs md:text-sm text-gray-400">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Compare boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* Generic */}
                <div className="bg-red-950/20 rounded-xl p-5 border border-red-900/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-red-400 font-semibold">Generic Marketing</span>
                    <span className="text-2xl font-bold text-red-500">6%</span>
                  </div>
                  <div className="text-sm text-gray-400 mb-3">Average conversion rate</div>
                  <div className="bg-red-950/40 h-2 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-red-600"
                      initial={{ width: 0 }}
                      whileInView={{ width: "6%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5 }}
                    ></motion.div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>$10K spent</span>
                    <span>$36K revenue</span>
                  </div>
                </div>

                {/* Personalized */}
                <div className="bg-green-950/20 rounded-xl p-5 border border-green-900/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-green-400 font-semibold">Personalized Marketing</span>
                    <span className="text-2xl font-bold text-green-500">19%</span>
                  </div>
                  <div className="text-sm text-gray-400 mb-3">Average conversion rate</div>
                  <div className="bg-green-950/40 h-2 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-green-600"
                      initial={{ width: 0 }}
                      whileInView={{ width: "19%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5 }}
                    ></motion.div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>$10K spent</span>
                    <span>$114K revenue</span>
                  </div>
                </div>
              </div>

              <div className="text-center mt-8">
                <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                  The longer you delay, the wider the gap between you and competitors using personalized marketing.
                </p>

                <motion.a
                  href="#solution"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 25px 50px -12px rgba(239, 68, 68, 0.3)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold px-8 py-4 rounded-xl text-lg shadow-xl"
                >
                  <span>See The Solution</span>
                  <ArrowRight className="ml-2 h-6 w-6" />
                </motion.a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection;
