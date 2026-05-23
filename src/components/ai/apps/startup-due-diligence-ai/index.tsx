import React, { useState, useEffect } from "react";
import { Play, Loader2, AlertTriangle, CheckCircle2, Minus, TrendingUp } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

interface VerdictBannerProps {
  recommendation: "invest" | "no_invest" | "hold";
}

function VerdictBanner({ recommendation }: VerdictBannerProps) {
  const config = {
    invest: {
      icon: CheckCircle2,
      title: "Invest",
      description: "Strong opportunity identified — recommends moving forward",
      bg: "bg-green-950/40 border-green-700",
      iconColor: "text-green-400",
      titleColor: "text-green-400",
    },
    no_invest: {
      icon: AlertTriangle,
      title: "No Invest",
      description: "Significant concerns identified — recommends against",
      bg: "bg-red-950/40 border-red-700",
      iconColor: "text-red-400",
      titleColor: "text-red-400",
    },
    hold: {
      icon: Minus,
      title: "Hold",
      description: "Mixed signals — recommends further due diligence",
      bg: "bg-yellow-950/40 border-yellow-700",
      iconColor: "text-yellow-400",
      titleColor: "text-yellow-400",
    },
  };

  const { icon: Icon, title, description, bg, iconColor, titleColor } = config[recommendation] || config.hold;

  return (
    <div className={`rounded-xl border p-6 ${bg}`}>
      <div className="flex items-center gap-4">
        <div className={`rounded-full p-3 bg-black/30`}>
          <Icon className={`h-10 w-10 ${iconColor}`} />
        </div>
        <div>
          <h3 className={`text-2xl font-bold ${titleColor}`}>{title}</h3>
          <p className="text-gray-300 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function StartupDueDiligenceAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [startupName, setStartupName] = useState("");
  const [pitchDeck, setPitchDeck] = useState("");
  const [stage, setStage] = useState("seed");
  const [investmentAmount, setInvestmentAmount] = useState("");
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
    if (!startupName.trim()) return;
    const inputs = {
      startupName: startupName.trim(),
      pitchDeck: pitchDeck.trim() || undefined,
      stage,
      investmentAmount: investmentAmount.trim() || undefined,
    };
    setLastInputs(inputs);
    await run(inputs);
  };

  const handleQuickIterate = async (focus: string) => {
    const base = lastInputs || { startupName: startupName.trim(), pitchDeck: pitchDeck.trim(), stage, investmentAmount: investmentAmount.trim() };
    await run({ ...base, _iterationFocus: focus });
  };

  const handleReset = () => {
    setStartupName("");
    setPitchDeck("");
    setStage("seed");
    setInvestmentAmount("");
    setLastInputs(null);
    reset();
  };

  const handleClearAll = () => {
    setStartupName("");
    setPitchDeck("");
    setStage("seed");
    setInvestmentAmount("");
    setLastInputs(null);
    reset();
  };

  const stages = [
    { value: "pre-seed", label: "Pre-Seed" },
    { value: "seed", label: "Seed" },
    { value: "series-a", label: "Series A" },
    { value: "series-b", label: "Series B" },
  ];

  const getVerdictFromOutput = (out: any): "invest" | "no_invest" | "hold" | null => {
    if (!out) return null;
    const str = JSON.stringify(out).toLowerCase();
    if (str.includes('"recommendation"') || str.includes('"investment recommendation"')) {
      const obj = typeof out === "object" ? out : {};
      const rec = obj.recommendation || obj.investmentRecommendation || "";
      if (rec.toLowerCase().includes("invest")) return "invest";
      if (rec.toLowerCase().includes("no") || rec.toLowerCase().includes("don't") || rec.toLowerCase().includes("avoid")) return "no_invest";
      return "hold";
    }
    return null;
  };

  const verdict = output ? getVerdictFromOutput(output) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <TrendingUp className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400">Comprehensive due diligence analysis for startup investments. Get team assessment, market analysis, valuation fairness, and investment recommendations.</p>

      {!output ? (
        <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Startup Name</Label>
              <Input
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
                placeholder="e.g. Acme AI, Stripe, Notion"
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Funding Stage</Label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-lg border border-gray-700 bg-black p-2.5 text-white focus:border-primary-500 focus:outline-none"
              >
                {stages.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Investment Amount (Optional)</Label>
            <Input
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
              placeholder="e.g. $500,000, $2M"
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Pitch Deck / Business Plan (Optional)</Label>
            <textarea
              value={pitchDeck}
              onChange={(e) => setPitchDeck(e.target.value)}
              placeholder="Paste key information from the pitch deck, business plan, or any relevant documents..."
              disabled={isRunning}
              rows={6}
              className="w-full rounded-lg border border-gray-700 bg-black p-3 text-white placeholder:text-gray-500 focus:border-primary-500 focus:outline-none resize-none"
            />
          </div>
          <Button
            onClick={handleRun}
            disabled={!startupName.trim() || isRunning}
            className="w-full bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Conducting Due Diligence..." : "Run Due Diligence Analysis"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {verdict && <VerdictBanner recommendation={verdict} />}
          <StructuredResult
            result={output}
            title={`Due Diligence Report: ${startupName}`}
          />
          {lastInputs && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-400 py-2">Quick follow-ups:</span>
              <Button variant="outline" size="sm" onClick={() => handleQuickIterate("team")} className="border-gray-700">
                Team Analysis
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickIterate("market")} className="border-gray-700">
                Market Analysis
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickIterate("valuation")} className="border-gray-700">
                Valuation
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickIterate("risks")} className="border-gray-700">
                Risk Factors
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

StartupDueDiligenceAI.displayName = "StartupDueDiligenceAI";