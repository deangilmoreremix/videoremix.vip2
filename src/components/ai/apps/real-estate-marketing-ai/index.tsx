/**
 * Real Estate Marketing AI — Production UI (Batch 10)
 * New VideoRemix Name: Real Estate Marketing AI
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Home } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function RealEstateMarketingAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [propertyType, setPropertyType] = useState("residential");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [listingGoal, setListingGoal] = useState("sell");
  const [targetBuyers, setTargetBuyers] = useState("");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset, enableMultiTurn: true });

  useEffect(() => { onRunningChange?.(isRunning); }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!propertyAddress.trim() && !targetBuyers.trim()) return;
    await run({
      propertyType,
      propertyAddress: propertyAddress.trim(),
      listingGoal,
      targetBuyers: targetBuyers.trim(),
    });
  };

  const handleReset = () => reset();
  const handleClearAll = () => {
    setPropertyType("residential");
    setPropertyAddress("");
    setListingGoal("sell");
    setTargetBuyers("");
    reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Home className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">AI-powered real estate marketing strategy, pricing analysis, listing copy, social media content, email campaigns, and visual suggestions.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Property Type</Label>
              <select value={propertyType} onChange={e => setPropertyType(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Listing Goal</Label>
              <select value={listingGoal} onChange={e => setListingGoal(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
                <option value="sell">Sell</option>
                <option value="rent">Rent</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Property Address</Label>
            <Input value={propertyAddress} onChange={e => setPropertyAddress(e.target.value)} placeholder="123 Main St, City, State ZIP" disabled={isRunning} className="bg-black border-gray-700 text-white" />
          </div>

          <PromptTextarea label="Target Buyers" placeholder="Describe your ideal buyer or tenant: family of 4, first-time homebuyers, investors looking for rental income..." value={targetBuyers} onChange={setTargetBuyers} disabled={isRunning} rows={4} />

          <Button onClick={handleRun} disabled={isRunning} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg">
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Generating marketing plan..." : "Run Real Estate Marketing AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Real Estate Marketing Package" />
          <ResultActions onNew={handleReset} newLabel="New Property" onClear={handleClearAll} clearLabel="Clear All" />
        </div>
      )}
    </div>
  );
}