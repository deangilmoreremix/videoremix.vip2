/**
 * Launch Campaign Builder AI — Production UI
 * New VideoRemix Name: Launch Campaign Builder AI
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Rocket } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function LaunchCampaignBuilderAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [product, setProduct] = useState("");
  const [launchType, setLaunchType] = useState("New Product");
  const [budget, setBudget] = useState("$5k-$15k");
  const [audience, setAudience] = useState("");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const types = ["New Product", "Feature Drop", "Rebrand", "Partnership", "Event / Webinar"];

  const handleRun = async () => {
    if (!product.trim() || !audience.trim()) return;
    const inputs = { product: product.trim(), launchType, budget, audience: audience.trim(), durationWeeks: 6 };
    await run(inputs);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3"><Rocket className="h-7 w-7 text-primary-500" /><h2 className="text-2xl font-semibold">{appName}</h2></div>
      <p className="text-gray-400 -mt-4">Complete 6-week launch campaign plan with channels, content, timeline, and measurement.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div><Label className="text-sm font-medium text-gray-300 mb-2 block">Product / Offer Being Launched</Label><Input value={product} onChange={e=>setProduct(e.target.value)} placeholder="New AI-powered workflow automation tool" disabled={isRunning} className="bg-black border-gray-700" /></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label className="text-sm font-medium text-gray-300 mb-2 block">Launch Type</Label><select value={launchType} onChange={e=>setLaunchType(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">{types.map(t=><option key={t}>{t}</option>)}</select></div>
            <div><Label className="text-sm font-medium text-gray-300 mb-2 block">Budget Range</Label><Input value={budget} onChange={e=>setBudget(e.target.value)} placeholder="$5k-$15k" disabled={isRunning} className="bg-black border-gray-700" /></div>
            <div><Label className="text-sm font-medium text-gray-300 mb-2 block">Primary Audience</Label><Input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Growth marketers at 50-200 person SaaS" disabled={isRunning} className="bg-black border-gray-700" /></div>
          </div>
          <Button onClick={handleRun} disabled={!product.trim() || !audience.trim() || isRunning} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg"><Play className="mr-2 h-5 w-5" />{isRunning ? "Building full GTM campaign..." : "Run Launch Campaign Builder AI"}</Button>
        </div>
      ) : <div><StructuredResult result={output} title="Full Launch Campaign Blueprint" /><ResultActions onNew={() => reset()} newLabel="Plan Another Launch" /></div>}
    </div>
  );
}
