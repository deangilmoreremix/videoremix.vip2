// tests/agentos/missions-b.test.ts
//
// Unit tests for src/services/agentos/missions.ts against the in-memory
// Supabase harness.
//
// Tasks are the one write the browser deliberately does not make directly:
// createTask, cancelTask, retryTask and runQueuedTasks all go through an edge
// function that owns the queue RPCs, while missions and task edges are
// ordinary RLS-gated rows. These tests pin both halves — the exact action
// each invoke dispatches on, and the cycle check that guards the dependency
// graph before any edge reaches the database.

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
  addTaskEdge,
  cancelMission,
  cancelTask,
  createMission,
  createTask,
  getMission,
  listMissions,
  listTaskEdges,
  removeTaskEdge,
  retryTask,
  runQueuedTasks,
} from "../../src/services/agentos/missions";
import { clearStubs, createMockSupabase, rowsOf, seed, setCaller, stubInvoke } from "./harness";

const NOW = "2026-10-12T10:00:00.000Z";

function missionRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "m1",
    owner_clerk_id: "clerk_A",
    workspace_id: null,
    title: "Launch research",
    description: "",
    goal: "Understand the market",
    status: "active",
    priority: 5,
    created_by: "user",
    started_at: null,
    completed_at: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function taskRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "t1",
    owner_clerk_id: "clerk_A",
    mission_id: "m1",
    workspace_id: null,
    title: "Draft launch post",
    description: "",
    assigned_worker_id: null,
    status: "queued",
    priority: 5,
    input: {},
    output: null,
    error: null,
    attempt: 0,
    max_attempts: 3,
    trigger: "manual",
    run_after: NOW,
    lease_owner: null,
    lease_expires_at: null,
    handoff_to_task_id: null,
    requires_approval: false,
    approval_id: null,
    started_at: null,
    completed_at: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function edgeRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    task_id: "task_A",
    waits_for: "task_B",
    kind: "depends_on",
    owner_clerk_id: "clerk_A",
    created_at: NOW,
    ...overrides,
  };
}

describe("missions service", () => {
  beforeEach(() => {
    clearStubs();
    setCaller("clerk_A");
    state.client = createMockSupabase();
  });

  describe("createMission", () => {
    it("inserts a mission with the owner stamped from the caller", async () => {
      const result = await createMission({ title: "Launch research", goal: "Understand the market" });
      expect(result.error).toBeNull();
      expect(result.data?.title).toBe("Launch research");
      expect(result.data?.goal).toBe("Understand the market");
      expect(result.data?.status).toBe("active");
      // Owner comes from the DB trigger, not the caller.
      expect(result.data?.owner_clerk_id).toBe("clerk_A");
    });

    it("rejects a blank title without hitting the database", async () => {
      const result = await createMission({ title: "  " });
      expect(result.error?.code).toBe("validation");
      expect(result.data).toBeNull();
      expect(state.client?.calls.filter((call) => call.op === "insert")).toEqual([]);
    });
  });

  describe("getMission", () => {
    it("requires an id", async () => {
      expect((await getMission("")).error?.code).toBe("validation");
    });

    it("returns not_found for another tenant's mission", async () => {
      seed(state.client!, "missions", [missionRow({ owner_clerk_id: "clerk_B" })]);
      expect((await getMission("m1")).error?.code).toBe("not_found");
    });
  });

  describe("listMissions", () => {
    it("filters by status", async () => {
      seed(state.client!, "missions", [
        missionRow({ id: "m1", status: "active", created_at: "2026-10-12T10:00:00.000Z" }),
        missionRow({ id: "m2", status: "draft", created_at: "2026-10-11T10:00:00.000Z" }),
        missionRow({ id: "m3", status: "completed", created_at: "2026-10-10T10:00:00.000Z" }),
        missionRow({ id: "m4", status: "active", created_at: "2026-10-09T10:00:00.000Z" }),
      ]);

      const active = await listMissions({ status: "active" });
      expect(active.error).toBeNull();
      expect(active.data?.map((mission) => mission.id)).toEqual(["m1", "m4"]);

      const all = await listMissions();
      expect(all.data?.map((mission) => mission.id)).toEqual(["m1", "m2", "m3", "m4"]);
    });
  });

  describe("cancelMission", () => {
    it("cancels the open tasks and then the mission", async () => {
      seed(state.client!, "missions", [missionRow()]);
      seed(state.client!, "tasks", [
        taskRow({ id: "t1", status: "queued" }),
        taskRow({ id: "t2", status: "completed" }),
        taskRow({ id: "t3", status: "failed" }),
      ]);
      stubInvoke("agentos-tasks", async () => ({ data: { task_id: "t1", status: "cancelled" } }));

      const result = await cancelMission("m1");
      expect(result.error).toBeNull();
      expect(result.data).toEqual({ missionId: "m1", cancelledTasks: 1 });
      // Only the queued task is sent to the edge function; terminal tasks are skipped.
      expect(state.client?.invokeCalls).toEqual([
        { name: "agentos-tasks", body: { action: "cancel", task_id: "t1" } },
      ]);
      expect((await getMission("m1")).data?.status).toBe("cancelled");
    });
  });

  describe("createTask", () => {
    it("asks the edge function to create the task", async () => {
      stubInvoke("agentos-tasks", async () => ({
        data: { task: { id: "task_1", title: "Draft launch post" }, queued_as: "immediate" },
      }));

      const result = await createTask({ title: "  Draft launch post  ", mission_id: "m1", priority: 7 });
      expect(result.error).toBeNull();
      expect(result.data?.title).toBe("Draft launch post");
      // The browser sends intent; the edge function applies it via the queue RPCs.
      expect(state.client?.invokeCalls).toEqual([
        {
          name: "agentos-tasks",
          body: {
            action: "create",
            task: { title: "Draft launch post", mission_id: "m1", priority: 7 },
          },
        },
      ]);
    });

    it("turns an edge-function error envelope into a service error", async () => {
      stubInvoke("agentos-tasks", async () => ({
        error: { code: "conflict", message: "Worker is offline" },
      }));

      const result = await createTask({ title: "Draft launch post" });
      expect(result.error?.code).toBe("unknown");
      expect(result.error?.message).toBe("Worker is offline");
      expect(result.data).toBeNull();
    });

    it("rejects a blank title without invoking the function", async () => {
      const result = await createTask({ title: "   " });
      expect(result.error?.code).toBe("validation");
      expect(result.data).toBeNull();
      expect(state.client?.invokeCalls).toEqual([]);
    });
  });

  describe("cancelTask", () => {
    it("sends the cancel action with the task id", async () => {
      stubInvoke("agentos-tasks", async () => ({ data: { task_id: "task_9", status: "cancelled" } }));

      const result = await cancelTask("task_9");
      expect(result.error).toBeNull();
      expect(result.data).toEqual({ task_id: "task_9", status: "cancelled" });
      expect(state.client?.invokeCalls).toEqual([
        { name: "agentos-tasks", body: { action: "cancel", task_id: "task_9" } },
      ]);
    });

    it("surfaces a cancel failure", async () => {
      stubInvoke("agentos-tasks", async () => ({
        error: { code: "conflict", message: "Task already finished" },
      }));

      const result = await cancelTask("task_9");
      expect(result.error?.message).toBe("Task already finished");
      expect(result.data).toBeNull();
    });

    it("requires a task id", async () => {
      expect((await cancelTask("")).error?.code).toBe("validation");
      expect(state.client?.invokeCalls).toEqual([]);
    });
  });

  describe("retryTask", () => {
    it("sends the retry action with the task id", async () => {
      stubInvoke("agentos-tasks", async () => ({ data: { task_id: "task_9", status: "queued" } }));

      const result = await retryTask("task_9");
      expect(result.error).toBeNull();
      expect(result.data).toEqual({ task_id: "task_9", status: "queued" });
      expect(state.client?.invokeCalls).toEqual([
        { name: "agentos-tasks", body: { action: "retry", task_id: "task_9" } },
      ]);
    });

    it("surfaces a retry failure", async () => {
      stubInvoke("agentos-tasks", async () => ({
        error: { code: "not_found", message: "Task is not failed" },
      }));

      const result = await retryTask("task_9");
      expect(result.error?.message).toBe("Task is not failed");
      expect(result.data).toBeNull();
    });
  });

  describe("runQueuedTasks", () => {
    it("asks the executor for a single queued task by default", async () => {
      stubInvoke("agentos-execute", async () => ({ data: { claimed: 1 } }));

      const result = await runQueuedTasks();
      expect(result.error).toBeNull();
      expect(result.data?.claimed).toBe(1);
      expect(state.client?.invokeCalls).toEqual([{ name: "agentos-execute", body: { limit: 1 } }]);
    });

    it("passes a custom limit through", async () => {
      stubInvoke("agentos-execute", async () => ({ data: { claimed: 0 } }));

      const result = await runQueuedTasks({ limit: 5 });
      expect(result.error).toBeNull();
      expect(result.data?.claimed).toBe(0);
      expect(state.client?.invokeCalls[0].body).toEqual({ limit: 5 });
    });

    it("surfaces an executor failure", async () => {
      stubInvoke("agentos-execute", async () => ({
        error: { code: "internal", message: "Sweep could not start" },
      }));

      const result = await runQueuedTasks();
      expect(result.error?.message).toBe("Sweep could not start");
      expect(result.data).toBeNull();
    });
  });

  describe("addTaskEdge", () => {
    it("inserts the dependency edge", async () => {
      const result = await addTaskEdge({ taskId: "task_A", waitsFor: "task_B" });
      expect(result.error).toBeNull();
      expect(result.data).toEqual({ task_id: "task_A", waits_for: "task_B" });

      const insert = state.client?.calls.find(
        (call) => call.op === "insert" && call.table === "task_edges",
      );
      expect(insert?.payload).toEqual({
        task_id: "task_A",
        waits_for: "task_B",
        kind: "depends_on",
      });
    });

    it("records the requested kind", async () => {
      const result = await addTaskEdge({ taskId: "task_A", waitsFor: "task_B", kind: "handoff" });
      expect(result.error).toBeNull();
      expect(rowsOf(state.client!, "task_edges")[0].kind).toBe("handoff");
    });

    it("requires both ends of the edge", async () => {
      expect((await addTaskEdge({ taskId: "", waitsFor: "task_B" })).error?.code).toBe("validation");
      expect((await addTaskEdge({ taskId: "task_A", waitsFor: "" })).error?.code).toBe("validation");
      expect(state.client?.calls.filter((call) => call.op === "insert")).toEqual([]);
    });

    it("rejects a self-dependency", async () => {
      const result = await addTaskEdge({ taskId: "task_A", waitsFor: "task_A" });
      expect(result.error?.code).toBe("validation");
      expect(state.client?.calls.filter((call) => call.op === "insert")).toEqual([]);
    });

    it("rejects an edge that would close a cycle", async () => {
      seed(state.client!, "task_edges", [edgeRow()]);

      const result = await addTaskEdge({ taskId: "task_B", waitsFor: "task_A" });
      expect(result.error?.code).toBe("validation");
      expect(result.error?.message).toMatch(/cycle/i);
      expect(state.client?.calls.filter((call) => call.op === "insert")).toEqual([]);
    });

    it("rejects a transitive cycle", async () => {
      seed(state.client!, "task_edges", [
        edgeRow({ task_id: "task_A", waits_for: "task_B" }),
        edgeRow({ task_id: "task_B", waits_for: "task_C" }),
      ]);

      const result = await addTaskEdge({ taskId: "task_C", waitsFor: "task_A" });
      expect(result.error?.code).toBe("validation");
      expect(result.error?.message).toMatch(/cycle/i);
    });

    it("allows an edge that only extends the chain", async () => {
      seed(state.client!, "task_edges", [
        edgeRow({ task_id: "task_A", waits_for: "task_B" }),
        edgeRow({ task_id: "task_B", waits_for: "task_C" }),
      ]);

      const result = await addTaskEdge({ taskId: "task_A", waitsFor: "task_C" });
      expect(result.error).toBeNull();
      expect(rowsOf(state.client!, "task_edges")).toHaveLength(3);
    });
  });

  describe("removeTaskEdge", () => {
    it("deletes the dependency edge", async () => {
      seed(state.client!, "task_edges", [edgeRow()]);

      const result = await removeTaskEdge({ taskId: "task_A", waitsFor: "task_B" });
      expect(result.error).toBeNull();
      expect(result.data).toEqual({ task_id: "task_A", waits_for: "task_B" });
      expect(rowsOf(state.client!, "task_edges")).toEqual([]);
      expect(state.client?.calls).toContainEqual({ op: "delete", table: "task_edges" });
    });

    it("requires both ends of the edge", async () => {
      expect((await removeTaskEdge({ taskId: "task_A", waitsFor: "" })).error?.code).toBe("validation");
      expect(state.client?.calls.filter((call) => call.op === "delete")).toEqual([]);
    });
  });

  describe("listTaskEdges", () => {
    it("returns the edges between a mission's tasks", async () => {
      seed(state.client!, "tasks", [
        taskRow({ id: "task_A", mission_id: "m1" }),
        taskRow({ id: "task_B", mission_id: "m1" }),
        taskRow({ id: "task_C", mission_id: "m2" }),
      ]);
      seed(state.client!, "task_edges", [
        edgeRow({ task_id: "task_A", waits_for: "task_B" }),
        edgeRow({ task_id: "task_C", waits_for: "task_A" }),
      ]);

      const result = await listTaskEdges("m1");
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].task_id).toBe("task_A");
      expect(result.data?.[0].waits_for).toBe("task_B");
      expect(result.data?.[0].kind).toBe("depends_on");
    });

    it("requires a mission id", async () => {
      expect((await listTaskEdges("")).error?.code).toBe("validation");
    });
  });
});
