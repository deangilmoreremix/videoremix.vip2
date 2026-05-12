import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Lock, ExternalLink, ShoppingCart, User, Video, Compass } from 'lucide-react';
import { appCategories } from '../../data/appCategories';
import { appsData } from '../../data/appsData';
import LazyIcon from '../LazyIcon';
import { useUserAccess } from '../../hooks/useUserAccess';
import { useAuth } from '../../context/AuthContext';
import { useAchievements } from '../../hooks/useAchievements';

interface ToolkitStepProps {
  selectedCategories: string[];
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

const ToolkitStep: React.FC<ToolkitStepProps> = ({
  selectedCategories,
  onComplete,
  onBack,
}) => {
  const { user } = useAuth();
  const { achievements } = useAchievements();
  const { hasAccessToApp, purchasedApps } = useUserAccess();

  const hasAnyPurchases = purchasedApps.length > 0;

  const recommendedApps = useMemo(() => {
    if (!selectedCategories.length) return [];
    
    return appsData.filter(app => {
      // Check if app.category is in selectedCategories
      // App may have businessCategory array or single category string
      const appCats = (app as any).businessCategory || [];
      const singleCat = app.category || '';
      
      // Check if any of app's categories match selected ones
      if (appCats.length > 0) {
        return appCats.some((cat: string) => selectedCategories.includes(cat));
      }
      return selectedCategories.includes(singleCat);
    }).slice(0, 12);
  }, [selectedCategories]);

  const categories = useMemo(() => 
    appCategories.filter(cat => selectedCategories.includes(cat.id)),
    [selectedCategories]
  );

  const setupTasks = useMemo((): SetupTask[] => [
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add your details and preferences',
      icon: <User className="h-4 w-4" />,
      completed: achievements.some(a => a.achievement_type === 'profile_completed'),
      action: () => { window.location.href = '/dashboard#profile'; },
      actionLabel: 'Edit Profile',
    },
    {
      id: 'purchase',
      title: 'Get Your First App',
      description: 'Explore and purchase your first tool',
      icon: <ShoppingCart className="h-4 w-4" />,
      completed: hasAnyPurchases,
      action: () => { window.location.href = '/#tools'; },
      actionLabel: 'Browse Apps',
    },
    {
      id: 'video',
      title: 'Create Your First Video',
      description: 'Start creating personalized content',
      icon: <Video className="h-4 w-4" />,
      completed: achievements.some(a => a.achievement_type === 'video_creator'),
      action: () => { window.location.href = '/dashboard#create'; },
      actionLabel: 'Create Video',
    },
    {
      id: 'explore',
      title: 'Explore Multiple Apps',
      description: 'Try out different tools',
      icon: <Compass className="h-4 w-4" />,
      completed: achievements.some(a => a.achievement_type === 'power_user'),
      action: () => { window.location.href = '/#tools'; },
      actionLabel: 'Explore',
    },
  ], [achievements, hasAnyPurchases]);

  const completedTasks = setupTasks.filter(t => t.completed).length;
  const totalTasks = setupTasks.length;

  const handleOpenApp = useCallback((appId: string) => {
    if (!appId) {
      console.error('Invalid app ID');
      return;
    }
    try {
      window.open(`/app/${appId}`, '_blank');
    } catch (error) {
      console.error('Failed to open app:', error);
    }
  }, []);

  const handlePurchaseApp = useCallback(() => {
    try {
      window.location.href = '/#pricing';
    } catch (error) {
      console.error('Failed to navigate to pricing:', error);
    }
  }, []);

  const handleComplete = useCallback(() => {
    if (!user) {
      console.error('No user found');
      return;
    }
    onComplete();
  }, [user, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Your Personalized Toolkit
        </h2>
        <p className="text-gray-400">
          Based on your selections, here are your handpicked tools
        </p>
      </div>

      {categories.map(category => {
        const categoryApps = recommendedApps.filter(app => {
          const appCats = (app as any).businessCategory || [];
          const singleCat = app.category || '';
          if (appCats.length > 0) {
            return appCats.includes(category.id);
          }
          return singleCat === category.id;
        });
        
        if (categoryApps.length === 0) return null;
        
        return (
          <div key={category.id} className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <LazyIcon name={category.id} className="h-5 w-5 text-[#cc785c]" />
              {category.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryApps.map(app => {
                const isOwned = hasAccessToApp(app.id);
                return (
                  <motion.div
                    key={app.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      rounded-xl p-4 border-2 transition-all relative
                      ${isOwned
                        ? 'bg-[#cc785c]/10 border-[#cc785c]/50'
                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                      }
                    `}
                  >
                    {isOwned && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-600/20 text-green-400 px-2 py-1 rounded-full text-xs font-semibold">
                        <CheckCircle2 className="h-3 w-3" />
                        Owned
                      </div>
                    )}
                    {!isOwned && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-gray-600/20 text-gray-400 px-2 py-1 rounded-full text-xs font-semibold">
                        <Lock className="h-3 w-3" />
                        Locked
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`
                        p-2 rounded-lg
                        ${isOwned ? 'bg-[#cc785c]/20' : 'bg-gray-700'}
                      `}>
                        {app.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white mb-1">
                          {app.name}
                        </h4>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {app.description}
                        </p>
                      </div>
                    </div>

                    {isOwned ? (
                      <button
                        onClick={() => handleOpenApp(app.id)}
                        className="w-full px-4 py-2 bg-[#cc785c] hover:bg-[#cc785c]/80 text-white text-sm rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open App
                      </button>
                    ) : (
                      <button
                        onClick={handlePurchaseApp}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Purchase
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Getting Started Checklist */}
      <div className="bg-gray-800/30 rounded-xl p-5 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Getting Started</h3>
          <span className="text-sm text-gray-400">
            {completedTasks}/{totalTasks} completed
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
          <div 
            className="bg-[#cc785c] h-2 rounded-full transition-all duration-500"
            style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
          />
        </div>
        <div className="space-y-2">
          {setupTasks.map(task => (
            <div
              key={task.id}
              className={`
                flex items-center gap-3 p-3 rounded-lg
                ${task.completed ? 'bg-green-900/20' : 'bg-gray-800/50'}
              `}
            >
              <div className={`
                p-2 rounded-lg flex-shrink-0
                ${task.completed ? 'bg-green-600' : 'bg-gray-700'}
              `}>
                {task.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white">
                  {task.title}
                </h4>
                <p className="text-xs text-gray-400 truncate">
                  {task.description}
                </p>
              </div>
              {task.completed ? (
                <span className="text-green-400 text-xs font-semibold flex-shrink-0">✓ Done</span>
              ) : (
                <button
                  onClick={task.action}
                  className="px-3 py-1.5 bg-[#cc785c] hover:bg-[#cc785c]/80 text-white text-xs rounded-lg transition-all flex-shrink-0"
                >
                  {task.actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 text-white transition-all"
        >
          ← Back
        </button>
        <button
          onClick={handleComplete}
          className="px-6 py-3 rounded-lg font-semibold bg-[#cc785c] hover:bg-[#cc785c]/80 text-white transition-all"
        >
          Complete Onboarding
        </button>
      </div>
    </motion.div>
  );
};

export default React.memo(ToolkitStep);
