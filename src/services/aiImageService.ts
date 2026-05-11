import { supabase } from "../utils/supabaseClient";

export class AiImageService {
  static async getUserImages() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("ai_image_projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getImagesByAppId(appSlug: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("ai_image_projects")
      .select("*")
      .eq("user_id", user.id)
      .eq("app_slug", appSlug)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createProject(appSlug: string, projectName: string, inputImageUrl?: string, generationType?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("ai_image_projects")
      .insert({
        user_id: user.id,
        app_slug: appSlug,
        project_name: projectName,
        input_image_url: inputImageUrl,
        generation_type: generationType,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProject(id: string, updates: any) {
    const { data, error } = await supabase
      .from("ai_image_projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteProject(id: string) {
    const { error } = await supabase
      .from("ai_image_projects")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  static async generateImage(projectId: string, prompt: string, appSlug: string) {
    // Update status to processing
    await this.updateProject(projectId, { status: "processing", settings: { prompt } });

    try {
      // Call AI image generation API (OpenAI DALL-E, Stable Diffusion, etc.)
      // For now, simulate with a placeholder
      const outputUrl = `https://via.placeholder.com/512x512?text=${encodeURIComponent(prompt)}`;

      await this.updateProject(projectId, {
        status: "completed",
        output_image_url: outputUrl,
        settings: { prompt, completed_at: new Date().toISOString() },
      });

      return outputUrl;
    } catch (error: any) {
      await this.updateProject(projectId, { status: "failed" });
      throw error;
    }
  }
}
