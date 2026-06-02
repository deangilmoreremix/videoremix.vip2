import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, TrendingUp, Layers, Target, DollarSign, ArrowRight, Play, Star, Check } from "lucide-react";

interface RotatingWord {
  word: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROTATING_WORDS: RotatingWord[] = [
  { word: "Engagement", color: "text-primary-400", icon: Sparkles },
  { word: "Conversions", color: "text-emerald-400", icon: TrendingUp },
  { word: "Scale", color: "text-violet-400", icon: Layers },
  { word: "Personalization", color: "text-pink-400", icon: Target },
  { word: "ROI", color: "text-amber-400", icon: DollarSign },
];

const ROTATE_INTERVAL_MS = 3000;

const AnimatedHero: React.FC = () => {
  const [index, setIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const current = ROTATING_WORDS[index];
  const CurrentIcon = current.icon;

  // Reserve width of the longest word ("Personalization") to prevent layout shift
  const longestWord = useMemo(
    () => ROTATING_WORDS.reduce((a, b) => (a.word.length >= b.word.length ? a : b)).word,
    []
  );

  useEffect(() => {
    if (shouldReduceMotion) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [shouldReduceMotion]);

  return (
    <section
      className="relative min-h-[88vh] flex items-center overflow-hidden bg-[#050510]"
      aria-label="Hero"
    >
      {/* Animated gradient orbs */}
      <motion.div
        aria-hidden
        className="absolute top-1/4 left-1/4 w-[480px] h-[480px] rounded-full bg-primary-600/20 blur-3xl pointer-events-none"
        animate={
          shouldReduceMotion
            ? {}
            : { x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }
        }
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] rounded-full bg-accent-600/20 blur-3xl pointer-events-none"
        animate={
          shouldReduceMotion
            ? {}
            : { x: [0, -50, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }
        }
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle grid overlay */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container-max section-padding relative z-10 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Trust badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
          >
            <Sparkles className="h-4 w-4 text-primary-400" />
            <span className="text-sm text-gray-300">
              Trusted by 12,467+ marketing teams worldwide
            </span>
          </motion.div>

          {/* Rotating headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="block"
            >
              Drive your marketing
            </motion.span>

            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative inline-block align-baseline min-w-[1ch]"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={current.word}
                  initial={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 28, filter: "blur(8px)" }
                  }
                  animate={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : { opacity: 1, y: 0, filter: "blur(0px)" }
                  }
                  exit={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -28, filter: "blur(8px)" }
                  }
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className={`inline-flex items-center gap-3 ${current.color} font-extrabold`}
                >
                  <CurrentIcon className={`h-10 w-10 sm:h-12 sm:h-12 md:h-14 md:w-14 ${current.color}`} />
                  <span>{current.word}</span>
                </motion.span>
              </AnimatePresence>
            </motion.span>

            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="block"
            >
              with AI personalization.
            </motion.span>
          </h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Transform generic marketing into personalized experiences at enterprise
            scale. Generate thousands of on-brand variants in minutes — no
            engineering team required.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <motion.button
              whileHover={shouldReduceMotion ? {} : { scale: 1.04, y: -2 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="group relative inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white font-semibold rounded-xl shadow-2xl shadow-primary-500/40 hover:shadow-primary-500/60 transition-shadow"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </motion.button>
            <motion.button
              whileHover={shouldReduceMotion ? {} : { scale: 1.04, y: -2 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/15 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              <Play className="h-5 w-5" />
              Watch 60s Demo
            </motion.button>
          </motion.div>

          {/* Trust row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-400"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400 tracking-tight">★★★★★</span>
              <span className="font-medium text-gray-200">4.9/5</span>
              <span>from 2,100+ reviews</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>SOC 2 certified</span>
            </div>
          </motion.div>

          {/* Hidden placeholder for layout reservation (longest word) */}
          <span aria-hidden className="sr-only">{longestWord}</span>
        </div>
      </div>

      {/* Bottom fade to next section */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-[#050510] pointer-events-none"
      />
    </section>
  );
};

export default AnimatedHero;
