/**
 * Research Planner AI — Production UI (Batch 5)
 * New VideoRemix Name: Research Planner AI
 * Creates complete research strategies, milestones, resource plans, and risk assessments.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Layers } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function ResearchPlannerAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [researchObjective, setResearchObjective] = useState("");
  const [availableResources, setAvailableResources] = useState("");
  const [timeline, setTimeline] = useState("4 weeks");
  const [teamExpertise, setTeamExpertise] = useState("");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!researchObjective.trim()) return;

    const inputs = {
      researchObjective: researchObjective.trim(),
      availableResources: availableResources.trim() || undefined,
      timeline: timeline.trim(),
      teamExpertise: teamExpertise.trim() || undefined,
      additionalContext: fileContent || undefined,
    };

    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setResearchObjective("");
    setAvailableResources("");
    setTimeline("4 weeks");
    setTeamExpertise("");
    setFileContent(null);
    reset();
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Layers className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Designs rigorous research plans with methodology, search strategy, milestones, resource allocation, risk assessment, and expected outcomes.</p>
      </div>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Research Objective / Goal</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. Understand the regulatory landscape for AI-generated content in the EU by Q3 2026"
              value={researchObjective}
              onChange={setResearchObjective}
              disabled={isRunning}
              maxLength={1800}
              rows={4}
              hint="Clear objective leads to a focused, executable plan."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Available Resources</Label>
              <PromptTextarea
                label=""
                placeholder="Team size, budget, tools (e.g. 2 analysts, $5k budget, access to academic databases)"
                value={availableResources}
                onChange={setAvailableResources}
                disabled={isRunning}
                maxLength={1200}
                rows={3}
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Timeline</Label>
              <Input
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                placeholder="e.g. 3 weeks, 2 months"
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500 mt-1.5">Helps create realistic milestones.</p>
            </div>
          </div>

          <PromptTextarea
            label="Team Expertise (optional)"
            placeholder="e.g. Strong in data analysis, limited legal background, one PhD in policy"
            value={teamExpertise}
            onChange={setTeamExpertise}
            disabled={isRunning}
            maxLength={800}
            rows={2}
            hint="The plan will account for skill gaps and suggest external help where needed."
          />

          <PromptTextarea
            label="Additional Constraints or Known Information"
            placeholder="Any fixed deadlines, must-use sources, or political sensitivities..."
            value={fileContent || ""}
            onChange={(v) => setFileContent(v)}
            disabled={isRunning}
            maxLength={2000}
            rows={3}
          />

          <Button
            onClick={handleRun}
            disabled={!researchObjective.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Designing research plan..." : "Run Research Planner AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Research Plan" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Plan"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}
