/**
 * Competitor Spy AI — Production UI
 * New VideoRemix Name: Competitor Spy AI
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Eye } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function CompetitorSpyAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [yourCompany, setYourCompany] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [focus, setFocus] = useState("Pricing & Packaging");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const focuses = ["Pricing & Packaging", "Positioning & Messaging", "Feature Gaps", "Go-to-Market Channels", "Customer Experience", "Overall Landscape"];

  const handleRun = async () => {
    if (!yourCompany.trim() || !competitors.trim()) return;
    const inputs = { yourCompany: yourCompany.trim(), competitors: competitors.trim(), focus, depth: "deep (website, reviews, recent moves)" };
    await run(inputs);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3"><Eye className="h-7 w-7 text-primary-500" /><h2 className="text-2xl font-semibold">{appName}</h2></div>
      <p className="text-gray-400 -mt-4">Deep competitive teardown with actionable counters and ongoing monitoring plan.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div><Label className="text-sm font-medium text-gray-300 mb-2 block">Your Company / Product</Label><Input value={yourCompany} onChange={e=>setYourCompany(e.target.value)} placeholder="Our AI video editing platform" disabled={isRunning} className="bg-black border-gray-700" /></div>
          <div><Label className="text-sm font-medium text-gray-300 mb-2 block">Competitors (comma separated)</Label><Input value={competitors} onChange={e=>setCompetitors(e.target.value)} placeholder="CapCut, Descript, Runway, Adobe Premiere" disabled={isRunning} className="bg-black border-gray-700" /></div>
          <div><Label className="text-sm font-medium text-gray-300 mb-2 block">Focus Area</Label><select value={focus} onChange={e=>setFocus(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">{focuses.map(f=><option key={f}>{f}</option>)}</select></div>
          <Button onClick={handleRun} disabled={!yourCompany.trim() || !competitors.trim() || isRunning} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg"><Play className="mr-2 h-5 w-5" />{isRunning ? "Spying on the competition..." : "Run Competitor Spy AI"}</Button>
        </div>
      ) : <div><StructuredResult result={output} title="Competitive Intelligence Report" /><ResultActions onNew={() => reset()} newLabel="New Spy Mission" /></div>}
    </div>
  );
}
