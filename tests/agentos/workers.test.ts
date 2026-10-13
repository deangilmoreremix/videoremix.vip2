// tests/agentos/workers.test.ts
//
// Unit tests for src/services/agentos/workers.ts against the in-memory
// Supabase harness. The harness applies the same ownership rule Postgres RLS
// applies, so these tests also prove the service cannot reach another tenant's
// rows.

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
  cloneWorker,
  createWorker,
  deleteWorker,
  getWorker,
  listWorkerTools,
  listWorkers,
  replaceWorkerTools,
  setWorkerStatus,
  updateWorker,
} from "../../src/services/agentos/workers";
import { createMockSupabase, rowsOf, seed, setCaller } from "./harness";

const NOW = "2026-10-12T10:00:00.000Z";

function workerRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "w1",
    owner_clerk_id: "clerk_A",
    workspace_id: null,
    name: "Researcher",
    role: "researcher",
    instructions: "Research topics.",
    goals: "",
    status: "active",
    model_provider: "openai",
    model_id: "gpt-4o-mini",
    fallback_provider: null,
    fallback_model_id: null,
    temperature: 0.7,
    max_output_tokens: 2048,
    tools: [],
    knowledge: [],
    memory_enabled: true,
    permissions: {},
    heartbeat: { enabled: false },
    metadata: {},
    cloned_from: null,
    archived_at: null,
    accent: "violet",
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function seededClient() {
  setCaller("clerk_A");
  const client = createMockSupabase();
  seed(client, "workers", [workerRow()]);
  seed(client, "worker_tools", [
    {
      id: "t1",
      worker_id: "w1",
      owner_clerk_id: "clerk_A",
      tool_key: "web_fetch",
      config: {},
      enabled: true,
      created_at: NOW,
    },
  ]);
  return client;
}

describe("workers service", () => {
  beforeEach(() => {
    setCaller("clerk_A");
    state.client = createMockSupabase();
  });

  describe("createWorker", () => {
    it("inserts a worker and returns the created row", async () => {
      const result = await createWorker({ name: "Writer", role: "writer" });
      expect(result.error).toBeNull();
      expect(result.data?.name).toBe("Writer");
      expect(result.data?.status).toBe("active");
      // Owner comes from the DB trigger, not the caller.
      expect(result.data?.owner_clerk_id).toBe("clerk_A");
    });

    it("rejects an empty name without hitting the database", async () => {
      const result = await createWorker({ name: "   " });
      expect(result.error?.code).toBe("validation");
      expect(result.data).toBeNull();
      expect(state.client?.calls.filter((call) => call.op === "insert")).toEqual([]);
    });

    it("rejects an out-of-range temperature", async () => {
      expect((await createWorker({ name: "Writer", temperature: 5 })).error?.code).toBe("validation");
      expect((await createWorker({ name: "Writer", temperature: -1 })).error?.code).toBe("validation");
    });

    it("assigns the worker tools it was given", async () => {
      await createWorker({
        name: "Writer",
        tools: [{ tool_key: "web_fetch" }, { tool_key: "videoremix_apps" }],
      });
      const created = rowsOf(state.client!, "workers")[0];
      const tools = await listWorkerTools(created.id as string);
      expect(tools.data?.map((tool) => tool.tool_key).sort()).toEqual([
        "videoremix_apps",
        "web_fetch",
      ]);
    });
  });

  describe("listWorkers", () => {
    it("excludes archived workers by default", async () => {
      state.client = seededClient();
      seed(state.client, "workers", [workerRow({ id: "w2", name: "Old", status: "archived", archived_at: NOW })]);

      const hidden = await listWorkers();
      expect(hidden.data?.map((worker) => worker.id)).toEqual(["w1"]);

      const shown = await listWorkers({ includeArchived: true });
      expect(shown.data).toHaveLength(2);
    });

    it("returns nothing for a different tenant", async () => {
      state.client = seededClient();
      setCaller("clerk_B");
      const result = await listWorkers();
      expect(result.data).toEqual([]);
    });

    it("filters by workspace when asked", async () => {
      state.client = seededClient();
      seed(state.client, "workers", [
        workerRow({ id: "w3", name: "Team", workspace_id: "ws1" }),
      ]);

      const scoped = await listWorkers({ workspaceId: "ws1" });
      expect(scoped.data?.map((worker) => worker.id)).toEqual(["w3"]);
    });
  });

  describe("cloneWorker", () => {
    it("copies the configuration and the tool assignments", async () => {
      state.client = seededClient();
      const result = await cloneWorker("w1");
      expect(result.error).toBeNull();
      expect(result.data?.name).toBe("Researcher (copy)");
      expect(result.data?.cloned_from).toBe("w1");
      expect(result.data?.id).not.toBe("w1");
      expect(result.data?.owner_clerk_id).toBe("clerk_A");
      expect(result.data?.instructions).toBe("Research topics.");

      const tools = await listWorkerTools(result.data!.id);
      expect(tools.data?.map((tool) => tool.tool_key)).toEqual(["web_fetch"]);
    });

    it("accepts a name override", async () => {
      state.client = seededClient();
      const result = await cloneWorker("w1", { name: "Researcher v2" });
      expect(result.data?.name).toBe("Researcher v2");
    });

    it("reports not_found for an unknown worker", async () => {
      state.client = seededClient();
      expect((await cloneWorker("does-not-exist")).error?.code).toBe("not_found");
    });
  });

  describe("setWorkerStatus", () => {
    it("pauses and resumes a worker", async () => {
      state.client = seededClient();
      expect((await setWorkerStatus("w1", "paused")).data?.status).toBe("paused");
      expect((await setWorkerStatus("w1", "active")).data?.status).toBe("active");
    });

    it("stamps archived_at when archiving and clears it on reactivation", async () => {
      state.client = seededClient();
      const archived = await setWorkerStatus("w1", "archived");
      expect(archived.data?.status).toBe("archived");
      expect(archived.data?.archived_at).toBeTruthy();

      const reactivated = await setWorkerStatus("w1", "active");
      expect(reactivated.data?.status).toBe("active");
      expect(reactivated.data?.archived_at).toBeNull();
    });

    it("refuses an unknown worker", async () => {
      state.client = seededClient();
      expect((await setWorkerStatus("nope", "paused")).error?.code).toBe("not_found");
    });
  });

  describe("replaceWorkerTools", () => {
    it("replaces the tool set rather than appending", async () => {
      state.client = seededClient();
      const result = await replaceWorkerTools("w1", [{ tool_key: "videoremix_apps" }]);
      expect(result.error).toBeNull();
      expect(result.data?.map((tool) => tool.tool_key)).toEqual(["videoremix_apps"]);

      const remaining = await listWorkerTools("w1");
      expect(remaining.data).toHaveLength(1);
      expect(remaining.data?.[0].tool_key).toBe("videoremix_apps");
    });

    it("removes every tool when handed an empty set", async () => {
      state.client = seededClient();
      await replaceWorkerTools("w1", []);
      expect((await listWorkerTools("w1")).data).toEqual([]);
    });
  });

  describe("updateWorker", () => {
    it("patches only the supplied fields", async () => {
      state.client = seededClient();
      const result = await updateWorker("w1", { instructions: "New brief." });
      expect(result.data?.instructions).toBe("New brief.");
      expect(result.data?.name).toBe("Researcher");
    });

    it("never lets a caller change the owner", async () => {
      state.client = seededClient();
      // The RLS UPDATE policy has WITH CHECK owner_clerk_id = current user, so
      // a client-supplied owner is dropped by the database, not honoured.
      // deno-lint-ignore no-explicit-any -- deliberately sending a forbidden field
      await updateWorker("w1", { owner_clerk_id: "clerk_EVIL" } as any);
      const reloaded = await getWorker("w1");
      expect(reloaded.data?.owner_clerk_id).toBe("clerk_A");
    });

    it("rejects an empty name", async () => {
      state.client = seededClient();
      expect((await updateWorker("w1", { name: "" })).error?.code).toBe("validation");
    });
  });

  describe("deleteWorker", () => {
    it("removes the worker row", async () => {
      state.client = seededClient();
      expect((await deleteWorker("w1")).error).toBeNull();
      expect((await getWorker("w1")).error?.code).toBe("not_found");
    });

    it("cannot delete another tenant's worker", async () => {
      state.client = seededClient();
      setCaller("clerk_B");
      expect((await deleteWorker("w1")).error).toBeNull();
      // RLS made the delete a no-op, so the row survives for its owner.
      setCaller("clerk_A");
      expect((await getWorker("w1")).error).toBeNull();
    });
  });

  describe("getWorker", () => {
    it("requires an id", async () => {
      state.client = seededClient();
      expect((await getWorker("")).error?.code).toBe("validation");
    });

    it("returns not_found for another tenant's worker", async () => {
      state.client = seededClient();
      setCaller("clerk_B");
      expect((await getWorker("w1")).error?.code).toBe("not_found");
    });
  });
});
