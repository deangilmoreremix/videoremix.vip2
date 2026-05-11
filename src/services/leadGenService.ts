import { supabase } from "../utils/supabaseClient";

export class LeadGenService {
  static async getUserProjects() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("leadgen_projects")
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
      .from("leadgen_projects")
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
      .from("leadgen_projects")
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
      .from("leadgen_projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteProject(id: string) {
    const { error } = await supabase
      .from("leadgen_projects")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  static async generateContent(projectId: string, inputData: any) {
    await this.updateProject(projectId, { status: "processing", input_data: inputData });

    try {
      // Generate landing page, CRM data, etc. based on project type
      const result = {
        published_url: `https://example.com/landing/${projectId}`,
        analytics: { views: 0, leads: 0 },
      };

      await this.updateProject(projectId, {
        status: "published",
        output_data: result,
        published_url: result.published_url,
      });

      return result;
    } catch (error: any) {
      await this.updateProject(projectId, { status: "draft" });
      throw error;
    }
  }
}
