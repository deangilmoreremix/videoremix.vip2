import { useState, useEffect, useCallback } from "react";
import { VideoService } from "../services/videoService";
import type { Video } from "../utils/supabaseClient";

interface UseHomepageVideosOptions {
  autoFetch?: boolean;
  featured?: boolean;
}

export const useHomepageVideos = (options: UseHomepageVideosOptions = {}) => {
  const { autoFetch = true, featured = false } = options;

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data: Video[];
      if (featured) {
        data = await VideoService.getFeaturedVideos();
      } else {
        data = await VideoService.getHomepageVideos();
      }

      setVideos(data);
    } catch (err) {
      console.error("Error fetching homepage videos:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [featured]);

  const getVideoUrl = useCallback(async (filePath: string): Promise<string> => {
    return VideoService.getVideoUrl(filePath);
  }, []);

  const getThumbnailUrl = useCallback((thumbnailPath: string): string => {
    return VideoService.getThumbnailUrl(thumbnailPath);
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchVideos();
    }
  }, [autoFetch, fetchVideos]);

  return {
    videos,
    loading,
    error,
    refetch: fetchVideos,
    getVideoUrl,
    getThumbnailUrl,
  };
};

export const usePublicVideos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await VideoService.getPublicVideos();
      setVideos(data);
    } catch (err) {
      console.error("Error fetching public videos:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const getVideoUrl = useCallback(async (filePath: string): Promise<string> => {
    return VideoService.getVideoUrl(filePath);
  }, []);

  const getThumbnailUrl = useCallback((thumbnailPath: string): string => {
    return VideoService.getThumbnailUrl(thumbnailPath);
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return {
    videos,
    loading,
    error,
    refetch: fetchVideos,
    getVideoUrl,
    getThumbnailUrl,
  };
};
