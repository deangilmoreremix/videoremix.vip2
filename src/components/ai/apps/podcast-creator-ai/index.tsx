/**
 * Podcast Creator AI — Production UI
 * New VideoRemix Name: Podcast Creator AI
 * Turns ideas, topics, and content into podcast episodes, interview outlines, and audio scripts.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Radio } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function PodcastCreatorAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("Solo Episode");
  const [audience, setAudience] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const formats = ["Solo Episode", "Interview", "Panel Discussion", "Storytelling/Narrative", "News & Commentary", "Educational/Tutorial"];
  const audiences = ["General", "Business/Professional", "Tech/Developers", "Creative/Artists", "Entrepreneurs", "Fitness/Wellness", "Finance/Investing"];

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
    if (content) setTopic(content);
  };

  const handleRun = async () => {
    const content = (topic || fileContent || "").trim();
    if (!content) return;
    const inputs = {
      topic: content,
      format,
      audience: audience || "General",
      additionalNotes: additionalNotes.trim(),
      goal: "Complete podcast episode package with script, outline, and production notes",
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setTopic("");
    setFormat("Solo Episode");
    setAudience("");
    setAdditionalNotes("");
    setFileContent(null);
    reset();
  };

  const finalContent = topic || fileContent || "";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Radio className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Transform any idea, topic, or content into professional podcast episodes with scripts, interview outlines, and audio production-ready packages.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Topic / Idea</Label>
            <PromptTextarea
              label=""
              placeholder="Describe your podcast topic, episode idea, or the content you want to convert..."
              value={topic}
              onChange={setTopic}
              disabled={isRunning}
              maxLength={4000}
              rows={6}
              hint="Include key points you want to cover, the main message, and any specific angles. 300-2,500 characters ideal."
            />
          </div>

          <BasicFileUpload
            label="Or upload .txt / .md file with topic/notes"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".txt,.md"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Format</Label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {formats.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Target Audience</Label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                <option value="">Select audience (optional)</option>
                {audiences.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Additional Notes (optional)</Label>
            <PromptTextarea
              label=""
              placeholder="Any specific angles, guest suggestions, key points to hit, or production preferences..."
              value={additionalNotes}
              onChange={setAdditionalNotes}
              disabled={isRunning}
              maxLength={1500}
              rows={3}
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={!finalContent.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Generating podcast package..." : "Run Podcast Creator AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Podcast Episode Package" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Podcast Episode"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}