/**
 * Home Renovation Visualizer AI — Production UI (Batch 10)
 * New VideoRemix Name: Home Renovation Visualizer AI
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Home } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

export default function HomeRenovationVisualizerAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [renovationType, setRenovationType] = useState("kitchen");
  const [currentState, setCurrentState] = useState("");
  const [budget, setBudget] = useState("mid-range");
  const [style, setStyle] = useState("modern");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset, enableMultiTurn: true });

  useEffect(() => { onRunningChange?.(isRunning); }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!currentState.trim()) return;
    await run({ renovationType, currentState: currentState.trim(), budget, style });
  };

  const handleReset = () => reset();
  const handleClearAll = () => {
    setRenovationType("kitchen");
    setCurrentState("");
    setBudget("mid-range");
    setStyle("modern");
    reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Home className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Get design concepts, material suggestions, cost estimates, timelines, before/after visualizations, and contractor recommendations for your renovation.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Renovation Type</Label>
              <select value={renovationType} onChange={e => setRenovationType(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
                <option value="kitchen">Kitchen</option>
                <option value="bathroom">Bathroom</option>
                <option value="full-house">Full House</option>
                <option value="outdoor">Outdoor</option>
                <option value="addition">Addition</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Budget</Label>
              <select value={budget} onChange={e => setBudget(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
                <option value="budget">Budget</option>
                <option value="mid-range">Mid-Range</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Style Preference</Label>
            <select value={style} onChange={e => setStyle(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
              <option value="modern">Modern</option>
              <option value="traditional">Traditional</option>
              <option value="minimalist">Minimalist</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>

          <PromptTextarea label="Current State Description" placeholder="Describe the current state of the space: size, layout issues, what you dislike, any structural constraints, must-keep elements..." value={currentState} onChange={setCurrentState} disabled={isRunning} rows={5} />

          <Button onClick={handleRun} disabled={!currentState.trim() || isRunning} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg">
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Visualizing renovation..." : "Run Home Renovation Visualizer AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Renovation Plan & Visualizations" />
          <ResultActions onNew={handleReset} newLabel="New Renovation" onClear={handleClearAll} clearLabel="Clear All" />
        </div>
      )}
    </div>
  );
}