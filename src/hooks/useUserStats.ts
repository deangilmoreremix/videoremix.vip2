import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabaseClient";

interface UserStats {
  purchasedAppsCount: number;
  videosCreated: number;
  activeDays: number;
}

export const useUserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    purchasedAppsCount: 0,
    videosCreated: 0,
    activeDays: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) {
        setStats({
          purchasedAppsCount: 0,
          videosCreated: 0,
          activeDays: 0,
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [appsResult, videosResult] = await Promise.all([
          supabase
            .from("user_app_access")
            .select("app_slug", { count: "exact", head: false })
            .eq("user_id", user.id)
            .eq("has_access", true),
          supabase
            .from("videos")
            .select("id", { count: "exact", head: false })
            .eq("user_id", user.id),
        ]);

        const purchasedAppsCount = appsResult.data?.length || 0;
        const videosCreated = videosResult.data?.length || 0;

        const accountAge = user.created_at
          ? Math.floor(
              (Date.now() - new Date(user.created_at).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0;
        const activeDays = Math.max(1, accountAge);

        setStats({
          purchasedAppsCount,
          videosCreated,
          activeDays,
        });
      } catch (err: any) {
        console.error("Error fetching user stats:", err);
        setError(err.message || "Failed to load user statistics");
        setStats({
          purchasedAppsCount: 0,
          videosCreated: 0,
          activeDays: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user]);

  return {
    stats,
    loading,
    error,
  };
};
