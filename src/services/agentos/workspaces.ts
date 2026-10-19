// src/services/agentos/workspaces.ts
//
// Workspace and team management.
//
// The database auto-adds the creator as the owner of a new workspace
// (trigger agentos.add_owner_membership in 20261012120000_agentos_core.sql), so
// this service never inserts the membership row itself — a member invite is a
// separate, explicit action by the workspace owner.

import { agentosDb, agentosErrorMessage } from "./client";
import {
  err,
  ok,
  type AgentOSResult,
  type Workspace,
  type WorkspaceMember,
  type WorkspacePolicies,
  type WorkspaceRole,
} from "../../types/agentos";

const COLUMNS = "*";

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  goals?: string;
  instructions?: string;
  policies?: WorkspacePolicies;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
  goals?: string;
  instructions?: string;
  policies?: WorkspacePolicies;
  settings?: Record<string, unknown>;
}

export async function listWorkspaces(options: {
  includeArchived?: boolean;
} = {}): Promise<AgentOSResult<Workspace[]>> {
  let query = agentosDb.from("workspaces").select(COLUMNS);
  if (!options.includeArchived) query = query.is("archived_at", null);
  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) return err("database", "Could not load workspaces", agentosErrorMessage(error));
  return ok((data ?? []) as Workspace[]);
}

export async function getWorkspace(workspaceId: string): Promise<AgentOSResult<Workspace>> {
  if (!workspaceId) return err("validation", "workspaceId is required");

  const { data, error } = await agentosDb
    .from("workspaces")
    .select(COLUMNS)
    .eq("id", workspaceId)
    .maybeSingle();

  if (error) return err("database", "Could not load workspace", agentosErrorMessage(error));
  if (!data) return err("not_found", "Workspace not found");
  return ok(data as Workspace);
}

export async function createWorkspace(input: CreateWorkspaceInput): Promise<AgentOSResult<Workspace>> {
  if (!input.name || !input.name.trim()) {
    return err("validation", "Give the workspace a name");
  }

  const { data, error } = await agentosDb
    .from("workspaces")
    .insert({
      name: input.name.trim(),
      description: input.description ?? "",
      goals: input.goals ?? "",
      instructions: input.instructions ?? "",
      policies: input.policies ?? {},
    })
    .select(COLUMNS)
    .single();

  if (error) return err("database", "Could not create workspace", agentosErrorMessage(error));
  return ok(data as Workspace);
}

export async function updateWorkspace(
  workspaceId: string,
  input: UpdateWorkspaceInput,
): Promise<AgentOSResult<Workspace>> {
  if (!workspaceId) return err("validation", "workspaceId is required");
  if (input.name !== undefined && input.name.trim().length === 0) {
    return err("validation", "Give the workspace a name");
  }

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.description !== undefined) patch.description = input.description;
  if (input.goals !== undefined) patch.goals = input.goals;
  if (input.instructions !== undefined) patch.instructions = input.instructions;
  if (input.policies !== undefined) patch.policies = input.policies;
  if (input.settings !== undefined) patch.settings = input.settings;

  const { data, error } = await agentosDb
    .from("workspaces")
    .update(patch)
    .eq("id", workspaceId)
    .select(COLUMNS)
    .single();

  if (error) return err("database", "Could not update workspace", agentosErrorMessage(error));
  return ok(data as Workspace);
}

/**
 * Archive a workspace. Archived workspaces are hidden from the default list and
 * treated as read-only by the UI.
 */
export async function archiveWorkspace(workspaceId: string): Promise<AgentOSResult<Workspace>> {
  if (!workspaceId) return err("validation", "workspaceId is required");

  const { data, error } = await agentosDb
    .from("workspaces")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", workspaceId)
    .select(COLUMNS)
    .single();

  if (error) return err("database", "Could not archive workspace", agentosErrorMessage(error));
  return ok(data as Workspace);
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

export async function listWorkspaceMembers(
  workspaceId: string,
): Promise<AgentOSResult<WorkspaceMember[]>> {
  if (!workspaceId) return err("validation", "workspaceId is required");

  const { data, error } = await agentosDb
    .from("workspace_members")
    .select(COLUMNS)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) return err("database", "Could not load workspace members", agentosErrorMessage(error));
  return ok((data ?? []) as WorkspaceMember[]);
}

/**
 * Invite a member by Clerk user id. Clerk ids are the only identity primitive
 * this platform owns; inviting by email would require a directory lookup this
 * port deliberately does not add.
 */
export async function inviteMember(params: {
  workspaceId: string;
  memberClerkId: string;
  role?: Exclude<WorkspaceRole, "owner">;
}): Promise<AgentOSResult<WorkspaceMember>> {
  if (!params.workspaceId) return err("validation", "workspaceId is required");
  if (!params.memberClerkId || !params.memberClerkId.trim()) {
    return err("validation", "Enter the member's Clerk user id");
  }

  // Refuse to add a second owner: the DB creates one, and a workspace has one.
  const { data: existing } = await agentosDb
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", params.workspaceId)
    .eq("member_clerk_id", params.memberClerkId.trim())
    .maybeSingle();

  if (existing) {
    return err("conflict", "That member is already in this workspace");
  }

  const { data, error } = await agentosDb
    .from("workspace_members")
    .insert({
      workspace_id: params.workspaceId,
      member_clerk_id: params.memberClerkId.trim(),
      role: params.role ?? "member",
    })
    .select(COLUMNS)
    .single();

  if (error) return err("database", "Could not add workspace member", agentosErrorMessage(error));
  return ok(data as WorkspaceMember);
}

/** Change a member's role. The owner's role is immutable. */
export async function updateMemberRole(params: {
  workspaceId: string;
  memberClerkId: string;
  role: Exclude<WorkspaceRole, "owner">;
}): Promise<AgentOSResult<WorkspaceMember>> {
  if (!params.workspaceId || !params.memberClerkId) {
    return err("validation", "workspaceId and memberClerkId are required");
  }

  const { data: current, error: loadError } = await agentosDb
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", params.workspaceId)
    .eq("member_clerk_id", params.memberClerkId)
    .maybeSingle();

  if (loadError) return err("database", "Could not load member", agentosErrorMessage(loadError));
  if (!current) return err("not_found", "Member not found");
  if (current.role === "owner") {
    return err("conflict", "The workspace owner role cannot be changed");
  }

  const { data, error } = await agentosDb
    .from("workspace_members")
    .update({ role: params.role })
    .eq("workspace_id", params.workspaceId)
    .eq("member_clerk_id", params.memberClerkId)
    .select(COLUMNS)
    .single();

  if (error) return err("database", "Could not update member role", agentosErrorMessage(error));
  return ok(data as WorkspaceMember);
}

/** Remove a member. The owner cannot be removed. */
export async function removeMember(params: {
  workspaceId: string;
  memberClerkId: string;
}): Promise<AgentOSResult<{ workspace_id: string; member_clerk_id: string }>> {
  if (!params.workspaceId || !params.memberClerkId) {
    return err("validation", "workspaceId and memberClerkId are required");
  }

  const { data: current, error: loadError } = await agentosDb
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", params.workspaceId)
    .eq("member_clerk_id", params.memberClerkId)
    .maybeSingle();

  if (loadError) return err("database", "Could not load member", agentosErrorMessage(loadError));
  if (!current) return err("not_found", "Member not found");
  if (current.role === "owner") {
    return err("conflict", "The workspace owner cannot be removed");
  }

  const { error } = await agentosDb
    .from("workspace_members")
    .delete()
    .eq("workspace_id", params.workspaceId)
    .eq("member_clerk_id", params.memberClerkId);

  if (error) return err("database", "Could not remove workspace member", agentosErrorMessage(error));
  return ok({ workspace_id: params.workspaceId, member_clerk_id: params.memberClerkId });
}
