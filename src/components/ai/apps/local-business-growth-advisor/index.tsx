/**
 * Local Business Growth Advisor — Production UI (Batch 10)
 * New VideoRemix Name: Local Business Growth Advisor
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, TrendingUp } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function LocalBusinessGrowthAdvisor({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("restaurant");
  const [locationType, setLocationType] = useState("downtown");
  const [competitors, setCompetitors] = useState("");
  const [growthGoal, setGrowthGoal] = useState("attract-customers");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset, enableMultiTurn: true });

  useEffect(() => { onRunningChange?.(isRunning); }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!businessName.trim()) return;
    await run({
      businessName: businessName.trim(),
      industry,
      locationType,
      competitors: competitors.trim(),
      growthGoal,
    });
  };

  const handleReset = () => reset();
  const handleClearAll = () => {
    setBusinessName("");
    setIndustry("restaurant");
    setLocationType("downtown");
    setCompetitors("");
    setGrowthGoal("attract-customers");
    reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Get growth opportunities, local marketing tactics, online presence strategies, partnership ideas, quick wins, and long-term growth strategy for your local business.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Business Name</Label>
            <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Your Business Name" disabled={isRunning} className="bg-black border-gray-700 text-white" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Industry</Label>
              <select value={industry} onChange={e => setIndustry(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
                <option value="restaurant">Restaurant</option>
                <option value="retail">Retail</option>
                <option value="service">Service</option>
                <option value="healthcare">Healthcare</option>
                <option value="professional">Professional</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Location Type</Label>
              <select value={locationType} onChange={e => setLocationType(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
                <option value="downtown">Downtown</option>
                <option value="suburban">Suburban</option>
                <option value="mall">Mall</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Growth Goal</Label>
              <select value={growthGoal} onChange={e => setGrowthGoal(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
                <option value="attract-customers">Attract Customers</option>
                <option value="retain-customers">Retain Customers</option>
                <option value="expand">Expand</option>
                <option value="reduce-costs">Reduce Costs</option>
              </select>
            </div>
          </div>

          <PromptTextarea label="Competitors (Optional)" placeholder="List nearby competitors or businesses you compete with. What do they do well? Where do they fall short?" value={competitors} onChange={setCompetitors} disabled={isRunning} rows={3} />

          <Button onClick={handleRun} disabled={!businessName.trim() || isRunning} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg">
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Analyzing growth opportunities..." : "Run Local Business Growth Advisor"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Growth Strategy & Recommendations" />
          <ResultActions onNew={handleReset} newLabel="New Analysis" onClear={handleClearAll} clearLabel="Clear All" />
        </div>
      )}
    </div>
  );
}