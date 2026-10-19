// tests/agentos/approvals-b.test.ts
//
// Unit tests for src/services/agentos/approvals.ts against the in-memory
// Supabase harness.
//
// The browser never updates an approval row itself: decideApproval posts the
// decision to the agentos-approvals edge function, which performs the
// ownership check before invoking the resolver RPC. These tests pin the exact
// invoke payload, that an invalid decision never leaves the browser, and that
// the pending count degrades to zero instead of leaking an error into badges.

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
  countPendingApprovals,
  decideApproval,
  getApproval,
  listApprovals,
} from "../../src/services/agentos/approvals";
import { clearStubs, createMockSupabase, seed, setCaller, stubInvoke } from "./harness";

const NOW = "2026-10-12T10:00:00.000Z";

function approvalRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "ap1",
    owner_clerk_id: "clerk_A",
    task_id: "t1",
    run_id: null,
    worker_id: null,
    workspace_id: null,
    action_type: "send_email",
    action_payload: {},
    reason: "External email",
    status: "pending",
    requested_at: NOW,
    expires_at: null,
    decided_at: null,
    decided_by: null,
    decision_note: null,
    ...overrides,
  };
}

describe("approvals service", () => {
  beforeEach(() => {
    clearStubs();
    setCaller("clerk_A");
    state.client = createMockSupabase();
  });

  describe("listApprovals", () => {
    it("returns every approval by default", async () => {
      seed(state.client!, "approvals", [
        approvalRow({ id: "ap1", status: "pending", requested_at: "2026-10-12T10:00:00.000Z" }),
        approvalRow({ id: "ap2", status: "approved", requested_at: "2026-10-11T10:00:00.000Z" }),
        approvalRow({ id: "ap3", status: "rejected", requested_at: "2026-10-10T10:00:00.000Z" }),
      ]);

      const result = await listApprovals();
      expect(result.error).toBeNull();
      expect(result.data?.map((approval) => approval.id)).toEqual(["ap1", "ap2", "ap3"]);
    });

    it("filters by status", async () => {
      seed(state.client!, "approvals", [
        approvalRow({ id: "ap1", status: "pending" }),
        approvalRow({ id: "ap2", status: "approved" }),
        approvalRow({ id: "ap3", status: "pending", requested_at: "2026-10-11T10:00:00.000Z" }),
      ]);

      const result = await listApprovals({ status: "pending" });
      expect(result.error).toBeNull();
      expect(result.data?.map((approval) => approval.id)).toEqual(["ap1", "ap3"]);
    });
  });

  describe("getApproval", () => {
    it("requires an id", async () => {
      expect((await getApproval("")).error?.code).toBe("validation");
    });

    it("returns not_found for another tenant's approval", async () => {
      seed(state.client!, "approvals", [approvalRow({ owner_clerk_id: "clerk_B" })]);
      expect((await getApproval("ap1")).error?.code).toBe("not_found");
    });
  });

  describe("decideApproval", () => {
    it("posts the decision to the edge function", async () => {
      stubInvoke("agentos-approvals", async () => ({
        data: { resolution: "approved", task: { id: "t1", status: "queued" } },
      }));

      const result = await decideApproval({ approvalId: "ap1", decision: "approved" });
      expect(result.error).toBeNull();
      expect(result.data?.resolution).toBe("approved");
      // The browser never writes the row: the edge function owns the check.
      expect(state.client?.invokeCalls).toEqual([
        {
          name: "agentos-approvals",
          body: { approval_id: "ap1", decision: "approved", note: "" },
        },
      ]);
    });

    it("forwards a rejected decision verbatim", async () => {
      stubInvoke("agentos-approvals", async (_state, body) => ({
        data: { resolution: body.decision, task: null },
      }));

      const result = await decideApproval({
        approvalId: "ap1",
        decision: "rejected",
        note: "Not this week",
      });
      expect(result.error).toBeNull();
      expect(result.data?.resolution).toBe("rejected");
      expect(state.client?.invokeCalls[0].body).toEqual({
        approval_id: "ap1",
        decision: "rejected",
        note: "Not this week",
      });
    });

    it("falls back to the requested decision when the function returns no body", async () => {
      stubInvoke("agentos-approvals", async () => ({}));

      const result = await decideApproval({ approvalId: "ap1", decision: "rejected" });
      expect(result.error).toBeNull();
      expect(result.data).toEqual({ resolution: "rejected", task: null });
    });

    it("turns an error envelope into a service error", async () => {
      stubInvoke("agentos-approvals", async () => ({
        error: { code: "forbidden", message: "Not your approval" },
      }));

      const result = await decideApproval({ approvalId: "ap1", decision: "approved" });
      expect(result.error?.code).toBe("unknown");
      expect(result.error?.message).toBe("Not your approval");
      expect(result.data).toBeNull();
    });

    it("rejects an invalid decision client-side", async () => {
      // deno-lint-ignore no-explicit-any -- deliberately sending a forbidden decision
      const result = await decideApproval({ approvalId: "ap1", decision: "maybe" as any });
      expect(result.error?.code).toBe("validation");
      expect(result.data).toBeNull();
      expect(state.client?.invokeCalls).toEqual([]);
    });

    it("requires an approval id", async () => {
      const result = await decideApproval({ approvalId: "", decision: "approved" });
      expect(result.error?.code).toBe("validation");
      expect(state.client?.invokeCalls).toEqual([]);
    });
  });

  describe("countPendingApprovals", () => {
    it("returns the count the query reports", async () => {
      // The harness read path has no `{ count: "exact", head: true }` support,
      // so inject the minimal chainable this one assertion needs.
      const client = createMockSupabase();
      const realFrom = client.agentos.from.bind(client.agentos);
      const counted = {
        select: () => counted,
        eq: () => counted,
        then: (onFulfilled: (value: { count: number; error: null }) => unknown) =>
          Promise.resolve({ count: 2, error: null }).then(onFulfilled),
      };
      client.agentos.from = ((table: string) =>
        table === "approvals" ? counted : realFrom(table)) as unknown as typeof client.agentos.from;
      state.client = client;

      const result = await countPendingApprovals();
      expect(result.error).toBeNull();
      expect(result.data).toBe(2);
    });

    it("defaults to zero when the query reports no count", async () => {
      // The harness never populates `count`, so this pins the `?? 0` default
      // rather than the row count itself.
      seed(state.client!, "approvals", [
        approvalRow({ id: "ap1", status: "approved" }),
        approvalRow({ id: "ap2", status: "rejected" }),
      ]);

      const result = await countPendingApprovals();
      expect(result.error).toBeNull();
      expect(result.data).toBe(0);
    });

    it("reports a database error", async () => {
      const client = createMockSupabase();
      const realFrom = client.agentos.from.bind(client.agentos);
      const failing = {
        select: () => failing,
        eq: () => failing,
        then: (onFulfilled: (value: { count: null; error: { message: string } }) => unknown) =>
          Promise.resolve({ count: null, error: { message: "count unavailable" } }).then(onFulfilled),
      };
      client.agentos.from = ((table: string) =>
        table === "approvals" ? failing : realFrom(table)) as unknown as typeof client.agentos.from;
      state.client = client;

      const result = await countPendingApprovals();
      expect(result.error?.code).toBe("database");
      expect(result.error?.message).toBe("Could not count approvals");
      expect(result.data).toBeNull();
    });
  });

  describe("tenant isolation", () => {
    it("returns nothing for a different tenant", async () => {
      seed(state.client!, "approvals", [
        approvalRow({ id: "ap1", status: "pending" }),
        approvalRow({ id: "ap2", status: "approved" }),
      ]);
      setCaller("clerk_B");

      const result = await listApprovals();
      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });
  });
});
