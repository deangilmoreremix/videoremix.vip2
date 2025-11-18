import React, { createContext, useContext, useState, useEffect } from 'react';

interface AnimationContextType {
  prefersReducedMotion: boolean;
  lowPowerMode: boolean;
  highPerformanceMode: boolean;
  isInitialLoadComplete: boolean;
  setIsInitialLoadComplete: (value: boolean) => void;
  shouldDisableComplexAnimations: boolean;
  calculateAnimationDelay: (baseDelay: number, priority: 'high' | 'medium' | 'low') => number;
  registerAnimation: () => void;
  completeAnimation: () => void;
}

const AnimationContext = createContext<AnimationContextType>({
  prefersReducedMotion: false,
  lowPowerMode: false,
  highPerformanceMode: true,
  isInitialLoadComplete: false,
  setIsInitialLoadComplete: () => {},
  shouldDisableComplexAnimations: false,
  calculateAnimationDelay: () => 0,
  registerAnimation: () => {},
  completeAnimation: () => {}
});

export const useAnimationContext = () => useContext(AnimationContext);
const useAnimation = useAnimationContext; // Alias for backward compatibility

export const AnimationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const [highPerformanceMode, setHighPerformanceMode] = useState(true);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [pendingAnimations, setPendingAnimations] = useState(0);
  
  // Disable complex animations for reduced motion or low power mode
  const shouldDisableComplexAnimations = prefersReducedMotion || lowPowerMode;
  
  // Calculate animation delay based on priority
  const calculateAnimationDelay = (baseDelay: number, priority: 'high' | 'medium' | 'low') => {
    if (prefersReducedMotion) return 0;
    
    switch(priority) {
      case 'high': return baseDelay;
      case 'medium': return baseDelay + 0.1;
      case 'low': return baseDelay + 0.3;
      default: return baseDelay;
    }
  };
  
  // Animation tracking functions
  const registerAnimation = () => {
    setPendingAnimations(prev => prev + 1);
  };
  
  const completeAnimation = () => {
    setPendingAnimations(prev => Math.max(0, prev - 1));
  };
  
  useEffect(() => {
    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    // Add event listener
    if (motionQuery.addEventListener) {
      motionQuery.addEventListener('change', handleReducedMotionChange);
    } else {
      // Fallback for older browsers
      motionQuery.addListener(handleReducedMotionChange);
    }
    
    // Check for low-end devices
    const detectDeviceCapabilities = () => {
      // Basic checks for device performance
      const isLowPower = 
        (window.navigator.hardwareConcurrency !== undefined && window.navigator.hardwareConcurrency <= 4) || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Determine if this is a high-performance device
      const isHighPerformance = 
        (window.navigator.hardwareConcurrency !== undefined && window.navigator.hardwareConcurrency >= 8) &&
        !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      setLowPowerMode(isLowPower);
      setHighPerformanceMode(isHighPerformance);
    };
    
    detectDeviceCapabilities();
    
    // Set initial load complete after a short delay
    // This ensures animations don't run until the page is ready
    const initialLoadTimer = setTimeout(() => {
      setIsInitialLoadComplete(true);
    }, 500);
    
    return () => {
      if (motionQuery.removeEventListener) {
        motionQuery.removeEventListener('change', handleReducedMotionChange);
      } else {
        motionQuery.removeListener(handleReducedMotionChange);
      }
      clearTimeout(initialLoadTimer);
    };
  }, []);
  
  const contextValue = {
    prefersReducedMotion,
    lowPowerMode,
    highPerformanceMode,
    isInitialLoadComplete,
    setIsInitialLoadComplete,
    shouldDisableComplexAnimations,
    calculateAnimationDelay,
    registerAnimation,
    completeAnimation
  };
  
  return (
    <AnimationContext.Provider value={contextValue}>
      {children}
    </AnimationContext.Provider>
  );
};