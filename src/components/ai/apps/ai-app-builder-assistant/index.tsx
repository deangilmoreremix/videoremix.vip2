/**
 * AI App Builder Assistant — Production UI
 * New VideoRemix Name: AI App Builder Assistant
 * Custom form for app architecture, tech stack, and development roadmap
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, GitBranch, Layers, Code2, Rocket, Clock, CheckCircle2, Mic, MessageSquare } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { ExecutionTrace } from "../../primitives/ExecutionTrace";
import { RealtimeVoiceSession } from "../../primitives/RealtimeVoiceSession";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AIAppBuilderAssistant({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [appIdea, setAppIdea] = useState("");
  const [targetPlatform, setTargetPlatform] = useState("web");
  const [techStack, setTechStack] = useState("");
  const [complexity, setComplexity] = useState("medium");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset, enableMultiTurn: true });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!appIdea.trim()) return;
    await run({
      appIdea: appIdea.trim(),
      targetPlatform,
      techStack: techStack.trim() || undefined,
      complexity,
    });
  };

  const handleReset = () => {
    reset();
  };

  const handleClearAll = () => {
    setAppIdea("");
    setTargetPlatform("web");
    setTechStack("");
    setComplexity("medium");
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
          <Layers className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Design complete applications with architecture, tech stack, and development roadmap. Use Live Voice to describe your idea conversationally.</p>
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
          voice="alloy"
          onStructuredResult={handleVoiceResult}
          onEnd={() => {}}
        />
      )}

      {/* Text mode (original) */}
      {mode === "text" && !output && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Target Platform</Label>
              <select
                value={targetPlatform}
                onChange={(e) => setTargetPlatform(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white focus:border-primary-500"
              >
                <option value="web">Web Application</option>
                <option value="mobile">Mobile Application</option>
                <option value="desktop">Desktop Application</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Complexity</Label>
              <select
                value={complexity}
                onChange={(e) => setComplexity(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white focus:border-primary-500"
              >
                <option value="simple">Simple (MVP)</option>
                <option value="medium">Medium (Full Features)</option>
                <option value="full-stack">Full-Stack (Enterprise)</option>
              </select>
            </div>
          </div>

          <PromptTextarea
            label="App Idea / Concept"
            placeholder="Describe your app idea in detail: what problem does it solve, who are the users, what makes it unique..."
            value={appIdea}
            onChange={setAppIdea}
            disabled={isRunning}
            maxLength={2000}
            rows={6}
            hint="Be specific about core functionality and target users."
          />

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Preferred Tech Stack (Optional)</Label>
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
            disabled={!appIdea.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Designing your app..." : "Generate App Architecture"}
          </Button>
        </div>
      )}

      {/* Rich result view (shows for both text and voice when output is set) */}
      {output && (
        <div className="space-y-6">
          {output.verificationTrace && (
            <ExecutionTrace trace={output.verificationTrace} />
          )}
          <StructuredResult
            result={output}
            title="App Architecture & Roadmap"
            onDownload={() => {
              const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `app-architecture-${Date.now()}.json`; a.click();
            }}
          />
           <ResultActions
            onNew={handleReset}
            newLabel="New Architecture"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}