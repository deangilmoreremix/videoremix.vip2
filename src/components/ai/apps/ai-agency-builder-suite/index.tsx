/**
 * AI Agency Builder Suite — Production UI
 * New VideoRemix Name: AI Agency Builder Suite
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Briefcase } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AIAgencyBuilderSuite({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [niche, setNiche] = useState("");
  const [experience, setExperience] = useState("Solo founder transitioning from freelance");
  const [targetClients, setTargetClients] = useState("");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!niche.trim() || !targetClients.trim()) return;
    const inputs = { niche: niche.trim(), experience, targetClients: targetClients.trim(), goal: "Launch profitable agency in 90 days" };
    await run(inputs);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3"><Briefcase className="h-7 w-7 text-primary-500" /><h2 className="text-2xl font-semibold">{appName}</h2></div>
      <p className="text-gray-400 -mt-4">Complete agency launch kit: positioning, packages, acquisition playbook, operations, and 90-day plan.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div><Label className="text-sm font-medium text-gray-300 mb-2 block">Agency Niche / Service Focus</Label><Input value={niche} onChange={e=>setNiche(e.target.value)} placeholder="AI automation for e-commerce brands or Fractional CMO for B2B SaaS" disabled={isRunning} className="bg-black border-gray-700" /></div>
          <div><Label className="text-sm font-medium text-gray-300 mb-2 block">Your Background / Team</Label><Input value={experience} onChange={e=>setExperience(e.target.value)} disabled={isRunning} className="bg-black border-gray-700" /></div>
          <PromptTextarea label="Ideal Client Profile" placeholder="Who pays you? Pain, company size, where they hang out, budget..." value={targetClients} onChange={setTargetClients} disabled={isRunning} />
          <Button onClick={handleRun} disabled={!niche.trim() || !targetClients.trim() || isRunning} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg"><Play className="mr-2 h-5 w-5" />{isRunning ? "Building your agency empire..." : "Run AI Agency Builder Suite"}</Button>
        </div>
      ) : <div><StructuredResult result={output} title="Agency Launch Blueprint" /><ResultActions onNew={() => reset()} newLabel="Build Another Model" /></div>}
    </div>
  );
}
