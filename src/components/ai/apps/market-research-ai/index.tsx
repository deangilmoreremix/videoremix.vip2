/**
 * Market Research AI — Production UI (Batch 5)
 * New VideoRemix Name: Market Research AI
 * Full market analysis: size, players, opportunities, threats, customer profile, pricing, barriers, go/no-go recommendation.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, TrendingUp } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function MarketResearchAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [marketTopic, setMarketTopic] = useState("");
  const [targetGeography, setTargetGeography] = useState("Global");
  const [researchType, setResearchType] = useState<"opportunity" | "threat" | "competitive" | "feasibility">("opportunity");
  const [reportDepth, setReportDepth] = useState<"brief" | "standard" | "comprehensive">("standard");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!marketTopic.trim()) return;

    const inputs = {
      marketTopic: marketTopic.trim(),
      targetGeography: targetGeography.trim(),
      researchType,
      reportDepth,
    };

    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setMarketTopic("");
    setTargetGeography("Global");
    setResearchType("opportunity");
    setReportDepth("standard");
    reset();
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <TrendingUp className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Comprehensive market intelligence. Delivers market size/growth, competitive landscape, opportunities, threats, customer profiles, pricing trends, barriers, and clear go/no-go recommendation with live data.</p>
      </div>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Market or Industry Topic</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. AI-powered video editing tools for creators"
              value={marketTopic}
              onChange={setMarketTopic}
              disabled={isRunning}
              maxLength={1400}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Target Geography</Label>
              <Input
                value={targetGeography}
                onChange={(e) => setTargetGeography(e.target.value)}
                placeholder="Global, US, EU, LATAM..."
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Research Type</Label>
              <select
                value={researchType}
                onChange={(e) => setResearchType(e.target.value as any)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white"
              >
                <option value="opportunity">Opportunity Analysis</option>
                <option value="threat">Threat / Risk Analysis</option>
                <option value="competitive">Competitive Landscape</option>
                <option value="feasibility">Feasibility Study</option>
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Report Depth</Label>
              <select
                value={reportDepth}
                onChange={(e) => setReportDepth(e.target.value as any)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white"
              >
                <option value="brief">Brief</option>
                <option value="standard">Standard</option>
                <option value="comprehensive">Comprehensive</option>
              </select>
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={!marketTopic.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Analyzing market with live data..." : "Run Market Research AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Market Research Report" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Market Analysis"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}
