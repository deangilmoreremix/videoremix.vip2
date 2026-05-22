/**
 * AI Audio Guide Creator — Production UI
 * New VideoRemix Name: AI Audio Guide Creator
 * Creates guided audio tours, location-based narrations, educational walkthroughs, spoken experiences.
 */

import React, { useState, useEffect } from "react";
import { Navigation, Play, Loader2 } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AIAudioGuideCreator({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [topic, setTopic] = useState("");
  const [locationContext, setLocationContext] = useState("");
  const [guideType, setGuideType] = useState("Walking Tour");
  const [targetDuration, setTargetDuration] = useState("10");
  const [narratorStyle, setNarratorStyle] = useState("Informative & Engaging");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const guideTypes = [
    "Walking Tour",
    "Museum Tour",
    "Historical Site Tour",
    "Nature/Wildlife Guide",
    "Educational Walkthrough",
    "Audio Tourist Guide",
    "Corporate/Facility Tour",
    "Product Demo Audio",
  ];

  const durations = [
    { value: "5", label: "5 minutes (short)" },
    { value: "10", label: "10 minutes" },
    { value: "15", label: "15 minutes (standard)" },
    { value: "20", label: "20 minutes" },
    { value: "30", label: "30 minutes (extended)" },
    { value: "45", label: "45+ minutes (comprehensive)" },
  ];

  const narratorStyles = [
    "Informative & Engaging",
    "Friendly & Conversational",
    "Professional & Authoritative",
    "Storytelling & Dramatic",
    "Calm & Meditative",
  ];

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
    if (content) setTopic(content);
  };

  const handleRun = async () => {
    const topicContent = (topic || fileContent || "").trim();
    if (!topicContent) return;
    const inputs = {
      topic: topicContent,
      locationContext: locationContext.trim() || "General location",
      guideType,
      targetDuration: parseInt(targetDuration, 10),
      narratorStyle,
      goal: "Complete audio guide script with narration structure and tour points",
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setTopic("");
    setLocationContext("");
    setGuideType("Walking Tour");
    setTargetDuration("10");
    setNarratorStyle("Informative & Engaging");
    setFileContent(null);
    reset();
  };

  const finalContent = topic || fileContent || "";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Navigation className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Create guided audio tours, location-based narrations, educational walkthroughs, and spoken experiences.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Tour / Guide Topic</Label>
            <PromptTextarea
              label=""
              placeholder="Describe the tour or guide topic (e.g., 'Historic downtown walking tour covering 5 blocks of 19th century architecture', 'Museum exhibit on ancient Egyptian civilization', 'Nature trail guide for local flora and fauna')..."
              value={topic}
              onChange={setTopic}
              disabled={isRunning}
              maxLength={4000}
              rows={6}
              hint="Include key subjects, themes, points of interest, and what visitors should learn or experience."
            />
          </div>

          <BasicFileUpload
            label="Or upload .txt / .md file with tour information"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".txt,.md"
          />

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Location Context (optional)</Label>
            <PromptTextarea
              label=""
              placeholder="Describe the physical location, venue layout, or geographic area (e.g., 'Museum with 3 wings - Egyptian, Greek, Roman', '1-mile outdoor trail with 8 stops', 'Historic district with cobblestone streets')..."
              value={locationContext}
              onChange={setLocationContext}
              disabled={isRunning}
              maxLength={1500}
              rows={3}
              hint="Location details help create more specific, contextual narration."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Guide Type</Label>
              <select
                value={guideType}
                onChange={(e) => setGuideType(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {guideTypes.map((gt) => <option key={gt} value={gt}>{gt}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Target Duration</Label>
              <select
                value={targetDuration}
                onChange={(e) => setTargetDuration(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {durations.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Narrator Style</Label>
              <select
                value={narratorStyle}
                onChange={(e) => setNarratorStyle(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {narratorStyles.map((ns) => <option key={ns} value={ns}>{ns}</option>)}
              </select>
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={!finalContent.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Generating audio guide..." : "Run AI Audio Guide Creator"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Audio Guide Package" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Audio Guide"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}