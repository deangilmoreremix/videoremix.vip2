import { useState, useEffect, useCallback } from "react";
import { VideoService } from "../services/videoService";
import { useUser } from "../providers/ClerkProvider";
import type {
  Video,
  VideoUploadData,
  VideoUpdateData,
} from "../utils/supabaseTypes";

export const useVideos = () => {
  const { user: clerkUser } = useUser();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!clerkUser?.id) {
        setVideos([]);
        return;
      }
      const data = await VideoService.getUserVideos(clerkUser.id);
      setVideos(data);
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [clerkUser?.id]);

  const uploadVideo = useCallback(
    async (uploadData: VideoUploadData): Promise<Video> => {
      try {
        setError(null);
        if (!clerkUser?.id) {
          throw new Error("User not authenticated");
        }
        const newVideo = await VideoService.uploadVideo(clerkUser.id, uploadData);
        // Add to local state
        setVideos((prev) => [newVideo, ...prev]);
        return newVideo;
      } catch (err) {
        console.error("Error uploading video:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Upload failed";
        setError(errorMessage);
        throw err;
      }
    },
    [clerkUser?.id],
  );

  const updateVideo = useCallback(
    async (id: string, updates: VideoUpdateData): Promise<Video> => {
      try {
        setError(null);
        if (!clerkUser?.id) {
          throw new Error("User not authenticated");
        }
        const updatedVideo = await VideoService.updateVideo(id, clerkUser.id, updates);
        // Update local state
        setVideos((prev) =>
          prev.map((video) => (video.id === id ? updatedVideo : video)),
        );
        return updatedVideo;
      } catch (err) {
        console.error("Error updating video:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Update failed";
        setError(errorMessage);
        throw err;
      }
    },
    [clerkUser?.id],
  );

  const deleteVideo = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      if (!clerkUser?.id) {
        throw new Error("User not authenticated");
      }
      await VideoService.deleteVideo(id, clerkUser.id);
      // Remove from local state
      setVideos((prev) => prev.filter((video) => video.id !== id));
    } catch (err) {
      console.error("Error deleting video:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Delete failed";
      setError(errorMessage);
      throw err;
    }
  }, [clerkUser?.id]);

  const getVideoById = useCallback(
    async (id: string): Promise<Video | null> => {
      try {
        setError(null);
        if (!clerkUser?.id) {
          return null;
        }
        return await VideoService.getVideoById(id, clerkUser.id);
      } catch (err) {
        console.error("Error fetching video:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Fetch failed";
        setError(errorMessage);
        throw err;
      }
    },
    [clerkUser?.id],
  );

  const getVideoUrl = useCallback((filePath: string): string => {
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
    uploadVideo,
    updateVideo,
    deleteVideo,
    getVideoById,
    getVideoUrl,
    getThumbnailUrl,
    refetch: fetchVideos,
  };
};
