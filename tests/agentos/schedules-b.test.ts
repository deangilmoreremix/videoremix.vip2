// tests/agentos/schedules-b.test.ts
//
// Unit tests for src/services/agentos/schedules.ts against the in-memory
// Supabase harness.
//
// next_run_at is the whole contract of a schedule row: the sweep only fires
// what the browser computed as the next occurrence. These tests pin that
// createSchedule refuses anything the cron parser cannot place, and that
// updateSchedule recomputes the next run only when the timing itself changed.

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
  createSchedule,
  deleteSchedule,
  getSchedule,
  listSchedules,
  previewSchedule,
  setScheduleEnabled,
  updateSchedule,
} from "../../src/services/agentos/schedules";
import { clearStubs, createMockSupabase, seed, setCaller } from "./harness";

const NOW = "2026-10-12T10:00:00.000Z";
/** A deliberately stale next run, so recomputation is observable. */
const STALE_NEXT_RUN = "2020-01-01T09:00:00.000Z";

function scheduleRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "s1",
    owner_clerk_id: "clerk_A",
    mission_id: null,
    workspace_id: null,
    worker_id: null,
    title: "Daily digest",
    prompt: "Summarize the news",
    cron: "0 9 * * *",
    timezone: "UTC",
    enabled: true,
    input: {},
    next_run_at: STALE_NEXT_RUN,
    last_run_at: null,
    last_status: null,
    last_error: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function seededClient() {
  setCaller("clerk_A");
  const client = createMockSupabase();
  seed(client, "schedules", [scheduleRow()]);
  return client;
}

describe("schedules service", () => {
  beforeEach(() => {
    clearStubs();
    setCaller("clerk_A");
    state.client = createMockSupabase();
  });

  describe("createSchedule", () => {
    it("stores the next occurrence computed from the cron", async () => {
      const before = Date.now();
      const result = await createSchedule({
        title: "Daily digest",
        prompt: "Summarize the news",
        cron: "0 9 * * *",
      });

      expect(result.error).toBeNull();
      expect(result.data?.cron).toBe("0 9 * * *");
      expect(result.data?.enabled).toBe(true);
      // Owner comes from the DB trigger, not the caller.
      expect(result.data?.owner_clerk_id).toBe("clerk_A");

      const nextRun = new Date(result.data!.next_run_at!);
      expect(nextRun.getTime()).toBeGreaterThan(before);
      // The 09:00 wall clock comes from the cron, not from "now".
      expect(nextRun.getUTCHours()).toBe(9);
      expect(nextRun.getUTCMinutes()).toBe(0);
    });

    it("rejects a blank title without hitting the database", async () => {
      const result = await createSchedule({ title: "  ", prompt: "Summarize", cron: "0 9 * * *" });
      expect(result.error?.code).toBe("validation");
      expect(result.data).toBeNull();
      expect(state.client?.calls.filter((call) => call.op === "insert")).toEqual([]);
    });

    it("rejects a blank prompt without hitting the database", async () => {
      const result = await createSchedule({ title: "Daily digest", prompt: "  ", cron: "0 9 * * *" });
      expect(result.error?.code).toBe("validation");
      expect(result.data).toBeNull();
      expect(state.client?.calls.filter((call) => call.op === "insert")).toEqual([]);
    });

    it("rejects an unparseable cron without hitting the database", async () => {
      expect(
        (await createSchedule({ title: "Daily digest", prompt: "Summarize", cron: "*/5 * * *" }))
          .error?.code,
      ).toBe("validation");
      expect(
        (await createSchedule({ title: "Daily digest", prompt: "Summarize", cron: "60 * * * *" }))
          .error?.code,
      ).toBe("validation");
      expect(state.client?.calls.filter((call) => call.op === "insert")).toEqual([]);
    });

    it("rejects a cron that never matches a future time", async () => {
      // 31 February does not exist, so there is no occurrence to record.
      const result = await createSchedule({
        title: "Daily digest",
        prompt: "Summarize",
        cron: "0 0 31 2 *",
      });
      expect(result.error?.code).toBe("validation");
      expect(result.error?.message).toMatch(/never matches/i);
      expect(result.data).toBeNull();
      expect(state.client?.calls.filter((call) => call.op === "insert")).toEqual([]);
    });
  });

  describe("updateSchedule", () => {
    it("patches only the supplied fields", async () => {
      state.client = seededClient();
      const result = await updateSchedule("s1", { title: "Weekly digest" });
      expect(result.error).toBeNull();
      expect(result.data?.title).toBe("Weekly digest");
      expect(result.data?.prompt).toBe("Summarize the news");
    });

    it("recomputes next_run_at when the cron changes", async () => {
      state.client = seededClient();
      const result = await updateSchedule("s1", { cron: "30 8 * * *" });
      expect(result.error).toBeNull();
      expect(result.data?.cron).toBe("30 8 * * *");
      expect(result.data?.next_run_at).not.toBe(STALE_NEXT_RUN);

      const nextRun = new Date(result.data!.next_run_at!);
      expect(nextRun.getTime()).toBeGreaterThan(Date.now());
      expect(nextRun.getUTCHours()).toBe(8);
      expect(nextRun.getUTCMinutes()).toBe(30);
    });

    it("leaves next_run_at alone when only the input changes", async () => {
      state.client = seededClient();
      const result = await updateSchedule("s1", { input: { channel: "#general" } });
      expect(result.error).toBeNull();
      expect(result.data?.input).toEqual({ channel: "#general" });
      // No timing field was supplied, so the stored next run survives untouched.
      expect(result.data?.next_run_at).toBe(STALE_NEXT_RUN);
    });

    it("requires an id", async () => {
      expect((await updateSchedule("", { title: "Weekly digest" })).error?.code).toBe("validation");
    });
  });

  describe("setScheduleEnabled", () => {
    it("disabling keeps the stored next_run_at", async () => {
      state.client = seededClient();
      const result = await setScheduleEnabled("s1", false);
      expect(result.error).toBeNull();
      expect(result.data?.enabled).toBe(false);
      expect(result.data?.next_run_at).toBe(STALE_NEXT_RUN);
    });

    it("enabling recomputes next_run_at", async () => {
      state.client = seededClient();
      const result = await setScheduleEnabled("s1", true);
      expect(result.error).toBeNull();
      expect(result.data?.enabled).toBe(true);
      expect(result.data?.next_run_at).not.toBe(STALE_NEXT_RUN);
      expect(new Date(result.data!.next_run_at!).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("deleteSchedule", () => {
    it("removes the schedule", async () => {
      state.client = seededClient();
      expect((await deleteSchedule("s1")).error).toBeNull();
      expect((await listSchedules()).data).toEqual([]);
    });

    it("requires an id", async () => {
      expect((await deleteSchedule("")).error?.code).toBe("validation");
    });
  });

  describe("previewSchedule", () => {
    it("previews exactly three future runs for a valid cron", () => {
      const from = new Date("2026-10-14T00:00:00.000Z");
      const runs = previewSchedule("0 9 * * *", "UTC", from);
      expect(runs.map((run) => run.toISOString())).toEqual([
        "2026-10-14T09:00:00.000Z",
        "2026-10-15T09:00:00.000Z",
        "2026-10-16T09:00:00.000Z",
      ]);
    });

    it("previews nothing for an unparseable cron", () => {
      expect(previewSchedule("not a cron", "UTC")).toEqual([]);
    });

    it("previews nothing for a cron that never matches", () => {
      expect(previewSchedule("0 0 31 2 *", "UTC")).toEqual([]);
    });
  });

  describe("tenant isolation", () => {
    it("returns nothing for a different tenant", async () => {
      state.client = seededClient();
      setCaller("clerk_B");

      const listed = await listSchedules();
      expect(listed.error).toBeNull();
      expect(listed.data).toEqual([]);

      const single = await getSchedule("s1");
      expect(single.error?.code).toBe("not_found");
    });

    it("refuses to enable another tenant's schedule", async () => {
      state.client = seededClient();
      setCaller("clerk_B");
      // RLS turns the update into a zero-row write, which .single() reports.
      expect((await setScheduleEnabled("s1", false)).error?.code).toBe("database");
    });
  });
});
