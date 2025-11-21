import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Trophy, Sparkles, X } from 'lucide-react';
import { useAchievements, ACHIEVEMENT_DEFINITIONS } from '../../hooks/useAchievements';
import { useUserAccess } from '../../hooks/useUserAccess';
import { useAuth } from '../../context/AuthContext';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  achievementType?: string;
}

const OnboardingProgressTracker: React.FC = () => {
  const { user } = useAuth();
  const { achievements, progressPercentage, getCompletionPercentage } = useAchievements();
  const { accessData } = useUserAccess();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!user || isDismissed) return null;

  const hasAnyPurchases = (accessData?.apps.length || 0) > 0;

  const checklistItems: ChecklistItem[] = [
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add your details and preferences',
      completed: achievements.some(a => a.achievement_type === 'profile_completed'),
      achievementType: 'profile_completed',
    },
    {
      id: 'purchase',
      title: 'Get Your First App',
      description: 'Explore and purchase your first tool',
      completed: hasAnyPurchases,
      achievementType: 'first_purchase',
    },
    {
      id: 'video',
      title: 'Create Your First Video',
      description: 'Start creating personalized content',
      completed: achievements.some(a => a.achievement_type === 'video_creator'),
      achievementType: 'video_creator',
    },
    {
      id: 'explore',
      title: 'Explore Multiple Apps',
      description: 'Try out 5 different tools',
      completed: achievements.some(a => a.achievement_type === 'power_user'),
      achievementType: 'power_user',
    },
    {
      id: 'preferences',
      title: 'Customize Your Dashboard',
      description: 'Set your theme and layout preferences',
      completed: progressPercentage >= 80,
    },
  ];

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);
  const isFullyComplete = completedCount === totalCount;

  if (isFullyComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-sm rounded-xl p-6 border border-green-500/30 relative overflow-hidden"
      >
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-4 mb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-4 rounded-full"
          >
            <Trophy className="h-8 w-8 text-white" />
          </motion.div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              Onboarding Complete!
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Sparkles className="h-6 w-6 text-yellow-400" />
              </motion.div>
            </h3>
            <p className="text-gray-300">
              You've mastered the basics! Keep creating amazing content.
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-white/5 rounded-lg">
          <p className="text-sm text-gray-300 mb-2">You've earned {achievements.length} achievements!</p>
          <div className="flex gap-2 flex-wrap">
            {achievements.slice(0, 5).map((achievement) => {
              const def = ACHIEVEMENT_DEFINITIONS[achievement.achievement_type];
              return def ? (
                <div
                  key={achievement.id}
                  className="text-2xl"
                  title={def.title}
                >
                  {def.icon}
                </div>
              ) : null;
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden"
    >
      <div
        className="p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: isExpanded ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </motion.div>
            <h3 className="text-lg font-bold text-white">
              Getting Started Progress
            </h3>
            <span className="text-sm text-gray-400">
              {completedCount} of {totalCount} completed
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
            />
          </div>
          <div className="absolute -top-1 right-0 text-xs font-bold text-primary-400">
            {completionPercentage}%
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-6 pb-6"
          >
            <div className="space-y-3">
              {checklistItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    item.completed
                      ? 'bg-green-900/20 border border-green-500/30'
                      : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="mt-0.5">
                    {item.completed ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring' }}
                      >
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                      </motion.div>
                    ) : (
                      <Circle className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${item.completed ? 'text-gray-300 line-through' : 'text-white'}`}>
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  {item.achievementType && item.completed && (
                    <div className="text-2xl">
                      {ACHIEVEMENT_DEFINITIONS[item.achievementType]?.icon}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OnboardingProgressTracker;
