import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AnimatedBorderGradientProps {
  children: React.ReactNode;
  className?: string;
  borderWidth?: number;
  duration?: number;
  colors?: string[];
}

const AnimatedBorderGradient: React.FC<AnimatedBorderGradientProps> = ({
  children,
  className = '',
  borderWidth = 2,
  duration = 3,
  colors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'],
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {(isHovered || isInView) && (
        <motion.div
          className="absolute inset-0 rounded-inherit"
          style={{
            background: `conic-gradient(from 0deg, ${colors.join(', ')})`,
            padding: borderWidth,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-full h-full bg-gray-900 rounded-inherit" />
        </motion.div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default AnimatedBorderGradient;
