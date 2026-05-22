/**
 * Daily Content Engine AI — Production UI
 * New VideoRemix Name: Daily Content Engine AI
 * Generates a full day of on-brand marketing content from topics, news, and trends.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Calendar } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function DailyContentEngineAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [niche, setNiche] = useState("");
  const [sources, setSources] = useState("");
  const [platforms, setPlatforms] = useState("LinkedIn, Twitter/X, Email");
  const [numPieces, setNumPieces] = useState("4");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!niche.trim()) return;
    const inputs = {
      niche: niche.trim(),
      sources: sources.trim() || "latest industry news and trends",
      platforms: platforms.trim(),
      numPieces: parseInt(numPieces, 10),
      date: new Date().toISOString().split("T")[0],
    };
    await run(inputs);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Calendar className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Instant daily content engine: turn any niche, news, or trend into 3–5 platform-optimized posts, threads, and emails.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Your Niche or Topic</Label>
            <Input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. AI automation for solopreneurs, sustainable fashion"
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
          </div>

          <PromptTextarea
            label="News, Trends or Source Material (optional)"
            placeholder="Paste headlines, key stats, or a short brief from today’s news..."
            value={sources}
            onChange={setSources}
            disabled={isRunning}
            maxLength={2000}
            rows={4}
            hint="The more specific the sources, the more timely and credible the content."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Target Platforms</Label>
              <Input
                value={platforms}
                onChange={(e) => setPlatforms(e.target.value)}
                placeholder="LinkedIn, Twitter/X, Email, Instagram"
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Number of Pieces</Label>
              <select
                value={numPieces}
                onChange={(e) => setNumPieces(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white"
              >
                {[3,4,5,6].map(n => <option key={n} value={n}>{n} pieces</option>)}
              </select>
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={!niche.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Building your daily content pack..." : "Run Daily Content Engine AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Daily Content Pack" />
          <ResultActions onNew={() => reset()} newLabel="Generate Tomorrow's Content" />
        </div>
      )}
    </div>
  );
}
