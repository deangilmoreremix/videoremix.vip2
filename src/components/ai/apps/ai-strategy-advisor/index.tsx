/**
 * AI Strategy Advisor — Production UI
 * New VideoRemix Name: AI Strategy Advisor
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Target } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AIStrategyAdvisor({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [company, setCompany] = useState("");
  const [focusArea, setFocusArea] = useState("Market Expansion");
  const [context, setContext] = useState("");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const focusAreas = ["Market Expansion", "New Product Launch", "Competitive Defense", "Operational Efficiency", "M&A / Partnership", "Digital Transformation"];

  const handleRun = async () => {
    if (!company.trim() || !context.trim()) return;
    const inputs = { company: company.trim(), focusArea, context: context.trim(), timeframe: "12-18 months" };
    await run(inputs);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3"><Target className="h-7 w-7 text-primary-500" /><h2 className="text-2xl font-semibold">{appName}</h2></div>
      <p className="text-gray-400 -mt-4">Board-level strategic analysis and recommended path forward with clear execution priorities.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-sm font-medium text-gray-300 mb-2 block">Company / Initiative</Label><Input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Acme Inc or 'Our Series B SaaS platform'" disabled={isRunning} className="bg-black border-gray-700" /></div>
            <div><Label className="text-sm font-medium text-gray-300 mb-2 block">Strategic Focus Area</Label><select value={focusArea} onChange={e=>setFocusArea(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">{focusAreas.map(f => <option key={f}>{f}</option>)}</select></div>
          </div>
          <PromptTextarea label="Current Situation & Constraints" placeholder="Market position, key competitors, resources, recent wins/losses, must-win goals..." value={context} onChange={setContext} disabled={isRunning} rows={5} />
          <Button onClick={handleRun} disabled={!company.trim() || !context.trim() || isRunning} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg"><Play className="mr-2 h-5 w-5" />{isRunning ? "Running strategy war game..." : "Run AI Strategy Advisor"}</Button>
        </div>
      ) : <div><StructuredResult result={output} title="Strategic Recommendation" /><ResultActions onNew={() => reset()} newLabel="New Strategy Session" /></div>}
    </div>
  );
}
