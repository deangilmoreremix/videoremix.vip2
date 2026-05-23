/**
 * Research Assistant AI — Production UI (Batch 5)
 * New VideoRemix Name: Research Assistant AI
 * Comprehensive research on any topic with web search, structured findings, sources, and next steps.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Search } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function ResearchAssistantAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [researchTopic, setResearchTopic] = useState("");
  const [scope, setScope] = useState<"brief" | "detailed" | "comprehensive">("detailed");
  const [focusAreas, setFocusAreas] = useState("");
  const [sourceRequirements, setSourceRequirements] = useState<"academic" | "mixed" | "all">("mixed");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!researchTopic.trim()) return;

    const inputs = {
      researchTopic: researchTopic.trim(),
      scope,
      focusAreas: focusAreas.trim() || undefined,
      sourceRequirements,
      additionalContext: fileContent || undefined,
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
    setResearchTopic("");
    setScope("detailed");
    setFocusAreas("");
    setSourceRequirements("mixed");
    setFileContent(null);
    reset();
  };

  const scopes = [
    { value: "brief", label: "Brief" },
    { value: "detailed", label: "Detailed" },
    { value: "comprehensive", label: "Comprehensive" },
  ];

  const sourceTypes = [
    { value: "academic", label: "Academic & Peer-reviewed" },
    { value: "mixed", label: "Mixed (Academic + Web)" },
    { value: "all", label: "All Sources" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Search className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">AI-powered research on any topic. Get executive summaries, key findings, cited sources, and actionable next steps using real-time web search.</p>
      </div>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Research Topic or Question</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. Impact of AI agents on customer support in 2026, or latest trends in sustainable packaging for e-commerce"
              value={researchTopic}
              onChange={setResearchTopic}
              disabled={isRunning}
              maxLength={2000}
              rows={4}
              hint="Be specific — the more focused your topic, the better the research quality."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Research Scope</Label>
              <div className="flex gap-2">
                {scopes.map((s) => (
                  <Button
                    key={s.value}
                    type="button"
                    variant={scope === s.value ? "default" : "outline"}
                    onClick={() => setScope(s.value as any)}
                    disabled={isRunning}
                    className="flex-1"
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1.5">How deep should the research go?</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Source Requirements</Label>
              <select
                value={sourceRequirements}
                onChange={(e) => setSourceRequirements(e.target.value as any)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {sourceTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <PromptTextarea
            label="Specific Focus Areas (optional)"
            placeholder="e.g. cost implications, technical feasibility, regulatory risks, competitor landscape"
            value={focusAreas}
            onChange={setFocusAreas}
            disabled={isRunning}
            maxLength={1500}
            rows={3}
            hint="Narrow the research to these aspects for more targeted insights."
          />

          {/* Optional context upload for grounding */}
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Optional Context / Prior Research</Label>
            <PromptTextarea
              label=""
              placeholder="Paste any existing notes, previous research, or constraints the AI should consider..."
              value={fileContent || ""}
              onChange={(v) => setFileContent(v)}
              disabled={isRunning}
              maxLength={4000}
              rows={4}
              hint="Helps the AI build on what you already know."
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={!researchTopic.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Researching with live web search..." : "Run Research Assistant AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Research Findings" />
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
