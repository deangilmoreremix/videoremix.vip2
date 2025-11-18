import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationContext } from '../context/AnimationContext';

interface Sparkle {
  id: string;
  createdAt: number;
  color: string;
  size: number;
  style: {
    top: string;
    left: string;
    zIndex: number;
  };
}

interface MagicSparklesProps {
  colors?: string[];
  minSparkles?: number;
  maxSparkles?: number;
  className?: string;
  overflow?: boolean;
  minSize?: number;
  maxSize?: number;
  speed?: 'slow' | 'medium' | 'fast';
  children?: React.ReactNode;
}

// Function to generate random sparkles
const generateSparkle = (
  colors: string[], 
  minSize: number, 
  maxSize: number
): Sparkle => {
  return {
    id: String(Math.random()),
    createdAt: Date.now(),
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * (maxSize - minSize) + minSize,
    style: {
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      zIndex: Math.floor(Math.random() * 3) // Random z-index for depth effect
    }
  };
};

const MagicSparkles: React.FC<MagicSparklesProps> = ({
  colors = ['#FFC700', '#FF0069', '#6C00FF', '#4ade80', '#00D1FF'],
  minSparkles = 6,
  maxSparkles = 12,
  className = '',
  overflow = false,
  minSize = 10,
  maxSize = 20,
  speed = 'medium',
  children
}) => {
  const { prefersReducedMotion, lowPowerMode } = useAnimationContext();
  
  // Don't render animations for reduced motion or low power
  if (prefersReducedMotion || lowPowerMode) {
    return <div className={`relative ${className}`}>{children}</div>;
  }
  
  // Get a random number of sparkles between min and max
  const sparkleCount = Math.floor(
    Math.random() * (maxSparkles - minSparkles + 1) + minSparkles
  );
  
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const timeoutRef = useRef<number | null>(null);
  
  // Get animation duration based on speed
  const getAnimationDuration = () => {
    switch(speed) {
      case 'slow': return 1800;
      case 'fast': return 800;
      case 'medium':
      default: return 1200;
    }
  };

  // Initialize sparkles and set up cleanup
  useEffect(() => {
    // Create initial sparkles
    const initialSparkles = Array.from({ length: sparkleCount })
      .map(() => generateSparkle(colors, minSize, maxSize));
    
    setSparkles(initialSparkles);
    
    // Replace sparkles periodically
    const refreshRate = getAnimationDuration(); // ms
    
    const updateSparkles = () => {
      setSparkles(prevSparkles => {
        // Remove one random sparkle
        const nextSparkles = [...prevSparkles];
        
        if (nextSparkles.length > 0) {
          const indexToRemove = Math.floor(Math.random() * nextSparkles.length);
          nextSparkles.splice(indexToRemove, 1);
        }
        
        // Add a new sparkle
        return [
          ...nextSparkles,
          generateSparkle(colors, minSize, maxSize)
        ];
      });
      
      // Use window.setTimeout directly and store the numeric ID
      timeoutRef.current = window.setTimeout(updateSparkles, refreshRate);
    };
    
    // Start the timer and store the ID
    timeoutRef.current = window.setTimeout(updateSparkles, refreshRate);
    
    // Cleanup function
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [colors, minSize, maxSize, sparkleCount, speed]);

  return (
    <div className={`relative ${className} ${overflow ? '' : 'overflow-hidden'}`}>
      {children}
      
      <AnimatePresence>
        {sparkles.map(sparkle => (
          <motion.div
            key={sparkle.id}
            className="absolute pointer-events-none"
            style={sparkle.style}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              duration: getAnimationDuration() / 1000, // convert ms to seconds
              ease: "easeInOut"
            }}
          >
            <div
              style={{
                width: `${sparkle.size}px`,
                height: `${sparkle.size}px`,
                position: 'relative'
              }}
            >
              <svg
                width="100%" 
                height="100%" 
                viewBox="0 0 68 68" 
                fill="none"
                style={{ transform: `rotate(${Math.random() * 360}deg)` }}
              >
                <path
                  d="M26.5 25.5C19.0043 33.3697 0 34 0 34C0 34 19.1013 35.3684 26.5 43.5C33.234 50.901 34 68 34 68C34 68 36.9884 50.7065 44.5 43.5C51.6431 36.647 68 34 68 34C68 34 51.6947 32.0939 44.5 25.5C36.5605 18.2235 34 0 34 0C34 0 33.1982 18.5571 26.5 25.5Z"
                  fill={sparkle.color}
                />
              </svg>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MagicSparkles;