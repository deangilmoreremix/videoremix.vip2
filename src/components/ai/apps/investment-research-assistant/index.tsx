/**
 * Investment Research Assistant — Production UI
 * New VideoRemix Name: Investment Research Assistant
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, TrendingUp, PieChart, AlertTriangle } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function InvestmentResearchAssistant({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [investmentOptions, setInvestmentOptions] = useState("");
  const [riskTolerance, setRiskTolerance] = useState("moderate");
  const [investmentHorizon, setInvestmentHorizon] = useState("medium");
  const [amount, setAmount] = useState("");
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
    if (!investmentOptions.trim()) return;
    const inputs = {
      investmentOptions: investmentOptions.trim(),
      riskTolerance,
      investmentHorizon,
      amount: amount.trim() || undefined,
    };
    setLastInputs(inputs);
    await run(inputs);
  };

  const handleQuickIterate = async (focus: string) => {
    const base = lastInputs || { investmentOptions: investmentOptions.trim(), riskTolerance, investmentHorizon, amount: amount.trim() };
    await run({ ...base, _iterationFocus: focus });
  };

  const handleReset = () => {
    setInvestmentOptions("");
    setRiskTolerance("moderate");
    setInvestmentHorizon("medium");
    setAmount("");
    setLastInputs(null);
    reset();
  };

  const handleClearAll = () => {
    setInvestmentOptions("");
    setRiskTolerance("moderate");
    setInvestmentHorizon("medium");
    setAmount("");
    setLastInputs(null);
    reset();
  };

  const riskLevels = [
    { value: "conservative", label: "Conservative", color: "text-green-400" },
    { value: "moderate", label: "Moderate", color: "text-yellow-400" },
    { value: "aggressive", label: "Aggressive", color: "text-red-400" },
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case "conservative": return { text: "text-green-400", bg: "bg-green-950/30", bar: "bg-green-500" };
      case "moderate": return { text: "text-yellow-400", bg: "bg-yellow-950/30", bar: "bg-yellow-500" };
      case "aggressive": return { text: "text-red-400", bg: "bg-red-950/30", bar: "bg-red-500" };
      default: return { text: "text-gray-400", bg: "bg-gray-900", bar: "bg-gray-500" };
    }
  };

  const horizonOptions = [
    { value: "short", label: "Short (< 1 year)" },
    { value: "medium", label: "Medium (1-5 years)" },
    { value: "long", label: "Long (5+ years)" },
  ];

  const riskColors = getRiskColor(riskTolerance);
  const riskIndex = riskLevels.findIndex(r => r.value === riskTolerance);
  const riskPercent = ((riskIndex + 1) / 3) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <PieChart className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400">Get personalized investment recommendations, portfolio allocation strategies, and risk assessment based on your profile.</p>

      {!output ? (
        <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6 space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Investment Options / Preferences</Label>
            <textarea
              value={investmentOptions}
              onChange={(e) => setInvestmentOptions(e.target.value)}
              placeholder="List investment options you're considering (e.g. stocks, bonds, real estate, crypto, index funds, individual stocks like AAPL, Tesla, etc.)"
              disabled={isRunning}
              rows={4}
              className="w-full rounded-lg border border-gray-700 bg-black p-3 text-white placeholder:text-gray-500 focus:border-primary-500 focus:outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Risk Tolerance</Label>
              <select
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-lg border border-gray-700 bg-black p-2.5 text-white focus:border-primary-500 focus:outline-none"
              >
                {riskLevels.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Conservative</span>
                  <span className={`font-medium ${riskColors.text}`}>{riskLevels.find(r => r.value === riskTolerance)?.label}</span>
                  <span className="text-gray-500">Aggressive</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full ${riskColors.bar} transition-all duration-300`} style={{ width: `${riskPercent}%` }} />
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Investment Horizon</Label>
              <select
                value={investmentHorizon}
                onChange={(e) => setInvestmentHorizon(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-lg border border-gray-700 bg-black p-2.5 text-white focus:border-primary-500 focus:outline-none"
              >
                {horizonOptions.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Investment Amount</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. $10,000"
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>
          </div>
          <Button
            onClick={handleRun}
            disabled={!investmentOptions.trim() || isRunning}
            className="w-full bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Analyzing Investments..." : "Get Recommendations"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <StructuredResult
            result={output}
            title="Investment Research Report"
          />
          {lastInputs && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-400 py-2">Quick follow-ups:</span>
              <Button variant="outline" size="sm" onClick={() => handleQuickIterate("diversification")} className="border-gray-700">
                Diversification
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickIterate("timing")} className="border-gray-700">
                Timing Advice
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickIterate("risk_details")} className="border-gray-700">
                Risk Details
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

InvestmentResearchAssistant.displayName = "InvestmentResearchAssistant";