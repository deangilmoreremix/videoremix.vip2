/**
 * Risk Decision AI — Production UI (Batch 8)
 * New VideoRemix Name: Risk Decision AI
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Scale, AlertTriangle, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

const RiskMatrixCell: React.FC<{ label: string; level: string; active: boolean }> = ({ label, level, active }) => {
  const colorMap: Record<string, string> = {
    low: "bg-green-900/50 border-green-700",
    medium: "bg-yellow-900/50 border-yellow-700",
    high: "bg-orange-900/50 border-orange-700",
    critical: "bg-red-900/50 border-red-700",
  };
  const textColorMap: Record<string, string> = {
    low: "text-green-300",
    medium: "text-yellow-300",
    high: "text-orange-300",
    critical: "text-red-300",
  };
  return (
    <div className={`rounded-lg border p-3 text-center transition-all ${active ? colorMap[level?.toLowerCase()] || colorMap.medium : "bg-gray-900/50 border-gray-800"}`}>
      <span className={`text-xs font-medium ${active ? textColorMap[level?.toLowerCase()] || "text-gray-300" : "text-gray-600"}`}>{label}</span>
    </div>
  );
};

const RecommendationBanner: React.FC<{ recommendation: string }> = ({ recommendation }) => {
  const rec = recommendation?.toLowerCase() || "";
  const isBuy = rec.includes("buy") || rec.includes("proceed") || rec.includes("approve") || rec.includes("go");
  const isAvoid = rec.includes("avoid") || rec.includes("reject") || rec.includes("stop") || rec.includes("cancel");
  const isHold = rec.includes("hold") || rec.includes("caution") || rec.includes("review") || rec.includes("wait");
  const config = isBuy ? { bg: "bg-green-950/40 border-green-900/60", color: "#22c55e", icon: <CheckCircle2 className="h-5 w-5" /> } :
    isAvoid ? { bg: "bg-red-950/40 border-red-900/60", color: "#ef4444", icon: <XCircle className="h-5 w-5" /> } :
      { bg: "bg-yellow-950/40 border-yellow-900/60", color: "#eab308", icon: <AlertTriangle className="h-5 w-5" /> };
  return (
    <div className={`rounded-xl border p-5 ${config.bg}`}>
      <div className="flex items-center gap-3">
        <span style={{ color: config.color }}>{config.icon}</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Recommendation</p>
          <p className="text-white font-semibold text-lg">{recommendation}</p>
        </div>
      </div>
    </div>
  );
};

const MitigationCard: React.FC<{ strategy: string }> = ({ strategy }) => (
  <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3">
    <span className="text-gray-200 text-sm">{strategy}</span>
  </div>
);

const ContingencyItem: React.FC<{ plan: string }> = ({ plan }) => (
  <li className="flex items-start gap-2 bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2">
    <ShieldAlert className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
    <span className="text-gray-300 text-sm">{plan}</span>
  </li>
);

export default function RiskDecisionAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [decisionContext, setDecisionContext] = useState("");
  const [options, setOptions] = useState("");
  const [riskAppetite, setRiskAppetite] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [lastInputs, setLastInputs] = useState<Record<string, any>>({});

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, {
    onResult, onError, onReset, enableMultiTurn: true
  });

  useEffect(() => { onRunningChange?.(isRunning); }, [isRunning, onRunningChange]);

  const handleFileUpload = (file: File | null, content?: string) => {
    if (!file) { setUploadedFile(null); return; }
    setIsFileLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedFile(content || e.target?.result as string);
      setIsFileLoading(false);
    };
    reader.onerror = () => { setIsFileLoading(false); setUploadedFile(null); };
    reader.readAsDataURL(file);
  };

  const handleRun = async () => {
    if (!decisionContext.trim()) return;
    const inputs: Record<string, any> = { decisionContext, riskAppetite };
    if (options.trim()) inputs.options = options;
    if (uploadedFile) inputs.additionalContext = uploadedFile;
    setLastInputs(inputs);
    await run(inputs);
  };

  const handleReset = () => { setLastInputs({}); reset(); };

  const handleClearAll = () => {
    setDecisionContext(""); setOptions(""); setRiskAppetite("moderate");
    setUploadedFile(null); setLastInputs({}); reset();
  };

  const out = output as any;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Scale className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Analyze decisions against your risk appetite, visualize risk matrices, and get mitigation strategies.</p>
      </div>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <PromptTextarea
            label="Decision Context"
            placeholder="Describe the decision you need to make. Include the business context, objectives, constraints, and what success looks like..."
            value={decisionContext}
            onChange={setDecisionContext}
            disabled={isRunning}
            maxLength={5000}
            rows={8}
            hint="Context helps assess which risks are most relevant to your situation."
          />

          <PromptTextarea
            label="Options (optional)"
            placeholder="List the options you're considering. E.g., Option A: Acquire company X / Option B: Partner with Y / Option C: Build in-house..."
            value={options}
            onChange={setOptions}
            disabled={isRunning}
            maxLength={3000}
            rows={5}
          />

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Risk Appetite</Label>
            <select
              value={riskAppetite}
              onChange={(e) => setRiskAppetite(e.target.value as any)}
              disabled={isRunning}
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white"
            >
              <option value="conservative">Conservative — Minimize risk, prioritize stability</option>
              <option value="moderate">Moderate — Balance risk and reward</option>
              <option value="aggressive">Aggressive — Willing to accept higher risk for higher reward</option>
            </select>
          </div>

          <BasicFileUpload
            label="Additional Context File (optional)"
            accept=".txt,.pdf,.csv,.md"
            onFileSelect={handleFileUpload}
            disabled={isRunning}
            maxSizeMB={5}
          />

          <Button
            onClick={handleRun}
            disabled={!decisionContext.trim() || isRunning || isFileLoading}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Analyzing risk..." : "Analyze Risk"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {out.recommendation && <RecommendationBanner recommendation={out.recommendation} />}

          {out.riskMatrix && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-primary-400 mb-4">Risk Matrix</h3>
              {typeof out.riskMatrix === "object" ? (
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-4 gap-2 min-w-[400px]">
                    <div />
                    <div className="text-center text-xs text-gray-500 pb-1">Low Impact</div>
                    <div className="text-center text-xs text-gray-500 pb-1">Medium Impact</div>
                    <div className="text-center text-xs text-gray-500 pb-1">High Impact</div>
                    {["Low", "Medium", "High"].map((likelihood, li) => (
                      <React.Fragment key={likelihood}>
                        <div className="text-xs text-gray-500 text-right pr-2 pt-3">{likelihood} Likelihood</div>
                        {["low", "medium", "high"].map((impact, ii) => {
                          const cell = out.riskMatrix[`${likelihood}_${impact}`] || out.riskMatrix[`${li}_${ii}`];
                          return (
                            <RiskMatrixCell
                              key={`${li}-${ii}`}
                              label={cell?.label || ""}
                              level={cell?.level || "low"}
                              active={!!cell}
                            />
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(out.riskMatrix)}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">Rows = Likelihood | Columns = Impact</p>
            </div>
          )}

          {out.riskAnalysis && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-blue-400 mb-3">Risk Analysis</h3>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{out.riskAnalysis}</p>
            </div>
          )}

          {out.mitigationStrategies && Array.isArray(out.mitigationStrategies) && out.mitigationStrategies.length > 0 && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-green-400 mb-3">Mitigation Strategies</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {out.mitigationStrategies.map((strategy: string, i: number) => (
                  <MitigationCard key={i} strategy={strategy} />
                ))}
              </div>
            </div>
          )}

          {out.contingencyPlans && Array.isArray(out.contingencyPlans) && out.contingencyPlans.length > 0 && (
            <div className="bg-yellow-950/20 border border-yellow-900/40 rounded-xl p-5">
              <h3 className="font-semibold text-yellow-400 mb-3">Contingency Plans</h3>
              <ul className="space-y-2">
                {out.contingencyPlans.map((plan: string, i: number) => (
                  <ContingencyItem key={i} plan={plan} />
                ))}
              </ul>
            </div>
          )}

          {out.monitoringPlan && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-primary-400 mb-3">Monitoring Plan</h3>
              {Array.isArray(out.monitoringPlan) ? (
                <ul className="space-y-2">
                  {out.monitoringPlan.map((item: string, i: number) => (
                    <li key={i} className="text-gray-300 text-sm border-l-2 border-gray-700 pl-3">{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(out.monitoringPlan)}</p>
              )}
            </div>
          )}

          {out.success === undefined && Object.keys(out).filter(k => !["riskAnalysis","riskMatrix","recommendation","mitigationStrategies","contingencyPlans","monitoringPlan"].includes(k)).length > 0 && (
            <StructuredResult result={out} title="Full Risk Analysis" />
          )}

          <div className="flex gap-3 flex-wrap">
            <ResultActions onNew={handleReset} newLabel="New Analysis" onClear={handleClearAll} clearLabel="Clear All" />
            {Object.keys(lastInputs).length > 0 && (
              <Button onClick={handleRun} disabled={isRunning} className="bg-primary-600 hover:bg-primary-500">
                {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Re-analyze
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}