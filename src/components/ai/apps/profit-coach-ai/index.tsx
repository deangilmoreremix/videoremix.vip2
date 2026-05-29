/**
 * Profit Coach AI — Production UI
 * New VideoRemix Name: Profit Coach AI
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, TrendingUp, Zap, Target } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function ProfitCoachAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [businessModel, setBusinessModel] = useState("");
  const [currentMargins, setCurrentMargins] = useState("");
  const [revenue, setRevenue] = useState("");
  const [targetProfitIncrease, setTargetProfitIncrease] = useState("10");
  const [lastInputs, setLastInputs] = useState<Record<string, unknown> | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, {
    enableMultiTurn: true,
    onResult,
    onError,
    onReset,
  });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  const handleRun = async () => {
    if (!businessModel.trim()) return;
    const inputs = {
      businessModel: businessModel.trim(),
      currentMargins: currentMargins.trim() || undefined,
      revenue: revenue.trim() || undefined,
      targetProfitIncrease,
    };
    setLastInputs(inputs);
    await run(inputs);
  };

  const handleQuickIterate = async (focus: string) => {
    const base = lastInputs || { businessModel: businessModel.trim(), currentMargins: currentMargins.trim(), revenue: revenue.trim(), targetProfitIncrease };
    await run({ ...base, _iterationFocus: focus });
  };

  const handleReset = () => {
    setBusinessModel("");
    setCurrentMargins("");
    setRevenue("");
    setTargetProfitIncrease("10");
    setLastInputs(null);
    reset();
  };

  const handleClearAll = () => {
    setBusinessModel("");
    setCurrentMargins("");
    setRevenue("");
    setTargetProfitIncrease("10");
    setLastInputs(null);
    reset();
  };

  const targetOptions = [
    { value: "5", label: "5% increase" },
    { value: "10", label: "10% increase" },
    { value: "15", label: "15% increase" },
    { value: "20", label: "20% increase" },
    { value: "30", label: "30% increase" },
    { value: "50", label: "50% increase" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <TrendingUp className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400">AI-powered profit optimization strategies tailored to your business model, margins, and revenue goals.</p>

      {!output ? (
        <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6 space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Business Model / Description</Label>
            <textarea
              value={businessModel}
              onChange={(e) => setBusinessModel(e.target.value)}
              placeholder="Describe your business model (e.g. SaaS subscription, e-commerce, agency services, etc.)"
              disabled={isRunning}
              rows={3}
              className="w-full rounded-lg border border-gray-700 bg-black p-3 text-white placeholder:text-gray-500 focus:border-primary-500 focus:outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Current Margins (%)</Label>
              <Input
                value={currentMargins}
                onChange={(e) => setCurrentMargins(e.target.value)}
                placeholder="e.g. 25%"
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Monthly Revenue</Label>
              <Input
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="e.g. $50,000"
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Target Profit Increase</Label>
              <select
                value={targetProfitIncrease}
                onChange={(e) => setTargetProfitIncrease(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-lg border border-gray-700 bg-black p-2.5 text-white focus:border-primary-500 focus:outline-none"
              >
                {targetOptions.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <Button
            onClick={handleRun}
            disabled={!businessModel.trim() || isRunning}
            className="w-full bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Analyzing Profit Opportunities..." : "Analyze Profit Potential"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <StructuredResult
            result={output}
            title="Profit Optimization Report"
          />
          {lastInputs && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-400 py-2">Quick follow-ups:</span>
              <Button variant="outline" size="sm" onClick={() => handleQuickIterate("pricing")} className="border-gray-700">
                Pricing Strategy
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickIterate("costs")} className="border-gray-700">
                Cost Reduction
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickIterate("growth")} className="border-gray-700">
                Growth Hacks
              </Button>
            </div>
          )}
          <ResultActions
            onNew={handleReset}
            newLabel="New Analysis"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}

ProfitCoachAI.displayName = "ProfitCoachAI";