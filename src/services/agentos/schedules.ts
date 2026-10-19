// src/services/agentos/schedules.ts
//
// Recurring automation.
//
// SCHEDULES DO NOT FIRE BY THEMSELVES
//   A schedule row only records intent and the next occurrence. Something has
//   to call the agentos-sweep edge function on a timer for a due schedule to
//   become a task (see supabase/functions/agentos-sweep/index.ts). The UI says
//   so explicitly instead of implying continuous execution.

import { agentosDb, agentosErrorMessage } from "./client";
import {
  err,
  ok,
  type AgentOSResult,
  type Schedule,
} from "../../types/agentos";
import { nextCronRun } from "./cron";

export async function listSchedules(): Promise<AgentOSResult<Schedule[]>> {
  const { data, error } = await agentosDb
    .from("schedules")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return err("database", "Could not load schedules", agentosErrorMessage(error));
  return ok((data ?? []) as Schedule[]);
}

export async function getSchedule(scheduleId: string): Promise<AgentOSResult<Schedule>> {
  if (!scheduleId) return err("validation", "scheduleId is required");

  const { data, error } = await agentosDb
    .from("schedules")
    .select("*")
    .eq("id", scheduleId)
    .maybeSingle();

  if (error) return err("database", "Could not load schedule", agentosErrorMessage(error));
  if (!data) return err("not_found", "Schedule not found");
  return ok(data as Schedule);
}

export interface CreateScheduleInput {
  title: string;
  prompt: string;
  cron: string;
  timezone?: string;
  worker_id?: string | null;
  mission_id?: string | null;
  workspace_id?: string | null;
  input?: Record<string, unknown>;
  enabled?: boolean;
}

export async function createSchedule(input: CreateScheduleInput): Promise<AgentOSResult<Schedule>> {
  if (!input.title || !input.title.trim()) {
    return err("validation", "Give the schedule a title");
  }
  if (!input.prompt || !input.prompt.trim()) {
    return err("validation", "Add the prompt this schedule will run");
  }

  const next = nextCronRun(input.cron, input.timezone ?? "UTC", new Date());
  if (!next) {
    return err("validation", "That cron expression never matches a future time");
  }

  const { data, error } = await agentosDb
    .from("schedules")
    .insert({
      title: input.title.trim(),
      prompt: input.prompt,
      cron: input.cron.trim(),
      timezone: input.timezone ?? "UTC",
      worker_id: input.worker_id ?? null,
      mission_id: input.mission_id ?? null,
      workspace_id: input.workspace_id ?? null,
      input: input.input ?? {},
      enabled: input.enabled ?? true,
      next_run_at: next.toISOString(),
    })
    .select("*")
    .single();

  if (error) return err("database", "Could not create schedule", agentosErrorMessage(error));
  return ok(data as Schedule);
}

export interface UpdateScheduleInput {
  title?: string;
  prompt?: string;
  cron?: string;
  timezone?: string;
  worker_id?: string | null;
  mission_id?: string | null;
  input?: Record<string, unknown>;
  enabled?: boolean;
}

export async function updateSchedule(
  scheduleId: string,
  input: UpdateScheduleInput,
): Promise<AgentOSResult<Schedule>> {
  if (!scheduleId) return err("validation", "scheduleId is required");

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) {
    if (!input.title.trim()) return err("validation", "Give the schedule a title");
    patch.title = input.title.trim();
  }
  if (input.prompt !== undefined) patch.prompt = input.prompt;
  if (input.cron !== undefined || input.timezone !== undefined || input.enabled !== undefined) {
    const current = await getSchedule(scheduleId);
    if (current.error || !current.data) return current;
    const cron = input.cron ?? current.data.cron;
    const timezone = input.timezone ?? current.data.timezone;
    patch.cron = cron.trim();
    patch.timezone = timezone;

    const next = nextCronRun(patch.cron as string, patch.timezone as string, new Date());
    if (!next) return err("validation", "That cron expression never matches a future time");
    // Only recompute next_run_at when the timing itself changed; toggling
    // enabled must not push a due schedule further out.
    if (input.cron || input.timezone || input.enabled) {
      patch.next_run_at = next.toISOString();
    }
  }
  if (input.worker_id !== undefined) patch.worker_id = input.worker_id;
  if (input.mission_id !== undefined) patch.mission_id = input.mission_id;
  if (input.input !== undefined) patch.input = input.input;
  if (input.enabled !== undefined) patch.enabled = input.enabled;

  const { data, error } = await agentosDb
    .from("schedules")
    .update(patch)
    .eq("id", scheduleId)
    .select("*")
    .single();

  if (error) return err("database", "Could not update schedule", agentosErrorMessage(error));
  return ok(data as Schedule);
}

export async function deleteSchedule(scheduleId: string): Promise<AgentOSResult<{ id: string }>> {
  if (!scheduleId) return err("validation", "scheduleId is required");

  const { error } = await agentosDb.from("schedules").delete().eq("id", scheduleId);
  if (error) return err("database", "Could not delete schedule", agentosErrorMessage(error));
  return ok({ id: scheduleId });
}

export async function setScheduleEnabled(
  scheduleId: string,
  enabled: boolean,
): Promise<AgentOSResult<Schedule>> {
  if (!scheduleId) return err("validation", "scheduleId is required");

  const patch: Record<string, unknown> = { enabled };
  if (enabled) {
    const current = await getSchedule(scheduleId);
    if (current.error || !current.data) return current;
    const next = nextCronRun(current.data.cron, current.data.timezone, new Date());
    if (next) patch.next_run_at = next.toISOString();
  }

  const { data, error } = await agentosDb
    .from("schedules")
    .update(patch)
    .eq("id", scheduleId)
    .select("*")
    .single();

  if (error) return err("database", "Could not change schedule state", agentosErrorMessage(error));
  return ok(data as Schedule);
}

/** Next three occurrences, for the preview widget. */
export function previewSchedule(
  cron: string,
  timezone: string,
  from: Date = new Date(),
): Date[] {
  const runs: Date[] = [];
  let cursor = from;
  for (let index = 0; index < 3; index += 1) {
    const next = nextCronRun(cron, timezone, cursor);
    if (!next) break;
    runs.push(next);
    cursor = next;
  }
  return runs;
}
