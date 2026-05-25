import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowUp from 'lucide-react/dist/esm/icons/arrow-up.js';

const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          onClick={scrollToTop}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-20 right-4 z-40 bg-gradient-to-r from-primary-600 to-accent-600 text-white p-3 rounded-full shadow-lg"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
          {Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100) > 75 && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-white bg-gray-900 px-2 py-1 rounded">
              {Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100)}%
            </span>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default BackToTop;
