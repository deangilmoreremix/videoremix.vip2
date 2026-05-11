import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface AnimatedStatsCounterProps {
  from?: number;
  to: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  icon?: React.ReactNode;
  springConfig?: {
    stiffness?: number;
    damping?: number;
  };
  className?: string;
}

const AnimatedStatsCounter: React.FC<AnimatedStatsCounterProps> = ({
  from = 0,
  to,
  duration = 2,
  delay = 0,
  prefix = '',
  suffix = '',
  label,
  icon,
  springConfig = { stiffness: 100, damping: 20 },
  className = '',
}) => {
  const [count, setCount] = React.useState(from);
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(from + (to - from) * eased);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    const timeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, delay * 1000);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animationFrame);
    };
  }, [isVisible, from, to, duration, delay]);

  const formatNumber = (num: number): string => {
    if (to >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (to >= 1000) return `${(num / 1000).toFixed(1)}K`;
    if (Number.isInteger(to)) return Math.round(num).toString();
    return num.toFixed(1);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className={`text-center ${className}`}
    >
      {icon && (
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', ...springConfig, delay: delay + 0.2 }}
          className="flex justify-center mb-3"
        >
          {icon}
        </motion.div>
      )}
      <motion.div
        className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent"
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {prefix}{formatNumber(count)}{suffix}
      </motion.div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </motion.div>
  );
};

export default AnimatedStatsCounter;
