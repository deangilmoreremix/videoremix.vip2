/**
 * Local Tour Guide AI — Production UI (Batch 10)
 * New VideoRemix Name: Local Tour Guide AI
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, MapPin } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function LocalTourGuideAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [location, setLocation] = useState("");
  const [interests, setInterests] = useState("");
  const [duration, setDuration] = useState("half-day");
  const [groupSize, setGroupSize] = useState("2");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset, enableMultiTurn: true });

  useEffect(() => { onRunningChange?.(isRunning); }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!location.trim()) return;
    await run({
      location: location.trim(),
      interests: interests.trim(),
      duration,
      groupSize: groupSize.trim(),
    });
  };

  const handleReset = () => reset();
  const handleClearAll = () => {
    setLocation("");
    setInterests("");
    setDuration("half-day");
    setGroupSize("2");
    reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <MapPin className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Discover the best tour routes, must-see spots, hidden gems, local tips, dining recommendations, and practical info for any location.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Location</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Barcelona, Spain" disabled={isRunning} className="bg-black border-gray-700 text-white" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Duration</Label>
              <select value={duration} onChange={e => setDuration(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
                <option value="2h">2 Hours</option>
                <option value="half-day">Half Day</option>
                <option value="full-day">Full Day</option>
                <option value="weekend">Weekend</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Group Size</Label>
            <Input type="number" min="1" value={groupSize} onChange={e => setGroupSize(e.target.value)} placeholder="2" disabled={isRunning} className="bg-black border-gray-700 text-white max-w-xs" />
          </div>

          <PromptTextarea label="Your Interests" placeholder="e.g. food, history, nature, shopping, nightlife, art, local culture... (comma-separated)" value={interests} onChange={setInterests} disabled={isRunning} rows={3} />

          <Button onClick={handleRun} disabled={!location.trim() || isRunning} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg">
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Creating your tour..." : "Run Local Tour Guide AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Your Custom Tour Guide" />
          <ResultActions onNew={handleReset} newLabel="Plan Another Tour" onClear={handleClearAll} clearLabel="Clear All" />
        </div>
      )}
    </div>
  );
}