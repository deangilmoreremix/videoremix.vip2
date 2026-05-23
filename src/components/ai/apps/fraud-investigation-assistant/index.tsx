/**
 * Fraud Investigation Assistant — Production UI (Batch 8)
 * New VideoRemix Name: Fraud Investigation Assistant
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, ShieldAlert, AlertTriangle, Search, Scale, ShieldCheck, ChevronRight } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

const RiskMeter: React.FC<{ level: string }> = ({ level }) => {
  const config: Record<string, { color: string; pct: number; label: string }> = {
    low: { color: "#22c55e", pct: 25, label: "Low Risk" },
    medium: { color: "#eab308", pct: 55, label: "Medium Risk" },
    high: { color: "#ef4444", pct: 80, label: "High Risk" },
    critical: { color: "#dc2626", pct: 100, label: "Critical Risk" },
  };
  const { color, pct, label } = config[level?.toLowerCase()] || config.medium;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Fraud Risk Level:</span>
        <span className="font-semibold" style={{ color }}>{label}</span>
      </div>
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
};

const FraudIndicatorItem: React.FC<{ indicator: string; severity?: string }> = ({ indicator, severity }) => {
  const sev = severity?.toLowerCase() || "";
  const isHigh = sev.includes("high") || sev.includes("critical") || sev.includes("severe");
  const borderColor = isHigh ? "border-red-900/50" : "border-yellow-900/50";
  const bgColor = isHigh ? "bg-red-950/20" : "bg-yellow-950/20";
  return (
    <li className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${borderColor} ${bgColor}`}>
      <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isHigh ? "text-red-400" : "text-yellow-400"}`} />
      <div className="flex-1">
        <span className="text-gray-200 text-sm">{indicator}</span>
        {severity && <span className={`ml-2 text-xs font-medium ${isHigh ? "text-red-400" : "text-yellow-400"}`}>[{severity}]</span>}
      </div>
    </li>
  );
};

const InvestigationStep: React.FC<{ step: string; index: number }> = ({ step, index }) => (
  <div className="flex items-start gap-3 bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3">
    <div className="w-7 h-7 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
      {index + 1}
    </div>
    <p className="text-gray-200 text-sm flex-1 pt-1">{step}</p>
    <ChevronRight className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
  </div>
);

const PreventionRec: React.FC<{ rec: string }> = ({ rec }) => (
  <li className="flex items-start gap-2">
    <ShieldCheck className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
    <span className="text-gray-300 text-sm">{rec}</span>
  </li>
);

export default function FraudInvestigationAssistant({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [suspiciousActivity, setSuspiciousActivity] = useState("");
  const [evidenceAvailable, setEvidenceAvailable] = useState("");
  const [industry, setIndustry] = useState("");
  const [lastInputs, setLastInputs] = useState<Record<string, any>>({});

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, {
    onResult, onError, onReset, enableMultiTurn: true
  });

  useEffect(() => { onRunningChange?.(isRunning); }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!suspiciousActivity.trim()) return;
    const inputs: Record<string, any> = { suspiciousActivity };
    if (evidenceAvailable.trim()) inputs.evidenceAvailable = evidenceAvailable;
    if (industry.trim()) inputs.industry = industry;
    setLastInputs(inputs);
    await run(inputs);
  };

  const handleReset = () => { setLastInputs({}); reset(); };

  const handleClearAll = () => {
    setSuspiciousActivity(""); setEvidenceAvailable(""); setIndustry(""); setLastInputs({}); reset();
  };

  const out = output as any;
  const riskLevel = out?.riskAssessment?.toLowerCase().includes("high") ? "high" :
    out?.riskAssessment?.toLowerCase().includes("medium") ? "medium" :
      out?.riskAssessment?.toLowerCase().includes("low") ? "low" : "medium";

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-7 w-7 text-red-400" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Identify fraud indicators, assess risk, build investigation plans, and recommend prevention measures.</p>
      </div>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <PromptTextarea
            label="Suspicious Activity Description"
            placeholder="Describe the suspicious activity in detail. Include what happened, when, how it was discovered, and any patterns observed..."
            value={suspiciousActivity}
            onChange={setSuspiciousActivity}
            disabled={isRunning}
            maxLength={5000}
            rows={8}
            hint="Be as specific as possible — include dates, amounts, individuals involved."
          />

          <PromptTextarea
            label="Evidence Available"
            placeholder="List any evidence you already have: transaction records, communications, witness statements, logs, documents..."
            value={evidenceAvailable}
            onChange={setEvidenceAvailable}
            disabled={isRunning}
            maxLength={3000}
            rows={5}
          />

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Industry / Sector</Label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Financial Services, Healthcare, Retail, Insurance..."
              disabled={isRunning}
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white placeholder:text-gray-500"
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={!suspiciousActivity.trim() || isRunning}
            className="w-full md:w-auto bg-red-600 hover:bg-red-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
            {isRunning ? "Investigating..." : "Start Investigation"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {out.fraudIndicators && Array.isArray(out.fraudIndicators) && out.fraudIndicators.length > 0 && (
            <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-5">
              <h3 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Fraud Indicators ({out.fraudIndicators.length})
              </h3>
              <ul className="space-y-2">
                {out.fraudIndicators.map((indicator: string, i: number) => (
                  <FraudIndicatorItem key={i} indicator={indicator} severity={out.indicatorSeverity?.[i]} />
                ))}
              </ul>
            </div>
          )}

          {out.riskAssessment && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-primary-400 mb-3 flex items-center gap-2">
                <Scale className="h-4 w-4" /> Risk Assessment
              </h3>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{out.riskAssessment}</p>
            </div>
          )}

          {riskLevel && <RiskMeter level={riskLevel} />}

          {out.investigationPlan && Array.isArray(out.investigationPlan) && out.investigationPlan.length > 0 && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-blue-400 mb-4 flex items-center gap-2">
                <Search className="h-4 w-4" /> Investigation Plan
              </h3>
              <div className="space-y-2">
                {out.investigationPlan.map((step: string, i: number) => (
                  <InvestigationStep key={i} step={step} index={i} />
                ))}
              </div>
            </div>
          )}

          {out.evidenceNeeded && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-yellow-400 mb-3">Evidence Needed</h3>
              {Array.isArray(out.evidenceNeeded) ? (
                <ul className="space-y-2">
                  {out.evidenceNeeded.map((item: string, i: number) => (
                    <li key={i} className="text-gray-300 text-sm border-l-2 border-yellow-600 pl-3">{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(out.evidenceNeeded)}</p>
              )}
            </div>
          )}

          {out.legalConsiderations && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-gray-300 mb-3">Legal Considerations</h3>
              <p className="text-gray-200 text-sm whitespace-pre-wrap">{out.legalConsiderations}</p>
            </div>
          )}

          {out.recoveryOptions && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-green-400 mb-3">Recovery Options</h3>
              {Array.isArray(out.recoveryOptions) ? (
                <ul className="space-y-2">
                  {out.recoveryOptions.map((opt: string, i: number) => (
                    <li key={i} className="text-gray-300 text-sm border-l-2 border-green-600 pl-3">{opt}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(out.recoveryOptions)}</p>
              )}
            </div>
          )}

          {out.preventionRecommendations && Array.isArray(out.preventionRecommendations) && out.preventionRecommendations.length > 0 && (
            <div className="bg-green-950/20 border border-green-900/40 rounded-xl p-5">
              <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Prevention Recommendations
              </h3>
              <ul className="space-y-2">
                {out.preventionRecommendations.map((rec: string, i: number) => (
                  <PreventionRec key={i} rec={rec} />
                ))}
              </ul>
            </div>
          )}

          {out.success === undefined && Object.keys(out).filter(k => !["fraudIndicators","riskAssessment","investigationPlan","evidenceNeeded","legalConsiderations","recoveryOptions","preventionRecommendations","indicatorSeverity"].includes(k)).length > 0 && (
            <StructuredResult result={out} title="Full Investigation Report" />
          )}

          <div className="flex gap-3 flex-wrap">
            <ResultActions onNew={handleReset} newLabel="New Investigation" onClear={handleClearAll} clearLabel="Clear All" />
            {Object.keys(lastInputs).length > 0 && (
              <Button onClick={handleRun} disabled={isRunning} className="bg-primary-600 hover:bg-primary-500">
                {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Re-investigate
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}