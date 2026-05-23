/**
 * Sprint Planner AI — Production UI
 * New VideoRemix Name: Sprint Planner AI
 * Agile sprint planning with story allocation and burndown tracking
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Target, Users, Clock, AlertTriangle, CheckCircle2, ArrowRight, Mic, MessageSquare } from "lucide-react";
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

export default function SprintPlannerAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [userStories, setUserStories] = useState("");
  const [sprintGoal, setSprintGoal] = useState("");
  const [teamVelocity, setTeamVelocity] = useState("");
  const [sprintDuration, setSprintDuration] = useState("2");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset, enableMultiTurn: true });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!userStories.trim()) return;
    await run({
      userStories: userStories.trim(),
      sprintGoal: sprintGoal.trim() || undefined,
      teamVelocity: teamVelocity.trim() || undefined,
      sprintDuration,
    });
  };

  const handleReset = () => {
    reset();
  };

  const handleClearAll = () => {
    setUserStories("");
    setSprintGoal("");
    setTeamVelocity("");
    setSprintDuration("2");
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
        <p className="mt-2 text-gray-400">Plan agile sprints with story allocation, task breakdown, and velocity tracking. Use Live Voice to speak your backlog and goals.</p>
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
            label="User Stories (Backlog)"
            placeholder="List your user stories, one per line, with format:\n- As a [user], I want to [feature] so that [benefit]\n- Include story points if known: e.g. (5 points)\n\nExample:\n- As a user, I want to log in so I can access my dashboard (3 points)\n- As an admin, I want to manage users so I can control access (5 points)"
            value={userStories}
            onChange={setUserStories}
            disabled={isRunning}
            maxLength={3000}
            rows={10}
            hint="Format: As a [user], I want to [feature] so that [benefit]. Include story points if known."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Sprint Goal</Label>
              <Input
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
                placeholder="e.g. Complete user authentication"
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Team Velocity (points/sprint)</Label>
              <Input
                value={teamVelocity}
                onChange={(e) => setTeamVelocity(e.target.value)}
                placeholder="e.g. 20"
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Sprint Duration</Label>
              <select
                value={sprintDuration}
                onChange={(e) => setSprintDuration(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white focus:border-primary-500"
              >
                <option value="1">1 Week</option>
                <option value="2">2 Weeks</option>
                <option value="3">3 Weeks</option>
                <option value="4">4 Weeks</option>
              </select>
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={!userStories.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Planning sprint..." : "Plan Sprint"}
          </Button>
        </div>
      )}

      {/* Rich result view (shows for both text and voice when output is set) */}
      {output && (
        <div className="space-y-6">
          {output.verificationTrace && (
            <ExecutionTrace trace={output.verificationTrace} />
          )}

          {output.sprintPlan && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary-500" />
                Sprint Plan
              </h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.sprintPlan}</div>
            </div>
          )}

          {output.storyAllocation && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Story Allocation
              </h3>
              {Array.isArray(output.storyAllocation) ? (
                <div className="space-y-3">
                  {output.storyAllocation.map((story: any, i: number) => (
                    <div key={i} className="border-l-2 border-primary-600 pl-4 py-2">
                      <div className="text-white font-medium">{typeof story === 'string' ? story : story.story || story.title || `Story ${i + 1}`}</div>
                      {typeof story === 'object' && story.assignee && (
                        <div className="text-gray-500 text-sm mt-1">Assignee: {story.assignee}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-300 whitespace-pre-wrap">{output.storyAllocation}</div>
              )}
            </div>
          )}

          {output.taskBreakdown && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-green-400" />
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
                  view="kanban"
                />
              ) : (
                <div className="text-gray-300 whitespace-pre-wrap rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
                  {output.taskBreakdown}
                </div>
              )}
            </div>
          )}

          {output.sprintBurndown && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-400" />
                Sprint Burndown
              </h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.sprintBurndown}</div>
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

          {output.risks && (
            <div className="rounded-xl border border-yellow-900/50 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Sprint Risks
              </h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.risks}</div>
            </div>
          )}

          {output.retrospectiveSuggestions && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Retrospective Suggestions</h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.retrospectiveSuggestions}</div>
            </div>
          )}

          <StructuredResult
            result={output}
            title="Additional Sprint Details"
            onDownload={() => {
              const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `sprint-plan-${Date.now()}.json`; a.click();
            }}
          />
            <ResultActions
             onNew={handleReset}
             newLabel="Plan Another Sprint"
             onClear={handleClearAll}
             clearLabel="Clear All"
           />
         </div>
       )}
     </div>
   );
 }