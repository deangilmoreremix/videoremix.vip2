/**
 * Video Knowledge Assistant — Production UI
 * New VideoRemix Name: Video Knowledge Assistant
 * Chat with YouTube videos, extract insights, summaries, and key moments.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Youtube } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function VideoKnowledgeAssistant({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [query, setQuery] = useState("");
  const [focusArea, setFocusArea] = useState("general");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const focusAreas = ["general", "tutorials", "news", "podcasts", "educational", "entertainment"];

  const handleRun = async () => {
    if (!videoUrl.trim() && !videoDescription.trim()) return;
    const inputs = {
      videoUrl: videoUrl.trim(),
      videoDescription: videoDescription.trim(),
      query: query.trim() || "Summarize the video and extract key insights",
      focusArea,
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setVideoUrl("");
    setVideoDescription("");
    setQuery("");
    setFocusArea("general");
    reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Youtube className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Chat with YouTube videos, extract insights, get summaries and key moments from any video content.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">YouTube Video URL (optional)</Label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Video Description (fallback)</Label>
              <Input
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                placeholder="Or describe the video topic if no URL"
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Your Question / Query</Label>
            <PromptTextarea
              label=""
              placeholder="What would you like to know? (e.g. 'Summarize key points', 'What are the main takeaways?', 'Extract action items')"
              value={query}
              onChange={setQuery}
              disabled={isRunning}
              maxLength={1000}
              rows={4}
              hint="Be specific about what insights you want from the video"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Content Focus Area</Label>
            <select
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              disabled={isRunning}
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
            >
              {focusAreas.map((area) => <option key={area} value={area}>{area.charAt(0).toUpperCase() + area.slice(1)}</option>)}
            </select>
          </div>

          <Button
            onClick={handleRun}
            disabled={(!videoUrl.trim() && !videoDescription.trim()) || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Analyzing video..." : "Run Video Knowledge Assistant"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Video Insights" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Video Query"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}