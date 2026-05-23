import React, { useState, useEffect } from "react";
import { Play, Loader2, CheckCircle2, AlertTriangle, FileText, Clock, Shield, Wrench, BookOpen, DollarSign } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

const INDUSTRIES = [
  "Healthcare",
  "Financial Services",
  "Retail & E-commerce",
  "Technology",
  "Manufacturing",
  "Energy & Utilities",
  "Education",
  "Legal",
  "Media & Entertainment",
  "Real Estate",
  "Transportation & Logistics",
  "Food & Beverage",
  "Construction",
  "Telecommunications",
  "Pharmaceuticals",
  "Insurance",
  "Hospitality",
  "Government & Public Sector",
];

const REGULATION_TYPES = [
  "GDPR / Data Privacy",
  "HIPAA / Healthcare Privacy",
  "SOX / Financial Controls",
  "PCI-DSS / Payment Security",
  "CCPA / California Privacy",
  "SOC 2 / Security Compliance",
  "ISO 27001 / Information Security",
  "AML / Anti-Money Laundering",
  "KYC / Know Your Customer",
  "EPA / Environmental",
  "OSHA / Workplace Safety",
  "FDA / Food & Drug",
  "FTC / Consumer Protection",
  "ADA / Accessibility",
  "COPPA / Children's Privacy",
  "GLBA / Financial Services",
  "FERPA / Education Privacy",
  "Industry-Specific Regulation",
];

const COMPANY_SIZES = [
  "1-10 employees (Startup)",
  "11-50 employees (Small)",
  "51-200 employees (Mid-Market)",
  "201-500 employees (Growing Enterprise)",
  "501-1000 employees (Enterprise)",
  "1000+ employees (Large Enterprise)",
];

export default function PolicyComplianceAssistant({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [industry, setIndustry] = useState("");
  const [regulationType, setRegulationType] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [lastInputs, setLastInputs] = useState<Record<string, unknown> | null>(null);

  const { run, isRunning, output, reset } = useRunAIApp(appId, {
    enableMultiTurn: true,
    onResult,
    onError,
    onReset,
  });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!industry || !regulationType || !companySize) return;
    const inputs = { industry, regulationType, companySize };
    setLastInputs(inputs);
    await run(inputs);
  };

  const handleReset = () => {
    reset();
    setLastInputs(null);
  };

  const renderImplementationChecklist = (checklist: string[]) => {
    if (!Array.isArray(checklist)) return null;
    return (
      <div className="space-y-2">
        {checklist.map((item: string, i: number) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-black/40 border border-gray-800">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <span className="text-sm text-gray-200">{item}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderTimeline = (timeline: string) => {
    if (!timeline) return null;
    const phases = timeline.split(/[;,]|\n/).map((p: string) => p.trim()).filter(Boolean);
    return (
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-500 to-primary-700" />
        <div className="space-y-4 pl-10">
          {phases.map((phase: string, i: number) => (
            <div key={i} className="relative">
              <div className="absolute -left-10 top-1.5 w-5 h-5 rounded-full bg-primary-600 border-2 border-primary-400 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-primary-400" />
                <span className="text-sm font-medium text-white">{phase}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStructuredOutput = () => {
    if (!output || typeof output !== "object") return null;
    const data = output as Record<string, any>;

    return (
      <div className="space-y-6">
        {data.plainEnglishSummary && (
          <div className="rounded-xl bg-primary-900/30 border border-primary-700 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-primary-400" />
              <h4 className="font-semibold text-primary-300">Summary</h4>
            </div>
            <p className="text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">{data.plainEnglishSummary}</p>
          </div>
        )}

        {data.complianceOverview && (
          <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-primary-400" />
              <h4 className="font-semibold text-white">Compliance Overview</h4>
            </div>
            <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{data.complianceOverview}</p>
          </div>
        )}

        {data.keyRequirements && (
          <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h4 className="font-semibold text-white">Key Requirements</h4>
            </div>
            {Array.isArray(data.keyRequirements) ? (
              <ul className="space-y-2">
                {data.keyRequirements.map((req: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-amber-400 mt-1">•</span>
                    <span className="text-gray-300 text-sm">{req}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{data.keyRequirements}</p>
            )}
          </div>
        )}

        {data.implementationChecklist && (
          <div className="rounded-xl border border-green-800/50 bg-[#0a0a0a] p-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <h4 className="font-semibold text-white">Implementation Checklist</h4>
            </div>
            {renderImplementationChecklist(
              Array.isArray(data.implementationChecklist)
                ? data.implementationChecklist
                : typeof data.implementationChecklist === "string"
                ? data.implementationChecklist.split("\n").filter(Boolean)
                : []
            )}
          </div>
        )}

        {data.timelineToComply && (
          <div className="rounded-xl border border-blue-800/50 bg-[#0a0a0a] p-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-blue-400" />
              <h4 className="font-semibold text-white">Timeline to Comply</h4>
            </div>
            {renderTimeline(data.timelineToComply)}
          </div>
        )}

        {data.penaltiesForNonCompliance && (
          <div className="rounded-xl border border-red-800/50 bg-[#0a0a0a] p-6">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-red-400" />
              <h4 className="font-semibold text-white">Penalties for Non-Compliance</h4>
            </div>
            <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{data.penaltiesForNonCompliance}</p>
          </div>
        )}

        {data.recommendedTools && (
          <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-6">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="h-5 w-5 text-primary-400" />
              <h4 className="font-semibold text-white">Recommended Tools</h4>
            </div>
            {Array.isArray(data.recommendedTools) ? (
              <ul className="space-y-2">
                {data.recommendedTools.map((tool: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-primary-400 mt-1">•</span>
                    <span className="text-gray-300 text-sm">{tool}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{data.recommendedTools}</p>
            )}
          </div>
        )}

        {data.resources && (
          <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-6">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-5 w-5 text-primary-400" />
              <h4 className="font-semibold text-white">Resources</h4>
            </div>
            {Array.isArray(data.resources) ? (
              <ul className="space-y-2">
                {data.resources.map((res: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-primary-400 mt-1">•</span>
                    <span className="text-gray-300 text-sm">{res}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{data.resources}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const isFormValid = industry && regulationType && companySize;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary-600/20">
            <Shield className="h-6 w-6 text-primary-400" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">{appName}</h2>
            <p className="text-sm text-gray-400">Get a compliance checklist, requirements, penalties, and timeline for your industry</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Industry</Label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              disabled={isRunning}
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white focus:border-primary-500 focus:outline-none"
            >
              <option value="">Select industry...</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Regulation Type</Label>
            <select
              value={regulationType}
              onChange={(e) => setRegulationType(e.target.value)}
              disabled={isRunning}
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white focus:border-primary-500 focus:outline-none"
            >
              <option value="">Select regulation...</option>
              {REGULATION_TYPES.map((reg) => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Company Size</Label>
            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              disabled={isRunning}
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white focus:border-primary-500 focus:outline-none"
            >
              <option value="">Select size...</option>
              {COMPANY_SIZES.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        {lastInputs && (
          <div className="p-3 rounded-lg bg-black/40 border border-gray-800 text-xs text-gray-500">
            Last check: {lastInputs.industry} · {lastInputs.regulationType} · {lastInputs.companySize}
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
              Checking Compliance...
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Check Compliance
            </>
          )}
        </Button>
      </div>

      {output && (
        <div className="space-y-4">
          {renderStructuredOutput()}
          <ResultActions onNew={handleReset} newLabel="New Check" />
        </div>
      )}
    </div>
  );
}

PolicyComplianceAssistant.displayName = "PolicyComplianceAssistant";