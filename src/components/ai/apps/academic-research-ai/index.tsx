/**
 * Academic Research AI — Production UI (Batch 5)
 * New VideoRemix Name: Academic Research AI
 * Scholarly literature review, gap identification, methodology design, and cited paper lists.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, BookOpen } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AcademicResearchAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [researchTopic, setResearchTopic] = useState("");
  const [academicField, setAcademicField] = useState("");
  const [preferredCitationStyle, setPreferredCitationStyle] = useState<"apa" | "mla" | "chicago" | "ieee">("apa");
  const [methodologyPreference, setMethodologyPreference] = useState<"qualitative" | "quantitative" | "mixed">("mixed");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!researchTopic.trim()) return;

    const inputs = {
      researchTopic: researchTopic.trim(),
      academicField: academicField.trim(),
      preferredCitationStyle,
      methodologyPreference,
    };

    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setResearchTopic("");
    setAcademicField("");
    setPreferredCitationStyle("apa");
    setMethodologyPreference("mixed");
    reset();
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Scholarly research assistant. Produces literature reviews, identifies research gaps, proposes methodology, and returns properly cited relevant papers using academic web sources.</p>
      </div>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Research Topic / Question</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. The effect of multimodal AI on scientific discovery workflows"
              value={researchTopic}
              onChange={setResearchTopic}
              disabled={isRunning}
              maxLength={1600}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Academic Field</Label>
              <Input
                value={academicField}
                onChange={(e) => setAcademicField(e.target.value)}
                placeholder="e.g. Science & Technology Studies, HCI, AI Ethics"
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Citation Style</Label>
              <select
                value={preferredCitationStyle}
                onChange={(e) => setPreferredCitationStyle(e.target.value as any)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white"
              >
                <option value="apa">APA</option>
                <option value="mla">MLA</option>
                <option value="chicago">Chicago</option>
                <option value="ieee">IEEE</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Preferred Methodology</Label>
            <div className="flex gap-2">
              {(["qualitative", "quantitative", "mixed"] as const).map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant={methodologyPreference === m ? "default" : "outline"}
                  onClick={() => setMethodologyPreference(m)}
                  disabled={isRunning}
                  className="flex-1 capitalize"
                >
                  {m}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={!researchTopic.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Conducting academic literature review..." : "Run Academic Research AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Academic Research Report" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Academic Search"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}
