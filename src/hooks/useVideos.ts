import { useState, useEffect, useCallback } from 'react';
import { VideoService } from '../services/videoService';
import type { Video, VideoUploadData, VideoUpdateData } from '../utils/supabaseClient';

export const useVideos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await VideoService.getUserVideos();
      setVideos(data);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadVideo = useCallback(async (uploadData: VideoUploadData): Promise<Video> => {
    try {
      setError(null);
      const newVideo = await VideoService.uploadVideo(uploadData);
      // Add to local state
      setVideos(prev => [newVideo, ...prev]);
      return newVideo;
    } catch (err) {
      console.error('Error uploading video:', err);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateVideo = useCallback(async (id: string, updates: VideoUpdateData): Promise<Video> => {
    try {
      setError(null);
      const updatedVideo = await VideoService.updateVideo(id, updates);
      // Update local state
      setVideos(prev => prev.map(video =>
        video.id === id ? updatedVideo : video
      ));
      return updatedVideo;
    } catch (err) {
      console.error('Error updating video:', err);
      const errorMessage = err instanceof Error ? err.message : 'Update failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteVideo = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await VideoService.deleteVideo(id);
      // Remove from local state
      setVideos(prev => prev.filter(video => video.id !== id));
    } catch (err) {
      console.error('Error deleting video:', err);
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const getVideoById = useCallback(async (id: string): Promise<Video | null> => {
    try {
      setError(null);
      return await VideoService.getVideoById(id);
    } catch (err) {
      console.error('Error fetching video:', err);
      const errorMessage = err instanceof Error ? err.message : 'Fetch failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

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
    refetch: fetchVideos
  };
};