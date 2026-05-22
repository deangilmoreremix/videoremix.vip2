/**
 * AI Sales Email Writer — Production UI
 * New VideoRemix Name: AI Sales Email Writer
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Mail } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AISalesEmailWriter({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [prospect, setProspect] = useState("");
  const [tone, setTone] = useState("Consultative");
  const [goal, setGoal] = useState("");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const tones = ["Consultative", "Direct / Challenger", "Value-First", "Story-Driven", "Urgency"];

  const handleRun = async () => {
    if (!prospect.trim() || !goal.trim()) return;
    const inputs = { prospect: prospect.trim(), tone, goal: goal.trim(), length: "medium (75-120 words)" };
    await run(inputs);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3"><Mail className="h-7 w-7 text-primary-500" /><h2 className="text-2xl font-semibold">{appName}</h2></div>
      <p className="text-gray-400 -mt-4">Generate 3 high-converting, personalized sales email variants + follow-up sequence in seconds.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div><Label className="text-sm font-medium text-gray-300 mb-2 block">Prospect / Company + Context</Label><Input value={prospect} onChange={e=>setProspect(e.target.value)} placeholder="VP Marketing @ GrowthCo (just raised $12M, hiring 3 SDRs)" disabled={isRunning} className="bg-black border-gray-700" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-sm font-medium text-gray-300 mb-2 block">Tone</Label><select value={tone} onChange={e=>setTone(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">{tones.map(t=><option key={t}>{t}</option>)}</select></div>
            <div><Label className="text-sm font-medium text-gray-300 mb-2 block">Primary Goal / Offer</Label><Input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Book 15-min discovery call" disabled={isRunning} className="bg-black border-gray-700" /></div>
          </div>
          <Button onClick={handleRun} disabled={!prospect.trim() || !goal.trim() || isRunning} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg"><Play className="mr-2 h-5 w-5" />{isRunning ? "Writing & A/B testing emails..." : "Run AI Sales Email Writer"}</Button>
        </div>
      ) : <div><StructuredResult result={output} title="Email Variants + Sequence" /><ResultActions onNew={() => reset()} newLabel="Write More Emails" /></div>}
    </div>
  );
}
