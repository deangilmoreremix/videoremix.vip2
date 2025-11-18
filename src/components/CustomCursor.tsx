import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAnimationContext } from '../context/AnimationContext';

interface CustomCursorProps {
  showSpotlight?: boolean;
}

const CustomCursor: React.FC<CustomCursorProps> = ({ showSpotlight = true }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { prefersReducedMotion, lowPowerMode } = useAnimationContext();

  useEffect(() => {
    // Initial hide cursor until mouse moves
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, 1000);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Check if cursor is over clickable element
      const target = e.target as HTMLElement;
      const computedStyle = window.getComputedStyle(target);
      setIsPointer(
        computedStyle.cursor === 'pointer' || 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.closest('a') !== null || 
        target.closest('button') !== null
      );
    };
    
    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);
    
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mousedown', handleMouseDown, { passive: true });
    document.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    document.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  // Return null for reduced motion or low power mode after all hooks are called
  if (prefersReducedMotion || lowPowerMode) {
    return null;
  }

  return (
    <>
      {/* Main cursor dot */}
      <motion.div 
        className={`fixed w-4 h-4 rounded-full bg-primary-500 mix-blend-difference pointer-events-none z-50 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        animate={{
          x: mousePosition.x - 8, // Center the cursor
          y: mousePosition.y - 8,
          scale: isClicked ? 0.5 : isPointer ? 1.5 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 500, // Increase stiffness for more responsive movement
          damping: 28, // Adjust damping for smoother movement
          mass: 0.1, // Lower mass for faster response
        }}
        style={{ willChange: 'transform' }}
      />
      
      {/* Cursor ring */}
      <motion.div 
        className={`fixed w-10 h-10 rounded-full border-2 border-white/30 pointer-events-none z-50 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        animate={{
          x: mousePosition.x - 20, // Center the ring
          y: mousePosition.y - 20,
          scale: isPointer ? 1.5 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 300, // Lower stiffness for smoother trail
          damping: 28,
          mass: 0.2,
          delay: 0, // Remove delay for more responsive feel
        }}
        style={{ willChange: 'transform' }}
      />
      
      {/* Spotlight effect (optional) */}
      {showSpotlight && (
        <motion.div 
          className={`fixed rounded-full pointer-events-none z-40 bg-primary-500/5 backdrop-blur-md ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          animate={{
            x: mousePosition.x - 150, // Center the spotlight
            y: mousePosition.y - 150,
            scale: isPointer ? 1.2 : 1,
            opacity: isPointer ? 0.12 : 0.05,
          }}
          style={{
            width: 300,
            height: 300,
            willChange: 'transform, opacity'
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 25,
            mass: 0.3,
          }}
        />
      )}
    </>
  );
};

export default CustomCursor;