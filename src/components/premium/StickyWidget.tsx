import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up.js';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3.js';
import ROICalculator from './ROICalculator';

const StickyWidget: React.FC = () => {
   const [isExpanded, setIsExpanded] = useState(false);
   const [isVisible, setIsVisible] = useState(false);

   useEffect(() => {
     const handleScroll = () => {
       setIsVisible(window.scrollY > 500);
     };
     window.addEventListener('scroll', handleScroll);
     return () => window.removeEventListener('scroll', handleScroll);
   }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 right-4 z-40"
        >
          <motion.div
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 shadow-2xl overflow-hidden"
            animate={{ width: isExpanded ? 400 : 60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {!isExpanded ? (
              <button
                onClick={() => setIsExpanded(true)}
                className="w-15 h-15 flex items-center justify-center text-primary-400 hover:bg-gray-700 transition-colors"
              >
                <BarChart3 className="h-6 w-6" />
              </button>
            ) : (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white font-bold text-sm">ROI Calculator</span>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-xs">
                  <ROICalculator />
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyWidget;
