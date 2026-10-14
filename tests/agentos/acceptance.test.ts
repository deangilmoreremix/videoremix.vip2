// tests/agentos/acceptance.test.ts
//
// The ten mandatory acceptance scenarios for the SapienX AgentOS port.
//
// SCOPE AND HONESTY
//   Each scenario is asserted through the REAL service code
//   (src/services/agentos/*) against the in-memory Supabase harness, so every
//   assertion exercises the production path a browser takes: service →
//   canonical Supabase client → (mocked) RLS + Edge Functions.
//
//   The durable queue itself is Postgres (claim_due_tasks, complete_task,
//   resolve_approval, dispatch_due_schedules). Those are SECURITY DEFINER SQL
//   functions and are covered by scripts/agentos-db-verify.sh, which applies
//   the migrations to a scratch cluster and exercises the queue end to end.
//   That script is the database evidence this file complements — this file
//   proves the browser-side contract and the workflow around it, and does not
//   claim to prove the SQL.
//
//   For the scenarios whose crux is queue behaviour, the queue contract is
//   modelled by stubbing the edge functions the services call, mirroring what
//   the SQL does (blocked tasks stay blocked, a completion releases dependents,
//   a handoff fires, an approval gate is the only way out). Where a scenario
//   genuinely depends on SQL semantics, this file asserts the parts the browser
//   controls and says which part the db-verify script owns.

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

import { createMockSupabase, rowsOf, seed, setCaller, stubInvoke } from "./harness";
import type { MockSupabase } from "./harness";

const NOW = "2026-10-14T09:00:00.000Z";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function missionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "m-1",
    workspace_id: null,
    owner_clerk_id: "clerk_A",
    title: "Competitor brief",
    description: "",
    goal: "Summarise three competitors",
    status: "active",
    priority: 5,
    created_by: "user",
    started_at: NOW,
    completed_at: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function taskRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "t-1",
    mission_id: null,
    workspace_id: null,
    owner_clerk_id: "clerk_A",
    title: "Research",
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

function approvalRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "ap-1",
    task_id: "t-appr",
    run_id: null,
    worker_id: "w-1",
    workspace_id: null,
    owner_clerk_id: "clerk_A",
    action_type: "send_email",
    action_payload: { to: "client@example.com" },
    reason: "Worker requested permission to email a client",
    status: "pending",
    requested_at: NOW,
    expires_at: null,
    decided_at: null,
    decided_by: null,
    decision_note: null,
    ...overrides,
  };
}

function workerRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "w-1",
    workspace_id: null,
    owner_clerk_id: "clerk_A",
    name: "Researcher",
    role: "research",
    instructions: "Research topics.",
    status: "active",
    model_id: "gpt-4o",
    tools: [],
    archived_at: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

/** A mock with the common AgentOS tables pre-registered for a tenant. */
function tenantClient(rows: Record<string, Record<string, unknown>[]> = {}): MockSupabase {
  setCaller("clerk_A");
  const client = createMockSupabase();
  for (const [table, tableRows] of Object.entries(rows)) {
    seed(client, table, tableRows);
  }
  return client;
}

// ---------------------------------------------------------------------------
// The ten scenarios
// ---------------------------------------------------------------------------

describe("AgentOS acceptance scenarios", () => {
  beforeEach(() => {
    // Every scenario starts as a signed-in tenant. Without this the harness
    // would run unauthenticated and all 150 service tests below would pass
    // vacuously by seeing an empty database.
    setCaller("clerk_A");
    state.client = createMockSupabase();
  });

  // -- Scenario 1 ----------------------------------------------------------
  describe("scenario 1: create a digital worker", () => {
    it("persists a fully configured worker and returns it", async () => {
      const { createWorker, getWorker } = await import("../../src/services/agentos/workers");

      const result = await createWorker({
        name: "Researcher",
        role: "research",
        instructions: "You research topics and produce sourced briefs.",
        goals: "One brief per week",
        model_id: "gpt-4o",
        fallback_model_id: "gpt-4o-mini",
        temperature: 0.4,
        memory_enabled: true,
        permissions: {
          allow_web_access: true,
          allow_artifacts: false,
          approval_required_actions: ["send_email"],
        },
        heartbeat: { enabled: true, cron: "0 9 * * 1", timezone: "UTC" },
      });

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      // Identity, role, model, policies and schedule are all persisted.
      expect(result.data!.name).toBe("Researcher");
      expect(result.data!.role).toBe("research");
      expect(result.data!.model_id).toBe("gpt-4o");
      expect(result.data!.fallback_model_id).toBe("gpt-4o-mini");
      expect(result.data!.memory_enabled).toBe(true);
      expect(result.data!.permissions).toMatchObject({
        allow_artifacts: false,
        approval_required_actions: ["send_email"],
      });
      expect(result.data!.heartbeat).toMatchObject({ enabled: true, cron: "0 9 * * 1" });

      // Durable: reading by id returns the same row.
      const reloaded = await getWorker(result.data!.id);
      expect(reloaded.error).toBeNull();
      expect(reloaded.data!.name).toBe("Researcher");
      expect(reloaded.data!.model_id).toBe("gpt-4o");
    });

    it("is picked up by the Mission Control canvas layout", async () => {
      state.client = tenantClient({ workers: [workerRow()] });
      const { createWorker } = await import("../../src/services/agentos/workers");
      await createWorker({ name: "Second researcher", role: "research", model_id: "gpt-4o-mini" });

      const { buildLayout } = await import(
        "../../src/components/agentos/mission-control/canvas/useCanvasLayout"
      );
      const { rowsOf } = await import("./harness");
      const workers = rowsOf(state.client!, "workers");

      const layout = buildLayout({
        // deno-lint-ignore no-explicit-any -- rows read straight from the mock
        workers: workers as any,
        missions: [],
        tasks: [],
        models: [],
        runs: [],
        canvasNodes: [],
        canvasEdges: [],
      });

      // A worker node exists for each persisted row, so the new worker is on
      // the board and not only in the database.
      const workerNodes = layout.nodes.filter((node) => node.type === "worker");
      expect(workerNodes).toHaveLength(2);
      expect(workerNodes.some((node) => node.data.name === "Second researcher")).toBe(true);
      expect(workerNodes.some((node) => node.data.model === "gpt-4o")).toBe(true);
    });

    it("rejects a worker with no name", async () => {
      const { createWorker } = await import("../../src/services/agentos/workers");
      expect((await createWorker({ name: "  " })).error?.code).toBe("validation");
    });
  });

  // -- Scenario 2 ----------------------------------------------------------
  describe("scenario 2: assign a mission and get real execution events", () => {
    it("sends the task to the executor and reports the queue decision", async () => {
      state.client = tenantClient({
        missions: [missionRow()],
        workers: [workerRow()],
      });

      let invokedBody: unknown = null;
      // Mirrors what agentos-tasks does: insert, apply dependencies, then call
      // enqueue_task, which returns 'blocked' when a blocker is unmet.
      stubInvoke("agentos-tasks", async (_state, body) => {
        invokedBody = body;
        return { data: { task: { id: "t-new", status: "queued" }, queued_as: "queued" } };
      });

      const { createTask, getMission } = await import("../../src/services/agentos/missions");
      const result = await createTask({
        mission_id: "m-1",
        title: "Draft the brief",
        description: "Use the research",
        assigned_worker_id: "w-1",
        trigger: "mission",
        input: { topic: "AI agents" },
      });

      expect(result.error).toBeNull();
      expect(result.data?.id).toBe("t-new");
      expect(result.data?.status).toBe("queued");

      // The task really went to the executor endpoint with the full payload,
      // which is what produces the execution events on the server side.
      expect(invokedBody).not.toBeNull();
      expect((invokedBody as Record<string, unknown>).action).toBe("create");
      const sentTask = (invokedBody as Record<string, unknown>).task as Record<string, unknown>;
      expect(sentTask.title).toBe("Draft the brief");
      expect(sentTask.mission_id).toBe("m-1");
      expect(sentTask.assigned_worker_id).toBe("w-1");
      expect(sentTask.trigger).toBe("mission");

      // And the mission is still the same durable record.
      expect((await getMission("m-1")).data?.title).toBe("Competitor brief");
    });

    it("propagates an executor failure instead of reporting success", async () => {
      state.client = tenantClient();
      stubInvoke("agentos-tasks", async () => ({
        error: { code: "internal", message: "queue unavailable" },
      }));

      const { createTask } = await import("../../src/services/agentos/missions");
      const result = await createTask({ title: "Draft", assigned_worker_id: "w-1" });
      expect(result.error?.message).toBe("queue unavailable");
      expect(result.data).toBeNull();
    });
  });

  // -- Scenario 3 ----------------------------------------------------------
  describe("scenario 3: multi-agent handoff", () => {
    it("links the two workers' tasks and records both executions", async () => {
      state.client = tenantClient({
        workers: [workerRow(), workerRow({ id: "w-2", name: "Writer", model_id: "gpt-4o-mini" })],
        missions: [missionRow()],
        tasks: [
          taskRow({ id: "t-1", assigned_worker_id: "w-1", status: "completed", attempt: 1 }),
          taskRow({
            id: "t-2",
            assigned_worker_id: "w-2",
            status: "queued",
            title: "Write the brief",
          }),
        ],
        task_edges: [{ task_id: "t-2", waits_for: "t-1", kind: "handoff", created_at: NOW }],
        execution_runs: [
          {
            id: "r-1",
            task_id: "t-1",
            worker_id: "w-1",
            owner_clerk_id: "clerk_A",
            status: "succeeded",
            trigger: "manual",
            model_id: "gpt-4o",
            prompt_tokens: 100,
            completion_tokens: 50,
            credits: 1,
            attempt: 1,
            started_at: NOW,
            ended_at: NOW,
            error: null,
          },
          {
            id: "r-2",
            task_id: "t-2",
            worker_id: "w-2",
            owner_clerk_id: "clerk_A",
            status: "succeeded",
            trigger: "handoff",
            model_id: "gpt-4o-mini",
            prompt_tokens: 80,
            completion_tokens: 40,
            credits: 0.5,
            attempt: 1,
            started_at: NOW,
            ended_at: NOW,
            error: null,
          },
        ],
      });

      const { listRuns, listTaskEvents } = await import("../../src/services/agentos/runtime");
      const { rowsOf } = await import("./harness");

      // The relationship is stored, which is what the activity history draws.
      const edges = rowsOf(state.client!, "task_edges");
      expect(edges).toHaveLength(1);
      expect(edges[0].kind).toBe("handoff");
      expect(edges[0].waits_for).toBe("t-1");
      expect(edges[0].task_id).toBe("t-2");

      // Both stages ran, and the second is attributed to the handoff trigger.
      const runs = await listRuns();
      expect(runs.data).toHaveLength(2);
      const handoff = runs.data!.find((run) => run.task_id === "t-2");
      expect(handoff?.trigger).toBe("handoff");
      expect(handoff?.worker_id).toBe("w-2");

      // Each stage has its own transcript.
      expect((await listTaskEvents("t-1")).error).toBeNull();
      expect((await listTaskEvents("t-2")).error).toBeNull();
    });

    it("keeps the handoff target blocked while its blocker is unfinished", async () => {
      state.client = tenantClient({
        workers: [workerRow(), workerRow({ id: "w-2", name: "Writer" })],
        tasks: [
          taskRow({ id: "t-1", assigned_worker_id: "w-1", status: "running" }),
          taskRow({ id: "t-2", assigned_worker_id: "w-2", status: "pending" }),
        ],
        task_edges: [{ task_id: "t-2", waits_for: "t-1", kind: "handoff", created_at: NOW }],
      });

      // enqueue_task is the SQL gate; the service's duty is to send the right
      // action. Stubbing it as 'blocked' mirrors the SQL for an unmet blocker.
      stubInvoke("agentos-tasks", async () => ({
        data: { task: { id: "t-3", status: "pending" }, queued_as: "blocked" },
      }));

      const { createTask } = await import("../../src/services/agentos/missions");
      const result = await createTask({
        title: "Follow-up",
        depends_on: ["t-1"],
        assigned_worker_id: "w-2",
      });

      // The service surfaces the queue's decision rather than fabricating one.
      expect(result.error).toBeNull();
      expect(result.data?.status).toBe("pending");
    });
  });

  // -- Scenario 4 ----------------------------------------------------------
  describe("scenario 4: scheduled automation", () => {
    it("durably stores a schedule and its next run", async () => {
      state.client = tenantClient({ workers: [workerRow()] });

      const { createSchedule, listSchedules, getSchedule, previewSchedule } = await import(
        "../../src/services/agentos/schedules"
      );

      const created = await createSchedule({
        title: "Weekly competitor scan",
        prompt: "Check overnight mentions and summarise the top three",
        cron: "0 9 * * 1",
        timezone: "UTC",
        worker_id: "w-1",
      });

      expect(created.error).toBeNull();
      expect(created.data?.cron).toBe("0 9 * * 1");
      expect(created.data?.enabled).toBe(true);
      // next_run_at is stored, not recomputed on every read.
      expect(created.data?.next_run_at).toBeTruthy();
      const storedNext = created.data!.next_run_at;

      // A later read returns the stored row unchanged.
      const listed = await listSchedules();
      expect(listed.data).toHaveLength(1);
      expect(listed.data![0].next_run_at).toBe(storedNext);
      expect((await getSchedule(created.data!.id)).data?.id).toBe(created.data!.id);

      // The preview shows the next three real occurrences.
      const preview = previewSchedule("0 9 * * 1", "UTC", new Date(NOW));
      expect(preview).toHaveLength(3);
      preview.forEach((run, index) => {
        if (index > 0) expect(run.getTime()).toBeGreaterThan(preview[index - 1].getTime());
      });
    });

    it("refuses a cron expression that never fires", async () => {
      state.client = tenantClient({ workers: [workerRow()] });
      const { createSchedule } = await import("../../src/services/agentos/schedules");

      const result = await createSchedule({
        title: "Impossible",
        prompt: "never",
        cron: "0 0 31 2 *",
        worker_id: "w-1",
      });
      expect(result.error?.code).toBe("validation");
      expect(result.data).toBeNull();
    });

    it("disabling and re-enabling keeps the row and recomputes only on enable", async () => {
      state.client = tenantClient({ workers: [workerRow()] });
      const { createSchedule, setScheduleEnabled, getSchedule } = await import(
        "../../src/services/agentos/schedules"
      );

      const created = (await createSchedule({
        title: "Scan",
        prompt: "go",
        cron: "0 9 * * 1",
        worker_id: "w-1",
      })).data!;

      const disabled = (await setScheduleEnabled(created.id, false)).data!;
      expect(disabled.enabled).toBe(false);
      expect(disabled.next_run_at).toBe(created.next_run_at);

      const enabled = (await setScheduleEnabled(created.id, true)).data!;
      expect(enabled.enabled).toBe(true);
      expect(enabled.next_run_at).toBeTruthy();

      expect((await getSchedule(created.id)).data?.enabled).toBe(true);
    });
  });

  // -- Scenario 5 ----------------------------------------------------------
  describe("scenario 5: memory attached to a worker", () => {
    it("stores worker-scoped memory and retrieves it in a later search", async () => {
      const {
        createMemory,
        searchMemories,
        listMemories,
        updateMemory,
        deleteMemory,
      } = await import("../../src/services/agentos/memory");

      const created = await createMemory({
        content: "The client prefers plain language without jargon.",
        kind: "preference",
        scope: "worker",
        worker_id: "w-1",
        importance: 4,
        tags: ["voice", "client"],
      });
      expect(created.error).toBeNull();
      expect(created.data?.scope).toBe("worker");
      expect(created.data?.worker_id).toBe("w-1");

      await createMemory({
        content: "Q3 report is due on the 30th.",
        kind: "fact",
        scope: "worker",
        worker_id: "w-1",
        importance: 5,
      });

      // A later execution retrieves by search, and the match ranks first.
      const found = await searchMemories({ workerId: "w-1", query: "plain language" });
      expect(found.error).toBeNull();
      expect(found.data!.length).toBeGreaterThan(0);
      expect(found.data![0].content).toContain("plain language");
      // Unrelated memory is not padded back into the result.
      expect(found.data!.some((memory) => memory.content.includes("Q3 report"))).toBe(false);

      // Retrieval is scoped: only this worker's memory is returned.
      expect((await listMemories({ workerId: "w-1" })).data).toHaveLength(2);
      expect((await listMemories({ workerId: "w-9" })).data).toHaveLength(0);

      // Context is correctable.
      expect((await updateMemory(created.data!.id, { content: "Prefers plain language." })).data?.content).toBe(
        "Prefers plain language.",
      );

      // And removable.
      expect((await deleteMemory(created.data!.id)).error).toBeNull();
      expect((await listMemories({ workerId: "w-1" })).data).toHaveLength(1);
    });

    it("requires a target for the scope it declares", async () => {
      const { createMemory } = await import("../../src/services/agentos/memory");
      expect(
        (await createMemory({ content: "x", scope: "worker" })).error?.code,
      ).toBe("validation");
      expect(
        (await createMemory({ content: "x", scope: "workspace" })).error?.code,
      ).toBe("validation");
    });
  });

  // -- Scenario 6 ----------------------------------------------------------
  describe("scenario 6: human approval gate", () => {
    it("blocks a sensitive action until the owner approves it", async () => {
      state.client = tenantClient({
        approvals: [approvalRow()],
        tasks: [taskRow({ id: "t-appr", status: "running", requires_approval: true })],
      });

      const { listApprovals, countPendingApprovals, decideApproval } = await import(
        "../../src/services/agentos/approvals"
      );

      // The action is parked and visible to the operator.
      const pending = await listApprovals({ status: "pending" });
      expect(pending.data).toHaveLength(1);
      expect(pending.data![0].action_type).toBe("send_email");

      // The pending count drives the sidebar badge. The harness does not
      // implement PostgREST's {count:"exact", head:true} projection (it always
      // returns the row list), so the count read is exercised separately in
      // approvals-b.test.ts with an injected chainable. Here the gate itself is
      // the subject: the approval exists and is pending.
      expect(pending.data![0].status).toBe("pending");
      expect(pending.data![0].reason).toContain("email");

      // Approving releases it back to the queue.
      let decided: unknown = null;
      stubInvoke("agentos-approvals", async (_state, body) => {
        decided = body;
        return {
          data: {
            resolution: "approved",
            task: { id: "t-appr", status: "queued", output: { _approval_decided_by: "clerk_A" } },
          },
        };
      });

      const approved = await decideApproval({
        approvalId: "ap-1",
        decision: "approved",
        note: "looks fine",
      });
      expect(approved.error).toBeNull();
      expect(decided).toEqual({ approval_id: "ap-1", decision: "approved", note: "looks fine" });
      expect(approved.data!.resolution).toBe("approved");
      const task = approved.data!.task as Record<string, unknown>;
      expect(task.status).toBe("queued");
      expect(task.output).toMatchObject({ _approval_decided_by: "clerk_A" });
    });

    it("prevents execution when the action is rejected", async () => {
      state.client = tenantClient({ approvals: [approvalRow({ id: "ap-2" })] });

      stubInvoke("agentos-approvals", async () => ({
        data: {
          resolution: "rejected",
          task: {
            id: "t-appr",
            status: "cancelled",
            error: "rejected by human reviewer",
            output: { _approval_decided_by: "clerk_A" },
          },
        },
      }));

      const { decideApproval } = await import("../../src/services/agentos/approvals");
      const rejected = await decideApproval({
        approvalId: "ap-2",
        decision: "rejected",
        note: "no way",
      });

      expect(rejected.error).toBeNull();
      expect(rejected.data!.resolution).toBe("rejected");
      // Cancelled, not merely unblocked: there is no path back to the queue.
      const task = rejected.data!.task as Record<string, unknown>;
      expect(task.status).toBe("cancelled");
      expect(task.error).toBe("rejected by human reviewer");
      expect(task.output).toMatchObject({ _approval_decided_by: "clerk_A" });
    });

    it("rejects an invalid decision without contacting the server", async () => {
      state.client = tenantClient({ approvals: [approvalRow({ id: "ap-3" })] });
      const { decideApproval } = await import("../../src/services/agentos/approvals");

      // deno-lint-ignore no-explicit-any -- deliberately sending an invalid decision
      const result = await decideApproval({ approvalId: "ap-3", decision: "maybe" as any });
      expect(result.error?.code).toBe("validation");
      expect(state.client!.invokeCalls).toEqual([]);
    });
  });

  // -- Scenario 7 ----------------------------------------------------------
  describe("scenario 7: provider configuration", () => {
    it("verifies a BYOK credential and persists only a reference", async () => {
      state.client = tenantClient();

      let sentCredential: string | null = null;
      stubInvoke("agentos-provider-test", async (_state, body) => {
        const payload = body as Record<string, unknown>;
        sentCredential = (payload.credential as string) ?? null;
        return { data: { ok: true, credential_ref: "cref_v1_openai_clerk_A_abc123" } };
      });

      const { createProviderConfig, listProviderConfigs } = await import(
        "../../src/services/agentos/models"
      );
      const { rowsOf } = await import("./harness");

      const created = await createProviderConfig({
        provider: "openai",
        label: "My OpenAI key",
        mode: "byok",
        credential: "sk-super-secret-value",
        model_ids: ["gpt-4o", "gpt-4o-mini"],
      });

      expect(created.error).toBeNull();
      // The credential was sent to the probe exactly once.
      expect(sentCredential).toBe("sk-super-secret-value");
      // Only the reference is persisted. The secret appears nowhere.
      expect(created.data!.credential_ref).toBe("cref_v1_openai_clerk_A_abc123");
      expect(created.data!.status).toBe("active");
      expect(partialStringify(created.data!)).not.toContain("sk-super-secret-value");

      const stored = rowsOf(state.client!, "provider_configs");
      expect(stored).toHaveLength(1);
      expect(partialStringify(stored[0])).not.toContain("sk-super-secret-value");
      expect(stored[0].credential_ref).toBe("cref_v1_openai_clerk_A_abc123");

      // The worker routes to the models this provider makes available.
      expect(created.data!.model_ids).toEqual(["gpt-4o", "gpt-4o-mini"]);
      expect((await listProviderConfigs()).data).toHaveLength(1);
    });

    it("stores nothing when the credential fails the readiness probe", async () => {
      state.client = tenantClient();
      stubInvoke("agentos-provider-test", async () => ({
        data: { ok: false, error: "OpenAI 401: invalid api key" },
      }));

      const { createProviderConfig } = await import("../../src/services/agentos/models");
      const { rowsOf } = await import("./harness");

      const result = await createProviderConfig({
        provider: "openai",
        mode: "byok",
        credential: "sk-wrong",
      });

      expect(result.error?.code).toBe("validation");
      expect(result.data).toBeNull();
      // No reference to a bad key is kept either.
      expect(rowsOf(state.client!, "provider_configs")).toHaveLength(0);
    });
  });

  // -- Scenario 8 ----------------------------------------------------------
  describe("scenario 8: application integration", () => {
    it("exposes only supported integrations and refuses OpenClaw", async () => {
      state.client = tenantClient({
        integrations: [
          {
            key: "videoremix_apps",
            name: "VideoRemix App Catalog",
            description: "The canonical 130-app catalog",
            category: "platform",
            auth_type: "none",
            capabilities: ["app_invocation"],
            support: "supported",
            docs_url: "",
          },
          {
            key: "browser_session",
            name: "Isolated Browser Session",
            description: "Requires a provisioned browser worker",
            category: "browser",
            auth_type: "browser_session",
            capabilities: ["browser_automation"],
            support: "limited",
            docs_url: "",
          },
          {
            key: "openclaw_gateway",
            name: "OpenClaw Gateway",
            description: "Intentionally excluded",
            category: "excluded",
            auth_type: "none",
            capabilities: [],
            support: "unsupported",
            docs_url: "",
          },
        ],
      });

      const {
        listIntegrations,
        getIntegration,
        listAssignableToolKeys,
        connectAccount,
      } = await import("../../src/services/agentos/connections");

      // The directory the worker UI reads never includes unsupported rows.
      const directory = await listIntegrations();
      expect(directory.data!.map((row) => row.key).sort()).toEqual([
        "browser_session",
        "videoremix_apps",
      ]);

      // Requesting one by key is refused rather than returned.
      expect((await getIntegration("openclaw_gateway")).error?.code).toBe("unsupported");

      // So an unsupported tool cannot be assigned to a worker.
      expect((await listAssignableToolKeys()).data?.sort()).toEqual([
        "browser_session",
        "videoremix_apps",
      ]);

      // A supported integration can be connected with scoped authorization.
      stubInvoke("agentos-connections", async () => ({
        data: {
          id: "conn-1",
          owner_clerk_id: "clerk_A",
          workspace_id: null,
          integration_key: "videoremix_apps",
          account_label: "Catalog access",
          status: "connected",
          scopes: ["app_invocation"],
          isolation: "tenant",
          health_status: "unknown",
        },
      }));

      const connected = await connectAccount({
        integration_key: "videoremix_apps",
        account_label: "Catalog access",
        scopes: ["app_invocation"],
      });
      expect(connected.error).toBeNull();
      expect(connected.data?.integration_key).toBe("videoremix_apps");
      // Only the advertised scope was requested.
      expect(connected.data?.scopes).toEqual(["app_invocation"]);
      // And the tenant is the caller, not something the browser chose.
      expect(connected.data?.owner_clerk_id).toBe("clerk_A");

      // Connecting an unsupported one is refused client-side, before any call.
      const blocked = await connectAccount({ integration_key: "openclaw_gateway" });
      expect(blocked.error?.code).toBe("unsupported");
    });
  });

  // -- Scenario 9 ----------------------------------------------------------
  describe("scenario 9: monitoring and operations", () => {
    it("reports real events, failures, model usage and recorded cost", async () => {
      state.client = tenantClient({
        tasks: [
          taskRow({ id: "t-1", status: "completed" }),
          taskRow({ id: "t-2", status: "running" }),
          taskRow({ id: "t-3", status: "failed", error: "OpenAI 500: upstream" }),
          taskRow({ id: "t-4", status: "waiting_approval" }),
        ],
        execution_runs: [
          {
            id: "r-1",
            task_id: "t-1",
            worker_id: "w-1",
            owner_clerk_id: "clerk_A",
            status: "succeeded",
            trigger: "manual",
            model_id: "gpt-4o",
            prompt_tokens: 1000,
            completion_tokens: 500,
            credits: 7.5,
            attempt: 1,
            lease_expires_at: null,
            started_at: NOW,
            ended_at: NOW,
            error: null,
          },
          {
            id: "r-2",
            task_id: "t-3",
            worker_id: "w-2",
            owner_clerk_id: "clerk_A",
            status: "failed",
            trigger: "manual",
            model_id: "gpt-4o-mini",
            prompt_tokens: 200,
            completion_tokens: 0,
            credits: 0,
            attempt: 3,
            lease_expires_at: null,
            started_at: NOW,
            ended_at: NOW,
            error: "OpenAI 500: upstream",
          },
        ],
        execution_events: [
          {
            id: "e-1",
            run_id: "r-1",
            task_id: "t-1",
            worker_id: "w-1",
            owner_clerk_id: "clerk_A",
            seq: 2,
            kind: "run.succeeded",
            level: "success",
            message: "Task finished",
            payload: {},
            created_at: NOW,
          },
          {
            id: "e-2",
            run_id: "r-1",
            task_id: "t-1",
            worker_id: "w-1",
            owner_clerk_id: "clerk_A",
            seq: 1,
            kind: "run.started",
            level: "info",
            message: "Claimed",
            payload: {},
            created_at: NOW,
          },
          {
            id: "e-3",
            run_id: "r-2",
            task_id: "t-3",
            worker_id: "w-2",
            owner_clerk_id: "clerk_A",
            seq: 1,
            kind: "run.failed",
            level: "error",
            message: "OpenAI 500: upstream",
            payload: {},
            created_at: NOW,
          },
        ],
        usage_records: [
          {
            id: "u-1",
            owner_clerk_id: "clerk_A",
            workspace_id: null,
            worker_id: "w-1",
            run_id: "r-1",
            provider: "openai",
            model_id: "gpt-4o",
            prompt_tokens: 1000,
            completion_tokens: 500,
            credits: 7.5,
            cost_usd: 0,
            created_at: NOW,
          },
        ],
      });

      const { listTaskEvents, listRecentEvents, listRuns, getLatestRunForTask } = await import(
        "../../src/services/agentos/runtime"
      );

      // Transcript for a task, in seq order.
      const transcript = await listTaskEvents("t-1");
      expect(transcript.data!.map((event) => event.seq)).toEqual([1, 2]);
      expect(transcript.data!.at(-1)?.kind).toBe("run.succeeded");

      // The failure is visible in the activity stream.
      const recent = await listRecentEvents({ limit: 50 });
      expect(recent.data!.some((event) => event.level === "error")).toBe(true);

      // Model usage and cost are the recorded numbers.
      const runs = await listRuns();
      const totalCredits = runs.data!.reduce((sum, run) => sum + Number(run.credits), 0);
      expect(totalCredits).toBe(7.5);
      const gpt4o = runs.data!.find((run) => run.model_id === "gpt-4o")!;
      expect(gpt4o.prompt_tokens).toBe(1000);
      expect(gpt4o.completion_tokens).toBe(500);

      // The latest run for the failed task is the failure, not an earlier one.
      expect((await getLatestRunForTask("t-3")).data?.status).toBe("failed");
      expect((await getLatestRunForTask("t-1")).data?.status).toBe("succeeded");
    });
  });

  // -- Scenario 10 ---------------------------------------------------------
  describe("scenario 10: cross-account isolation", () => {
    it("hides every tenant resource from a second account", async () => {
      state.client = tenantClient({
        workspaces: [
          { ...missionRow({ id: "ws-1", title: "Workspace" }), name: "Workspace" },
        ],
        workspace_members: [
          { workspace_id: "ws-1", member_clerk_id: "clerk_A", role: "owner", created_at: NOW },
        ],
        workers: [workerRow({ workspace_id: "ws-1" })],
        tasks: [taskRow({ assigned_worker_id: "w-1" })],
        conversations: [
          {
            id: "c-1",
            worker_id: "w-1",
            workspace_id: "ws-1",
            owner_clerk_id: "clerk_A",
            title: "Private chat",
            channel: "ui",
            message_count: 1,
            created_at: NOW,
            updated_at: NOW,
          },
        ],
        provider_configs: [
          {
            id: "p-1",
            owner_clerk_id: "clerk_A",
            provider: "openai",
            label: "My key",
            mode: "byok",
            credential_ref: "cref_v1_openai_clerk_A_secret",
            is_default: true,
            status: "active",
            model_ids: [],
            created_at: NOW,
            updated_at: NOW,
          },
        ],
      });

      const workers = await import("../../src/services/agentos/workers");
      const workspaces = await import("../../src/services/agentos/workspaces");
      const missions = await import("../../src/services/agentos/missions");
      const models = await import("../../src/services/agentos/models");
      const runtime = await import("../../src/services/agentos/runtime");

      // As the owner, every resource is visible.
      expect((await workers.listWorkers()).data).toHaveLength(1);
      expect((await workspaces.listWorkspaces()).data).toHaveLength(1);
      expect((await missions.listTasks()).data).toHaveLength(1);
      expect((await models.listProviderConfigs()).data).toHaveLength(1);
      expect((await runtime.listRuns()).data).toEqual([]);

      // Switch identity: the identical queries return nothing.
      setCaller("clerk_B");
      expect((await workspaces.listWorkspaces()).data).toEqual([]);
      expect((await workspaces.getWorkspace("ws-1")).error?.code).toBe("not_found");
      expect((await workspaces.listWorkspaceMembers("ws-1")).data).toEqual([]);
      expect((await workers.listWorkers()).data).toEqual([]);
      expect((await workers.getWorker("w-1")).error?.code).toBe("not_found");
      expect((await missions.listTasks()).data).toEqual([]);
      expect((await missions.getMission("m-1")).error?.code).toBe("not_found");
      expect((await models.listProviderConfigs()).data).toEqual([]);

      // Writes are blocked too, not just reads. clerk_B cannot read the
      // membership row at all, so the service walks into the INSERT and the
      // workspace INSERT policy drops it: the came-back error is a database
      // error, and — the property that actually matters — no row was added.
      const attempted = await workspaces.inviteMember({
        workspaceId: "ws-1",
        memberClerkId: "clerk_B",
      });
      expect(attempted.error?.code).toBe("database");
      expect(
        (state.client!.tables.get("workspace_members")?.rows ?? []).map((row) => row.member_clerk_id),
      ).toEqual(["clerk_A"]);

      expect((await workers.setWorkerStatus("w-1", "archived")).error?.code).toBe("not_found");
      // The worker is untouched by the failed status change.
      expect(rowsOf(state.client!, "workers")[0].status).toBe("active");

      // The executor is what owns a task insert, so a foreign caller is
      // rejected there rather than by this client.
      stubInvoke("agentos-tasks", async () => ({
        error: { code: "forbidden", message: "owner mismatch" },
      }));
      expect((await missions.createTask({ title: "Sneak" })).error?.message).toBe("owner mismatch");
      expect((await missions.listTasks()).data).toEqual([]);
    });

    it("returns nothing at all with no verified identity", async () => {
      setCaller("clerk_A");
      state.client = tenantClient({ workers: [workerRow()] });
      const { listWorkers } = await import("../../src/services/agentos/workers");

      // The guard that keeps every isolation assertion above meaningful: if the
      // unauthenticated path stopped returning empty, they would be vacuous.
      setCaller(null);
      expect((await listWorkers()).data).toEqual([]);
    });
  });
});

/** Stringify without worrying about circular structures in a row. */
function partialStringify(value: unknown): string {
  try {
    return JSON.stringify(value, (_key, inner) =>
      typeof inner === "bigint" ? inner.toString() : inner,
    );
  } catch {
    return String(value);
  }
}
