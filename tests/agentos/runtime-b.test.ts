// tests/agentos/runtime-b.test.ts
//
// Unit tests for src/services/agentos/runtime.ts against the in-memory
// Supabase harness. The harness applies the same ownership rule Postgres RLS
// applies, so these tests also prove the service cannot reach another tenant's
// rows.
//
// runtime.ts is documented as read-only — execution is triggered by the edge
// function or the scheduler sweep, never by the browser — so every test also
// asserts that the call performed no INSERT / UPDATE / DELETE.

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
  getLatestRunForTask,
  listRecentEvents,
  listRunEvents,
  listRuns,
  listTaskEvents,
} from "../../src/services/agentos/runtime";
import { createMockSupabase, seed, setCaller } from "./harness";

const NOW = "2026-10-12T10:00:00.000Z";

function runRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "run_1",
    task_id: "task_1",
    worker_id: "w1",
    conversation_id: null,
    owner_clerk_id: "clerk_A",
    status: "succeeded",
    trigger: "manual",
    model_provider: "openai",
    model_id: "gpt-4o-mini",
    prompt_tokens: 10,
    completion_tokens: 20,
    credits: 1,
    attempt: 1,
    lease_owner: null,
    lease_expires_at: null,
    started_at: NOW,
    ended_at: NOW,
    error: null,
    ...overrides,
  };
}

function eventRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "evt_1",
    run_id: "run_1",
    task_id: "task_1",
    worker_id: "w1",
    owner_clerk_id: "clerk_A",
    seq: 1,
    kind: "run.started",
    level: "info",
    message: "Run started",
    payload: {},
    created_at: NOW,
    ...overrides,
  };
}

/** Every runtime function is a read: the mock records every write it is asked for. */
function expectNoWrites(): void {
  const writes = state.client!.calls.filter((call) =>
    ["insert", "update", "delete"].includes(call.op),
  );
  expect(writes).toEqual([]);
}

describe("runtime service", () => {
  beforeEach(() => {
    setCaller("clerk_A");
    state.client = createMockSupabase();
  });

  describe("listRuns", () => {
    it("returns the tenant's runs newest first", async () => {
      seed(state.client!, "execution_runs", [
        runRow({ id: "run_noon", started_at: "2026-10-12T12:00:00.000Z" }),
        runRow({ id: "run_dawn", started_at: "2026-10-12T08:00:00.000Z" }),
        runRow({ id: "run_now", started_at: NOW }),
      ]);

      const result = await listRuns();
      expect(result.error).toBeNull();
      expect(result.data?.map((run) => run.id)).toEqual(["run_noon", "run_now", "run_dawn"]);
      expectNoWrites();
    });

    it("filters by worker when asked", async () => {
      seed(state.client!, "execution_runs", [
        runRow({ id: "run_1", worker_id: "w1" }),
        runRow({ id: "run_2", worker_id: "w2" }),
      ]);

      const result = await listRuns({ workerId: "w1" });
      expect(result.data?.map((run) => run.id)).toEqual(["run_1"]);
      expectNoWrites();
    });

    it("caps the page at the requested limit", async () => {
      seed(state.client!, "execution_runs", [
        runRow({ id: "run_dawn", started_at: "2026-10-12T08:00:00.000Z" }),
        runRow({ id: "run_noon", started_at: "2026-10-12T12:00:00.000Z" }),
        runRow({ id: "run_now", started_at: NOW }),
      ]);

      const result = await listRuns({ limit: 2 });
      expect(result.data?.map((run) => run.id)).toEqual(["run_noon", "run_now"]);
      expectNoWrites();
    });

    it("has no empty-workerId check: an empty id is simply no filter", async () => {
      // workerId is an optional filter rather than a row id, so "" fails the
      // `if (options.workerId)` guard and the tenant's whole history comes back.
      seed(state.client!, "execution_runs", [
        runRow({ id: "run_1" }),
        runRow({ id: "run_2", worker_id: "w2" }),
      ]);

      const result = await listRuns({ workerId: "" });
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      expectNoWrites();
    });

    it("returns nothing for a different tenant", async () => {
      seed(state.client!, "execution_runs", [runRow()]);
      setCaller("clerk_B");

      const result = await listRuns();
      expect(result.data).toEqual([]);
      expectNoWrites();
    });
  });

  describe("listRunEvents", () => {
    it("requires a runId", async () => {
      const result = await listRunEvents("");
      expect(result.error?.code).toBe("validation");
      expect(result.error?.message).toBe("runId is required");
      expect(result.data).toBeNull();
      expect(state.client!.calls).toEqual([]);
    });

    it("returns the transcript ordered by seq, oldest first", async () => {
      seed(state.client!, "execution_events", [
        eventRow({ id: "evt_3", seq: 3, created_at: "2026-10-12T10:03:00.000Z" }),
        eventRow({ id: "evt_1", seq: 1, created_at: "2026-10-12T10:01:00.000Z" }),
        eventRow({ id: "evt_2", seq: 2, created_at: "2026-10-12T10:02:00.000Z" }),
      ]);

      const result = await listRunEvents("run_1");
      expect(result.error).toBeNull();
      expect(result.data?.map((event) => event.id)).toEqual(["evt_1", "evt_2", "evt_3"]);
      expectNoWrites();
    });

    it("returns only the run's own events", async () => {
      seed(state.client!, "execution_events", [
        eventRow({ id: "evt_1", run_id: "run_1" }),
        eventRow({ id: "evt_2", run_id: "run_2" }),
      ]);

      const result = await listRunEvents("run_1");
      expect(result.data?.map((event) => event.id)).toEqual(["evt_1"]);
      expectNoWrites();
    });

    it("returns nothing for a different tenant", async () => {
      seed(state.client!, "execution_events", [eventRow()]);
      setCaller("clerk_B");

      const result = await listRunEvents("run_1");
      expect(result.data).toEqual([]);
      expectNoWrites();
    });
  });

  describe("listTaskEvents", () => {
    it("requires a taskId", async () => {
      const result = await listTaskEvents("");
      expect(result.error?.code).toBe("validation");
      expect(result.error?.message).toBe("taskId is required");
      expect(result.data).toBeNull();
      expect(state.client!.calls).toEqual([]);
    });

    it("returns the transcript ordered by seq, oldest first", async () => {
      seed(state.client!, "execution_events", [
        eventRow({ id: "evt_2", seq: 2, created_at: "2026-10-12T10:02:00.000Z" }),
        eventRow({ id: "evt_other", task_id: "task_2", seq: 1, created_at: "2026-10-12T10:01:00.000Z" }),
        eventRow({ id: "evt_1", seq: 1, created_at: "2026-10-12T10:01:00.000Z" }),
      ]);

      const result = await listTaskEvents("task_1");
      expect(result.error).toBeNull();
      expect(result.data?.map((event) => event.id)).toEqual(["evt_1", "evt_2"]);
      expectNoWrites();
    });

    it("returns nothing for a different tenant", async () => {
      seed(state.client!, "execution_events", [eventRow()]);
      setCaller("clerk_B");

      const result = await listTaskEvents("task_1");
      expect(result.data).toEqual([]);
      expectNoWrites();
    });
  });

  describe("listRecentEvents", () => {
    it("returns only events newer than the cutoff", async () => {
      seed(state.client!, "execution_events", [
        eventRow({ id: "evt_old", created_at: "2026-10-12T09:00:00.000Z" }),
        eventRow({ id: "evt_cutoff", created_at: NOW }),
        eventRow({ id: "evt_new", created_at: "2026-10-12T11:00:00.000Z" }),
      ]);

      const result = await listRecentEvents({ since: NOW });
      expect(result.error).toBeNull();
      // `since` is a strict gt(), so the cutoff instant itself is excluded too.
      expect(result.data?.map((event) => event.id)).toEqual(["evt_new"]);
      expectNoWrites();
    });

    it("orders the stream newest first", async () => {
      seed(state.client!, "execution_events", [
        eventRow({ id: "evt_noon", created_at: "2026-10-12T12:00:00.000Z" }),
        eventRow({ id: "evt_dawn", created_at: "2026-10-12T08:00:00.000Z" }),
        eventRow({ id: "evt_now", created_at: NOW }),
      ]);

      const result = await listRecentEvents();
      expect(result.data?.map((event) => event.id)).toEqual(["evt_noon", "evt_now", "evt_dawn"]);
      expectNoWrites();
    });

    it("treats an empty since as no cutoff", async () => {
      // listRecentEvents takes no id, so there is nothing to validate; "" is
      // falsy and the gt() filter is skipped entirely.
      seed(state.client!, "execution_events", [eventRow()]);

      const result = await listRecentEvents({ since: "" });
      expect(result.data).toHaveLength(1);
      expectNoWrites();
    });

    it("returns nothing for a different tenant", async () => {
      seed(state.client!, "execution_events", [eventRow()]);
      setCaller("clerk_B");

      const result = await listRecentEvents();
      expect(result.data).toEqual([]);
      expectNoWrites();
    });
  });

  describe("getLatestRunForTask", () => {
    it("returns the most recently started run", async () => {
      seed(state.client!, "execution_runs", [
        runRow({
          id: "run_latest",
          started_at: "2026-10-12T12:00:00.000Z",
          created_at: "2026-10-12T08:00:00.000Z",
        }),
        runRow({
          id: "run_middle",
          started_at: NOW,
          created_at: "2026-10-12T12:00:00.000Z",
        }),
        runRow({
          id: "run_first",
          started_at: "2026-10-12T08:00:00.000Z",
          created_at: NOW,
        }),
      ]);

      const result = await getLatestRunForTask("task_1");
      expect(result.error).toBeNull();
      // Ordered on started_at, not created_at.
      expect(result.data?.id).toBe("run_latest");
      expectNoWrites();
    });

    it("returns null when the task has never run", async () => {
      seed(state.client!, "execution_runs", [runRow({ id: "run_other", task_id: "task_2" })]);

      const result = await getLatestRunForTask("task_1");
      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
      expectNoWrites();
    });

    it("requires a taskId", async () => {
      const result = await getLatestRunForTask("");
      expect(result.error?.code).toBe("validation");
      expect(result.error?.message).toBe("taskId is required");
      expect(result.data).toBeNull();
      expect(state.client!.calls).toEqual([]);
    });

    it("returns null for a different tenant", async () => {
      seed(state.client!, "execution_runs", [runRow()]);
      setCaller("clerk_B");

      const result = await getLatestRunForTask("task_1");
      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
      expectNoWrites();
    });
  });
});
