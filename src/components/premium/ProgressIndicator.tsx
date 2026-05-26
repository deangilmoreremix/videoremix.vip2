import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ProgressIndicator: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-50">
      <motion.div
        className="h-full bg-gradient-to-r from-primary-500 via-accent-500 to-primary-400"
        style={{ width: `${scrollProgress}%` }}
        transition={{ duration: 0.1 }}
      />
      {scrollProgress > 10 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-2 right-4 bg-gray-900 text-white text-xs px-2 py-1 rounded-full"
        >
          {Math.round(scrollProgress)}% read
        </motion.div>
      )}
    </div>
  );
};

export default ProgressIndicator;
