import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ArrowUpRight, Bell, CheckCircle, ShoppingCart } from 'lucide-react';
import { useAnimationContext } from '../context/AnimationContext';

interface NotificationProps {
  type: 'signup' | 'purchase' | 'activity';
  message: string;
  timestamp: string;
  id: number;
}

const LiveActivityIndicator: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [activeUserCount, setActiveUserCount] = useState(567);
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);
  const [showToast, setShowToast] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const { prefersReducedMotion, lowPowerMode, isInitialLoadComplete } = useAnimationContext();
  
  // Generate random names for notifications
  const firstNames = ["John", "Sarah", "Michael", "Emma", "David", "Lisa", "Robert", "Jennifer", "William", "Maria"];
  const lastNames = ["Smith", "Johnson", "Brown", "Taylor", "Martinez", "Lee", "Garcia", "Wilson", "Anderson", "Thomas"];
  
  const getRandomName = () => {
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${first} ${last.charAt(0)}.`;
  };
  
  const getRandomLocation = () => {
    const locations = ["New York", "Los Angeles", "London", "Sydney", "Toronto", "Berlin", "Tokyo", "Paris", "Madrid", "Singapore"];
    return locations[Math.floor(Math.random() * locations.length)];
  };
  
  const getRandomMessage = (type: 'signup' | 'purchase' | 'activity') => {
    const name = getRandomName();
    const location = getRandomLocation();
    
    switch (type) {
      case 'signup':
        return `${name} just signed up for VideoRemix.vip`;
      case 'purchase':
        return `${name} from ${location} just purchased Pro`;
      case 'activity':
        return `${name} created their first video`;
      default:
        return "New activity detected";
    }
  };
  
  const createRandomNotification = (): NotificationProps => {
    const types = ['signup', 'purchase', 'activity'] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    
    return {
      type,
      message: getRandomMessage(type),
      timestamp: "Just now",
      id: Date.now(),
    };
  };
  
  // Initialize from localStorage
  useEffect(() => {
    // Don't initialize until the initial page load is complete
    if (!isInitialLoadComplete) return;
    
    const savedPreference = localStorage.getItem('activityEnabled');
    if (savedPreference !== null) {
      setIsEnabled(savedPreference === 'true');
    } else {
      // Default to enabled
      setIsEnabled(true);
      localStorage.setItem('activityEnabled', 'true');
    }
  }, [isInitialLoadComplete]);
  
  // Simulate active user count changing
  useEffect(() => {
    if (!isEnabled || !isInitialLoadComplete) return;
    
    const interval = setInterval(() => {
      // Random fluctuation in user count
      const change = Math.floor(Math.random() * 6) - 2; // -2 to +3 change
      setActiveUserCount(prev => Math.max(prev + change, 500));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isEnabled, isInitialLoadComplete]);
  
  // Simulate notifications appearing
  useEffect(() => {
    if (!isEnabled || !isInitialLoadComplete) return;
    
    const interval = setInterval(() => {
      // Only show notifications when the browser tab is active
      if (document.hidden) return;
      
      const shouldShowNotification = Math.random() > 0.5;
      
      if (shouldShowNotification) {
        const notification = createRandomNotification();
        setNotifications(prev => [notification, ...prev].slice(0, 5));
        setShowToast(true);
        
        // Clear any existing timeout
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        // Hide toast after 5 seconds
        timeoutRef.current = window.setTimeout(() => {
          setShowToast(false);
          timeoutRef.current = null;
        }, 5000);
      }
    }, 15000);
    
    return () => {
      clearInterval(interval);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [isEnabled, isInitialLoadComplete]);
  
  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'signup':
        return <Users className="w-4 h-4" />;
      case 'purchase':
        return <ShoppingCart className="w-4 h-4" />;
      case 'activity':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  // If reduced motion is preferred or low power mode is on, don't render
  if (prefersReducedMotion || lowPowerMode) {
    return null;
  }

  return (
    <>
      {/* Fixed live activity badge in corner */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: isEnabled ? 0 : 100, opacity: isEnabled ? 1 : 0 }}
        transition={{ delay: 2, duration: 0.5, type: "spring" }}
        className="fixed bottom-4 left-4 z-40"
      >
        <div className="bg-black/70 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {/* Live user count */}
          <div className="p-3 flex items-center border-b border-gray-700">
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                repeatDelay: 3
              }}
              className="w-2 h-2 bg-green-500 rounded-full mr-2"
              style={{ willChange: 'transform' }}
            />
            <span className="text-white font-medium text-sm flex items-center">
              <Users className="h-4 w-4 mr-1 text-primary-400" />
              <motion.span
                key={activeUserCount}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-primary-400 font-semibold mr-1"
              >
                {activeUserCount}
              </motion.span>
              people online now
            </span>
          </div>
          
          {/* Recent activity list - only render when visible for performance */}
          {isEnabled && (
            <div className="max-h-36 overflow-y-auto thin-scrollbar" style={{ scrollbarWidth: 'thin' }}>
              <AnimatePresence initial={false}>
                {notifications.map((notification) => (
                  <motion.div 
                    key={notification.id}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-3 py-2 border-b border-gray-700/50 last:border-0 hover:bg-gray-800/50 transition-colors flex items-center"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500/50 to-primary-700/50 flex items-center justify-center mr-2 flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="text-xs flex-1 overflow-hidden">
                      <p className="text-white truncate">{notification.message}</p>
                      <p className="text-gray-400">{notification.timestamp}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {notifications.length === 0 && (
                <div className="p-3 text-xs text-gray-400 text-center">
                  Activity will appear here...
                </div>
              )}
            </div>
          )}
          
          {/* View all link */}
          <div className="p-2 bg-gray-800/50">
            <a 
              href="#activity" 
              className="text-xs text-primary-400 hover:text-primary-300 flex items-center justify-center"
            >
              View all activity
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </a>
          </div>
        </div>
      </motion.div>
      
      {/* Toast notification for new activity - only shown when actively visible */}
      {isEnabled && showToast && notifications.length > 0 && (
        <AnimatePresence>
          <motion.div
            key={notifications[0].id}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-24 left-4 z-50 max-w-xs bg-gray-900 shadow-lg rounded-lg overflow-hidden border border-gray-700"
          >
            <div className="flex p-4">
              <div className="flex-shrink-0 mr-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  {getNotificationIcon(notifications[0].type)}
                </div>
              </div>
              <div>
                <p className="text-sm text-white font-medium">{notifications[0].message}</p>
                <p className="text-xs text-gray-400">{notifications[0].timestamp}</p>
              </div>
            </div>
            <div className="w-full bg-gray-700 h-1">
              <motion.div
                className="bg-primary-500 h-full"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
};

export default LiveActivityIndicator;