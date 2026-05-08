import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  ShoppingCart, 
  Video, 
  Compass, 
  Settings 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAchievements } from '../../hooks/useAchievements';
import { useUserAccess } from '../../hooks/useUserAccess';

interface GuidedSetupStepProps {
  onComplete: () => void;
  onBack: () => void;
}

interface SetupTask {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action: () => void;
  actionLabel: string;
}

const GuidedSetupStep: React.FC<GuidedSetupStepProps> = ({
  onComplete,
  onBack,
}) => {
  const { user } = useAuth();
  const { achievements } = useAchievements();
  const { accessData } = useUserAccess();

  const hasAnyPurchases = (accessData?.apps.length || 0) > 0;

  const tasks = useMemo((): SetupTask[] => [
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add your details and preferences',
      icon: <User className="h-5 w-5" />,
      completed: achievements.some(a => a.achievement_type === 'profile_completed'),
      action: () => {
        window.location.href = '/dashboard#profile';
      },
      actionLabel: 'Edit Profile',
    },
    {
      id: 'purchase',
      title: 'Get Your First App',
      description: 'Explore and purchase your first tool',
      icon: <ShoppingCart className="h-5 w-5" />,
      completed: hasAnyPurchases,
      action: () => {
        window.location.href = '/#tools';
      },
      actionLabel: 'Browse Apps',
    },
    {
      id: 'video',
      title: 'Create Your First Video',
      description: 'Start creating personalized content',
      icon: <Video className="h-5 w-5" />,
      completed: achievements.some(a => a.achievement_type === 'video_creator'),
      action: () => {
        window.location.href = '/dashboard#create';
      },
      actionLabel: 'Create Video',
    },
    {
      id: 'explore',
      title: 'Explore Multiple Apps',
      description: 'Try out 5 different tools',
      icon: <Compass className="h-5 w-5" />,
      completed: achievements.some(a => a.achievement_type === 'power_user'),
      action: () => {
        window.location.href = '/#tools';
      },
      actionLabel: 'Explore',
    },
    {
      id: 'preferences',
      title: 'Customize Your Dashboard',
      description: 'Set your theme and layout preferences',
      icon: <Settings className="h-5 w-5" />,
      completed: false,
      action: () => {
        window.location.href = '/dashboard#preferences';
      },
      actionLabel: 'Customize',
    },
  ], [achievements, hasAnyPurchases]);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Guided Setup
        </h2>
        <p className="text-gray-400">
          Complete these tasks to get the most out of your experience.
        </p>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Progress</span>
          <span className="text-sm text-white font-semibold">
            {completedCount} / {totalCount}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map(task => (
          <div
            key={task.id}
            className={`
              flex items-center gap-4 p-4 rounded-lg border
              ${task.completed 
                ? 'bg-green-900/20 border-green-700' 
                : 'bg-gray-800/50 border-gray-700'
              }
            `}
          >
            <div className={`
              p-2 rounded-lg
              ${task.completed ? 'bg-green-600' : 'bg-gray-700'}
            `}>
              {task.icon}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white">
                {task.title}
              </h4>
              <p className="text-xs text-gray-400">
                {task.description}
              </p>
            </div>
            {task.completed ? (
              <span className="text-green-400 text-sm font-semibold">✓ Done</span>
            ) : (
              <button
                onClick={task.action}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all"
              >
                {task.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 text-white transition-all"
        >
          ← Back
        </button>
        <button
          onClick={onComplete}
          className="px-6 py-3 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition-all"
        >
          Complete Onboarding
        </button>
      </div>
    </motion.div>
  );
};

export default React.memo(GuidedSetupStep);