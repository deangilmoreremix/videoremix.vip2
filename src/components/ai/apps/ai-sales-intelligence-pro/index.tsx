/**
 * AI Sales Intelligence Pro — Production UI
 * New VideoRemix Name: AI Sales Intelligence Pro
 * Rich form + structured output for sales research & outreach strategy
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Building2, Users } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AISalesIntelligencePro({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("SaaS");
  const [icpNotes, setIcpNotes] = useState("");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset, isStreaming, streamingContent } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const industries = ["SaaS", "E-commerce", "Healthcare", "Fintech", "Professional Services", "Manufacturing", "Other"];

  const handleRun = async () => {
    if (!company.trim()) return; // button is disabled, validation feedback via disabled state

    const inputs = {
      company: company.trim(),
      industry,
      icpNotes: icpNotes.trim() || undefined,
      additionalContext: fileContent || undefined,
      goal: "Full sales intelligence report with outreach",
    };

    await run(inputs);
  };

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
  };

  const handleReset = () => {
    reset();
  };

  const handleClearAll = () => {
    setCompany("");
    setIndustry("SaaS");
    setIcpNotes("");
    setFileContent(null);
    reset();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Building2 className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">AI-powered prospect research, opportunity identification, and smarter outreach strategy in seconds.</p>
      </div>

      {!output ? (
        <div className="space-y-6">
          {/* Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Company / Prospect Name</Label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme Corp or Sarah Chen @ Stripe"
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Industry / Sector</Label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {industries.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
          </div>

          <PromptTextarea
            label="ICP Notes & Target Persona"
            placeholder="Describe the ideal customer (role, pain points, company size, recent triggers like funding/hiring...)"
            value={icpNotes}
            onChange={setIcpNotes}
            disabled={isRunning}
            maxLength={1800}
            hint="The more specific, the better the research and personalization."
          />

          <BasicFileUpload
            label="Optional: Upload context (CRM notes, call transcript, website export)"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".txt,.md,.csv,.pdf"
          />

          <Button
            onClick={handleRun}
            disabled={!company.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Analyzing prospect & building strategy..." : "Run AI Sales Intelligence Pro"}
          </Button>
          {isRunning && isStreaming && streamingContent && (
            <div className="text-sm text-gray-400 italic animate-pulse mt-2 max-w-xl truncate">
              {streamingContent.slice(-200)}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult
            result={output}
            title="AI Sales Intelligence Report"
            onDownload={() => {
              const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `${company.replace(/\s+/g, "-")}-sales-intel.json`; a.click();
            }}
          />
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
