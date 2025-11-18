import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationContext } from '../context/AnimationContext';

interface SparkleProps {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
  duration: number;
}

interface SparkleEffectProps {
  count?: number;
  colors?: string[];
  minSize?: number;
  maxSize?: number;
  minOpacity?: number;
  maxOpacity?: number;
  minDuration?: number;
  maxDuration?: number;
  className?: string;
  interactive?: boolean;
}

const SparkleEffect: React.FC<SparkleEffectProps> = ({
  count = 40,
  colors = ['#ffffff', '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1'],
  minSize = 2,
  maxSize = 8,
  minOpacity = 0.3,
  maxOpacity = 0.8,
  minDuration = 5,
  maxDuration = 15,
  className = '',
  interactive = false
}) => {
  const [sparkles, setSparkles] = useState<SparkleProps[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const sparkleTimers = useRef<Map<number, number>>(new Map());
  const { prefersReducedMotion, lowPowerMode } = useAnimationContext();
  
  // Generate initial sparkles
  useEffect(() => {
    if (prefersReducedMotion || lowPowerMode) return;
    
    // Clear any existing timers
    sparkleTimers.current.forEach(timerId => {
      window.clearTimeout(timerId);
    });
    sparkleTimers.current.clear();
    
    const initialSparkles: SparkleProps[] = [];
    
    // Generate initial sparkles
    for (let i = 0; i < count; i++) {
      initialSparkles.push(createSparkle(i));
    }
    
    setSparkles(initialSparkles);
    
    // Initialize sparkle renewal cycle
    initialSparkles.forEach((sparkle, index) => {
      const delay = sparkle.duration * 1000; // Convert to milliseconds
      
      // Start the renewal cycle
      const timerId = window.setTimeout(() => {
        renewSparkle(sparkle.id);
      }, delay);
      
      // Store the timer ID
      sparkleTimers.current.set(sparkle.id, timerId);
    });
    
    // Get container dimensions
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setContainerSize({ width, height });
    }
    
    // Cleanup function to clear all timeouts
    return () => {
      sparkleTimers.current.forEach(timerId => {
        window.clearTimeout(timerId);
      });
      sparkleTimers.current.clear();
    };
  }, [count, prefersReducedMotion, lowPowerMode]);
  
  // Update container size on resize
  useEffect(() => {
    if (prefersReducedMotion || lowPowerMode) return;
    
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [prefersReducedMotion, lowPowerMode]);
  
  // Set up mouse movement tracking if interactive
  useEffect(() => {
    if (!interactive || prefersReducedMotion || lowPowerMode) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setMousePos({ x, y });
    };
    
    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [interactive, prefersReducedMotion, lowPowerMode]);
  
  // Create a new sparkle with the given ID
  function createSparkle(id: number): SparkleProps {
    return {
      id,
      x: Math.random() * 100, // percentage
      y: Math.random() * 100, // percentage
      size: Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize,
      opacity: Math.random() * (maxOpacity - minOpacity) + minOpacity,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * (maxDuration - minDuration) + minDuration
    };
  }
  
  // Renew a sparkle by creating a new one with the same ID
  function renewSparkle(id: number) {
    // Clear the old timer
    if (sparkleTimers.current.has(id)) {
      window.clearTimeout(sparkleTimers.current.get(id));
    }
    
    setSparkles(prevSparkles => {
      // Find and replace the sparkle with the given ID
      const newSparkle = createSparkle(id);
      const updatedSparkles = prevSparkles.map(s => 
        s.id === id ? newSparkle : s
      );
      
      // Set up a new timer for this sparkle
      const timerId = window.setTimeout(() => {
        renewSparkle(id);
      }, newSparkle.duration * 1000);
      
      // Store the new timer ID
      sparkleTimers.current.set(id, timerId);
      
      return updatedSparkles;
    });
  }
  
  // Add sparkle near mouse pointer (called on click for interactive mode)
  function addSparkleNearMouse() {
    if (!interactive || prefersReducedMotion || lowPowerMode) return;
    
    // Generate a unique ID
    const newId = Date.now();
    
    // Create a new sparkle near the mouse position (with some randomness)
    const mouseX = mousePos.x / containerSize.width * 100; // Convert to percentage
    const mouseY = mousePos.y / containerSize.height * 100; // Convert to percentage
    
    const randomOffsetX = (Math.random() - 0.5) * 20; // Random offset ±10%
    const randomOffsetY = (Math.random() - 0.5) * 20; // Random offset ±10%
    
    const newSparkle: SparkleProps = {
      id: newId,
      x: Math.min(Math.max(mouseX + randomOffsetX, 0), 100), // Keep within bounds
      y: Math.min(Math.max(mouseY + randomOffsetY, 0), 100), // Keep within bounds
      size: Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize,
      opacity: Math.random() * (maxOpacity - minOpacity) + minOpacity,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * (maxDuration - minDuration) + minDuration
    };
    
    setSparkles(prevSparkles => [...prevSparkles, newSparkle]);
    
    // Set a timeout to remove this sparkle
    const timerId = window.setTimeout(() => {
      // Instead of renewing, we'll remove this sparkle since it was added dynamically
      setSparkles(prevSparkles => prevSparkles.filter(s => s.id !== newId));
      sparkleTimers.current.delete(newId);
    }, newSparkle.duration * 1000);
    
    sparkleTimers.current.set(newId, timerId);
  }
  
  // Return empty container if reduced motion preferred or low power mode
  if (prefersReducedMotion || lowPowerMode) {
    return <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} />;
  }

  return (
    <div 
      ref={containerRef} 
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      onClick={interactive ? addSparkleNearMouse : undefined}
    >
      <AnimatePresence>
        {sparkles.map(sparkle => (
          <motion.div
            key={sparkle.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: sparkle.opacity, 
              scale: 1,
              x: 0,
              y: -30
            }}
            exit={{ opacity: 0, scale: 0, y: -50 }}
            transition={{ 
              duration: sparkle.duration,
              ease: "linear"
            }}
            style={{
              position: 'absolute',
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
              width: `${sparkle.size}px`,
              height: `${sparkle.size}px`,
              borderRadius: '50%',
              backgroundColor: sparkle.color,
              zIndex: 20
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default SparkleEffect;