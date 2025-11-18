import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

interface ScrollProgressBarProps {
  topOffset?: number;
}

const ScrollProgressBar: React.FC<ScrollProgressBarProps> = ({ topOffset = 0 }) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      // Show progress bar after scrolling a bit
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed left-0 right-0 h-1 bg-gradient-to-r from-primary-600 via-primary-400 to-secondary-500 z-50 origin-left"
      style={{ scaleX, top: `${topOffset}px` }}
    />
  );
};

export default ScrollProgressBar;