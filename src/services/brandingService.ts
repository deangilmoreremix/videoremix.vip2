import { supabase } from "../utils/supabaseClient";

export class BrandingService {
  static async getUserProjects() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("branding_projects")
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
      .from("branding_projects")
      .select("*")
      .eq("user_id", user.id)
      .eq("app_slug", appSlug)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createProject(appSlug: string, projectName: string, brandData?: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("branding_projects")
      .insert({
        user_id: user.id,
        app_slug: appSlug,
        project_name: projectName,
        brand_name: brandData?.brandName || "",
        brand_description: brandData?.description || "",
        status: "draft",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProject(id: string, updates: any) {
    const { data, error } = await supabase
      .from("branding_projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteProject(id: string) {
    const { error } = await supabase
      .from("branding_projects")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  static async generateBrandAssets(projectId: string) {
    await this.updateProject(projectId, { status: "in_progress" });

    try {
      const project = await this.getProjectById(projectId);
      
      // Call AI branding API here
      // For now, simulate with placeholder
      const outputUrls = [
        `https://via.placeholder.com/512x512?text=Logo+${project.brand_name}`,
        `https://via.placeholder.com/1920x1080?text=Branding+${project.brand_name}`,
      ];

      await this.updateProject(projectId, {
        status: "completed",
        output_urls: outputUrls,
        guidelines: { colors: ["#000", "#fff"], fonts: ["Arial"] },
      });

      return outputUrls;
    } catch (error: any) {
      await this.updateProject(projectId, { status: "failed" });
      throw error;
    }
  }

  private static async getProjectById(id: string) {
    const { data, error } = await supabase
      .from("branding_projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }
}
