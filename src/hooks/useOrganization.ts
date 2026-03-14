import { useState, useCallback } from "react";
import { supabase } from "../utils/supabaseClient";
import { useAuth, Organization } from "../context/AuthContext";

interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  is_active: boolean;
}

interface UseOrganizationReturn {
  members: OrganizationMember[];
  loadingMembers: boolean;
  fetchMembers: () => Promise<void>;
  fetchUserOrganizations: () => Promise<Organization[]>;
  createOrganization: (name: string) => Promise<{ org: Organization | null; error: string | null }>;
}

export function useOrganization(): UseOrganizationReturn {
  const { user, organization, switchOrganization } = useAuth();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!organization?.id) return;
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("is_active", true);

      if (!error && data) {
        setMembers(data as OrganizationMember[]);
      }
    } finally {
      setLoadingMembers(false);
    }
  }, [organization?.id]);

  const fetchUserOrganizations = useCallback(async (): Promise<Organization[]> => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("organizations")
      .select("*, organization_members!inner(user_id, is_active)")
      .eq("organization_members.user_id", user.id)
      .eq("organization_members.is_active", true)
      .eq("is_active", true);

    if (error || !data) return [];
    return data as Organization[];
  }, [user]);

  const createOrganization = useCallback(
    async (name: string): Promise<{ org: Organization | null; error: string | null }> => {
      if (!user) return { org: null, error: "Not authenticated" };

      const slug =
        name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") +
        "-" +
        user.id.substring(0, 8);

      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({ slug, name, owner_id: user.id, plan: "free" })
        .select()
        .maybeSingle();

      if (orgError || !orgData) {
        return { org: null, error: orgError?.message ?? "Failed to create organization" };
      }

      await supabase.from("organization_members").insert({
        organization_id: orgData.id,
        user_id: user.id,
        role: "owner",
      });

      await switchOrganization(orgData.id);
      return { org: orgData as Organization, error: null };
    },
    [user, switchOrganization]
  );

  return {
    members,
    loadingMembers,
    fetchMembers,
    fetchUserOrganizations,
    createOrganization,
  };
}
