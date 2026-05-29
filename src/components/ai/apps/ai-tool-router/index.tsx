/**
 * AI Tool Router — Production UI (Overflow App)
 * New VideoRemix Name: AI Tool Router
 * Analyzes your goal and routes you to the single best (or optimal combination of) internal AI apps + gives you the perfect prompt to paste.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Shuffle, Lightbulb } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";
import { PromptTextarea } from "../../primitives/PromptTextarea";

export default function AIToolRouter({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [goalDescription, setGoalDescription] = useState("");
  const [constraints, setConstraints] = useState("");
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
    if (!goalDescription.trim()) return;
    await run({
      goalDescription: goalDescription.trim(),
      constraints: constraints.trim(),
      fileContent: fileContent || "",
      goal: "Analyze the request and recommend the best internal AI app(s) from the 95-app suite with ready-to-paste prompts and routing logic",
    });
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setGoalDescription("");
    setConstraints("");
    setFileContent(null);
    reset();
  };

  const quickChips = [
    "I need help with competitive research and then writing a sales email",
    "Turn this messy brief into a full project plan + code review",
    "Analyze this document and then create a Notion-ready summary + action tracker",
    "Research current market data and then produce a board-ready slide deck outline",
    "I have customer feedback — route to the best tools for insight extraction + response templates",
  ];

  const handleQuick = async (q: string) => {
    await run({ ...(lastInputs || {}), goalDescription: q });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary-500/10 p-2">
          <Shuffle className="h-6 w-6 text-primary-500" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{appName}</h2>
          <p className="text-sm text-gray-400 -mt-0.5">The intelligent router for the entire 95-app Internal AI Suite</p>
        </div>
      </div>

      <p className="text-gray-400 max-w-3xl">
        Describe what you want to accomplish in plain English (or paste a brief/document). The router analyzes your goal against all 95 specialized AI apps and returns the optimal route — which app(s) to use, in what order, plus copy-paste ready prompts tailored to your exact request.
      </p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-1.5 block">What do you want to accomplish?</Label>
            <PromptTextarea
              value={goalDescription}
              onChange={setGoalDescription}
              placeholder="e.g. I need to research 3 competitors, write a differentiated sales email, and create a one-page battlecard..."
              disabled={isRunning}
              minRows={5}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-1.5 block">Constraints, Tone, or Special Requirements (optional)</Label>
            <PromptTextarea
              value={constraints}
              onChange={setConstraints}
              placeholder="Must be under 200 words, professional but warm tone, include pricing comparison, etc."
              disabled={isRunning}
              minRows={2}
            />
          </div>

          <BasicFileUpload
            label="Upload context (brief, competitor PDF, customer email thread, etc.)"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".pdf,.txt,.docx,.md,.png,.jpg"
          />

          <Button
            onClick={handleRun}
            disabled={!goalDescription.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lightbulb className="mr-2 h-5 w-5" />}
            {isRunning ? "Routing to the best tools..." : "Route My Request"}
          </Button>

          <p className="text-xs text-gray-500">Multi-turn enabled — refine the goal and it will re-route or improve the recommended prompts.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Recommended Routing & Ready-to-Use Prompts" />

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

          <ResultActions onNew={handleReset} newLabel="Route Another Request" onClear={handleClearAll} clearLabel="Clear & Start Fresh" />
        </div>
      )}
    </div>
  );
}
