/**
 * AI Business Growth Consultant — Production UI
 * New VideoRemix Name: AI Business Growth Consultant
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, TrendingUp, Mic, MessageSquare } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { RealtimeVoiceSession } from "../../primitives/RealtimeVoiceSession";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AIBusinessGrowthConsultant({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [businessType, setBusinessType] = useState("");
  const [stage, setStage] = useState("Growth");
  const [currentChallenges, setCurrentChallenges] = useState("");
  const [revenueRange, setRevenueRange] = useState("$1M-$5M");

  const [mode, setMode] = useState<"text" | "voice">("text");

  const handleVoiceResult = (json: any) => {
    onResult?.(json);
  };

  const { run, isRunning, output, error, reset, isStreaming, streamingContent } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const stages = ["Startup", "Traction", "Growth", "Scale", "Mature"];
  const revenues = ["<$500k", "$500k-$1M", "$1M-$5M", "$5M-$20M", "$20M+"];

  const handleRun = async () => {
    if (!businessType.trim() || !currentChallenges.trim()) return;
    const inputs = { businessType: businessType.trim(), stage, currentChallenges: currentChallenges.trim(), revenueRange, timeHorizon: "90 days" };
    await run(inputs);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3"><TrendingUp className="h-7 w-7 text-primary-500" /><h2 className="text-2xl font-semibold">{appName}</h2></div>
      <p className="text-gray-400 -mt-4">Get a personalized 90-day growth plan with prioritized levers, roadmap, and KPIs.</p>

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
          <Mic className="h-4 w-4" /> Live Voice
        </button>
      </div>

      {mode === "voice" && !output && (
        <RealtimeVoiceSession
          appId={appId}
          voice="nova"
          onStructuredResult={handleVoiceResult}
          onEnd={() => {}}
        />
      )}

      {output ? (
        <div><StructuredResult result={output} title="90-Day Growth Plan" /><ResultActions onNew={() => reset()} newLabel="New Plan" /></div>
      ) : (
        <div className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-sm font-medium text-gray-300 mb-2 block">Business Type / Niche</Label><Input value={businessType} onChange={e=>setBusinessType(e.target.value)} placeholder="e.g. B2B SaaS for HR teams or Local dental clinic chain" disabled={isRunning} className="bg-black border-gray-700" /></div>
            <div><Label className="text-sm font-medium text-gray-300 mb-2 block">Current Stage</Label><select value={stage} onChange={e=>setStage(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">{stages.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <PromptTextarea label="Top Challenges & Goals" placeholder="e.g. CAC too high, churn at 8%, want to 3x pipeline in next quarter..." value={currentChallenges} onChange={setCurrentChallenges} disabled={isRunning} />
          <div><Label className="text-sm font-medium text-gray-300 mb-2 block">Annual Revenue Range</Label><select value={revenueRange} onChange={e=>setRevenueRange(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">{revenues.map(r=><option key={r} value={r}>{r}</option>)}</select></div>

          <Button onClick={handleRun} disabled={!businessType.trim() || !currentChallenges.trim() || isRunning} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg"><Play className="mr-2 h-5 w-5" />{isRunning ? "Building your growth plan..." : "Run AI Business Growth Consultant"}</Button>
          {isRunning && isStreaming && streamingContent && (
            <div className="text-sm text-gray-400 italic animate-pulse mt-2 max-w-xl truncate">
              {streamingContent.slice(-200)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}