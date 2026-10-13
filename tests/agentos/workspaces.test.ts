// tests/agentos/workspaces.test.ts
//
// Unit tests for src/services/agentos/workspaces.ts.
//
// These tests cover the tenant boundary that previously broke the harness:
// agentos.workspace_members has a composite primary key and NO owner_clerk_id
// column, so its access is derived from the parent workspace. The harness
// models that relationship, which is what lets these assertions hold.

import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  client: null as null | ReturnType<typeof import("./harness").createMockSupabase>,
};

vi.mock("../../src/utils/supabase", () => ({
  get supabase() {
    return state.client;
  },
}));

vi.mock("../../src/utils/supabaseClient", () => ({
  get supabase() {
    return state.client;
  },
}));

import {
  archiveWorkspace,
  createWorkspace,
  getWorkspace,
  inviteMember,
  listWorkspaceMembers,
  listWorkspaces,
  removeMember,
  updateMemberRole,
  updateWorkspace,
} from "../../src/services/agentos/workspaces";
import { createMockSupabase, rowsOf, seed, setCaller } from "./harness";

const NOW = "2026-10-12T10:00:00.000Z";

function workspaceRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "ws1",
    owner_clerk_id: "clerk_A",
    name: "Marketing",
    description: "Growth work",
    goals: "",
    instructions: "",
    policies: {},
    settings: {},
    archived_at: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function seededClient() {
  setCaller("clerk_A");
  const client = createMockSupabase();
  seed(client, "workspaces", [workspaceRow()]);
  seed(client, "workspace_members", [
    {
      workspace_id: "ws1",
      member_clerk_id: "clerk_A",
      role: "owner",
      invited_by: null,
      revoked_at: null,
      created_at: NOW,
    },
  ]);
  return client;
}

describe("workspaces service", () => {
  beforeEach(() => {
    state.client = seededClient();
  });

  describe("createWorkspace", () => {
    it("creates a workspace owned by the caller", async () => {
      const result = await createWorkspace({ name: "Sales", goals: "Close more deals" });
      expect(result.error).toBeNull();
      expect(result.data?.name).toBe("Sales");
      expect(result.data?.goals).toBe("Close more deals");
      // Ownership is stamped by the DB, not the caller.
      expect(result.data?.owner_clerk_id).toBe("clerk_A");
    });

    it("rejects a blank name without a database round trip", async () => {
      const result = await createWorkspace({ name: "  " });
      expect(result.error?.code).toBe("validation");
      expect(result.data).toBeNull();
      expect(state.client?.calls.filter((call) => call.op === "insert")).toEqual([]);
    });

    it("persists the policies it was given", async () => {
      const result = await createWorkspace({
        name: "Cautious",
        policies: { executions_paused: true, approval_required_tools: ["gmail"] },
      });
      expect(result.error).toBeNull();
      const reloaded = await getWorkspace(result.data!.id);
      expect(reloaded.data?.policies).toMatchObject({
        executions_paused: true,
        approval_required_tools: ["gmail"],
      });
    });
  });

  describe("updateWorkspace", () => {
    it("patches only the supplied fields", async () => {
      const result = await updateWorkspace("ws1", { description: "New description" });
      expect(result.data?.description).toBe("New description");
      expect(result.data?.name).toBe("Marketing");
    });

    it("rejects a blank name", async () => {
      expect((await updateWorkspace("ws1", { name: "" })).error?.code).toBe("validation");
    });

    it("cannot be applied by a non-owner", async () => {
      setCaller("clerk_B");
      const result = await updateWorkspace("ws1", { description: "hijacked" });
      // RLS makes the UPDATE affect zero rows, so .single() finds nothing and
      // the service surfaces that as a database error rather than pretending
      // the write succeeded.
      expect(result.error?.code).toBe("database");
      expect(result.data).toBeNull();
      setCaller("clerk_A");
      expect((await getWorkspace("ws1")).data?.description).toBe("Growth work");
    });
  });

  describe("archiveWorkspace", () => {
    it("stamps archived_at and returns the updated workspace", async () => {
      const result = await archiveWorkspace("ws1");
      expect(result.error).toBeNull();
      expect(result.data?.archived_at).toBeTruthy();
    });

    it("cannot be archived by a non-owner", async () => {
      setCaller("clerk_B");
      const result = await archiveWorkspace("ws1");
      expect(result.error?.code).toBe("database");
      setCaller("clerk_A");
      expect((await getWorkspace("ws1")).data?.archived_at).toBeNull();
    });
  });

  describe("inviteMember", () => {
    it("adds a member with the requested role", async () => {
      const result = await inviteMember({
        workspaceId: "ws1",
        memberClerkId: "clerk_B",
        role: "admin",
      });
      expect(result.error).toBeNull();
      expect(result.data?.role).toBe("admin");
      expect(result.data?.member_clerk_id).toBe("clerk_B");

      const members = await listWorkspaceMembers("ws1");
      expect(members.data).toHaveLength(2);
    });

    it("rejects a blank Clerk id", async () => {
      expect((await inviteMember({ workspaceId: "ws1", memberClerkId: "   " })).error?.code).toBe(
        "validation",
      );
    });

    it("refuses to add someone who is already a member", async () => {
      expect((await inviteMember({ workspaceId: "ws1", memberClerkId: "clerk_A" })).error?.code).toBe(
        "conflict",
      );
    });

    it("cannot be performed by a non-owner of the workspace", async () => {
      setCaller("clerk_B");
      const result = await inviteMember({ workspaceId: "ws1", memberClerkId: "clerk_C" });
      // The RLS INSERT policy requires the caller to own the workspace.
      expect(result.error?.code).toBe("database");
      setCaller("clerk_A");
      expect(rowsOf(state.client!, "workspace_members")).toHaveLength(1);
    });
  });

  describe("updateMemberRole", () => {
    it("changes a non-owner role", async () => {
      await inviteMember({ workspaceId: "ws1", memberClerkId: "clerk_B", role: "viewer" });
      const result = await updateMemberRole({
        workspaceId: "ws1",
        memberClerkId: "clerk_B",
        role: "admin",
      });
      expect(result.error).toBeNull();
      expect(result.data?.role).toBe("admin");
    });

    it("refuses to change the owner's role", async () => {
      const result = await updateMemberRole({
        workspaceId: "ws1",
        memberClerkId: "clerk_A",
        role: "member",
      });
      expect(result.error?.code).toBe("conflict");
    });
  });

  describe("removeMember", () => {
    it("removes a non-owner member", async () => {
      await inviteMember({ workspaceId: "ws1", memberClerkId: "clerk_B" });
      const result = await removeMember({ workspaceId: "ws1", memberClerkId: "clerk_B" });
      expect(result.error).toBeNull();
      expect((await listWorkspaceMembers("ws1")).data).toHaveLength(1);
    });

    it("refuses to remove the owner", async () => {
      expect((await removeMember({ workspaceId: "ws1", memberClerkId: "clerk_A" })).error?.code).toBe(
        "conflict",
      );
    });

    it("cannot be performed by a non-owner of the workspace", async () => {
      await inviteMember({ workspaceId: "ws1", memberClerkId: "clerk_B" });
      setCaller("clerk_B");
      const result = await removeMember({ workspaceId: "ws1", memberClerkId: "clerk_A" });
      // clerk_B cannot see the membership row at all, so it reports absent.
      expect(result.error?.code).toBe("not_found");
      setCaller("clerk_A");
      expect(rowsOf(state.client!, "workspace_members")).toHaveLength(2);
    });
  });

  describe("tenant isolation", () => {
    it("returns nothing to a different tenant", async () => {
      setCaller("clerk_B");
      expect((await listWorkspaces()).data).toEqual([]);
    });

    it("hides a workspace it does not own", async () => {
      setCaller("clerk_B");
      expect((await getWorkspace("ws1")).error?.code).toBe("not_found");
    });

    it("hides the membership list of a workspace it cannot see", async () => {
      setCaller("clerk_B");
      expect((await listWorkspaceMembers("ws1")).data).toEqual([]);
    });
  });
});
