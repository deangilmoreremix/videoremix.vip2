import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, CheckCircle, X } from "lucide-react";

interface ConversionNudgeProps {
  headline: string;
  message: string;
  cta: string;
  onCta?: () => void;
  delaySeconds?: number;
}

const ConversionNudge: React.FC<ConversionNudgeProps> = ({
  headline,
  message,
  cta,
  onCta,
  delaySeconds = 15,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delaySeconds * 1000);
    return () => clearTimeout(timer);
  }, [delaySeconds]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.95 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.45, ease: [0.25, 1, 0.5, 1] }}
          className="fixed bottom-24 right-4 md:right-8 z-50 w-80 md:w-96"
          role="dialog"
          aria-label={headline}
        >
          <div className="relative bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="absolute -inset-1 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-2xl blur opacity-60" />
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="hidden md:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-primary-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{headline}</p>
                  <p className="mt-1 text-sm text-gray-300">{message}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={onCta}
                      className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-gray-100"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {cta}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-gray-400 transition-colors hover:text-white"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConversionNudge;
