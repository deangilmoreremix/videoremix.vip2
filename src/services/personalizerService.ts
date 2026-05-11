import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../utils/supabaseClient';

export interface PersonalizationProject {
  id: string;
  user_id: string;
  app_id: string;
  mode: string;
  target_name: string;
  target_company?: string;
  manual_notes?: string;
  scan_results?: any;
  output_data?: any;
  status: string;
  created_at: string;
  updated_at: string;
}

export class PersonalizerService {
  static async getUserProjects(): Promise<PersonalizationProject[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('personalization_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getProjectById(id: string): Promise<PersonalizationProject | null> {
    const { data, error } = await supabase
      .from('personalization_projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  static async createProject(appId: string, mode: string, targetName: string, targetCompany?: string): Promise<PersonalizationProject> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('personalization_projects')
      .insert({
        user_id: user.id,
        app_id: appId,
        mode,
        target_name: targetName,
        target_company: targetCompany || null,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProject(id: string, updates: Partial<PersonalizationProject>): Promise<PersonalizationProject> {
    const { data, error } = await supabase
      .from('personalization_projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('personalization_projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async performScan(projectId: string, targetName: string, options?: any): Promise<any> {
    // Update status
    await this.updateProject(projectId, { status: 'scanning' });

    try {
      // Call scan API (maigret worker)
      // This is handled in the component currently
      // Just update status here
      await this.updateProject(projectId, { status: 'scan_complete' });
    } catch (error) {
      await this.updateProject(projectId, { status: 'scan_failed' });
      throw error;
    }
  }

  static async generateContent(projectId: string, inputData: any): Promise<any> {
    await this.updateProject(projectId, { status: 'generating' });

    try {
      // Generation logic - handled in component
      await this.updateProject(projectId, { status: 'completed' });
    } catch (error) {
      await this.updateProject(projectId, { status: 'generation_failed' });
      throw error;
    }
  }

  static async saveOutput(projectId: string, outputData: any): Promise<void> {
    await this.updateProject(projectId, {
      output_data: outputData,
      status: 'saved',
    });
  }
}
