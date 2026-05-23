/**
 * Claim Checker AI — Production UI (Batch 8)
 * New VideoRemix Name: Claim Checker AI
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, FileSearch, CheckCircle2, XCircle, AlertTriangle, Clock, FileText, DollarSign, ShieldAlert } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

const ClaimAssessmentBadge: React.FC<{ status: string }> = ({ status }) => {
  const lower = status?.toLowerCase() || "";
  const isCovered = lower.includes("covered") || lower.includes("approved") || lower.includes("valid");
  const isDenied = lower.includes("denied") || lower.includes("rejected") || lower.includes("not covered");
  const color = isCovered ? "#22c55e" : isDenied ? "#ef4444" : "#eab308";
  const bg = isCovered ? "bg-green-950/30 border-green-900/50" : isDenied ? "bg-red-950/30 border-red-900/50" : "bg-yellow-950/30 border-yellow-900/50";
  const icon = isCovered ? <CheckCircle2 className="h-4 w-4" /> : isDenied ? <XCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border ${bg}`} style={{ color }}>
      {icon} {status}
    </span>
  );
};

const TimelineStep: React.FC<{ step: string; index: number; last?: boolean }> = ({ step, index, last }) => {
  const isComplete = step.toLowerCase().includes("complete") || step.toLowerCase().includes("approved") || step.toLowerCase().includes("done");
  const bg = isComplete ? "bg-green-950 border-green-900" : "bg-gray-900 border-gray-800";
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${isComplete ? "bg-green-600 border-green-500 text-white" : "bg-gray-800 border-gray-600 text-gray-400"}`}>
          {index + 1}
        </div>
        {!last && <div className="w-0.5 h-12 bg-gray-700" />}
      </div>
      <div className={`flex-1 rounded-lg border p-3 mb-2 ${bg}`}>
        <p className="text-sm text-gray-200 whitespace-pre-wrap">{step}</p>
      </div>
    </div>
  );
};

const DocChecklistItem: React.FC<{ doc: string }> = ({ doc }) => (
  <li className="flex items-start gap-2 bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2">
    <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
    <span className="text-gray-300 text-sm">{doc}</span>
  </li>
);

export default function ClaimCheckerAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [claimType, setClaimType] = useState<"health" | "auto" | "home" | "life">("health");
  const [claimDetails, setClaimDetails] = useState("");
  const [policyCoverage, setPolicyCoverage] = useState("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [lastInputs, setLastInputs] = useState<Record<string, any>>({});

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, {
    onResult, onError, onReset, enableMultiTurn: true
  });

  useEffect(() => { onRunningChange?.(isRunning); }, [isRunning, onRunningChange]);

  const handleFileUpload = (file: File | null, content?: string) => {
    if (!file) { setUploadedFile(null); setPolicyCoverage(""); return; }
    setIsFileLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setUploadedFile(base64);
      setPolicyCoverage(content || base64);
      setIsFileLoading(false);
    };
    reader.onerror = () => { setIsFileLoading(false); setUploadedFile(null); };
    reader.readAsDataURL(file);
  };

  const handleRun = async () => {
    const hasText = claimDetails.trim().length > 0;
    if (!hasText) return;
    const inputs: Record<string, any> = { claimType, claimDetails };
    if (uploadedFile) inputs.policyCoverage = uploadedFile;
    else if (policyCoverage) inputs.policyCoverage = policyCoverage;
    setLastInputs(inputs);
    await run(inputs);
  };

  const handleReset = () => { setLastInputs({}); reset(); };

  const handleClearAll = () => {
    setClaimType("health"); setClaimDetails(""); setPolicyCoverage("");
    setUploadedFile(null); setLastInputs({}); reset();
  };

  const out = output as any;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Evaluate your claim against policy coverage, estimate amounts, and identify documentation needed.</p>
      </div>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Claim Type</Label>
            <select
              value={claimType}
              onChange={(e) => setClaimType(e.target.value as any)}
              disabled={isRunning}
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white"
            >
              <option value="health">Health</option>
              <option value="auto">Auto</option>
              <option value="home">Home</option>
              <option value="life">Life</option>
            </select>
          </div>

          <PromptTextarea
            label="Claim Details"
            placeholder="Describe the incident, what happened, when it occurred, and any relevant details about your claim..."
            value={claimDetails}
            onChange={setClaimDetails}
            disabled={isRunning}
            maxLength={5000}
            rows={8}
            hint="Be specific about dates, locations, and what was damaged or affected."
          />

          <BasicFileUpload
            label="Policy Document (optional — or paste coverage text below)"
            accept=".txt,.pdf,.doc,.docx"
            onFileSelect={handleFileUpload}
            disabled={isRunning}
            maxSizeMB={10}
          />

          <PromptTextarea
            label="Or paste policy coverage text here"
            placeholder="Paste your policy coverage details here, or upload a document above..."
            value={policyCoverage}
            onChange={setPolicyCoverage}
            disabled={isRunning || !!uploadedFile}
            maxLength={10000}
            rows={6}
          />

          <Button
            onClick={handleRun}
            disabled={!claimDetails.trim() || isRunning || isFileLoading}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Checking claim..." : "Check Claim"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {out.claimAssessment && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-primary-400">Claim Assessment</h3>
                <ClaimAssessmentBadge status={out.coverageStatus || out.claimAssessment} />
              </div>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{out.claimAssessment}</p>
            </div>
          )}

          {out.amountEstimate && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Estimated Claim Amount
              </h3>
              <p className="text-2xl font-bold text-white">{out.amountEstimate}</p>
            </div>
          )}

          {out.coverageAnalysis && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-blue-400 mb-3">Coverage Analysis</h3>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{out.coverageAnalysis}</p>
            </div>
          )}

          {out.requiredDocumentation && Array.isArray(out.requiredDocumentation) && out.requiredDocumentation.length > 0 && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Required Documentation
              </h3>
              <ul className="space-y-2">
                {out.requiredDocumentation.map((doc: string, i: number) => (
                  <DocChecklistItem key={i} doc={doc} />
                ))}
              </ul>
            </div>
          )}

          {out.claimProcess && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-primary-400 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Claim Process
              </h3>
              {Array.isArray(out.claimProcess) ? (
                <div className="space-y-1">
                  {out.claimProcess.map((step: string, i: number) => (
                    <TimelineStep key={i} step={step} index={i} last={i === out.claimProcess.length - 1} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(out.claimProcess)}</p>
              )}
            </div>
          )}

          {out.timeline && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-gray-300 mb-3">Timeline</h3>
              <p className="text-gray-200 text-sm whitespace-pre-wrap">{out.timeline}</p>
            </div>
          )}

          {out.commonPitfalls && (
            <div className="bg-yellow-950/20 border border-yellow-900/40 rounded-xl p-5">
              <h3 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Common Pitfalls
              </h3>
              {Array.isArray(out.commonPitfalls) ? (
                <ul className="space-y-2">
                  {out.commonPitfalls.map((pitfall: string, i: number) => (
                    <li key={i} className="text-yellow-300 text-sm border-l-2 border-yellow-600 pl-3">{pitfall}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-yellow-300 text-sm whitespace-pre-wrap">{String(out.commonPitfalls)}</p>
              )}
            </div>
          )}

          {out.appealOptions && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-primary-400 mb-3">Appeal Options</h3>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{out.appealOptions}</p>
            </div>
          )}

          {out.success === undefined && Object.keys(out).filter(k => !["claimAssessment","coverageAnalysis","amountEstimate","requiredDocumentation","claimProcess","timeline","commonPitfalls","appealOptions","coverageStatus"].includes(k)).length > 0 && (
            <StructuredResult result={out} title="Full Claim Analysis" />
          )}

          <div className="flex gap-3 flex-wrap">
            <ResultActions onNew={handleReset} newLabel="New Check" onClear={handleClearAll} clearLabel="Clear All" />
            {Object.keys(lastInputs).length > 0 && (
              <Button onClick={handleRun} disabled={isRunning} className="bg-primary-600 hover:bg-primary-500">
                {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Re-check
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}