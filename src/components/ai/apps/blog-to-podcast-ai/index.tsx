/**
 * Blog To Podcast AI — Production UI
 * New VideoRemix Name: Blog To Podcast AI
 * Turns blog posts into professional podcast scripts, outlines, and production-ready packages.
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

export default function BlogToPodcastAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [blogContent, setBlogContent] = useState("");
  const [targetDuration, setTargetDuration] = useState("15");
  const [style, setStyle] = useState("Conversational");
  const [audience, setAudience] = useState("");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const styles = ["Conversational", "Storytelling", "Interview", "News & Insights", "Inspirational"];

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
    if (content) setBlogContent(content);
  };

  const handleRun = async () => {
    const content = (blogContent || fileContent || "").trim();
    if (!content) return;
    const inputs = {
      blogContent: content,
      targetDuration: parseInt(targetDuration, 10),
      style,
      audience: audience.trim() || "general business audience",
      goal: "Full podcast episode package with script and production notes",
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setBlogContent("");
    setTargetDuration("15");
    setStyle("Conversational");
    setAudience("");
    setFileContent(null);
    reset();
  };

  const finalContent = blogContent || fileContent || "";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Radio className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Convert any blog post or article into a complete, audio-ready podcast episode with script, outline, and production cues.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Blog / Article Content</Label>
            <PromptTextarea
              label=""
              placeholder="Paste the full blog post or article text here..."
              value={blogContent}
              onChange={setBlogContent}
              disabled={isRunning}
              maxLength={8000}
              rows={8}
              hint="For best results, include the full body (headings + paragraphs). 2,000–6,000 characters ideal."
            />
          </div>

          <BasicFileUpload
            label="Or upload .txt / .md file (auto-fills content)"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".txt,.md"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Target Duration</Label>
              <select
                value={targetDuration}
                onChange={(e) => setTargetDuration(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                <option value="5">5 minutes (short)</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes (standard)</option>
                <option value="20">20 minutes</option>
                <option value="30">30 minutes (deep dive)</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Podcast Style</Label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {styles.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Target Audience (optional)</Label>
              <Input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. startup founders, marketers"
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={!finalContent.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Generating podcast script & package..." : "Run Blog To Podcast AI"}
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
