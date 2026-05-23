/**
 * Research Memory Assistant — Production UI (Batch 5)
 * New VideoRemix Name: Research Memory Assistant
 * Maintains research memory across sessions, suggests continuations, and stores findings.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Database } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

export default function ResearchMemoryAssistant({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [currentResearch, setCurrentResearch] = useState("");
  const [previousContext, setPreviousContext] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"continue" | "investigate" | "new-topic">("continue");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset, enableMultiTurn: true });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!currentResearch.trim() && !query.trim()) return;

    const inputs = {
      currentResearch: currentResearch.trim(),
      previousContext: previousContext.trim() || undefined,
      query: query.trim() || undefined,
      mode,
    };

    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setCurrentResearch("");
    setPreviousContext("");
    setQuery("");
    setMode("continue");
    reset();
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Database className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Persistent research memory. Continues prior threads, stores new findings, and surfaces relevant past context across multiple sessions.</p>
      </div>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Current Research Focus / Session</Label>
            <PromptTextarea
              label=""
              placeholder="What are you working on right now?"
              value={currentResearch}
              onChange={setCurrentResearch}
              disabled={isRunning}
              maxLength={2000}
              rows={4}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Previous Session Context / Stored Memory (paste from last run)</Label>
            <PromptTextarea
              label=""
              placeholder="Paste key findings or the 'memoryUpdate' from a previous session here..."
              value={previousContext}
              onChange={setPreviousContext}
              disabled={isRunning}
              maxLength={4000}
              rows={5}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">New Query or Instruction</Label>
            <PromptTextarea
              label=""
              placeholder="What would you like to know or do with the combined memory?"
              value={query}
              onChange={setQuery}
              disabled={isRunning}
              maxLength={1200}
              rows={3}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Mode</Label>
            <div className="flex gap-2">
              {(["continue", "investigate", "new-topic"] as const).map((m) => (
                <Button key={m} type="button" variant={mode === m ? "default" : "outline"} onClick={() => setMode(m)} disabled={isRunning} className="flex-1">
                  {m.replace("-", " ")}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={(!currentResearch.trim() && !query.trim()) || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Updating research memory..." : "Run Research Memory Assistant"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Memory-Augmented Research Response" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Memory Session"
            onClear={handleClearAll}
            clearLabel="Clear Memory & Start Fresh"
          />
        </div>
      )}
    </div>
  );
}
