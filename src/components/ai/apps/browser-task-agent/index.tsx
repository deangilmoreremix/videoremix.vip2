/**
 * Browser Task Agent — Production UI (Overflow App)
 * New VideoRemix Name: Browser Task Agent
 * Helps users complete browser-based tasks, research workflows, online actions, and web productivity steps using advanced search + reasoning.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Globe, Target } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";
import { PromptTextarea } from "../../primitives/PromptTextarea";

export default function BrowserTaskAgent({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [taskDescription, setTaskDescription] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset, lastInputs } = useRunAIApp(appId, {
    onResult,
    onError,
    onReset,
    enableMultiTurn: true,
  });

  useEffect(() => { onRunningChange?.(isRunning); }, [isRunning, onRunningChange]);

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
  };

  const handleRun = async () => {
    if (!taskDescription.trim()) return;
    await run({
      taskDescription: taskDescription.trim(),
      targetUrl: targetUrl.trim(),
      additionalContext: additionalContext.trim(),
      fileContent: fileContent || "",
      goal: "Produce a complete, actionable browser task plan with research, steps, data, and next actions",
    });
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setTaskDescription("");
    setTargetUrl("");
    setAdditionalContext("");
    setFileContent(null);
    reset();
  };

  const quickChips = [
    "Turn this into a step-by-step automation script I can follow manually",
    "Find current pricing / availability on the target site",
    "Extract all key data points and organize them in a table",
    "What competitors are doing on similar pages?",
    "Generate the exact search queries + clicks needed to complete this",
  ];

  const handleQuick = async (q: string) => {
    await run({ ...(lastInputs || {}), refinement: q });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary-500/10 p-2">
          <Globe className="h-6 w-6 text-primary-500" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{appName}</h2>
          <p className="text-sm text-gray-400 -mt-0.5">Your AI browser research & action agent</p>
        </div>
      </div>

      <p className="text-gray-400 max-w-3xl">
        Describe any browser-based task (research, data extraction, competitive analysis, form filling workflows, price monitoring, etc.). The agent uses real-time web search, page analysis, and structured reasoning to deliver complete plans with data and exact next steps.
      </p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-1.5 block">Describe the Browser Task</Label>
            <PromptTextarea
              value={taskDescription}
              onChange={setTaskDescription}
              placeholder="e.g. Find the 5 cheapest business class flights from NYC to Tokyo in October, or extract all pricing tiers and features from competitor landing pages..."
              disabled={isRunning}
              minRows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-1.5 block">Target URL or Domain (optional)</Label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com/pricing or competitor.com"
                disabled={isRunning}
                className="w-full rounded-lg border border-gray-700 bg-black p-3 text-white text-sm"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-1.5 block">Additional Context / Constraints</Label>
              <input
                type="text"
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Budget under $1200, must include 2 checked bags, etc."
                disabled={isRunning}
                className="w-full rounded-lg border border-gray-700 bg-black p-3 text-white text-sm"
              />
            </div>
          </div>

          <BasicFileUpload
            label="Upload reference (screenshot, PDF, competitor page export, etc.)"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".png,.jpg,.jpeg,.pdf,.txt,.html"
          />

          <Button
            onClick={handleRun}
            disabled={!taskDescription.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Target className="mr-2 h-5 w-5" />}
            {isRunning ? "Executing browser research..." : "Run Browser Task Agent"}
          </Button>

          <p className="text-xs text-gray-500">Multi-turn supported — refine the plan, ask for code, or change constraints after the first result.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Browser Task Plan & Research" />

          <div className="flex flex-wrap gap-2">
            {quickChips.map((chip, i) => (
              <button
                key={i}
                onClick={() => handleQuick(chip)}
                disabled={isRunning}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-700 hover:bg-gray-800 text-gray-300 disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>

          <ResultActions onNew={handleReset} newLabel="New Browser Task" onClear={handleClearAll} clearLabel="Clear & Start Fresh" />
        </div>
      )}
    </div>
  );
}
