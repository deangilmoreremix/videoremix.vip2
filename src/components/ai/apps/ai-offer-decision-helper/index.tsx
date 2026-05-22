/**
 * AI Offer Decision Helper — Production UI
 * New VideoRemix Name: AI Offer Decision Helper
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, DollarSign } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AIOfferDecisionHelper({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [currentOffer, setCurrentOffer] = useState("");
  const [pricePoint, setPricePoint] = useState("");
  const [targetBuyer, setTargetBuyer] = useState("");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!currentOffer.trim()) return;
    const inputs = { currentOffer: currentOffer.trim(), pricePoint: pricePoint || "TBD", targetBuyer: targetBuyer.trim() || "SMB founders", objective: "Maximize close rate + LTV while protecting margin" };
    await run(inputs);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3"><DollarSign className="h-7 w-7 text-primary-500" /><h2 className="text-2xl font-semibold">{appName}</h2></div>
      <p className="text-gray-400 -mt-4">Optimize pricing, packaging, and positioning for higher conversion and better economics.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <PromptTextarea label="Current Offer Description" placeholder="e.g. $97/mo all-in platform with onboarding, templates, and 1:1 support" value={currentOffer} onChange={setCurrentOffer} disabled={isRunning} rows={3} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-sm font-medium text-gray-300 mb-2 block">Current / Proposed Price</Label><Input value={pricePoint} onChange={e=>setPricePoint(e.target.value)} placeholder="$297 one-time or $49/mo" disabled={isRunning} className="bg-black border-gray-700" /></div>
            <div><Label className="text-sm font-medium text-gray-300 mb-2 block">Ideal Buyer</Label><Input value={targetBuyer} onChange={e=>setTargetBuyer(e.target.value)} placeholder="Marketing teams at 20-80 person B2B SaaS" disabled={isRunning} className="bg-black border-gray-700" /></div>
          </div>
          <Button onClick={handleRun} disabled={!currentOffer.trim() || isRunning} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg"><Play className="mr-2 h-5 w-5" />{isRunning ? "Running pricing experiments..." : "Run AI Offer Decision Helper"}</Button>
        </div>
      ) : <div><StructuredResult result={output} title="Optimized Offer Recommendations" /><ResultActions onNew={() => reset()} newLabel="Test Another Offer" /></div>}
    </div>
  );
}
