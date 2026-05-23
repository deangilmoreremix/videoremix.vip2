/**
 * Personal AI Memory Assistant — Production UI (Batch 5)
 * New VideoRemix Name: Personal AI Memory Assistant
 * Remembers your preferences, goals, and projects across conversations.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, User } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

export default function PersonalAIMemoryAssistant({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [userQuery, setUserQuery] = useState("");
  const [memoryType, setMemoryType] = useState<"preference" | "goal" | "project" | "context">("goal");
  const [updateMemory, setUpdateMemory] = useState("");
  const [previousMemory, setPreviousMemory] = useState("");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!userQuery.trim()) return;

    const inputs = {
      userQuery: userQuery.trim(),
      memoryType,
      updateMemory: updateMemory.trim() || undefined,
      previousMemory: previousMemory.trim() || undefined,
    };

    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setUserQuery("");
    setMemoryType("goal");
    setUpdateMemory("");
    setPreviousMemory("");
    reset();
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <User className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Your personal long-term memory. Remembers preferences, goals, and project context so every conversation builds on the last.</p>
      </div>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <PromptTextarea
            label="What would you like help with today?"
            placeholder="e.g. Remind me of my top 3 priorities for the next quarter"
            value={userQuery}
            onChange={setUserQuery}
            disabled={isRunning}
            maxLength={1200}
            rows={3}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["preference", "goal", "project", "context"] as const).map((t) => (
              <Button key={t} type="button" variant={memoryType === t ? "default" : "outline"} onClick={() => setMemoryType(t)} disabled={isRunning} className="capitalize">
                {t}
              </Button>
            ))}
          </div>

          <PromptTextarea
            label="Update / New Information to Remember (optional)"
            placeholder="Paste new details you want stored..."
            value={updateMemory}
            onChange={setUpdateMemory}
            disabled={isRunning}
            maxLength={2000}
            rows={3}
          />

          <PromptTextarea
            label="Previous Memory Snapshot (optional - paste from last response)"
            placeholder="Helps the AI recall what it already knows about you."
            value={previousMemory}
            onChange={setPreviousMemory}
            disabled={isRunning}
            maxLength={3000}
            rows={4}
          />

          <Button
            onClick={handleRun}
            disabled={!userQuery.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Consulting your personal memory..." : "Run Personal AI Memory Assistant"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Memory-Informed Response" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Query"
            onClear={handleClearAll}
            clearLabel="Clear Memory Session"
          />
        </div>
      )}
    </div>
  );
}
