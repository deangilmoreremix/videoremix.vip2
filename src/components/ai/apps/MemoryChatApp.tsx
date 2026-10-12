/**
 * MemoryChatApp — shared chat UI for the memory-backed internal apps
 * (`llm-app-personalized-memory`, `local-chatgpt-with-memory`).
 *
 * Implements the advertised "keeps context across conversations" behavior
 * with the pieces available in this codebase:
 *   - the full conversation is replayed to the runner as `history`
 *   - durable facts extracted by the model (`memoryUpdates`) are persisted
 *     per-browser in localStorage and replayed as the `memory` block
 *
 * The runner applies the app's specialized config (app-configs.ts) which
 * instructs the model to personalize replies from the supplied memory and
 * to propose new durable facts. Cross-device sync is NOT part of this
 * app (documented in docs/completion/app-completion.md).
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Brain, Trash2, Send } from "lucide-react";
import type { AIAppProps } from "./types";
import { useRunAIApp } from "./useRunAIApp";
import { ResultActions } from "../primitives/ResultActions";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface MemoryUpdate {
  fact: string;
  type?: string;
}

const MEMORY_KEY_PREFIX = "videoremix:ai-chat-memory:";
const MAX_HISTORY_TURNS = 8;

function loadTurns(key: string): ChatTurn[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChatTurn[]) : [];
  } catch {
    return [];
  }
}

function saveTurns(key: string, turns: ChatTurn[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(turns.slice(-40)));
  } catch {
    // Storage unavailable — conversation stays in-memory for this session.
  }
}

function loadMemory(key: string): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(key + ":facts");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((f): f is string => typeof f === "string") : [];
  } catch {
    return [];
  }
}

function saveMemory(key: string, facts: string[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    if (facts.length === 0) {
      localStorage.removeItem(key + ":facts");
    } else {
      localStorage.setItem(key + ":facts", JSON.stringify(facts));
    }
  } catch {
    // Best-effort persistence only.
  }
}

function extractUpdates(output: unknown): MemoryUpdate[] {
  if (!output || typeof output !== "object") return [];
  const updates = (output as Record<string, unknown>).memoryUpdates;
  if (!Array.isArray(updates)) return [];
  return updates
    .map((u) => {
      if (typeof u === "string") return { fact: u };
      if (u && typeof u === "object" && typeof (u as Record<string, unknown>).fact === "string") {
        return u as unknown as MemoryUpdate;
      }
      return null;
    })
    .filter((u): u is MemoryUpdate => u !== null && u.fact.trim().length > 0);
}

function extractReply(output: unknown, streaming: string): string {
  if (streaming) return streaming;
  if (typeof output === "string") return output;
  if (output && typeof output === "object") {
    const reply = (output as Record<string, unknown>).reply;
    if (typeof reply === "string") return reply;
  }
  return "";
}

export const MemoryChatApp: React.FC<AIAppProps> = ({
  appId,
  appName,
  onResult,
  onError,
  onRunningChange,
  onReset,
}) => {
  const storageKey = `${MEMORY_KEY_PREFIX}${appId}`;
  const [turns, setTurns] = useState<ChatTurn[]>(() => loadTurns(storageKey));
  const [memory, setMemory] = useState<string[]>(() => loadMemory(storageKey));
  const [input, setInput] = useState("");
  const [showMemory, setShowMemory] = useState(false);

  const { run, isRunning, output, error, reset, isStreaming, streamingContent } = useRunAIApp(appId, {
    onResult,
    onError,
    onReset,
  });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleSend = async () => {
    const message = input.trim();
    if (!message || isRunning) return;

    const history = turns.slice(-MAX_HISTORY_TURNS);
    const userTurn: ChatTurn = { role: "user", content: message };
    setTurns((prev) => [...prev, userTurn]);
    setInput("");

    await run({
      message,
      memory: memory.join("\n"),
      history: history.map((t) => ({ role: t.role, content: t.content })),
    });
  };

  // Persist the assistant reply + any new durable facts once a run lands.
  useEffect(() => {
    if (isRunning || !output) return;
    const reply = extractReply(output, "");
    if (!reply) return;

    setTurns((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === "assistant" && last.content === reply) return prev;
      const next = [...prev, { role: "assistant" as const, content: reply }];
      saveTurns(storageKey, next);
      return next;
    });

    const updates = extractUpdates(output);
    if (updates.length > 0) {
      setMemory((prev) => {
        const next = [...prev];
        for (const u of updates) {
          if (!next.includes(u.fact)) next.push(u.fact);
        }
        saveMemory(storageKey, next);
        return next;
      });
    }
  }, [output, isRunning, storageKey]);

  const handleClearMemory = () => {
    setMemory([]);
    saveMemory(storageKey, []);
  };

  const handleNewChat = () => {
    setTurns([]);
    setInput("");
    reset();
    saveTurns(storageKey, []);
  };

  const liveReply = extractReply(output, streamingContent);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{appName}</h2>
          <p className="mt-1 text-gray-400">
            A chat that remembers. Facts you share are kept in this browser and reused in later replies.
          </p>
        </div>
        <button
          onClick={() => setShowMemory((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:border-gray-600"
        >
          <Brain className="h-3.5 w-3.5" />
          Memory ({memory.length})
        </button>
      </div>

      {showMemory && (
        <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-200">Remembered facts</h3>
            <button
              onClick={handleClearMemory}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
              Forget everything
            </button>
          </div>
          {memory.length === 0 ? (
            <p className="text-xs text-gray-500">
              Nothing remembered yet. Share preferences, projects, or context and they will show up here.
            </p>
          ) : (
            <ul className="space-y-1">
              {memory.map((fact, i) => (
                <li key={`${i}-${fact.slice(0, 24)}`} className="text-xs text-gray-300">
                  • {fact}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-4">
        <div className="max-h-[420px] space-y-4 overflow-y-auto">
          {turns.length === 0 && !isStreaming && (
            <p className="py-8 text-center text-sm text-gray-500">
              Start the conversation — say hello and tell me about yourself.
            </p>
          )}
          {turns.map((turn, i) => (
            <div key={i} className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                  turn.role === "user"
                    ? "bg-primary-600/20 text-primary-100"
                    : "bg-black text-gray-200"
                }`}
              >
                {turn.content}
              </div>
            </div>
          ))}
          {isStreaming && liveReply && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg bg-black px-4 py-2 text-sm text-gray-200 whitespace-pre-wrap">
                {liveReply}
              </div>
            </div>
          )}
          {isStreaming && !liveReply && (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking…</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-end gap-3 border-t border-gray-800 pt-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message… (Enter to send)"
            rows={2}
            disabled={isRunning}
            className="min-h-[48px] flex-1 resize-y rounded-lg border border-gray-700 bg-black p-3 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isRunning}
            className="inline-flex h-[48px] items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 font-semibold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {memory.length > 0
              ? `${memory.length} fact${memory.length === 1 ? "" : "s"} remembered in this browser`
              : "No memories stored yet"}
          </span>
          <ResultActions onNew={handleNewChat} newLabel="New chat" />
        </div>
      </div>

      {/* Errors are rendered by the runner (AIAppRunnerPage) per the app contract. */}
      {error ? <div className="hidden" data-testid="memory-chat-error-present" /> : null}
      {!isRunning && output && !turns.some((t) => t.role === "assistant") && (
        <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-200">
            <Play className="mr-1 inline h-3 w-3" />
            Last reply
          </h3>
          <pre className="whitespace-pre-wrap rounded-lg bg-black p-3 text-sm text-gray-200">
            {liveReply}
          </pre>
        </div>
      )}
    </div>
  );
};
