import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, X, Gift, ChevronRight, Sparkles, Users, Zap, Video } from 'lucide-react';
import { useMediaQuery } from 'react-responsive';

interface CountdownTimerProps {
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ hours, minutes, seconds }) => {
  const [timeLeft, setTimeLeft] = useState({
    hours,
    minutes,
    seconds
  });
  
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newSeconds = prev.seconds - 1;
        
        // Set blinking when time is low
        if (prev.hours === 0 && prev.minutes < 30) {
          setIsBlinking(true);
        }
        
        if (newSeconds >= 0) {
          return { ...prev, seconds: newSeconds };
        }
        
        const newMinutes = prev.minutes - 1;
        
        if (newMinutes >= 0) {
          return { ...prev, minutes: newMinutes, seconds: 59 };
        }
        
        const newHours = prev.hours - 1;
        
        if (newHours >= 0) {
          return { hours: newHours, minutes: 59, seconds: 59 };
        }
        
        clearInterval(interval);
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center space-x-2">
      <div className="hidden sm:block">
        <Timer className="h-4 w-4 text-white animate-pulse" />
      </div>
      <div className="flex items-center">
        <motion.div 
          className={`bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md text-white font-mono ${isBlinking ? 'animate-pulse' : ''}`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ 
            repeat: Infinity, 
            repeatType: "mirror",
            duration: 1,
            repeatDelay: 59
          }}
        >
          {String(timeLeft.hours).padStart(2, '0')}
        </motion.div>
        <span className="mx-1 text-white">:</span>
        <motion.div 
          className={`bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md text-white font-mono ${isBlinking ? 'animate-pulse' : ''}`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ 
            repeat: Infinity, 
            repeatType: "mirror",
            duration: 1,
            repeatDelay: 59
          }}
        >
          {String(timeLeft.minutes).padStart(2, '0')}
        </motion.div>
        <span className="mx-1 text-white">:</span>
        <motion.div 
          className={`bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md text-white font-mono ${isBlinking ? 'animate-pulse' : ''}`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ 
            repeat: Infinity, 
            repeatType: "mirror",
            duration: 1
          }}
        >
          {String(timeLeft.seconds).padStart(2, '0')}
        </motion.div>
      </div>
    </div>
  );
};

const UrgencyBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeUsers, setActiveUsers] = useState(347);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  // Simulate real-time active users
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Show/hide randomly selected urgency messages
  const [currentUrgencyMessage, setCurrentUrgencyMessage] = useState(0);
  const urgencyMessages = [
    { icon: <Gift className="h-4 w-4 text-yellow-300" />, text: "Limited Time Marketing Offer!" },
    { icon: <Users className="h-4 w-4 text-yellow-300" />, text: `${activeUsers} marketers viewing this deal` },
    { icon: <Zap className="h-4 w-4 text-yellow-300" />, text: "Only 7 marketing spots remaining!" },
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentUrgencyMessage(prev => (prev + 1) % urgencyMessages.length);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [urgencyMessages.length]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="relative z-50"
    >
      <motion.div 
        layout
        className={`bg-gradient-to-r from-primary-600 via-purple-600 to-secondary-600 py-2 px-4 relative overflow-hidden`}
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -40, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2,
              }}
            />
          ))}
          
          {/* Shine effect */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ 
              repeat: Infinity, 
              repeatDelay: 5,
              duration: 3,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center sm:justify-between relative z-10">
          <AnimatePresence>
            {!isMinimized && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center text-white text-sm mb-2 sm:mb-0"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  <Sparkles className="h-5 w-5 text-yellow-300" />
                </motion.div>
                <span className="font-bold mr-2 bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-100">
                  EXCLUSIVE OFFER:
                </span>
                <span>50% OFF Pro Marketing Plan + Free Marketing Blueprint</span>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="ml-4 hidden sm:flex"
                >
                  <a 
                    href="#claim-offer" 
                    className="flex items-center text-xs bg-white/20 hover:bg-white/30 backdrop-blur-sm py-1 px-3 rounded-full transition-colors"
                  >
                    Claim Now
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                      }}
                    >
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </motion.div>
                  </a>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center space-x-4">
            {isMinimized ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentUrgencyMessage}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center"
                >
                  {urgencyMessages[currentUrgencyMessage].icon}
                  <span className="text-white text-sm ml-2">
                    {urgencyMessages[currentUrgencyMessage].text}
                  </span>
                </motion.div>
              </AnimatePresence>
            ) : (
              <CountdownTimer hours={23} minutes={59} seconds={59} />
            )}

            <div className="flex space-x-1">
              <button 
                onClick={toggleMinimize} 
                className="text-white hover:text-gray-200 p-1 focus-ring rounded-full"
                aria-label={isMinimized ? "Expand banner" : "Minimize banner"}
              >
                <motion.div
                  animate={{ rotate: isMinimized ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronRight className="h-4 w-4" />
                </motion.div>
              </button>
              <button 
                onClick={() => setIsVisible(false)} 
                className="text-white hover:text-gray-200 p-1 focus-ring rounded-full"
                aria-label="Close banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UrgencyBanner;