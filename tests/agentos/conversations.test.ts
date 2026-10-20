// tests/agentos/conversations.test.ts
//
// Unit tests for src/services/agentos/conversations.ts against the in-memory
// Supabase harness.
//
// The behaviour these pin is the one the panel depends on:
//   1. Sending a message opens (or reuses) a thread, writes the person's turn
//      and queues a task that carries the prompt AND the thread id, because
//      the runtime has to know where the answer belongs.
//   2. A thread the caller does not own cannot be written to, and the refusal
//      is reported — never swallowed, because a swallowed refusal looks
//      exactly like a message that went nowhere.

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
  appendMessage,
  listConversations,
  listMessages,
  sendWorkerMessage,
} from "../../src/services/agentos/conversations";
import { createMockSupabase, rowsOf, setCaller, stubInvoke } from "./harness";

describe("AgentOS conversations", () => {
  beforeEach(() => {
    state.client = createMockSupabase({
      // The real policy: a message may only be written into a conversation the
      // caller owns or one in a workspace they belong to.
      messages: {
        ownerOf: (row) => (row.owner_clerk_id as string) ?? null,
        writableBy: (row, caller) => {
          if (!caller) return false;
          const conversation = state.client?.tables
            .get("conversations")
            ?.rows.find((candidate) => candidate.id === row?.conversation_id);
          return conversation?.owner_clerk_id === caller;
        },
      },
    });
    setCaller("clerk_A");

    // The edge function owns the queue: the browser sends the intent.
    stubInvoke("agentos-tasks", async (_state, body) => {
      const task = (body.task ?? {}) as Record<string, unknown>;
      return {
        data: {
          task: {
            id: "task_1",
            title: task.title,
            status: "queued",
            owner_clerk_id: "clerk_A",
            input: task.input ?? {},
            assigned_worker_id: task.assigned_worker_id ?? null,
            created_at: "2026-10-12T10:00:00.000Z",
          },
        },
      };
    });
  });

  it("opens a thread, writes the turn and queues the task", async () => {
    const result = await sendWorkerMessage({
      workerId: "worker_1",
      workspaceId: null,
      message: "Summarise the competitor pricing page.",
    });

    expect(result.error).toBeNull();
    expect(result.data?.conversation.title).toBe("Summarise the competitor pricing page.");
    expect(result.data?.message.role).toBe("user");
    expect(result.data?.message.content).toBe("Summarise the competitor pricing page.");
    expect(result.data?.task.id).toBe("task_1");

    const conversations = rowsOf(state.client!, "conversations");
    expect(conversations).toHaveLength(1);
    expect(conversations[0].owner_clerk_id).toBe("clerk_A");

    const messages = rowsOf(state.client!, "messages");
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe("user");
  });

  it("carries the prompt and the thread id into the task", async () => {
    const result = await sendWorkerMessage({
      workerId: "worker_1",
      message: "What changed this week?",
    });

    const invoke = state.client!.invokeCalls.find((call) => call.name === "agentos-tasks");
    const body = invoke?.body as { task: Record<string, unknown> };
    expect(body.task.assigned_worker_id).toBe("worker_1");
    expect(body.task.trigger).toBe("manual");
    // The runtime answers into this thread, so the id travels with the task.
    expect(body.task.input).toEqual({
      prompt: "What changed this week?",
      conversation_id: result.data?.conversation.id,
    });
  });

  it("writes into an existing thread without opening a second one", async () => {
    const first = await sendWorkerMessage({ workerId: "worker_1", message: "one" });
    const second = await sendWorkerMessage({
      workerId: "worker_1",
      conversationId: first.data!.conversation.id,
      message: "two",
    });

    expect(second.error).toBeNull();
    expect(rowsOf(state.client!, "conversations")).toHaveLength(1);
    expect(rowsOf(state.client!, "messages")).toHaveLength(2);
  });

  it("lists the worker's conversations and the turns of a thread", async () => {
    await sendWorkerMessage({ workerId: "worker_1", message: "hello" });
    await sendWorkerMessage({ workerId: "worker_2", message: "other worker" });

    const list = await listConversations({ workerId: "worker_1" });
    expect(list.error).toBeNull();
    expect(list.data).toHaveLength(1);
    expect(list.data?.[0].worker_id).toBe("worker_1");

    const thread = await listMessages(list.data![0].id);
    expect(thread.data).toHaveLength(1);
    expect(thread.data?.[0].content).toBe("hello");
  });

  it("reports a refused message instead of pretending it was written", async () => {
    const conversation = await sendWorkerMessage({ workerId: "worker_1", message: "hi" });

    // A caller who does not own the thread may not write to it.
    setCaller("clerk_B");
    const refused = await appendMessage({
      conversationId: conversation.data!.conversation.id,
      role: "user",
      content: "let me in",
    });

    expect(refused.error?.code).toBe("forbidden");
    expect(rowsOf(state.client!, "messages")).toHaveLength(1);
  });

  it("refuses an empty message before it reaches the database", async () => {
    const result = await sendWorkerMessage({ workerId: "worker_1", message: "   " });

    expect(result.error?.code).toBe("validation");
    expect(rowsOf(state.client!, "conversations")).toHaveLength(0);
    expect(state.client!.invokeCalls).toHaveLength(0);
  });
});
