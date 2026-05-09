import { supabase } from "../utils/supabaseClient";
import type {
  Video,
  VideoUploadData,
  VideoUpdateData,
} from "../utils/supabaseClient";

export class VideoService {
  /**
   * Get all videos for the current user
   */
  static async getUserVideos(): Promise<Video[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching videos:", error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get a specific video by ID
   */
  static async getVideoById(id: string): Promise<Video | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      console.error("Error fetching video:", error);
      throw error;
    }

    return data;
  }

  /**
   * Create a new video record (called after upload)
   */
  static async createVideo(videoData: {
    title?: string;
    description?: string;
    original_filename: string;
    file_path: string;
    file_size: number;
    mime_type: string;
  }): Promise<Video> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("videos")
      .insert({
        user_id: user.id,
        ...videoData,
        status: "uploaded",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating video:", error);
      throw error;
    }

    return data;
  }

  /**
   * Update video metadata
   */
  static async updateVideo(
    id: string,
    updates: VideoUpdateData,
  ): Promise<Video> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("videos")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating video:", error);
      throw error;
    }

    return data;
  }

  /**
   * Delete a video
   */
  static async deleteVideo(id: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // First get the video to get file paths
    const video = await this.getVideoById(id);
    if (!video) throw new Error("Video not found");

    // Delete from storage
    if (video.file_path) {
      await supabase.storage.from("videos").remove([video.file_path]);
    }
    if (video.thumbnail_path) {
      await supabase.storage.from("thumbnails").remove([video.thumbnail_path]);
    }

    // Delete from database
    const { error } = await supabase
      .from("videos")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting video:", error);
      throw error;
    }
  }

  /**
   * Upload a video file and create video record
   */
  static async uploadVideo(uploadData: VideoUploadData): Promise<Video> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { file, title, description } = uploadData;

    // Generate unique file path
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      throw uploadError;
    }

    // Create video record
    const video = await this.createVideo({
      title: title || file.name,
      description,
      original_filename: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
    });

    // Start processing (thumbnail generation)
    try {
      await this.processVideo(video.id);
    } catch (error) {
      console.error("Error starting video processing:", error);
      // Don't throw here, video is created successfully
    }

    return video;
  }

  /**
   * Start video processing (thumbnail generation)
   */
  static async processVideo(videoId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke("video-processor", {
      body: { videoId, thumbnailTimestamp: 1 },
    });

    if (error) {
      console.error("Error invoking video processor:", error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || "Video processing failed");
    }
  }

  /**
   * Get public URL for video file
   */
  static getVideoUrl(filePath: string): string {
    const { data } = supabase.storage.from("videos").getPublicUrl(filePath);
    return data.publicUrl;
  }

  /**
   * Get public URL for thumbnail
   */
  static getThumbnailUrl(thumbnailPath: string): string {
    const { data } = supabase.storage
      .from("thumbnails")
      .getPublicUrl(thumbnailPath);
    return data.publicUrl;
  }

  /**
   * Get all public videos
   */
  static async getPublicVideos(): Promise<Video[]> {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("is_public", true)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching public videos:", error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get videos for homepage display
   */
  static async getHomepageVideos(): Promise<Video[]> {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("is_public", true)
      .eq("display_on_homepage", true)
      .eq("status", "completed")
      .order("homepage_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching homepage videos:", error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get featured videos
   */
  static async getFeaturedVideos(): Promise<Video[]> {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("is_public", true)
      .eq("is_featured", true)
      .eq("status", "completed")
      .order("homepage_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching featured videos:", error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get a public video by ID (no authentication required)
   */
  static async getPublicVideoById(id: string): Promise<Video | null> {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("is_public", true)
      .maybeSingle();

    if (error) {
      console.error("Error fetching public video:", error);
      throw error;
    }

    return data;
  }
}
