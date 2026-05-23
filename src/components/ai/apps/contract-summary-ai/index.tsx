/**
 * Contract Summary AI — Production UI (Batch 8)
 * Contract analysis with red flags, risk meter, key terms highlighted.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, AlertTriangle, FileText, Shield, CheckCircle2 } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
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
        <span className="text-gray-400">Risk Level:</span>
        <span className="font-semibold" style={{ color }}>{label}</span>
      </div>
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
};

const RedFlagItem: React.FC<{ flag: string }> = ({ flag }) => (
  <li className="flex items-start gap-2 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
    <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
    <span className="text-red-300 text-sm">{flag}</span>
  </li>
);

const KeyTermItem: React.FC<{ term: string }> = ({ term }) => (
  <li className="flex items-start gap-2">
    <CheckCircle2 className="h-4 w-4 text-primary-400 mt-0.5 flex-shrink-0" />
    <span className="text-white text-sm font-medium">{term}</span>
  </li>
);

export default function ContractSummaryAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [contractType, setContractType] = useState<"nda" | "employment" | "service" | "lease" | "partnership">("nda");
  const [contractText, setContractText] = useState("");
  const [focusArea, setFocusArea] = useState<"obligations" | "risks" | "termination" | "liability" | "general">("general");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [lastInputs, setLastInputs] = useState<Record<string, any>>({});

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, {
    onResult, onError, onReset, enableMultiTurn: true
  });

  useEffect(() => { onRunningChange?.(isRunning); }, [isRunning, onRunningChange]);

  const handleFileUpload = (file: File | null) => {
    if (!file) { setUploadedFile(null); setFileName(null); return; }
    setIsFileLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setUploadedFile(base64);
      setFileName(file.name);
      setContractText(base64);
      setIsFileLoading(false);
    };
    reader.onerror = () => { setIsFileLoading(false); setUploadedFile(null); };
    reader.readAsDataURL(file);
  };

  const handleRun = async () => {
    const hasText = contractText.trim().length > 0;
    if (!hasText && !uploadedFile) return;
    const inputs: Record<string, any> = { contractType, focusArea };
    if (uploadedFile) inputs.contractText = uploadedFile;
    else inputs.contractText = contractText;
    setLastInputs(inputs);
    await run(inputs);
  };

  const handleReset = () => { setLastInputs({}); reset(); };

  const handleClearAll = () => {
    setContractType("nda"); setContractText(""); setFocusArea("general");
    setUploadedFile(null); setFileName(null); setLastInputs({}); reset();
  };

  const out = output as any;
  const riskLevel = out?.riskLevel || (out?.redFlags?.length > 3 ? "high" : out?.redFlags?.length > 0 ? "medium" : "low");

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Analyze any contract for key terms, obligations, risks, red flags, and recommended changes.</p>
      </div>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Contract Type</Label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value as any)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white"
              >
                <option value="nda">NDA</option>
                <option value="employment">Employment</option>
                <option value="service">Service Agreement</option>
                <option value="lease">Lease</option>
                <option value="partnership">Partnership</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Focus Area</Label>
              <select
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value as any)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white"
              >
                <option value="general">General Overview</option>
                <option value="obligations">Obligations</option>
                <option value="risks">Risks</option>
                <option value="termination">Termination</option>
                <option value="liability">Liability</option>
              </select>
            </div>
          </div>

          <BasicFileUpload
            label="Contract Document (optional — or paste below)"
            accept=".txt,.pdf,.doc,.docx"
            onFileSelect={handleFileUpload}
            disabled={isRunning}
            maxSizeMB={10}
          />
          {fileName && <p className="text-xs text-gray-500">File loaded: {fileName}</p>}

          <PromptTextarea
            label="Or paste contract text here"
            placeholder="Paste the full contract text here..."
            value={contractText}
            onChange={setContractText}
            disabled={isRunning}
            maxLength={20000}
            rows={10}
          />

          <Button
            onClick={handleRun}
            disabled={(!contractText.trim() && !uploadedFile) || isRunning || isFileLoading}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Analyzing contract..." : "Analyze Contract"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {out.summary && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-primary-400 mb-3">Executive Summary</h3>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{out.summary}</p>
            </div>
          )}

          {out.keyTerms && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-primary-400 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Key Terms
              </h3>
              <ul className="space-y-2">
                {Array.isArray(out.keyTerms) ? out.keyTerms.map((term: string, i: number) => (
                  <KeyTermItem key={i} term={term} />
                )) : (
                  <li className="text-gray-300 text-sm whitespace-pre-wrap">{String(out.keyTerms)}</li>
                )}
              </ul>
            </div>
          )}

          {out.obligations && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-yellow-400 mb-3">Obligations</h3>
              {Array.isArray(out.obligations) ? (
                <ul className="space-y-2">
                  {out.obligations.map((ob: string, i: number) => (
                    <li key={i} className="text-gray-300 text-sm border-l-2 border-yellow-600 pl-3">{ob}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(out.obligations)}</p>
              )}
            </div>
          )}

          {out.risks && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-yellow-500 mb-3">Risks Identified</h3>
              {Array.isArray(out.risks) ? (
                <ul className="space-y-2">
                  {out.risks.map((risk: string, i: number) => (
                    <li key={i} className="text-gray-300 text-sm border-l-2 border-yellow-500 pl-3">{risk}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(out.risks)}</p>
              )}
            </div>
          )}

          {out.redFlags && out.redFlags.length > 0 && (
            <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-5">
              <h3 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Red Flags ({out.redFlags.length})
              </h3>
              <ul className="space-y-2">
                {out.redFlags.map((flag: string, i: number) => (
                  <RedFlagItem key={i} flag={flag} />
                ))}
              </ul>
            </div>
          )}

          {riskLevel && <RiskMeter level={riskLevel} />}

          {out.recommendedChanges && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-primary-400 mb-3">Recommended Changes</h3>
              {Array.isArray(out.recommendedChanges) ? (
                <ul className="space-y-2">
                  {out.recommendedChanges.map((ch: string, i: number) => (
                    <li key={i} className="text-gray-300 text-sm border-l-2 border-blue-600 pl-3">{ch}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(out.recommendedChanges)}</p>
              )}
            </div>
          )}

          {out.nextSteps && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-primary-400 mb-3">Next Steps</h3>
              {Array.isArray(out.nextSteps) ? (
                <ul className="space-y-2">
                  {out.nextSteps.map((step: string, i: number) => (
                    <li key={i} className="text-gray-300 text-sm border-l-2 border-gray-700 pl-3">{step}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(out.nextSteps)}</p>
              )}
            </div>
          )}

          {out.success === undefined && Object.keys(out).length > 0 && (
            <StructuredResult result={out} title="Full Contract Analysis" />
          )}

          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={handleReset} className="border-gray-700">New Analysis</Button>
            <Button onClick={handleClearAll} variant="ghost">Clear All</Button>
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