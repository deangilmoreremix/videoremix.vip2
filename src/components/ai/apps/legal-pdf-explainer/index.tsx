/**
 * Legal PDF Explainer — Production UI
 * New VideoRemix Name: Legal PDF Explainer
 */

import React, { useState, useEffect, useRef } from "react";
import { Play, Loader2, FileText, Upload, CheckCircle2, AlertTriangle, HelpCircle, DollarSign, X } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

const DOCUMENT_TYPES = [
  { value: "contract", label: "Contract", description: "Service, employment, or vendor agreements" },
  { value: "agreement", label: "Agreement", description: "Partnership, SLA, or mutual agreements" },
  { value: "policy", label: "Policy", description: "Internal or external policy documents" },
  { value: "terms", label: "Terms of Service", description: "TOS, terms & conditions, usage terms" },
  { value: "lease", label: "Lease", description: "Rental, equipment, or property leases" },
];

export default function LegalPDFExplainer({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [documentType, setDocumentType] = useState("");
  const [query, setQuery] = useState("");
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [lastInputs, setLastInputs] = useState<Record<string, unknown> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { run, isRunning, output, reset } = useRunAIApp(appId, {
    enableMultiTurn: true,
    onResult,
    onError,
    onReset,
  });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleFileUpload = (file: File | null) => {
    if (!file) return;
    setIsFileLoading(true);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedFile(result);
      setDocumentContent(result);
      setIsFileLoading(false);
    };
    reader.onerror = () => {
      setIsFileLoading(false);
      setUploadedFile(null);
      setDocumentContent(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileUpload(file || null);
  };

  const removeFile = () => {
    setUploadedFile(null);
    setDocumentContent(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRun = async () => {
    if (!documentType) return;
    const inputs: Record<string, unknown> = { documentType };
    if (query.trim()) inputs.query = query.trim();
    if (documentContent) inputs.documentContent = documentContent;
    setLastInputs(inputs);
    await run(inputs);
  };

  const handleReset = () => {
    reset();
    setLastInputs(null);
  };

  const handleClearAll = () => {
    reset();
    setDocumentType("");
    setQuery("");
    setDocumentContent(null);
    setUploadedFile(null);
    setFileName(null);
    setLastInputs(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isFormValid = documentType;

  const renderObligationsChecklist = (obligations: string[]) => {
    if (!Array.isArray(obligations)) return null;
    return (
      <div className="space-y-2">
        {obligations.map((item: string, i: number) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-black/40 border border-gray-800">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <span className="text-sm text-gray-200">{item}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderConcerningSection = (content: string, type: "red" | "yellow" | "neutral" = "neutral") => {
    const colors = {
      red: "border-red-800/60 bg-red-950/30",
      yellow: "border-amber-800/60 bg-amber-950/30",
      neutral: "border-gray-800 bg-[#0a0a0a]",
    };
    return (
      <div className={`rounded-xl border p-5 ${colors[type]}`}>
        <p className="text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
      </div>
    );
  };

  const renderStructuredOutput = () => {
    if (!output || typeof output !== "object") return null;
    const data = output as Record<string, any>;

    return (
      <div className="space-y-6">
        {data.plainEnglishSummary && (
          <div className="rounded-xl bg-green-900/30 border-2 border-green-700 p-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-green-400" />
              <h4 className="font-semibold text-green-300">Plain English Summary</h4>
            </div>
            <p className="text-gray-100 whitespace-pre-wrap text-sm leading-relaxed font-medium">
              {data.plainEnglishSummary}
            </p>
          </div>
        )}

        {data.sectionBreakdown && (
          <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-primary-400" />
              <h4 className="font-semibold text-white">Section Breakdown</h4>
            </div>
            {typeof data.sectionBreakdown === "string" ? (
              renderConcerningSection(data.sectionBreakdown)
            ) : Array.isArray(data.sectionBreakdown) ? (
              <div className="space-y-3">
                {data.sectionBreakdown.map((section: string | { heading?: string; content: string; severity?: string }, i: number) => {
                  if (typeof section === "string") {
                    return <div key={i} className="text-gray-300 text-sm whitespace-pre-wrap">{section}</div>;
                  }
                  const severity = section.severity?.toLowerCase();
                  const type = severity === "concerning" || severity === "danger" || severity === "warning" ? "red"
                    : severity === "caution" || severity === "review" ? "yellow"
                    : "neutral";
                  return (
                    <div key={i}>
                      {section.heading && (
                        <p className="text-sm font-semibold text-gray-400 mb-2 mt-4 first:mt-0">{section.heading}</p>
                      )}
                      {renderConcerningSection(section.content, type)}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(data.sectionBreakdown)}</p>
            )}
          </div>
        )}

        {data.yourObligations && (
          <div className="rounded-xl border border-green-800/50 bg-[#0a0a0a] p-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <h4 className="font-semibold text-white">Your Obligations</h4>
            </div>
            {renderObligationsChecklist(
              Array.isArray(data.yourObligations)
                ? data.yourObligations
                : typeof data.yourObligations === "string"
                ? data.yourObligations.split("\n").filter(Boolean)
                : []
            )}
          </div>
        )}

        {data.rightsHighlighted && (
          <div className="rounded-xl border border-blue-800/50 bg-[#0a0a0a] p-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-blue-400" />
              <h4 className="font-semibold text-white">Your Rights (Highlighted)</h4>
            </div>
            {typeof data.rightsHighlighted === "string" ? (
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{data.rightsHighlighted}</p>
            ) : Array.isArray(data.rightsHighlighted) ? (
              <ul className="space-y-2">
                {data.rightsHighlighted.map((right: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">•</span>
                    <span className="text-gray-300 text-sm">{right}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(data.rightsHighlighted)}</p>
            )}
          </div>
        )}

        {data.questionsToAsk && (
          <div className="rounded-xl border border-amber-800/50 bg-[#0a0a0a] p-6">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="h-5 w-5 text-amber-400" />
              <h4 className="font-semibold text-white">Questions to Ask</h4>
            </div>
            {typeof data.questionsToAsk === "string" ? (
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{data.questionsToAsk}</p>
            ) : Array.isArray(data.questionsToAsk) ? (
              <ul className="space-y-2">
                {data.questionsToAsk.map((q: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-amber-400 mt-1">?</span>
                    <span className="text-gray-300 text-sm">{q}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(data.questionsToAsk)}</p>
            )}
          </div>
        )}

        {data.costImplications && (
          <div className="rounded-xl border border-red-800/50 bg-[#0a0a0a] p-6">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-red-400" />
              <h4 className="font-semibold text-white">Cost Implications</h4>
            </div>
            {typeof data.costImplications === "string" ? (
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{data.costImplications}</p>
            ) : Array.isArray(data.costImplications) ? (
              <ul className="space-y-2">
                {data.costImplications.map((cost: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">•</span>
                    <span className="text-gray-300 text-sm">{cost}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(data.costImplications)}</p>
            )}
          </div>
        )}

        {Object.keys(data).filter(k => !["plainEnglishSummary", "sectionBreakdown", "yourObligations", "rightsHighlighted", "questionsToAsk", "costImplications"].includes(k)).length > 0 && (
          <StructuredResult
            result={data}
            title="Full Analysis"
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary-600/20">
            <FileText className="h-6 w-6 text-primary-400" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">{appName}</h2>
            <p className="text-sm text-gray-400">Upload a legal PDF and get a plain English explanation with your obligations highlighted</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6 space-y-5">
        <div>
          <Label className="text-sm font-medium text-gray-300 mb-2 block">Document Type</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {DOCUMENT_TYPES.map((doc) => (
              <button
                key={doc.value}
                type="button"
                onClick={() => setDocumentType(doc.value)}
                disabled={isRunning}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  documentType === doc.value
                    ? "bg-primary-600/20 border-primary-600"
                    : "bg-black/40 border-gray-800 hover:border-gray-700"
                }`}
              >
                <p className="font-medium text-sm text-white">{doc.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{doc.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium text-gray-300">Upload Document (PDF)</Label>
            {fileName && (
              <div className="flex items-center gap-2 px-3 py-1 bg-primary-600/20 rounded-lg">
                <FileText className="h-4 w-4 text-primary-400" />
                <span className="text-sm text-primary-400">{fileName}</span>
                <button onClick={removeFile} className="hover:text-red-400" disabled={isRunning}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isRunning}
          />

          {!uploadedFile && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isRunning || isFileLoading}
              className="w-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 bg-black/50 py-8 hover:border-primary-600 transition-colors"
            >
              {isFileLoading ? (
                <>
                  <Loader2 className="h-8 w-8 text-primary-500 animate-spin mb-2" />
                  <span className="text-sm text-gray-400">Processing document...</span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-500 mb-2" />
                  <span className="text-sm text-gray-400">Click to upload or drag & drop PDF</span>
                  <span className="text-xs text-gray-500 mt-1">PDF, TXT, MD · up to 5MB</span>
                </>
              )}
            </button>
          )}
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-300 mb-2 block">
            Specific Question (optional)
          </Label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. What are my cancellation obligations? Are there any auto-renewal clauses? What happens if I terminate early?"
            disabled={isRunning}
            rows={3}
            className="w-full bg-black border border-gray-700 rounded-lg p-4 text-gray-200 placeholder-gray-600 resize-none focus:border-primary-500 focus:outline-none"
          />
        </div>

        {lastInputs && (
          <div className="p-3 rounded-lg bg-black/40 border border-gray-800 text-xs text-gray-500">
            Last analysis: {lastInputs.documentType as string}
            {lastInputs.query ? ` · "${lastInputs.query}"` : ""}
          </div>
        )}

        <Button
          onClick={handleRun}
          disabled={!isFormValid || isRunning}
          className="w-full bg-primary-600 hover:bg-primary-500 py-6 text-lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analyzing Document...
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Explain This Document
            </>
          )}
        </Button>
      </div>

      {output && (
        <div className="space-y-4">
          {renderStructuredOutput()}
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

LegalPDFExplainer.displayName = "LegalPDFExplainer";