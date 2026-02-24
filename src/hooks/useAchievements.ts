import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabaseClient";

export interface Achievement {
  id: string;
  achievement_type: string;
  earned_at: string;
  metadata: Record<string, any>;
}

export interface AchievementDefinition {
  type: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export const ACHIEVEMENT_DEFINITIONS: Record<string, AchievementDefinition> = {
  profile_completed: {
    type: "profile_completed",
    title: "Profile Master",
    description: "Completed your profile",
    icon: "👤",
    color: "from-blue-500 to-blue-600",
  },
  first_purchase: {
    type: "first_purchase",
    title: "First Steps",
    description: "Made your first purchase",
    icon: "🎉",
    color: "from-green-500 to-green-600",
  },
  video_creator: {
    type: "video_creator",
    title: "Video Creator",
    description: "Created your first video",
    icon: "🎬",
    color: "from-purple-500 to-purple-600",
  },
  power_user: {
    type: "power_user",
    title: "Power User",
    description: "Accessed 5 different apps",
    icon: "⚡",
    color: "from-yellow-500 to-yellow-600",
  },
  early_adopter: {
    type: "early_adopter",
    title: "Early Adopter",
    description: "Joined in the early days",
    icon: "🚀",
    color: "from-pink-500 to-pink-600",
  },
  content_master: {
    type: "content_master",
    title: "Content Master",
    description: "Created 10 videos",
    icon: "🏆",
    color: "from-orange-500 to-orange-600",
  },
};

export const useAchievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressPercentage, setProgressPercentage] = useState(0);

  useEffect(() => {
    if (!user) {
      setAchievements([]);
      setProgressPercentage(0);
      setLoading(false);
      return;
    }

    fetchAchievements();
    fetchProgressPercentage();
  }, [user]);

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching achievements:", fetchError);
        setError(fetchError.message);
        return;
      }

      setAchievements(data || []);
    } catch (err) {
      console.error("Error in fetchAchievements:", err);
      setError("Failed to load achievements");
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressPercentage = async () => {
    if (!user) return;

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "get_user_progress_percentage",
        {
          p_user_id: user.id,
        },
      );

      if (rpcError) {
        console.error("Error fetching progress:", rpcError);
        return;
      }

      setProgressPercentage(data || 0);
    } catch (err) {
      console.error("Error in fetchProgressPercentage:", err);
    }
  };

  const awardAchievement = async (
    achievementType: string,
    metadata: Record<string, any> = {},
  ) => {
    if (!user) return null;

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "award_achievement",
        {
          p_user_id: user.id,
          p_achievement_type: achievementType,
          p_metadata: metadata,
        },
      );

      if (rpcError) {
        console.error("Error awarding achievement:", rpcError);
        return null;
      }

      if (data) {
        await fetchAchievements();
        await fetchProgressPercentage();
      }

      return data;
    } catch (err) {
      console.error("Error in awardAchievement:", err);
      return null;
    }
  };

  const hasAchievement = (achievementType: string): boolean => {
    return achievements.some((a) => a.achievement_type === achievementType);
  };

  const getAchievementsByType = (
    achievementType: string,
  ): Achievement | null => {
    return (
      achievements.find((a) => a.achievement_type === achievementType) || null
    );
  };

  const getRecentAchievements = (limit: number = 3): Achievement[] => {
    return achievements.slice(0, limit);
  };

  const getTotalAchievements = (): number => {
    return achievements.length;
  };

  const getPossibleAchievements = (): number => {
    return Object.keys(ACHIEVEMENT_DEFINITIONS).length;
  };

  const getCompletionPercentage = (): number => {
    const possible = getPossibleAchievements();
    if (possible === 0) return 0;
    return Math.round((getTotalAchievements() / possible) * 100);
  };

  return {
    achievements,
    loading,
    error,
    progressPercentage,
    awardAchievement,
    hasAchievement,
    getAchievementsByType,
    getRecentAchievements,
    getTotalAchievements,
    getPossibleAchievements,
    getCompletionPercentage,
    refetch: fetchAchievements,
  };
};
