// tests/agentos/schema-routing.test.ts
//
// The AgentOS tables live in the `agentos` schema. The shared browser client
// talks to `public`, where `public.tasks` and `public.workspaces` also exist
// (they pre-date the port and belong to a different feature). An unqualified
// query therefore does not fail loudly — it can read the WRONG table.
//
// These tests pin the routing rules that make the port safe:
//   * the harness models the real project: the public schema does not contain
//     the AgentOS tables, and an unexposed schema is refused;
//   * a service that queries through the shared client gets an error, not
//     another tenant's or another feature's rows;
//   * the operator-facing error names the fix when the schema is not exposed.

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

import { agentosErrorMessage } from "../../src/services/agentos/client";
import { listWorkers } from "../../src/services/agentos/workers";
import { createMockSupabase, seed, setCaller } from "./harness";

describe("AgentOS schema routing", () => {
  beforeEach(() => {
    state.client = createMockSupabase();
    setCaller("clerk_A");
  });

  it("does not expose the AgentOS tables through the public schema", async () => {
    const { data, error } = await state.client!.from("workers").select("id").limit(1);

    expect(data).toBeNull();
    expect((error as { code?: string }).code).toBe("PGRST205");
    expect((error as { message: string }).message).toContain("public.workers");
  });

  it("refuses a schema the project does not expose", async () => {
    const { data, error } = await state.client!.schema("nope").rpc("anything");

    expect(data).toBeNull();
    expect((error as { code?: string }).code).toBe("PGRST106");
  });

  it("reads the AgentOS tables through the agentos schema", async () => {
    seed(state.client!, "workers", [
      { id: "w1", owner_clerk_id: "clerk_A", name: "Researcher", role: "researcher" },
    ]);

    const result = await listWorkers();

    expect(result.error).toBeNull();
    expect(result.data?.map((worker) => worker.id)).toEqual(["w1"]);
  });

  it("still enforces tenant isolation on the agentos schema", async () => {
    seed(state.client!, "workers", [
      { id: "w1", owner_clerk_id: "clerk_B", name: "Other tenant", role: "researcher" },
    ]);

    const result = await listWorkers();

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it("explains an unexposed schema instead of leaking a PostgREST code", () => {
    const message = agentosErrorMessage({
      code: "PGRST106",
      message: "Invalid schema: agentos. Only the following schemas are exposed: public, graphql_public",
    });

    expect(message).toContain("not exposed to PostgREST");
    expect(message).toContain("20261012120700_agentos_expose_schema.sql");
  });

  it("passes an unrelated error through unchanged", () => {
    expect(agentosErrorMessage({ code: "42501", message: "permission denied" })).toBe(
      "permission denied",
    );
  });
});
