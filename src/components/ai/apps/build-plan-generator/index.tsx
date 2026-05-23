/**
 * Build Plan Generator — Production UI
 * New VideoRemix Name: Build Plan Generator
 * Project planning with task breakdown, timeline, and risk assessment
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Target, ListChecks, Clock, AlertTriangle, Users, CheckCircle2, Mic, MessageSquare } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { ExecutionTrace } from "../../primitives/ExecutionTrace";
import { TaskBoard } from "../../primitives/TaskBoard";
import { MermaidDiagram } from "../../primitives/MermaidDiagram";
import { RealtimeVoiceSession } from "../../primitives/RealtimeVoiceSession";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function BuildPlanGenerator({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [projectGoal, setProjectGoal] = useState("");
  const [constraints, setConstraints] = useState("");
  const [techStack, setTechStack] = useState("");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset, enableMultiTurn: true });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!projectGoal.trim()) return;
    await run({
      projectGoal: projectGoal.trim(),
      constraints: constraints.trim() || undefined,
      techStack: techStack.trim() || undefined,
    });
  };

  const handleReset = () => {
    reset();
  };

  const handleClearAll = () => {
    setProjectGoal("");
    setConstraints("");
    setTechStack("");
    reset();
  };

  // Voice + Text mode (Batch 6 realtime planning apps)
  const [mode, setMode] = useState<"text" | "voice">("text");

  const handleVoiceResult = (json: any) => {
    onResult?.(json);
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Target className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Create detailed implementation plans with task breakdowns, timelines, and risk assessment. Use Live Voice to describe the project conversationally.</p>
      </div>

      {/* Mode switch */}
      <div className="inline-flex rounded-xl border border-gray-800 bg-black/60 p-1">
        <button
          onClick={() => setMode("text")}
          className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${mode === "text" ? "bg-primary-600 text-white" : "text-gray-400 hover:text-white"}`}
        >
          <MessageSquare className="h-4 w-4" /> Text Form
        </button>
        <button
          onClick={() => setMode("voice")}
          className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${mode === "voice" ? "bg-primary-600 text-white" : "text-gray-400 hover:text-white"}`}
        >
          <Mic className="h-4 w-4" /> Live Voice Planning
        </button>
      </div>

      {/* Live Voice */}
      {mode === "voice" && !output && (
        <RealtimeVoiceSession
          appId={appId}
          voice="shimmer"
          onStructuredResult={handleVoiceResult}
          onEnd={() => {}}
        />
      )}

      {/* Text mode (original) */}
      {mode === "text" && !output && (
        <div className="space-y-6">
          <PromptTextarea
            label="Project Goal"
            placeholder="Describe what you want to build: the application, key features, target users, success criteria..."
            value={projectGoal}
            onChange={setProjectGoal}
            disabled={isRunning}
            maxLength={2000}
            rows={6}
            hint="Be specific about the end goal and key deliverables."
          />

          <PromptTextarea
            label="Constraints (Optional)"
            placeholder="Describe any constraints: timeline, budget, team size, specific technologies to use or avoid..."
            value={constraints}
            onChange={setConstraints}
            disabled={isRunning}
            maxLength={1000}
            rows={4}
          />

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Tech Stack (Optional)</Label>
            <Input
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="e.g. React, Node.js, PostgreSQL or leave empty for recommendations"
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={!projectGoal.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Generating plan..." : "Generate Build Plan"}
          </Button>
        </div>
      )}

      {/* Rich result view (shows for both text and voice when output is set) */}
      {output && (
        <div className="space-y-6">
          {output.verificationTrace && (
            <ExecutionTrace trace={output.verificationTrace} />
          )}

          {output.projectPlan && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary-500" />
                Project Plan
              </h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.projectPlan}</div>
            </div>
          )}

          {output.timeline && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                Timeline
              </h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.timeline}</div>
            </div>
          )}

          {output.taskBreakdown && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-green-400" />
                Task Breakdown
              </h3>
              {Array.isArray(output.taskBreakdown) ? (
                <TaskBoard
                  data={output.taskBreakdown.map((task: any, i: number) => ({
                    title: task.task || task.title || `Task ${i + 1}`,
                    description: task.description || task.details || "",
                    status: task.status || (task.completed ? "completed" : "todo"),
                    assignee: task.assignee || undefined,
                  }))}
                  view="table"
                />
              ) : (
                <div className="text-gray-300 whitespace-pre-wrap rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
                  {output.taskBreakdown}
                </div>
              )}
            </div>
          )}

          {output.dependencies && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Dependencies</h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.dependencies}</div>
            </div>
          )}

          {output.resourceRequirements && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" />
                Resource Requirements
              </h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.resourceRequirements}</div>
            </div>
          )}

          {output.riskMitigation && (
            <div className="rounded-xl border border-yellow-900/50 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Mitigation
              </h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.riskMitigation}</div>
            </div>
          )}

          {output.definitionOfDone && (
            <div className="rounded-xl border border-green-900/50 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Definition of Done
              </h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.definitionOfDone}</div>
            </div>
          )}

          <StructuredResult
            result={output}
            title="Additional Plan Details"
            onDownload={() => {
              const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `build-plan-${Date.now()}.json`; a.click();
            }}
          />
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