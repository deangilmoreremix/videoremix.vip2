/**
 * Deep Research Pro — Production UI (Batch 5)
 * New VideoRemix Name: Deep Research Pro
 * Multi-round, high-depth investigation with research plan, findings, citations, and limitations.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Search } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

export default function DeepResearchPro({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [researchTopic, setResearchTopic] = useState("");
  const [depth, setDepth] = useState<"surface" | "intermediate" | "deep">("deep");
  const [timeConstraint, setTimeConstraint] = useState("2-4 hours");
  const [outputFormat, setOutputFormat] = useState<"brief" | "full" | "report" | "presentation">("report");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!researchTopic.trim()) return;

    const inputs = {
      researchTopic: researchTopic.trim(),
      depth,
      timeConstraint: timeConstraint.trim(),
      outputFormat,
      additionalContext: fileContent || undefined,
    };

    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setResearchTopic("");
    setDepth("deep");
    setTimeConstraint("2-4 hours");
    setOutputFormat("report");
    setFileContent(null);
    reset();
  };

  const depthOptions = [
    { v: "surface", l: "Surface" },
    { v: "intermediate", l: "Intermediate" },
    { v: "deep", l: "Deep" },
  ];

  const formatOptions = [
    { v: "brief", l: "Brief" },
    { v: "full", l: "Full" },
    { v: "report", l: "Report" },
    { v: "presentation", l: "Presentation" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Search className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Elite multi-round research agent. Produces a research plan, deep findings with sources, confidence assessment, and limitations using live web search.</p>
      </div>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Research Topic</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. Future of autonomous delivery vehicles in urban logistics 2026-2030"
              value={researchTopic}
              onChange={setResearchTopic}
              disabled={isRunning}
              maxLength={2000}
              rows={4}
              hint="Complex topics benefit most from Deep mode."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Depth</Label>
              <div className="flex flex-col gap-2">
                {depthOptions.map((d) => (
                  <Button
                    key={d.v}
                    type="button"
                    variant={depth === d.v ? "default" : "outline"}
                    onClick={() => setDepth(d.v as any)}
                    disabled={isRunning}
                  >
                    {d.l}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Time Constraint</Label>
              <input
                type="text"
                value={timeConstraint}
                onChange={(e) => setTimeConstraint(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white"
                placeholder="e.g. 2-4 hours or 1 day"
              />
              <p className="text-xs text-gray-500 mt-1.5">Helps the AI prioritize effort.</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Output Format</Label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as any)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500 h-[42px]"
              >
                {formatOptions.map((f) => (
                  <option key={f.v} value={f.v}>{f.l}</option>
                ))}
              </select>
            </div>
          </div>

          <PromptTextarea
            label="Additional Context or Constraints (optional)"
            placeholder="Existing hypotheses, specific regions, data sources to prioritize, or known limitations..."
            value={fileContent || ""}
            onChange={(v) => setFileContent(v)}
            disabled={isRunning}
            maxLength={3000}
            rows={3}
          />

          <Button
            onClick={handleRun}
            disabled={!researchTopic.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Conducting deep multi-round research..." : "Run Deep Research Pro"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Deep Research Report" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Deep Research"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}
