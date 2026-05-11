import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, CheckCircle, DollarSign } from 'lucide-react';

interface Activity {
  id: number;
  type: 'conversion' | 'signup' | 'milestone';
  message: string;
  location: string;
  time: string;
  amount?: string;
}

const activities: Activity[] = [
  { id: 1, type: 'conversion', message: 'Increased conversions by 2.3x', location: 'San Francisco, CA', time: '2 min ago' },
  { id: 2, type: 'signup', message: 'New team joined', location: 'Austin, TX', time: '5 min ago' },
  { id: 3, type: 'milestone', message: 'Reached 10K campaigns', location: 'New York, NY', time: '12 min ago' },
  { id: 4, type: 'conversion', message: 'Achieved 80% lift', location: 'London, UK', time: '18 min ago' },
  { id: 5, type: 'signup', message: 'Enterprise plan activated', location: 'Toronto, CA', time: '25 min ago' },
];

const iconMap = {
  conversion: <TrendingUp className="h-4 w-4 text-green-400" />,
  signup: <CheckCircle className="h-4 w-4 text-blue-400" />,
  milestone: <DollarSign className="h-4 w-4 text-yellow-400" />,
};

const LiveActivityFeed: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [visibleActivities, setVisibleActivities] = useState<Activity[]>([]);

  useEffect(() => {
    setVisibleActivities([activities[0]]);

    const interval = setInterval(() => {
      setVisibleActivities((prev) => {
        const nextIndex = prev.length;
        if (nextIndex >= activities.length) return prev;
        return [...prev, activities[nextIndex]];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`space-y-3 ${className}`}>
      <AnimatePresence>
        {visibleActivities.map((activity) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3 border border-gray-700/50"
          >
            <div className="flex-shrink-0">{iconMap[activity.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{activity.message}</p>
              <p className="text-xs text-gray-400">{activity.location}</p>
            </div>
            <div className="flex-shrink-0 text-xs text-gray-500">{activity.time}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default LiveActivityFeed;
