/**
 * Multi-AI Memory Hub — Production UI (Batch 5)
 * New VideoRemix Name: Multi-AI Memory Hub
 * Coordinates memory across multiple agents and sessions for consistent shared knowledge.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Network } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function MultiAIMemoryHub({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [query, setQuery] = useState("");
  const [memoryScope, setMemoryScope] = useState<"single-agent" | "cross-agent" | "all">("cross-agent");
  const [agents, setAgents] = useState("research, content, sales");
  const [timeRange, setTimeRange] = useState("recent");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset, enableMultiTurn: true });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!query.trim()) return;

    const inputs = {
      query: query.trim(),
      memoryScope,
      agents: agents.trim(),
      timeRange,
    };

    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setQuery("");
    setMemoryScope("cross-agent");
    setAgents("research, content, sales");
    setTimeRange("recent");
    reset();
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Network className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Cross-agent memory coordination. Consolidates knowledge from multiple AI assistants and surfaces shared insights or gaps.</p>
      </div>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <PromptTextarea
            label="Query Across Memory Stores"
            placeholder="e.g. What do we collectively know about the new competitor's pricing changes?"
            value={query}
            onChange={setQuery}
            disabled={isRunning}
            maxLength={1200}
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Memory Scope</Label>
              <select value={memoryScope} onChange={(e) => setMemoryScope(e.target.value as any)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
                <option value="single-agent">Single Agent</option>
                <option value="cross-agent">Cross-Agent</option>
                <option value="all">All Agents + Sessions</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Agents to Include</Label>
              <Input value={agents} onChange={(e) => setAgents(e.target.value)} disabled={isRunning} placeholder="research, content, sales" className="bg-black border-gray-700 text-white" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Time Range</Label>
              <Input value={timeRange} onChange={(e) => setTimeRange(e.target.value)} disabled={isRunning} placeholder="recent / last 30 days / all" className="bg-black border-gray-700 text-white" />
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={!query.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Consolidating multi-agent memory..." : "Run Multi-AI Memory Hub"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Consolidated Memory Insights" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Cross-Agent Query"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}
