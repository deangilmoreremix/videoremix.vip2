/**
 * News To Podcast AI — Production UI
 * New VideoRemix Name: News-To-Podcast AI
 * Converts news articles, topics, and trends into podcast-ready episodes and commentary scripts.
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

export default function NewsToPodcastAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [newsTopic, setNewsTopic] = useState("");
  const [niche, setNiche] = useState("Business/Tech");
  const [audience, setAudience] = useState("");
  const [style, setStyle] = useState("News Commentary");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const niches = ["Business/Tech", "Politics", "Entertainment", "Sports", "Science/Health", "Finance/Investing", "Startup/Early Stage", "Social Media/Marketing"];
  const styles = ["News Commentary", "Interview Style", "Panel Discussion", "Solo Analysis", "Educational Deep Dive"];
  const audiences = ["General", "Industry Professionals", "Enthusiasts/Amateurs", "Executives/Decision Makers", "Developers/Technicians"];

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
    if (content) setNewsTopic(content);
  };

  const handleRun = async () => {
    const content = (newsTopic || fileContent || "").trim();
    if (!content) return;
    const inputs = {
      newsTopic: content,
      niche,
      audience: audience || "General",
      style,
      goal: "Podcast-ready episode with commentary script, key points, and production cues",
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setNewsTopic("");
    setNiche("Business/Tech");
    setAudience("");
    setStyle("News Commentary");
    setFileContent(null);
    reset();
  };

  const finalContent = newsTopic || fileContent || "";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Radio className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Transform news articles, trending topics, or industry updates into engaging podcast episodes with commentary scripts and production notes.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">News / Topic</Label>
            <PromptTextarea
              label=""
              placeholder="Paste news content, describe a trending topic, or summarize the story you want to cover..."
              value={newsTopic}
              onChange={setNewsTopic}
              disabled={isRunning}
              maxLength={5000}
              rows={7}
              hint="Include key facts, the main story angle, and any specific perspectives you want to explore. 400-3,000 characters ideal."
            />
          </div>

          <BasicFileUpload
            label="Or upload .txt / .md file with news content"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".txt,.md"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Niche Focus</Label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {niches.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Style</Label>
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

          <Button
            onClick={handleRun}
            disabled={!finalContent.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Generating podcast episode..." : "Run News-To-Podcast AI"}
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