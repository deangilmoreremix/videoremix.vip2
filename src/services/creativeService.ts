import { supabase } from "../utils/supabaseClient";

export class CreativeService {
  static async getUserProjects() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("creative_projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getProjectsByAppId(appSlug: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("creative_projects")
      .select("*")
      .eq("user_id", user.id)
      .eq("app_slug", appSlug)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createProject(appSlug: string, projectName: string, projectType: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("creative_projects")
      .insert({
        user_id: user.id,
        app_slug: appSlug,
        project_name: projectName,
        project_type: projectType,
        status: "draft",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProject(id: string, updates: any) {
    const { data, error } = await supabase
      .from("creative_projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteProject(id: string) {
    const { error } = await supabase
      .from("creative_projects")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  static async generateContent(projectId: string, prompt: string) {
    await this.updateProject(projectId, { status: "processing", input_data: { prompt } });

    try {
      // Call appropriate API based on project type
      const outputUrl = `https://via.placeholder.com/800x600?text=${encodeURIComponent(prompt)}`;

      await this.updateProject(projectId, {
        status: "completed",
        output_data: { prompt, completed_at: new Date().toISOString() },
        output_urls: [outputUrl],
      });

      return outputUrl;
    } catch (error: any) {
      await this.updateProject(projectId, { status: "failed" });
      throw error;
    }
  }
}
