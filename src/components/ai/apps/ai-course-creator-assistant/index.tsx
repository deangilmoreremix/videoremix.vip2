/**
 * AI Course Creator Assistant — Production UI (Batch 5)
 * New VideoRemix Name: AI Course Creator Assistant
 * Designs full courses with modules, lessons, assessments, resources, and marketing copy.
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

export default function AICourseCreatorAssistant({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [courseTopic, setCourseTopic] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [courseLevel, setCourseLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [format, setFormat] = useState<"video" | "text" | "interactive" | "mixed">("mixed");
  const [estimatedDuration, setEstimatedDuration] = useState("6 weeks");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!courseTopic.trim()) return;

    const inputs = {
      courseTopic: courseTopic.trim(),
      targetAudience: targetAudience.trim(),
      courseLevel,
      desiredOutcome: desiredOutcome.trim(),
      format,
      estimatedDuration: estimatedDuration.trim(),
    };

    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setCourseTopic("");
    setTargetAudience("");
    setCourseLevel("intermediate");
    setDesiredOutcome("");
    setFormat("mixed");
    setEstimatedDuration("6 weeks");
    reset();
  };

  const levels = ["beginner", "intermediate", "advanced"] as const;
  const formats = ["video", "text", "interactive", "mixed"] as const;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Create complete, sellable courses with learning objectives, module structure, detailed lesson outlines, assessments, resources, and marketing copy.</p>
      </div>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Course Topic / Title</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. Building AI Agents for Customer Support Teams"
              value={courseTopic}
              onChange={setCourseTopic}
              disabled={isRunning}
              maxLength={1500}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Target Audience</Label>
              <Input
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Mid-level customer success managers"
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Course Level</Label>
              <div className="flex gap-2">
                {levels.map((l) => (
                  <Button key={l} type="button" variant={courseLevel === l ? "default" : "outline"} onClick={() => setCourseLevel(l)} disabled={isRunning} className="flex-1 capitalize">
                    {l}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <PromptTextarea
            label="Desired Learning Outcome"
            placeholder="What should students be able to do after completing the course?"
            value={desiredOutcome}
            onChange={setDesiredOutcome}
            disabled={isRunning}
            maxLength={1200}
            rows={2}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Primary Format</Label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white"
              >
                {formats.map((f) => <option key={f} value={f} className="capitalize">{f}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Estimated Duration</Label>
              <Input
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                placeholder="6 weeks, 20 hours, etc."
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={!courseTopic.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Designing full course curriculum..." : "Run AI Course Creator Assistant"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Complete Course Design" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Course"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}
