/**
 * AI Music & Jingle Assistant — Production UI
 * New VideoRemix Name: AI Music & Jingle Assistant
 * Creates music concepts, brand jingles, audio hooks, podcast intros, and promotional sound ideas.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Music } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AIMusicJingleAssistant({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [brandMood, setBrandMood] = useState("");
  const [useCase, setUseCase] = useState("ad");
  const [length, setLength] = useState("15");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const useCases = [
    { value: "ad", label: "Advertisement / Commercial" },
    { value: "podcast_intro", label: "Podcast Intro" },
    { value: "podcast_outro", label: "Podcast Outro" },
    { value: "brand_video", label: "Brand Video / Promo" },
    { value: "hold_music", label: "Hold Music / Waiting" },
    { value: "social_media", label: "Social Media Content" },
    { value: "app_notification", label: "App Notification Sound" },
  ];

  const moods = [
    { value: "energetic", label: "Energetic & Upbeat" },
    { value: "calm", label: "Calm & Relaxing" },
    { value: "fun", label: "Fun & Playful" },
    { value: "trust", label: "Trustworthy & Professional" },
    { value: "inspiring", label: "Inspiring & Motivating" },
    { value: "dramatic", label: "Dramatic & Bold" },
    { value: "elegant", label: "Elegant & Sophisticated" },
  ];

  const handleRun = async () => {
    const brand = brandMood.trim();
    if (!brand) return;
    const inputs = {
      brandName: brand,
      mood: moods.find((m) => m.value === useCase) || "energetic",
      lengthSec: parseInt(length, 10),
      useCase,
      additionalNotes: additionalNotes.trim(),
      goal: "Generate creative jingles, music concepts, and brand audio cues",
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setBrandMood("");
    setUseCase("ad");
    setLength("15");
    setAdditionalNotes("");
    reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Music className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Create original jingles, brand stingers, podcast intros, and promotional sound ideas for your brand.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Brand / Mood / Concept</Label>
            <PromptTextarea
              label=""
              placeholder="Describe your brand, product, or the mood you want to convey. Include: brand name, key values, target audience, and any reference sounds or styles you like..."
              value={brandMood}
              onChange={setBrandMood}
              disabled={isRunning}
              maxLength={2000}
              rows={5}
              hint="Be specific about your brand personality, values, and the emotions you want to evoke"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Use Case</Label>
              <select
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {useCases.map((uc) => (
                  <option key={uc.value} value={uc.value}>{uc.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Length (seconds)</Label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                <option value="5">5 seconds (short stinger)</option>
                <option value="10">10 seconds (quick hook)</option>
                <option value="15">15 seconds (standard jingle)</option>
                <option value="30">30 seconds (full spot)</option>
                <option value="60">60 seconds (extended)</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Additional Notes (optional)</Label>
            <Input
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any specific instruments, reference songs, or style preferences..."
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={!brandMood.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Creating jingle concepts..." : "Run AI Music & Jingle Assistant"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Music & Jingle Package" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Jingle"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}