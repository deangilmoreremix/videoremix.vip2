import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import PersonalizerDialog from './PersonalizerDialog';

export default function GlobalPersonalizerButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 flex items-center justify-center p-4 bg-gradient-to-r from-primary-600 to-primary-800 text-white rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-white/20 hover:shadow-[0_0_30px_rgba(99,102,241,0.8)] transition-all group"
        aria-label="Open AI Personalizer"
      >
        <Sparkles className="w-6 h-6 animate-pulse group-hover:animate-none" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap ml-0 group-hover:ml-3 font-semibold font-display">
          Personalize This
        </span>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-4 w-72 p-4 bg-gray-900 border border-white/20 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none translate-y-2 group-hover:translate-y-0">
          <h4 className="text-sm font-bold text-white mb-2 font-display flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-400" />
            AI Personalization System
          </h4>
          <p className="text-xs text-gray-300 font-body leading-relaxed mb-2">
            <strong>How it works:</strong> Click to open the module. Enter a prospect's username, and our system will scan public platforms to extract their details.
          </p>
          <p className="text-xs text-gray-300 font-body leading-relaxed">
            <strong>How to use:</strong> Generate highly targeted emails, video scripts, or proposals, then copy and paste the result into any of our 95+ apps!
          </p>
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <PersonalizerDialog
            open={isOpen}
            onClose={() => setIsOpen(false)}
            appId="videoremix-vip" // Default to VideoRemix, users can change this in the dialog
          />
        )}
      </AnimatePresence>
    </>
  );
}
