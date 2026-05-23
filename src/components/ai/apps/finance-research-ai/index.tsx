import React, { useState, useEffect } from "react";
import { Play, Loader2, TrendingUp } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function FinanceResearchAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [ticker, setTicker] = useState("");
  const [researchType, setResearchType] = useState("earnings");
  const [timeFrame, setTimeFrame] = useState("1Y");
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
    if (!ticker.trim()) return;
    const inputs = { companyTicker: ticker.trim().toUpperCase(), researchType, timeFrame };
    setLastInputs(inputs);
    await run(inputs);
  };

  const handleQuickIterate = async (focus: string) => {
    const base = lastInputs || { companyTicker: ticker.trim().toUpperCase(), researchType, timeFrame };
    await run({ ...base, _iterationFocus: focus });
  };

  const handleReset = () => {
    setTicker("");
    setLastInputs(null);
    reset();
  };

  const handleClearAll = () => {
    setTicker("");
    setResearchType("earnings");
    setTimeFrame("1Y");
    setLastInputs(null);
    reset();
  };

  const researchTypes = [
    { value: "earnings", label: "Earnings Analysis" },
    { value: "valuation", label: "Valuation Analysis" },
    { value: "industry", label: "Industry Context" },
    { value: "competitor", label: "Competitor Analysis" },
  ];

  const timeFrames = [
    { value: "1M", label: "1 Month" },
    { value: "3M", label: "3 Months" },
    { value: "6M", label: "6 Months" },
    { value: "1Y", label: "1 Year" },
    { value: "3Y", label: "3 Years" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <TrendingUp className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400">Get comprehensive financial research, valuation analysis, and market insights for any publicly traded company.</p>

      {!output ? (
        <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Company Ticker</Label>
              <div className="relative">
                <Input
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="AAPL, MSFT, GOOGL"
                  disabled={isRunning}
                  className="bg-black border-gray-700 text-white font-mono text-lg tracking-wider pl-10"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
              </div>
              {ticker && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-gray-400">Ticker: {ticker.toUpperCase()}</span>
                </div>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Research Type</Label>
              <select
                value={researchType}
                onChange={(e) => setResearchType(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-lg border border-gray-700 bg-black p-2.5 text-white focus:border-primary-500 focus:outline-none"
              >
                {researchTypes.map((rt) => (
                  <option key={rt.value} value={rt.value}>{rt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Time Frame</Label>
              <select
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-lg border border-gray-700 bg-black p-2.5 text-white focus:border-primary-500 focus:outline-none"
              >
                {timeFrames.map((tf) => (
                  <option key={tf.value} value={tf.value}>{tf.label}</option>
                ))}
              </select>
            </div>
          </div>
          <Button
            onClick={handleRun}
            disabled={!ticker.trim() || isRunning}
            className="w-full bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Researching Company..." : "Research Company"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <StructuredResult
            result={output}
            title={`${ticker.toUpperCase()} — ${researchTypes.find(r => r.value === researchType)?.label}`}
          />
          {lastInputs && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-400 py-2">Quick follow-ups:</span>
              <Button variant="outline" size="sm" onClick={() => handleQuickIterate("deeper_earnings")} className="border-gray-700">
                Deeper Earnings
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickIterate("competitors")} className="border-gray-700">
                Compare Competitors
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickIterate("risks")} className="border-gray-700">
                Risk Factors
              </Button>
            </div>
          )}
          <ResultActions
            onNew={handleReset}
            newLabel="New Research"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}

FinanceResearchAI.displayName = "FinanceResearchAI";