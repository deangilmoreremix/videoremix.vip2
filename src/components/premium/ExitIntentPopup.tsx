import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift } from 'lucide-react';

interface ExitIntentPopupProps {
  title?: string;
  content?: string;
  ctaText?: string;
  ctaLink?: string;
  delay?: number;
}

const ExitIntentPopup: React.FC<ExitIntentPopupProps> = ({
  title = 'Wait! Don\'t Miss Out',
  content = 'Get our free Personalization Blueprint PDF and discover how to 3x your marketing ROI.',
  ctaText = 'Download Free Guide',
  ctaLink = '/lead-magnet',
  delay = 2000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown) {
        setTimeout(() => {
          setIsVisible(true);
          setHasShown(true);
        }, delay);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasShown, delay]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full relative border border-primary-500/30"
          >
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-full bg-primary-900/40 mb-4">
                <Gift className="h-8 w-8 text-primary-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
              <p className="text-gray-300">{content}</p>
            </div>

            <motion.a
              href={ctaLink}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="block w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold py-3 rounded-xl text-center"
            >
              {ctaText}
            </motion.a>

            <button
              onClick={() => setIsVisible(false)}
              className="block w-full text-gray-400 text-sm mt-4 hover:text-white transition-colors"
            >
              No thanks, I'm not interested
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentPopup;
